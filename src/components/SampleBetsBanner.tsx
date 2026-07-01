"use client";

// Sits above the dashboard body whenever the user has any bets that
// were parsed from the first-run PasteHero sample tip. Explains why
// those bets are there and gives a one-click clear action that only
// removes the sample rows, leaving any real bets untouched.
//
// Deletion goes through the existing per-bet `deleteBet` helper so the
// tombstone + Supabase-sync retry logic applies exactly as with any
// user-initiated delete. That means offline safety + rollback via the
// standard pending-sync queue.

import { loadBets, deleteBet } from "@/lib/import/store";
import { SAMPLE_SOURCE_TAG } from "@/lib/sample-tip";

interface Props {
  count: number;
  // Called after the clear completes so the dashboard re-aggregates.
  onCleared?: () => void;
}

export function SampleBetsBanner({ count, onCleared }: Props) {
  const onClear = () => {
    // Snapshot the current list, then delete each sample bet by ID.
    // deleteBet is fire-and-forget for the remote leg (localStorage
    // update is synchronous), so we can trigger the parent re-aggregate
    // right after the loop.
    const bets = loadBets();
    for (const b of bets) {
      if (b.source === SAMPLE_SOURCE_TAG) {
        deleteBet(b.id);
      }
    }
    onCleared?.();
  };

  return (
    <div className="sample-bets-banner" role="status">
      <span>
        These are sample bets so you can see how tracking works.{" "}
        <button
          type="button"
          className="sample-bets-banner-clear"
          onClick={onClear}
          aria-label={`Clear ${count} sample bet${count === 1 ? "" : "s"}`}
        >
          Clear them
        </button>
      </span>
    </div>
  );
}
