"use client";

// Post-signup handoff for the landing-page DemoPasteBox.
//
// Flow this closes:
//   1. Signed-out visitor pastes text into the landing DemoPasteBox.
//   2. AI parses it. They click "Sign up to keep these".
//   3. DemoPasteBox writes the parsed bets to
//        sessionStorage["aiw_demo_bets"] = { bets: DemoBet[], savedAt }
//      then navigates to /sign-in.
//   4. They complete auth, land back on the dashboard.
//   5. THIS component mounts, reads the sessionStorage, converts each
//      DemoBet to an ImportedBet with an id, book scope, home/away
//      split, and computed P/L, calls appendBets(), clears the
//      sessionStorage entry, and shows a small dismissable banner
//      confirming the import.
//
// Design notes:
//   - Source tag is "demo-signup" so these bets are distinguishable
//     from first-run "sample" bets and never get filtered by the
//     SampleBetsBanner (which keys off the "sample" tag).
//   - Uses queueMicrotask before setState so we satisfy React 19's
//     no-synchronous-setState-in-effect rule.
//   - Only fires when the user is signed in AND has an active book.
//     If the auth context is still hydrating, we wait; the effect
//     re-runs when activeBook becomes non-null.
//   - Runs at most once per signed-in mount because we remove the
//     storage key immediately.

import { useEffect, useState } from "react";
import { appendBets } from "@/lib/import/store";
import type { ImportedBet, MarketGuess, Status } from "@/lib/import/types";
import { useAuth } from "@/lib/auth";
import { classifySport } from "@/lib/sport-classify";

const DEMO_STORAGE_KEY = "aiw_demo_bets";
const DEMO_SOURCE_TAG = "demo-signup";

interface DemoBet {
  kickoff: string;
  event: string;
  selection: string;
  market: string;
  odds: number;
  stake: number;
  status: string;
  sport?: string;
}

interface DemoPayload {
  bets?: DemoBet[];
  savedAt?: string;
}

// Match the same uid + splitTeams + pl helpers PasteHero uses. Kept
// inline (not re-exported from PasteHero) because that file's helpers
// are closure-scoped and this component's needs are small enough
// that a copy is cleaner than a refactor.
function uid(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    "-" +
    Date.now().toString(36)
  );
}

function splitTeams(event: string): { home?: string; away?: string } {
  for (const sep of [" v ", " vs ", " vs. ", " -v- "]) {
    const i = event.indexOf(sep);
    if (i > 0) {
      return {
        home: event.slice(0, i).trim(),
        away: event.slice(i + sep.length).trim(),
      };
    }
  }
  return {};
}

function computePl(status: string, stake: number, odds: number): number {
  if (status === "won") return stake * (odds - 1);
  if (status === "lost") return -stake;
  if (status === "half_won") return (stake * (odds - 1)) / 2;
  if (status === "half_lost") return -stake / 2;
  return 0;
}

interface Props {
  /** Called after the import writes so the parent can re-aggregate.
   *  Same pattern as PasteHero's onCommitted / SampleBetsBanner's
   *  onCleared: the dashboard passes a `setLocalBump` incrementer. */
  onImported?: (count: number) => void;
}

export function DemoBetImportBanner({ onImported }: Props = {}) {
  const { user, activeBook } = useAuth();
  const [importedCount, setImportedCount] = useState<number | null>(null);

  useEffect(() => {
    // Both gates: real user AND active book. If auth is still hydrating
    // the effect re-runs when they land.
    if (!user || !activeBook) return;
    if (typeof window === "undefined") return;

    let raw: string | null = null;
    try {
      raw = window.sessionStorage.getItem(DEMO_STORAGE_KEY);
    } catch {
      // sessionStorage blocked (privacy mode, iframe). Nothing to do.
      return;
    }
    if (!raw) return;

    let payload: DemoPayload | null = null;
    try {
      payload = JSON.parse(raw) as DemoPayload;
    } catch {
      // Malformed JSON — remove the key and bail. Do not import
      // partial data.
      try {
        window.sessionStorage.removeItem(DEMO_STORAGE_KEY);
      } catch {}
      return;
    }
    if (!payload || !Array.isArray(payload.bets) || payload.bets.length === 0) {
      try {
        window.sessionStorage.removeItem(DEMO_STORAGE_KEY);
      } catch {}
      return;
    }

    const importedAt = new Date().toISOString();
    const bookId = activeBook.id;
    const out: ImportedBet[] = payload.bets.map((b) => {
      const { home, away } = splitTeams(b.event);
      // Sport classifier is authoritative even if the demo route
      // returned a guess — the classifier has the full player /
      // team dictionary and its output is what the rest of the app
      // trusts for filtering + breakdown pages.
      const sport = classifySport({
        selection: b.selection,
        event: b.event,
        market: b.market as MarketGuess,
        home,
        away,
        sport: b.sport,
      });
      return {
        id: uid(),
        bookId,
        kickoff: b.kickoff,
        sport,
        home,
        away,
        event: b.event,
        market: b.market as MarketGuess,
        selection: b.selection,
        odds: b.odds,
        stake: b.stake,
        status: b.status as Status,
        pl: Math.round(computePl(b.status, b.stake, b.odds) * 100) / 100,
        source: DEMO_SOURCE_TAG,
        importedAt,
        raw: {},
      };
    });

    // Defer the writes past this render tick. appendBets triggers a
    // localStorage + sync write; setState fires the banner. React 19
    // rejects synchronous setState in an effect.
    queueMicrotask(() => {
      appendBets(out);
      try {
        window.sessionStorage.removeItem(DEMO_STORAGE_KEY);
      } catch {}
      setImportedCount(out.length);
      // Bump the parent's re-aggregation counter so the dashboard
      // picks up the freshly-imported bets on this render cycle.
      onImported?.(out.length);
    });
    // We deliberately depend on user?.id and activeBook.id (not the
    // whole objects) so the effect doesn't re-run on unrelated
    // refresh() calls in the auth context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, activeBook?.id]);

  if (importedCount == null || importedCount === 0) return null;

  const dismiss = () => setImportedCount(null);

  return (
    <div className="demo-import-banner" role="status">
      <span>
        <strong>
          {importedCount} bet{importedCount === 1 ? "" : "s"}
        </strong>{" "}
        imported from your landing-page demo. They&rsquo;re in your bet log
        now.
      </span>
      <button
        type="button"
        className="demo-import-banner-dismiss"
        onClick={dismiss}
        aria-label="Dismiss import notice"
      >
        Dismiss
      </button>
    </div>
  );
}
