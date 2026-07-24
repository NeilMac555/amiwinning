"use client";

// Dashboard edge callout — replaces the old ProfitPerStake card in the
// right slot next to WinRateGauge. Surfaces the user's #1 biggest edge
// straight on the dashboard so /analytics/leaks feels like a live
// insight surface rather than a dead-end tab. Clicking the card links
// through to the full report.
//
// Reasoning:
//   ProfitPerStake was a $10/$25/$50/$100 unit-to-dollar converter.
//   Serious bettors think in units and never used it; casual bettors
//   can multiply by their own stake in their head. Prime dashboard
//   real estate was showing a curiosity toy that changed no decision.
//   This card shows a signal that DOES change decisions ("your
//   edge in BTTS is real — double down") and drives clicks to the
//   killer leaks feature.
//
// Empty states:
//   - Under 50 settled bets       → prompt to log more
//   - Enough bets, no edge yet    → nudge into /analytics/leaks to
//                                    see what's dragging you
//   - Has an edge                 → the edge card

import Link from "next/link";
import { useMemo } from "react";
import { analyzeLeaks } from "@/lib/leaks";
import type { ImportedBet } from "@/lib/import/types";

interface Props {
  bets: ImportedBet[];
}

const MIN_SETTLED_FOR_ANALYSIS = 50;

export function DashboardEdgeCallout({ bets }: Props) {
  const analysis = useMemo(() => analyzeLeaks(bets), [bets]);
  const topEdge = analysis.strengths[0];
  const topLeak = analysis.leaks[0];

  // Not enough data yet.
  if (analysis.totalSettled < MIN_SETTLED_FOR_ANALYSIS) {
    return (
      <Link
        href="/analytics/leaks"
        className="card"
        style={{
          padding: 18,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          textDecoration: "none",
          color: "inherit",
          minHeight: 156,
        }}
      >
        <div className="kpi-label">Your edge</div>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            color: "var(--text-muted)",
            marginTop: 8,
          }}
        >
          Log at least {MIN_SETTLED_FOR_ANALYSIS} settled bets to see
          where your edge lives.
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color: "var(--text-faint)",
            fontFamily: "var(--mono)",
            letterSpacing: "0.02em",
          }}
        >
          {analysis.totalSettled}/{MIN_SETTLED_FOR_ANALYSIS} · view leaks report →
        </div>
      </Link>
    );
  }

  // Enough data, no positive-P/L slice cleared the threshold.
  if (!topEdge) {
    return (
      <Link
        href="/analytics/leaks"
        className="card"
        style={{
          padding: 18,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          textDecoration: "none",
          color: "inherit",
          minHeight: 156,
        }}
      >
        <div className="kpi-label">Your edge</div>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            color: "var(--text-muted)",
            marginTop: 8,
          }}
        >
          No clear positive segments yet.{" "}
          {topLeak && (
            <>
              Biggest drag:{" "}
              <span style={{ color: "var(--red)" }}>{topLeak.label}</span>.
            </>
          )}
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color: "var(--text-faint)",
            fontFamily: "var(--mono)",
            letterSpacing: "0.02em",
          }}
        >
          view leaks report →
        </div>
      </Link>
    );
  }

  // Has a real edge — show it.
  return (
    <Link
      href="/analytics/leaks"
      className="card"
      style={{
        padding: 18,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        textDecoration: "none",
        color: "inherit",
        minHeight: 156,
        borderLeft: "3px solid var(--green)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div className="kpi-label">Your biggest edge</div>
        <div
          style={{
            fontSize: 10,
            fontFamily: "var(--mono)",
            color: "var(--text-faint)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {dimensionShort(topEdge.dimension)}
        </div>
      </div>
      <div
        style={{
          fontFamily: "var(--serif)",
          fontSize: 32,
          fontWeight: 500,
          letterSpacing: "-0.025em",
          lineHeight: 1.05,
          fontVariationSettings: '"opsz" 96, "SOFT" 30',
          color: "var(--text)",
          marginTop: 8,
        }}
      >
        {topEdge.label}
      </div>
      <div
        style={{
          marginTop: 10,
          display: "flex",
          gap: 14,
          fontFamily: "var(--mono)",
          fontSize: 12,
          alignItems: "baseline",
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: "var(--green)", fontWeight: 600 }}>
          {topEdge.pl >= 0 ? "+" : ""}
          {topEdge.pl.toFixed(1)}u
        </span>
        <span style={{ color: "var(--green)" }}>
          {topEdge.yieldPct >= 0 ? "+" : ""}
          {topEdge.yieldPct.toFixed(1)}%
        </span>
        <span style={{ color: "var(--text-muted)" }}>
          {topEdge.n.toLocaleString()} bets
        </span>
      </div>
      <div
        style={{
          marginTop: 10,
          fontSize: 11,
          color: "var(--text-faint)",
          letterSpacing: "0.02em",
        }}
      >
        view all leaks + edges →
      </div>
    </Link>
  );
}

function dimensionShort(d: string): string {
  switch (d) {
    case "sport":
      return "SPORT";
    case "competition":
      return "COMPETITION";
    case "market":
      return "MARKET";
    case "odds":
      return "ODDS";
    default:
      return d.toUpperCase();
  }
}
