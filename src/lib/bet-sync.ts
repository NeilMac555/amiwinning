// Supabase ↔ local-cache sync layer.
//
// Strategy: localStorage is a fast read cache; Supabase is canonical truth.
// On sign-in we pull Supabase into localStorage (overwriting it). Writes go
// to localStorage immediately (for optimistic UI) and fire-and-forget to
// Supabase asynchronously. RLS enforces per-user isolation server-side.

import { supabase } from "./supabase";
import { loadBetsRaw, saveBets } from "./import/store";
import type { ImportedBet, MarketGuess, Status } from "./import/types";

// Row shape returned by Supabase. Snake-case, lower-bound types.
interface BetRow {
  id: string;
  user_id: string;
  book_id: string;
  kickoff: string;
  sport: string;
  league: string | null;
  home: string | null;
  away: string | null;
  event: string;
  market: string | null;
  selection: string;
  odds: string | number;
  stake: string | number;
  closing_odds: string | number | null;
  tipster: string | null;
  tags: string[] | null;
  notes: string | null;
  status: string;
  pl: string | number;
  source: string;
  imported_at: string;
  raw: Record<string, string> | null;
}

function rowToBet(r: BetRow): ImportedBet {
  return {
    id: r.id,
    bookId: r.book_id,
    kickoff: r.kickoff,
    sport: r.sport,
    league: r.league ?? undefined,
    home: r.home ?? undefined,
    away: r.away ?? undefined,
    event: r.event,
    market: (r.market as MarketGuess) ?? undefined,
    selection: r.selection,
    odds: Number(r.odds),
    stake: Number(r.stake),
    closingOdds: r.closing_odds != null ? Number(r.closing_odds) : undefined,
    tipster: r.tipster ?? undefined,
    tags: r.tags ?? undefined,
    notes: r.notes ?? undefined,
    status: r.status as Status,
    pl: Number(r.pl),
    source: r.source,
    importedAt: r.imported_at,
    raw: r.raw ?? {},
  };
}

function betToRow(b: ImportedBet, userId: string) {
  if (!b.bookId) {
    throw new Error(`bet ${b.id} missing bookId — cannot push to Supabase`);
  }
  return {
    id: b.id,
    user_id: userId,
    book_id: b.bookId,
    kickoff: b.kickoff,
    sport: b.sport,
    league: b.league ?? null,
    home: b.home ?? null,
    away: b.away ?? null,
    event: b.event,
    market: b.market ?? null,
    selection: b.selection,
    odds: b.odds,
    stake: b.stake,
    closing_odds: b.closingOdds ?? null,
    tipster: b.tipster ?? null,
    tags: b.tags && b.tags.length ? b.tags : null,
    notes: b.notes ?? null,
    status: b.status,
    pl: b.pl,
    source: b.source,
    imported_at: b.importedAt,
    raw: b.raw ?? {},
  };
}

/**
 * Fetch all bets for the current user from Supabase and overwrite the local
 * cache. Returns the number pulled, or -1 on error.
 */
export async function pullFromSupabase(): Promise<number> {
  if (!supabase) return 0;
  // RLS gates rows, but the bets_select_public_profile policy (migration
  // 0003) intentionally grants every signed-in user SELECT access to
  // every public-profile user's bets — that's what powers the /u/<handle>
  // page from anon clients. The client must therefore pin every pull to
  // its own user_id, or else it ingests other users' bets into the
  // localStorage cache. Get the current session's user once up front;
  // bail out if not signed in.
  const { data: sess } = await supabase.auth.getSession();
  const userId = sess.session?.user.id;
  if (!userId) return 0;

  // Pull in pages to avoid huge response bodies and Supabase's 1k default cap.
  const PAGE = 1000;
  let from = 0;
  const all: BetRow[] = [];
  // Loop until a short page comes back.
  // (Supabase ignores `range` when count is small but it's the standard idiom.)
  for (;;) {
    const { data, error } = await supabase
      .from("bets")
      .select("*")
      .eq("user_id", userId)
      .order("kickoff", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) {

      console.error("[aiw] pullFromSupabase failed:", error.message);
      return -1;
    }
    const rows = (data ?? []) as BetRow[];
    all.push(...rows);
    if (rows.length < PAGE) break;
    from += PAGE;
  }
  // Preserve any locally-pending bets (writes that haven't synced to
  // Supabase yet, or tombstoned deletes that haven't propagated). Without
  // this, the pull would silently destroy a bet the user just created on
  // a flaky network. Pending rows live in localStorage with the _pending
  // or _pendingDelete flag; we keep them across the cache replacement
  // until they're confirmed.
  const remote = all.map(rowToBet);
  const remoteIds = new Set(remote.map((b) => b.id));
  const localPending = loadBetsRaw().filter((b) => b._pending || b._pendingDelete);
  // Pending creates: include locals not yet in remote.
  // Pending deletes: drop them from the remote set so the tombstone wins.
  const pendingDeletes = new Set(
    localPending.filter((b) => b._pendingDelete).map((b) => b.id),
  );
  const merged = [
    ...remote.filter((b) => !pendingDeletes.has(b.id)),
    ...localPending.filter((b) => b._pending && !remoteIds.has(b.id)),
    ...localPending.filter((b) => b._pendingDelete && !remoteIds.has(b.id)),
  ];
  saveBets(merged);
  return merged.filter((b) => !b._pendingDelete).length;
}

