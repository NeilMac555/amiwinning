"use client";

import type { SecondaryStats as SecondaryStatsT } from "@/lib/data";
import { fmtStake, useUnit } from "./UnitContext";
import { useAuth } from "@/lib/auth";
import { formatOdds } from "@/lib/format-odds";

interface Props {
  s: SecondaryStatsT;
}

export function SecondaryStats({ s }: Props) {
  const unit = useUnit();
  const { activeBook } = useAuth();
  const oddsFormat = activeBook?.oddsFormat ?? "decimal";
  const americanFromAvgOdds = (avgOdds: number) =>
    avgOdds >= 2
      ? "+" + Math.round((avgOdds - 1) * 100)
      : "−" + Math.round(100 / (avgOdds - 1));
  return (
    <div className="stat-row">
      <div className="stat-cell">
        <div className="stat-label">Win rate</div>
        <div className="stat-value">{s.winRate.toFixed(1)}%</div>
        <div className="stat-sub">
          Break-even at {(100 / s.avgOdds).toFixed(1)}%
        </div>
      </div>
      <div className="stat-cell">
        <div className="stat-label">Avg odds</div>
        <div className="stat-value">{formatOdds(s.avgOdds, oddsFormat)}</div>
        <div className="stat-sub">
          {oddsFormat === "american"
            ? `${s.avgOdds.toFixed(2)} decimal`
            : `${americanFromAvgOdds(s.avgOdds)} American`}
        </div>
      </div>
      <div className="stat-cell">
        <div className="stat-label">Avg stake</div>
        <div className="stat-value">{fmtStake(s.avgStake, unit)}</div>
        <div className="stat-sub">
          {s.stakeRoll > 0
            ? `${s.stakeRoll.toFixed(2)}% bankroll`
            : "—"}
        </div>
      </div>
      <div className="stat-cell">
        <div className="stat-label">Avg CLV</div>
        <div
          className={`stat-value ${s.avgClv > 0 ? "num-pos" : s.avgClv < 0 ? "num-neg" : "num-flat"}`}
        >
          {s.avgClv === 0 ? "—" : `${s.avgClv > 0 ? "+" : "−"}${Math.abs(s.avgClv).toFixed(2)}%`}
        </div>
        <div className="stat-sub">
          {s.avgClv === 0 ? "Not yet captured" : "Pinnacle baseline"}
        </div>
      </div>
    </div>
  );
}
