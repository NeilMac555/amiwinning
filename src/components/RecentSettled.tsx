"use client";

import type { SettledBet } from "@/lib/data";
import { fmtUnit, useUnit } from "./UnitContext";
import { useAuth } from "@/lib/auth";
import { formatOdds } from "@/lib/format-odds";
import { SafeEvent, SafeField } from "./SafeBetField";
import { isMissing } from "@/lib/bet-display";

interface Props {
  bets: SettledBet[];
  now: number;
}

function fmtAgo(d: Date, now: number): string {
  const ms = now - d.getTime();
  // Future-dated bets (bad parse or pending mislabel) — surface a clear marker
  // rather than the old "1m ago" lie. Caller already clamps settledAt to now
  // for genuine display, so this branch is a last-resort safety net.
  if (ms < -60_000) return "future";
  if (ms < 60_000) return "just now";
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return `${Math.floor(ms / 60_000)}m ago`;
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 14) return `${days}d ago`;
  // Past two weeks — switch to an absolute date so a "5d ago" stops being a lie
  // when it's actually 5 weeks ago.
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function RecentSettled({ bets, now }: Props) {
  const unit = useUnit();
  const { activeBook } = useAuth();
  const oddsFormat = activeBook?.oddsFormat ?? "decimal";
  return (
    <div className="card table-card">
      <div className="card-header">
        <div>
          <div className="card-title">Recent settled</div>
          <div className="card-meta" style={{ marginTop: 4 }}>
            <span>Last {bets.length} resolved</span>
          </div>
        </div>
        <div className="card-actions">
          <button className="btn-ghost">View all</button>
        </div>
      </div>
      <div className="settled-feed-scroll">
        <div className="settled-feed">
          {bets.map((b) => (
            <div className="settled-row" key={b.id}>
              <div>
                <div className="settled-when">{fmtAgo(b.settledAt, now)}</div>
                <div
                  className="settled-result-row"
                  style={{ marginTop: 2 }}
                >
                  {b.league}
                </div>
              </div>
              <div className="settled-meta">
                <div className="settled-event">
                  {(() => {
                    // Assemble a synthetic "home v away" string and let
                    // SafeEvent detect + tag any missing side. Handles
                    // the case where a scrappy paste only surfaced one
                    // team.
                    const hasHome = !isMissing(b.home);
                    const hasAway = !isMissing(b.away);
                    if (hasHome && hasAway) {
                      return <>{b.home} v {b.away}</>;
                    }
                    if (hasHome || hasAway) {
                      return (
                        <SafeEvent value={`${b.home ?? ""} v ${b.away ?? ""}`} />
                      );
                    }
                    return <SafeEvent value="" />;
                  })()}
                </div>
                <div className="settled-selection">
                  <SafeField value={b.selection} label="selection" /> @{" "}
                  {formatOdds(b.odds, oddsFormat)}
                </div>
              </div>
              <div>
                <div
                  className={`settled-pl ${b.result === "win" ? "num-pos" : "num-neg"}`}
                >
                  {fmtUnit(b.pl, unit, { signed: true })}
                </div>
                <div className="settled-result-row">{b.result}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
