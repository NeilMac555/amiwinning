"use client";

// /analytics/leaks — Biggest Leaks report.
//
// Where the user is losing (and winning) the most money, sliced across
// competition, market, sport, and odds bucket. See src/lib/leaks.ts for
// the ranking formula and confidence tiers.
//
// Shape mirrors /analytics: client-rendered from the local bets cache,
// scoped to the active book, ghost-preview empty state for users with
// no data yet.

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { UnitProvider, fmtPL } from "@/components/UnitContext";
import { RangeTabs } from "@/components/RangeTabs";
import { consumeSeed, loadBets } from "@/lib/import/store";
import type { ImportedBet } from "@/lib/import/types";
import { applyThemeForSignedIn, useSettings } from "@/lib/settings";
import { useAuth } from "@/lib/auth";
import { SAMPLE_BETS } from "@/lib/sample-profile";
import { analyzeLeaks, type Leak, type Confidence } from "@/lib/leaks";
import { filterByRange, rangeLabel, type Range } from "@/lib/range";

// Leak analysis over very short windows produces noise (a single bad
// weekend in 7 days can look like a leak). Restrict the range picker
// to windows where sample sizes have a chance to matter.
const LEAKS_RANGES: Range[] = ["3M", "6M", "YTD", "12M", "All"];

const MIN_TOTAL_SETTLED_FOR_REAL_ANALYSIS = 50;

