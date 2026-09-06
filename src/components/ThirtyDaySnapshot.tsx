"use client";

import { useMemo } from "react";
import type { ImportedBet } from "@/lib/import/types";
import { thirtyDaySnapshot } from "@/lib/thirty-day-snapshot";
import { fmtUnit, useUnit } from "./UnitContext";

export function ThirtyDaySnapshot({ bets, now, bookName }: { bets: ImportedBet[]; now: number; bookName: string }) {
  const data = useMemo(() => thirtyDaySnapshot(bets, now), [bets, now]);
  const unit = useUnit();
  const min = Math.min(...data.points);
  const max = Math.max(...data.points);
  const span = max - min || 1;
  const path = data.points.map((value, i) => `${i ? "L" : "M"}${8 + i * 304 / 30},${88 - (value - min) / span * 76}`).join(" ");
  const tone = data.profit > 0 ? "pos" : data.profit < 0 ? "neg" : "flat";
  return (
    <section className="thirty-day-snapshot card" aria-labelledby="snapshot-heading">
      <div className="snapshot-heading"><h2 id="snapshot-heading">Last 30 days</h2><span>{bookName}</span></div>
      <p className="snapshot-label">Profit / loss</p>
      <div className={`snapshot-profit num-${tone}`}>{fmtUnit(data.profit, unit, { signed: true, dp: 2 })}</div>
      {data.count ? (
        <svg className={`snapshot-chart num-${tone}`} viewBox="0 0 320 100" role="img" aria-label={`Cumulative profit over the last 30 days: ${fmtUnit(data.profit, unit, { signed: true, dp: 2 })}`}>
          <line x1="8" x2="312" y1={88 - (0 - min) / span * 76} y2={88 - (0 - min) / span * 76} stroke="var(--border-strong)" strokeDasharray="3 4" />
          <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      ) : <p className="snapshot-empty">No settled bets in this period yet.</p>}
      <dl className="snapshot-metrics"><div><dt>Yield</dt><dd>{data.yieldPct === null ? "—" : `${data.yieldPct > 0 ? "+" : ""}${data.yieldPct.toFixed(1)}%`}</dd></div><div><dt>Settled bets</dt><dd>{data.count.toLocaleString("en-GB")}</dd></div><div><dt>Total staked</dt><dd>{fmtUnit(data.stake, unit)}</dd></div></dl>
      <p className="snapshot-note">Today and the previous 29 days (UTC), by event date. Pending and void bets excluded. Independent of the filter below.</p>
    </section>
  );
}
