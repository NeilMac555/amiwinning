// One-shot migration of localStorage bets → Supabase.
//
// Runs from the AuthProvider when a user signs in. Idempotent: each user has
// their own flag in localStorage so re-running the page doesn't re-upload.
// localStorage is NOT cleared after migration — kept as a backup until we
// switch the read path over to Supabase.

import { supabase } from "./supabase";
import { loadBets } from "./import/store";
import type { ImportedBet } from "./import/types";

export interface MigrationResult {
  status: "skipped" | "done" | "error";
  count?: number;
  error?: string;
}

function flagKey(userId: string) {
  return `aiw_migrated_${userId}_v1`;
}

function toRow(b: ImportedBet, userId: string) {
  return {
    id: b.id,
    user_id: userId,
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

export async function migrateLocalToSupabase(
  userId: string,
): Promise<MigrationResult> {
  if (typeof window === "undefined") return { status: "skipped" };
  if (!supabase) return { status: "skipped" };

  const flag = flagKey(userId);
  if (window.localStorage.getItem(flag)) return { status: "skipped" };

  const allBets = loadBets();
  if (allBets.length === 0) {
    window.localStorage.setItem(flag, new Date().toISOString());
    return { status: "done", count: 0 };
  }

  // Drop bets with no bookId — these are orphans from before the books
  // table existed. Supabase's bets.book_id is NOT NULL, so pushing them
  // would fail the entire batch and prevent the rest from migrating. The
  // user can still see them in their localStorage cache until they choose
  // a book for them; data-cleanup will eventually rehome these too.
  const bets = allBets.filter((b) => !!b.bookId);
  const skipped = allBets.length - bets.length;
  if (skipped > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `[aiw] migrateLocalToSupabase: skipping ${skipped} bets without bookId`,
    );
  }
  if (bets.length === 0) {
    window.localStorage.setItem(flag, new Date().toISOString());
    return { status: "done", count: 0 };
  }

  // Small batches — Supabase's statement_timeout default (60s) chokes on
  // large upserts with ON CONFLICT, especially when the JSONB `raw` column
  // is non-trivial. 100 rows/batch sits comfortably under the budget.
  const BATCH = 100;
  let inserted = 0;
  for (let i = 0; i < bets.length; i += BATCH) {
    const slice = bets.slice(i, i + BATCH);
    const rows = slice.map((b) => toRow(b, userId));
    const { error } = await supabase
      .from("bets")
      .upsert(rows, { onConflict: "id" });
    if (error) {
      // Don't set the migration flag — next page load will retry from this
      // batch onwards (upsert means already-inserted rows are no-ops).
      return {
        status: "error",
        error: error.message,
        count: inserted,
      };
    }
    inserted += slice.length;
  }

  window.localStorage.setItem(flag, new Date().toISOString());
  return { status: "done", count: inserted };
}
