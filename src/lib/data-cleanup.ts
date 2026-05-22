// One-shot client-side data cleanup. Walks every bet in the local cache,
// fixes systemic legacy bugs, then pushes the changed bets to Supabase.
//
// Idempotent: gated by `aiw_cleanup_v1` flag in localStorage. Safe to call
// on every app boot.
//
// What it fixes:
//   1. Sport mislabels — most legacy bets were stamped "Soccer" regardless of
//      what they actually were. Reclassify using the deterministic classifier.
//   2. Future-dated settled bets — early AI parses defaulted to today's date
//      when the source text was ambiguous ("Sunday" with no week given),
//      which put settled bets in the future and crashed "Recent settled"
//      sorting + relative-time formatting. Clamp to a sensible past date.
//
// Returns a summary so the UI can show "fixed N bets" feedback.

import { supabase } from "./supabase";
import { loadBets, saveBets } from "./import/store";
import { pushBets } from "./bet-sync";
import { classifySport } from "./sport-classify";
import type { ImportedBet } from "./import/types";

export interface CleanupResult {
  status: "skipped" | "done" | "error";
  sportReclassified: number;
  datesFixed: number;
  total: number;
  error?: string;
}

const CLEANUP_FLAG = "aiw_cleanup_v1";

function flagSetFor(userId?: string): string {
  return userId ? `${CLEANUP_FLAG}_${userId}` : CLEANUP_FLAG;
}

function safeWindow(): Window | null {
  return typeof window !== "undefined" ? window : null;
}

/**
 * Decide a sensible past date for a settled bet whose stored kickoff is in
 * the future. Best signal we have is `importedAt` — it's when the bet entered
 * the system, which is bounded above by "now" and is usually close to the
 * actual match date. Fall back to today if missing.
 */
function clampFutureKickoff(b: ImportedBet, todayIso: string): string | null {
  // Only meaningful for settled bets — pending bets are allowed to be in
  // the future.
  const isSettled =
    b.status === "won" ||
    b.status === "lost" ||
    b.status === "push" ||
    b.status === "half_won" ||
    b.status === "half_lost";
  if (!isSettled) return null;
  if (!b.kickoff) return null;
  // Only the date portion is compared (YYYY-MM-DD). Future == strictly after today.
  const koDate = b.kickoff.slice(0, 10);
  if (koDate <= todayIso) return null;
  // Prefer importedAt's date portion if it's <= today and >= 2010 (sanity).
  const imp = (b.importedAt ?? "").slice(0, 10);
  if (imp && imp <= todayIso && imp >= "2010-01-01") return imp;
  return todayIso;
}

export async function runDataCleanup(opts: {
  userId?: string;
  /** When true, push changes to Supabase. Defaults to true if a userId is given. */
  pushToRemote?: boolean;
}): Promise<CleanupResult> {
  const win = safeWindow();
  if (!win) {
    return { status: "skipped", sportReclassified: 0, datesFixed: 0, total: 0 };
  }
  const flag = flagSetFor(opts.userId);
  if (win.localStorage.getItem(flag)) {
    return { status: "skipped", sportReclassified: 0, datesFixed: 0, total: 0 };
  }

  const bets = loadBets();
  if (bets.length === 0) {
    win.localStorage.setItem(flag, new Date().toISOString());
    return { status: "done", sportReclassified: 0, datesFixed: 0, total: 0 };
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  let sportReclassified = 0;
  let datesFixed = 0;
  const changed: ImportedBet[] = [];

  const next = bets.map((b) => {
    let patched: ImportedBet | null = null;

    const newSport = classifySport(b);
    if (newSport !== b.sport) {
      patched = { ...(patched ?? b), sport: newSport };
      sportReclassified++;
    }

    const newKickoff = clampFutureKickoff(b, todayIso);
    if (newKickoff != null && newKickoff !== b.kickoff) {
      patched = { ...(patched ?? b), kickoff: newKickoff };
      datesFixed++;
    }

    if (patched) {
      changed.push(patched);
      return patched;
    }
    return b;
  });

  // Always write back — even if no changes, this is a fast no-op write.
  if (changed.length > 0) {
    saveBets(next);
  }

  // Push to Supabase. We push only the changed bets to keep the request size
  // small. If we're signed out, this is a local-only fix that'll get rolled
  // back on the next remote pull. The user can re-run after signing in.
  const shouldPush = opts.pushToRemote ?? !!opts.userId;
  if (shouldPush && changed.length > 0 && opts.userId && supabase) {
    try {
      await pushBets(changed, opts.userId);
    } catch (err) {
      return {
        status: "error",
        sportReclassified,
        datesFixed,
        total: bets.length,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // Set the flag last — only after a successful pass.
  win.localStorage.setItem(flag, new Date().toISOString());
  return {
    status: "done",
    sportReclassified,
    datesFixed,
    total: bets.length,
  };
}

/** Force-reset the cleanup flag so the next page load re-runs the migration.
 *  Handy for dev / debugging or if the user wants to manually trigger a redo. */
export function resetCleanupFlag(userId?: string): void {
  const win = safeWindow();
  if (!win) return;
  win.localStorage.removeItem(flagSetFor(userId));
}