export default function LeaksPage() {
  const [bets, setBets] = useState<ImportedBet[]>([]);
  const [range, setRange] = useState<Range>("All");
  // Freeze `now` once on mount so filterByRange is deterministic across
  // the memo — required by React 19's no-Date.now-in-render rule.
  const [now, setNow] = useState<number>(() => Date.now());
  const unit = useSettings().unit;
  const { user, betsVersion, activeBook } = useAuth();

  useEffect(() => {
    applyThemeForSignedIn();
    if (!user) consumeSeed();
    const allRaw = loadBets();
    const all = user
      ? allRaw.filter((b) => !b.id.startsWith("seed-"))
      : allRaw;
    const scoped = activeBook
      ? all.filter((b) => !b.bookId || b.bookId === activeBook.id)
      : all;
    // Reset the reference time whenever we reload bets so the range
    // filter is stable across the analysis run.
    const nowMs = Date.now();
    queueMicrotask(() => {
      setBets(scoped);
      setNow(nowMs);
    });
  }, [betsVersion, user, activeBook]);

  // If the user has almost no data, run the analysis on SAMPLE_BETS so
  // they see what the page WILL look like once they've logged enough.
  // Consistent with the empty-state pattern on /analytics.
  const settledCount = useMemo(
    () =>
      bets.filter(
        (b) =>
          b.status !== "pending" && b.status !== "void",
      ).length,
    [bets],
  );
  const usingSampleData = settledCount < MIN_TOTAL_SETTLED_FOR_REAL_ANALYSIS;
  const displayBets = usingSampleData ? SAMPLE_BETS : bets;

  // Apply the range filter before running the analyser. Freeze `now`
  // at render time (via the state above) so the memo stays pure —
  // React 19 forbids Date.now() inside useMemo.
  const windowedBets = useMemo(
    () => filterByRange(displayBets, range, now),
    [displayBets, range, now],
  );
  const analysis = useMemo(() => analyzeLeaks(windowedBets), [windowedBets]);

  return (
    <UnitProvider unit={unit}>
      <div className="app">
        <Sidebar />
        <div className="main-col">
          <TopBar />
          <div className="page">
            <div className="page-header">
              <div>
                <h1 className="page-title">Biggest Leaks</h1>
                <div className="page-subtitle">
                  {usingSampleData ? (
                    <>
                      Sample preview.{" "}
                      <Link href="/">Log your first bets</Link> to unlock
                      the real report ({settledCount}/
                      {MIN_TOTAL_SETTLED_FOR_REAL_ANALYSIS} settled bets so far).
                    </>
                  ) : (
                    <>
                      Where you&rsquo;re losing (and winning) the most money.
                      Analysed across {analysis.totalSettled.toLocaleString()} settled bets over{" "}
                      {rangeLabel(range, now)}.
                    </>
                  )}
                </div>
              </div>
              <RangeTabs value={range} onChange={setRange} options={LEAKS_RANGES} />
            </div>

            {analysis.leaks.length === 0 && analysis.strengths.length === 0 ? (
              <div className="leaks-empty">
                <p>
                  <strong>Not enough signal yet in any single slice.</strong>
                </p>
                <p>
                  A leak needs at least 30 settled bets in the same
                  competition / market / odds range before we&rsquo;ll
                  call it out — otherwise we&rsquo;d just be pattern-
                  matching variance. Keep logging.
                </p>
              </div>
            ) : (
              <>
                {analysis.leaks.length > 0 && (
                  <section className="leaks-section leaks-block leaks-block--leak">
                    <h2 className="leaks-h2 leaks-h2--leak">
                      Biggest Leaks
                    </h2>
                    <p className="leaks-lead">
                      Where you&rsquo;re losing money. Ranked by how much
                      each pattern has cost you, weighted by sample size.
                      Sustained negative segments — not one-off cold
                      streaks.
                    </p>
                    <div className="leaks-grid">
                      {analysis.leaks.map((l, i) => (
                        <LeakCard key={`${l.dimension}:${l.label}`} leak={l} rank={i + 1} tone="leak" />
                      ))}
                    </div>
                  </section>
                )}

                {analysis.strengths.length > 0 && (
                  <section className="leaks-section leaks-block leaks-block--strength">
                    <h2 className="leaks-h2 leaks-h2--strength">
                      Biggest Edges
                    </h2>
                    <p className="leaks-lead">
                      Where you actually make money. Same slicing, same
                      threshold — these are the segments to double down
                      on.
                    </p>
                    <div className="leaks-grid">
                      {analysis.strengths.map((s, i) => (
                        <LeakCard key={`${s.dimension}:${s.label}`} leak={s} rank={i + 1} tone="strength" />
                      ))}
                    </div>
                  </section>
                )}

                <section className="leaks-section leaks-methodology">
                  <h3 className="leaks-h3">How this is calculated</h3>
                  <ul>
                    <li>
                      Bets are sliced four ways: <strong>sport</strong>,{" "}
                      <strong>competition</strong> (soccer only, e.g. Premier
                      League, La Liga, Champions League),{" "}
                      <strong>market type</strong> (correct score,
                      goalscorer, BTTS, over/under, etc.), and{" "}
                      <strong>odds bucket</strong> (short / mid / longshot
                      / big longshot).
                    </li>
                    <li>
                      Only settled bets count. Pending and void bets are
                      excluded.
                    </li>
                    <li>
                      Minimum <strong>30 bets per slice</strong>. Below
                      that, ROI is too noisy to distinguish real leaks
                      from variance.
                    </li>
                    <li>
                      Ranking:{" "}
                      <code>|P/L| × √n</code>. Slices with real money at
                      stake and a decent sample rise to the top.
                    </li>
                    <li>
                      <strong>Confidence badges</strong> tell you how much
                      to trust each number: 🟡 early (n=30–49), 🟠 moderate
                      (n=50–99), 🟢 strong (n=100+).
                    </li>
                  </ul>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </UnitProvider>
  );

  function LeakCard({
    leak,
    rank,
    tone,
  }: {
    leak: Leak;
    rank: number;
    tone: "leak" | "strength";
  }) {
    return (
      <div className={`leaks-card leaks-card--${tone}`}>
        <div className="leaks-card-head">
          <div>
            <div className="leaks-card-dim">{dimensionLabel(leak.dimension)}</div>
            <div className="leaks-card-label">{leak.label}</div>
          </div>
          <div className="leaks-card-rank">#{rank}</div>
        </div>

        <div className="leaks-card-metrics">
          <div className="leaks-card-metric">
            <div className="leaks-card-metric-label">P/L</div>
            <div className={`leaks-card-metric-value leaks-card-metric-value--${leak.pl >= 0 ? "pos" : "neg"}`}>
              {fmtPL(leak.pl, "u")}
            </div>
          </div>
          <div className="leaks-card-metric">
            <div className="leaks-card-metric-label">Yield</div>
            <div className={`leaks-card-metric-value leaks-card-metric-value--${leak.yieldPct >= 0 ? "pos" : "neg"}`}>
              {leak.yieldPct >= 0 ? "+" : ""}
              {leak.yieldPct.toFixed(1)}%
            </div>
          </div>
          <div className="leaks-card-metric">
            <div className="leaks-card-metric-label">Bets</div>
            <div className="leaks-card-metric-value">{leak.n.toLocaleString()}</div>
          </div>
          <div className="leaks-card-metric">
            <div className="leaks-card-metric-label">Win rate</div>
            <div className="leaks-card-metric-value">{leak.winRate.toFixed(1)}%</div>
          </div>
        </div>

        <div className="leaks-card-foot">
          <span className={`leaks-badge leaks-badge--${leak.confidence}`}>
            {confidenceLabel(leak.confidence)}
          </span>
          <span className="leaks-card-avg-odds">avg odds {leak.avgOdds.toFixed(2)}</span>
        </div>
      </div>
    );
  }
}

function dimensionLabel(d: Leak["dimension"]): string {
  switch (d) {
    case "sport":
      return "SPORT";
    case "competition":
      return "COMPETITION";
    case "market":
      return "MARKET TYPE";
    case "odds":
      return "ODDS RANGE";
  }
}

function confidenceLabel(c: Confidence): string {
  switch (c) {
    case "early":
      return "🟡 Early signal";
    case "moderate":
      return "🟠 Moderate confidence";
    case "strong":
      return "🟢 Strong signal";
  }
}
