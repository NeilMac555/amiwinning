"use client";

// Stake-scaler card. The dashboard tracks P/L in units — which is the
// honest, leverage-neutral way to log. But unit P/L is abstract: "+50u"
// means nothing to a casual reader. This card translates the lifetime
// unit P/L into concrete dollar outcomes at various unit sizes, so
// users can answer "if I'd bet $X/unit, what would I be up?".

import { useState } from "react";

interface Props {
  lifetimePlUnits: number;
  totalBets: number;
  yearsSpan?: number;
}

const STAKE_OPTIONS = [10, 25, 50, 100, 250];

function fmtDollars(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) {
    return `${(v / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 10_000) {
    return `${Math.round(v / 1_000).toLocaleString()}K`;
  }
  if (abs >= 1_000) {
    return `${(v / 1_000).toFixed(1)}K`;
  }
  return Math.round(v).toLocaleString("en-US");
}

export function ProfitPerStake({
  lifetimePlUnits,
  totalBets,
  yearsSpan,
}: Props) {
  const [stake, setStake] = useState(50);
  const dollars = lifetimePlUnits * stake;
  const color =
    dollars > 0
      ? "var(--green)"
      : dollars < 0
        ? "var(--red)"
        : "var(--text-muted)";
  const perYear = yearsSpan && yearsSpan > 0 ? dollars / yearsSpan : null;

  return (
    <div className="card" style={{ padding: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div className="kpi-label">If you bet</div>
        <div style={{ display: "flex", gap: 4 }}>
          {STAKE_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className="btn-ghost"
              data-active={s === stake ? "true" : undefined}
              onClick={() => setStake(s)}
              style={{
                padding: "3px 9px",
                fontSize: 11,
                fontFamily: "var(--mono)",
                letterSpacing: "-0.005em",
              }}
            >
              ${s}
            </button>
          ))}
        </div>
      </div>
      <div
        style={{
          fontFamily: "var(--serif)",
          fontSize: 38,
          fontWeight: 500,
          letterSpacing: "-0.025em",
          lineHeight: 1.05,
          fontVariationSettings: '"opsz" 96, "SOFT" 30',
          color,
          marginTop: 8,
        }}
      >
        {dollars >= 0 ? "+" : "−"}${fmtDollars(Math.abs(dollars))}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 11,
          color: "var(--text-muted)",
        }}
      >
        Lifetime · ${stake}/unit ×{" "}
        <span className="mono" style={{ color: "var(--text)" }}>
          {lifetimePlUnits >= 0 ? "+" : "−"}
          {Math.abs(lifetimePlUnits).toFixed(2)}u
        </span>{" "}
        across {totalBets.toLocaleString()} bets
      </div>
      {perYear != null && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: "var(--border-w) solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
          }}
        >
          <span style={{ color: "var(--text-faint)" }}>per year</span>
          <span
            className="mono"
            style={{
              color: perYear >= 0 ? "var(--green)" : "var(--red)",
              fontWeight: 600,
            }}
          >
            {perYear >= 0 ? "+" : "−"}${fmtDollars(Math.abs(perYear))}
          </span>
        </div>
      )}
    </div>
  );
}
