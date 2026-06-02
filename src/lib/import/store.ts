// Client-side persistence layer for imported bets.
// Dual-mode: writes always hit the localStorage cache for instant UI, and
// fire-and-forget to Supabase when a user is signed in (set via the
// `setCurrentUserId` hook from the AuthProvider). Reads come from the cache.

import type { ImportedBet } from "./types";
import { deleteBetRemote, pushBet, pushBets } from "../bet-sync";

const KEY = "aiw_bets_v1";

// Module-level "who's currently signed in" — set by AuthProvider on user
// change. Null = signed out → writes stay local only.
let _currentUserId: string | null = null;
export function setCurrentUserId(id: string | null): void {
  _currentUserId = id;
}

export interface BetStoreSummary {
  count: number;
  earliest: string | null;
  latest: string | null;
  totalPl: number;
  totalStake: number;
}

function safeWindow(): Window | null {
  return typeof window !== "undefined" ? window : null;
}

/** Raw read — includes tombstones (_pendingDelete). Used internally by
 *  the sync layer so it can find pending deletes to retry. UI code
 *  should use loadBets(), which filters tombstones. */
export function loadBetsRaw(): ImportedBet[] {
  const w = safeWindow();
  if (!w) return [];
  try {
    const raw = w.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ImportedBet[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Public read — bets the user should see. Tombstones (locally-deleted
 *  bets whose remote delete is still pending) are filtered out so the
 *  UI doesn't show them. */
export function loadBets(): ImportedBet[] {
  return loadBetsRaw().filter((b) => !b._pendingDelete);
}

export function saveBets(bets: ImportedBet[]): void {
  const w = safeWindow();
  if (!w) return;
  w.localStorage.setItem(KEY, JSON.stringify(bets));
}

export function appendBets(newBets: ImportedBet[]): ImportedBet[] {
  const existing = loadBets();
  const byId = new Map(existing.map((b) => [b.id, b]));
  // Mark every incoming bet as _pending until Supabase confirms the push.
  // The flag is local-only — bet-sync clears it after a successful upsert,
  // and flushPendingSyncs retries anything still flagged on the next
  // sign-in / online event / 60s interval. Without this, a failed push
  // would silently delete the bet on the next pull.
  for (const b of newBets) byId.set(b.id, { ...b, _pending: true });
  const merged = Array.from(byId.values());
  saveBets(merged);
  if (_currentUserId && newBets.length > 0) {
    // Push in the background; flag is cleared on success.
    const userId = _currentUserId;
    void (async () => {
      const succeeded = await pushBets(newBets, userId);
      if (succeeded.size > 0) clearPendingFlag(succeeded);
    })();
  }
  return merged;
}

/** Strip _pending off bets whose IDs are in the given set. Re-reads the
 *  store so concurrent writes aren't clobbered. */
function clearPendingFlag(ids: Set<string>): void {
  const current = loadBets();
  let touched = false;
  const next = current.map((b) => {
    if (ids.has(b.id) && b._pending) {
      touched = true;
      const { _pending: _, ...rest } = b;
      void _;
      return rest as ImportedBet;
    }
    return b;
  });
  if (touched) saveBets(next);
}

export function clearBets(): void {
  const w = safeWindow();
  if (!w) return;
  w.localStorage.removeItem(KEY);
}

/** Look up a single bet by id. */
export function getBet(id: string): ImportedBet | undefined {
  return loadBets().find((b) => b.id === id);
}

/** Patch a bet in place. Returns the new store contents. */
export function updateBet(
  id: string,
  patch: Partial<ImportedBet>,
): ImportedBet[] {
  // Mark _pending — same logic as appendBets. If the push succeeds, the
  // background task clears it. If it fails, flushPendingSyncs will retry.
  const next = loadBets().map((b) =>
    b.id === id ? { ...b, ...patch, _pending: true } : b,
  );
  saveBets(next);
  if (_currentUserId) {
    const updated = next.find((b) => b.id === id);
    if (updated) {
      const userId = _currentUserId;
      void (async () => {
        const ok = await pushBet(updated, userId);
        if (ok) clearPendingFlag(new Set([id]));
      })();
    }
  }
  return next;
}

/** Hard-delete a bet. */
export function deleteBet(id: string): ImportedBet[] {
  // Tombstone-mark rather than evict immediately: if the remote delete
  // fails (network, RLS, anything), the next pull would re-insert the
  // row. We hide the bet from the UI by treating _pendingDelete as
  // deleted at read time, but keep it in the cache until Supabase
  // confirms. flushPendingSyncs retries.
  const current = loadBets();
  if (!_currentUserId) {
    // Signed out: no Supabase to sync with; just evict.
    const next = current.filter((b) => b.id !== id);
    saveBets(next);
    return next;
  }
  const next = current.map((b) =>
    b.id === id ? { ...b, _pendingDelete: true } : b,
  );
  saveBets(next);
  void (async () => {
    const ok = await deleteBetRemote(id);
    if (ok) {
      // Strip the tombstone — remove the row entirely from the cache.
      const after = loadBets().filter((b) => b.id !== id);
      saveBets(after);
    }
  })();
  // Return the externally-visible list (no tombstones).
  return next.filter((b) => !b._pendingDelete);
}

// ---------------------------------------------------------------------------
// One-shot seed. Bets the founder logged in chat get embedded here with stable
// IDs and auto-inserted on next mount. Idempotent — safe to call repeatedly,
// existing IDs are not re-added. Delete entries here once they're persisted
// to real storage post-Supabase.
const SEED_BETS: ImportedBet[] = [
  {
    id: "seed-2026-05-10-barca-rm",
    kickoff: "2026-05-10",
    sport: "Soccer",
    home: "Barcelona",
    away: "Real Madrid",
    event: "Barcelona vs Real Madrid",
    market: "ah",
    selection: "Barcelona -0.75 AH",
    odds: 1.79,
    stake: 2,
    status: "won",
    pl: 1.58,
    source: "manual",
    importedAt: "2026-05-14T17:00:00Z",
    raw: {},
  },
  {
    id: "seed-2026-05-10-milan-atalanta",
    kickoff: "2026-05-10",
    sport: "Soccer",
    home: "AC Milan",
    away: "Atalanta",
    event: "AC Milan vs Atalanta",
    market: "ah",
    selection: "Atalanta +0.25 AH",
    odds: 2.0,
    stake: 2,
    status: "won",
    pl: 2.0,
    source: "manual",
    importedAt: "2026-05-14T17:00:00Z",
    raw: {},
  },
  {
    id: "seed-2026-05-10-psg-brest",
    kickoff: "2026-05-10",
    sport: "Soccer",
    home: "PSG",
    away: "Brest",
    event: "PSG vs Brest",
    market: "ou",
    selection: "Over 3.5 goals",
    odds: 1.85,
    stake: 2,
    status: "lost",
    pl: -2,
    source: "manual",
    importedAt: "2026-05-14T17:00:00Z",
    raw: {},
  },
  {
    id: "seed-2026-05-10-double-havre-toulouse",
    kickoff: "2026-05-10",
    sport: "Soccer",
    event: "Double · Le Havre / Toulouse",
    market: "parlay",
    selection: "Double: Le Havre +1.5 AH + Toulouse Over 0.5 TT",
    odds: 1.88,
    stake: 2,
    status: "won",
    pl: 1.76,
    source: "manual",
    importedAt: "2026-05-14T17:00:00Z",
    raw: {},
  },
  {
    id: "seed-2026-05-11-spurs-leeds",
    kickoff: "2026-05-11",
    sport: "Soccer",
    home: "Spurs",
    away: "Leeds",
    event: "Spurs vs Leeds",
    market: "ah",
    selection: "Leeds +0.75 AH",
    odds: 1.88,
    stake: 2,
    status: "won",
    pl: 1.76,
    source: "manual",
    importedAt: "2026-05-14T17:00:00Z",
    raw: {},
  },
  {
    id: "seed-2026-05-12-celta-levante",
    kickoff: "2026-05-12",
    sport: "Soccer",
    home: "Celta",
    away: "Levante",
    event: "Celta vs Levante",
    market: "btts",
    selection: "BTTS Yes",
    odds: 1.76,
    stake: 2,
    status: "won",
    pl: 1.52,
    source: "manual",
    importedAt: "2026-05-14T17:00:00Z",
    raw: {},
  },
  {
    id: "seed-2026-05-13-lens-psg",
    kickoff: "2026-05-13",
    sport: "Soccer",
    home: "Lens",
    away: "PSG",
    event: "Lens vs PSG",
    market: "ah",
    selection: "Lens +0.25 AH",
    odds: 2.05,
    stake: 2,
    status: "lost",
    pl: -2,
    source: "manual",
    importedAt: "2026-05-14T17:00:00Z",
    raw: {},
  },
];

export function consumeSeed(): number {
  const w = safeWindow();
  if (!w) return 0;
  const existing = loadBets();
  const existingIds = new Set(existing.map((b) => b.id));
  const toAdd = SEED_BETS.filter((b) => !existingIds.has(b.id));
  if (toAdd.length === 0) return 0;
  saveBets([...existing, ...toAdd]);
  return toAdd.length;
}

export function summarise(bets: ImportedBet[]): BetStoreSummary {
  if (bets.length === 0) {
    return { count: 0, earliest: null, latest: null, totalPl: 0, totalStake: 0 };
  }
  let earliest = bets[0].kickoff;
  let latest = bets[0].kickoff;
  let pl = 0;
  let stake = 0;
  for (const b of bets) {
    if (b.kickoff < earliest) earliest = b.kickoff;
    if (b.kickoff > latest) latest = b.kickoff;
    pl += b.pl;
    stake += b.stake;
  }
  return {
    count: bets.length,
    earliest,
    latest,
    totalPl: Math.round(pl * 100) / 100,
    totalStake: Math.round(stake * 100) / 100,
  };
}
