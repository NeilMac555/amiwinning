// Supabase ↔ local-cache sync layer.
//
// Strategy: localStorage is a fast read cache; Supabase is canonical truth.
// On sign-in we pull Supabase into localStorage (overwriting it). Writes go
// to localStorage immediately (for optimistic UI) and fire-and-forget to
// Supabase asynchronously. RLS enforces per-user isolation server-side.

import { supabase } from "./supabase";
import { saveBets } from "./import/store";
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
  const bets = all.map(rowToBet);
  saveBets(bets);
  return bets.length;
}

/** Upsert a single bet. Bet must have bookId set. */
export async function pushBet(bet: ImportedBet, userId: string): Promise<void> {
  if (!supabase) return;
  if (!bet.bookId) {
     
    console.error("[aiw] pushBet skipped — bet has no bookId:", bet.id);
    return;
  }
  const { error } = await supabase
    .from("bets")
    .upsert([betToRow(bet, userId)], { onConflict: "id" });
  if (error) {
     
    console.error("[aiw] pushBet failed:", error.message, "(id:", bet.id, ")");
  }
}

/** Upsert many bets in batches. Any bet missing bookId is skipped. */
export async function pushBets(
  bets: ImportedBet[],
  userId: string,
): Promise<void> {
  if (!supabase) return;
  const valid = bets.filter((b) => b.bookId);
  if (valid.length === 0) return;
  if (valid.length !== bets.length) {
     
    console.warn(
      `[aiw] pushBets: skipping ${bets.length - valid.length} bets without bookId`,
    );
  }
  const BATCH = 500;
  for (let i = 0; i < valid.length; i += BATCH) {
    const slice = valid.slice(i, i + BATCH).map((b) => betToRow(b, userId));
    const { error } = await supabase
      .from("bets")
      .upsert(slice, { onConflict: "id" });
    if (error) {
       
      console.error("[aiw] pushBets batch failed:", error.message);
      return;
    }
  }
}

/** Delete a bet by id. RLS makes this safe — only the owner's row matches. */
export async function deleteBetRemote(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("bets").delete().eq("id", id);
  if (error) {
     
    console.error("[aiw] deleteBetRemote failed:", error.message, "(id:", id, ")");
  }
}