/** Upsert a single bet. Bet must have bookId set. Returns true on success
 *  so callers can clear the _pending flag locally. */
export async function pushBet(
  bet: ImportedBet,
  userId: string,
): Promise<boolean> {
  if (!supabase) return false;
  if (!bet.bookId) {

    console.error("[aiw] pushBet skipped — bet has no bookId:", bet.id);
    return false;
  }
  const { error } = await supabase
    .from("bets")
    .upsert([betToRow(bet, userId)], { onConflict: "id" });
  if (error) {

    console.error("[aiw] pushBet failed:", error.message, "(id:", bet.id, ")");
    return false;
  }
  return true;
}

/** Upsert many bets in batches. Returns ids of successfully-pushed bets
 *  so the caller can clear their _pending flags. Bets without bookId are
 *  skipped (logged) and not included in the returned set. */
export async function pushBets(
  bets: ImportedBet[],
  userId: string,
): Promise<Set<string>> {
  const succeeded = new Set<string>();
  if (!supabase) return succeeded;
  const valid = bets.filter((b) => b.bookId);
  if (valid.length === 0) return succeeded;
  if (valid.length !== bets.length) {

    console.warn(
      `[aiw] pushBets: skipping ${bets.length - valid.length} bets without bookId`,
    );
  }
  const BATCH = 500;
  for (let i = 0; i < valid.length; i += BATCH) {
    const sliceBets = valid.slice(i, i + BATCH);
    const sliceRows = sliceBets.map((b) => betToRow(b, userId));
    const { error } = await supabase
      .from("bets")
      .upsert(sliceRows, { onConflict: "id" });
    if (error) {

      console.error("[aiw] pushBets batch failed:", error.message);
      // Bail on first batch failure — return what we managed so far.
      return succeeded;
    }
    for (const b of sliceBets) succeeded.add(b.id);
  }
  return succeeded;
}

/** Delete a bet by id. Returns true on success. */
export async function deleteBetRemote(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("bets").delete().eq("id", id);
  if (error) {

    console.error("[aiw] deleteBetRemote failed:", error.message, "(id:", id, ")");
    return false;
  }
  return true;
}

// ─ Pending-sync flush ──────────────────────────────────────────────────
//
// Walks the local cache for anything tagged _pending (create) or
// _pendingDelete (tombstone), retries the operation against Supabase,
// and clears the flag on success. Called from:
//
//   1. AuthProvider on every sign-in.
//   2. window.online event when the browser reconnects.
//   3. A 60s interval timer while a session is active.
//   4. After any user-initiated bet write (defensive).
//
// Safe to call concurrently — last writer wins on localStorage, and
// upsert/delete are idempotent server-side.

export interface FlushResult {
  pushed: number;
  deleted: number;
  failed: number;
}

export async function flushPendingSyncs(
  userId: string,
): Promise<FlushResult> {
  const result: FlushResult = { pushed: 0, deleted: 0, failed: 0 };
  if (!supabase) return result;

  const local = loadBetsRaw();
  const pendingPush = local.filter((b) => b._pending && !b._pendingDelete);
  const pendingDel = local.filter((b) => b._pendingDelete);

  // Batch pushes for efficiency. pushBets returns the set of IDs that
  // landed; everything else stays flagged.
  let pushedIds: Set<string> = new Set();
  if (pendingPush.length > 0) {
    pushedIds = await pushBets(pendingPush, userId);
    result.pushed = pushedIds.size;
    result.failed += pendingPush.length - pushedIds.size;
  }

  // Deletes one at a time — there's no Supabase batch-delete helper that
  // takes a list of ids without an `in` filter, and the volume is low.
  const deletedIds = new Set<string>();
  for (const b of pendingDel) {
    const ok = await deleteBetRemote(b.id);
    if (ok) {
      deletedIds.add(b.id);
      result.deleted++;
    } else {
      result.failed++;
    }
  }

  // Re-load (other writes may have happened during the await) and clear
  // the flags / tombstones for everything that succeeded.
  if (result.pushed > 0 || result.deleted > 0) {
    const current = loadBetsRaw();
    const next = current
      .filter((b) => !deletedIds.has(b.id)) // tombstone removal
      .map((b) => {
        if (pushedIds.has(b.id) && b._pending) {
          const { _pending: _, ...rest } = b;
          void _;
          return rest as ImportedBet;
        }
        return b;
      });
    saveBets(next);
  }

  return result;
}

/** Total count of pending sync items in the local cache. */
export function countPendingSyncs(): number {
  return loadBetsRaw().filter((b) => b._pending || b._pendingDelete).length;
}
