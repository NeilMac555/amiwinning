// Biggest Leaks analyzer.
//
// The idea: slice a user's settled bets across three axes — competition,
// market type, and odds bucket — and surface the segments where they're
// losing (or winning) the most money AND where the sample size is large
// enough for the number to mean something.
//
// Ranking formula: score = |P/L| * sqrt(sample_size).
//   - Rewards segments where real money has been lost/won.
//   - Penalises small samples (a 5-bet slice losing 3u should rank below
//     a 200-bet slice losing 30u even though the % ROI is worse in the
//     small slice — the small slice is mostly variance).
//
// Confidence tiers are shown alongside each leak so users understand
// how noisy the number is:
//   - n < 30       : "early signal"     (visible for CLV-driven leaks
//                                        only, since CLV is much less
//                                        noisy than win-rate ROI)
//   - 30 <= n < 100: "moderate"
//   - n >= 100     : "strong"
//
// Empty state: users under 50 settled bets total can't have meaningful
// leak analysis in any one slice. The page handles that upstream.

import type { ImportedBet } from "./import/types";
import { byMarket, byCompetition } from "./analytics";
import { classifySport } from "./sport-classify";

export type LeakDimension = "competition" | "market" | "sport" | "odds";
export type Confidence = "early" | "moderate" | "strong";

export interface Leak {
  dimension: LeakDimension;
  label: string;
  n: number;              // settled bets in this slice
  pl: number;              // total P/L in units
  yieldPct: number;        // pl / totalStaked, as percent
  avgOdds: number;
  winRate: number;         // as percent
  confidence: Confidence;
  score: number;           // |pl| * sqrt(n), used for ranking
}

export interface LeakAnalysis {
  totalSettled: number;
  leaks: Leak[];        // segments where you're losing money
  strengths: Leak[];    // segments where you're winning money
}

const MIN_N_FOR_ROI_LEAK = 30;
const TOP_LEAKS = 5;
const TOP_STRENGTHS = 3;

function isSettled(b: ImportedBet): boolean {
  return b.status !== "pending" && b.status !== "void";
}
function isWin(b: ImportedBet): boolean {
  return b.status === "won" || b.status === "half_won";
}

function confidenceOf(n: number): Confidence {
  if (n >= 100) return "strong";
  if (n >= 30) return "moderate";
  return "early";
}

// ─ Odds bucket dimension (not in analytics.ts, defined here) ─────────────

interface OddsBucket {
  label: string;
  min: number;
  max: number;
}
const ODDS_BUCKETS: OddsBucket[] = [
  { label: "Short odds (< 1.7)",        min: 0,    max: 1.7 },
  { label: "Mid odds (1.7 – 2.5)",      min: 1.7,  max: 2.5 },
  { label: "Longshots (2.5 – 4.0)",     min: 2.5,  max: 4.0 },
  { label: "Big longshots (4.0+)",       min: 4.0,  max: Infinity },
];

function bucketOdds(odds: number): OddsBucket | null {
  for (const b of ODDS_BUCKETS) {
    if (odds >= b.min && odds < b.max) return b;
  }
  return null;
}

function byOddsBucket(bets: ImportedBet[]): Leak[] {
  const groups = new Map<
    string,
    { pl: number; stake: number; n: number; wins: number; oddsSum: number }
  >();
  for (const b of bets) {
    if (!isSettled(b)) continue;
    const bucket = bucketOdds(b.odds);
    if (!bucket) continue;
    const cur = groups.get(bucket.label) ?? {
      pl: 0,
      stake: 0,
      n: 0,
      wins: 0,
      oddsSum: 0,
    };
    cur.pl += b.pl;
    cur.stake += b.stake;
    cur.n++;
    cur.oddsSum += b.odds;
    if (isWin(b)) cur.wins++;
    groups.set(bucket.label, cur);
  }
  const rows: Leak[] = [];
  for (const [label, v] of groups.entries()) {
    if (v.n < MIN_N_FOR_ROI_LEAK) continue;
    rows.push({
      dimension: "odds",
      label,
      n: v.n,
      pl: round2(v.pl),
      yieldPct: v.stake > 0 ? round2((v.pl / v.stake) * 100) : 0,
      avgOdds: round2(v.oddsSum / v.n),
      winRate: round1((v.wins / v.n) * 100),
      confidence: confidenceOf(v.n),
      score: Math.abs(v.pl) * Math.sqrt(v.n),
    });
  }
  return rows;
}

// ─ Sport dimension ───────────────────────────────────────────────────────

function bySport(bets: ImportedBet[]): Leak[] {
  const groups = new Map<
    string,
    { pl: number; stake: number; n: number; wins: number; oddsSum: number }
  >();
  for (const b of bets) {
    if (!isSettled(b)) continue;
    // Use classifySport(b) rather than b.sport directly so results are
    // consistent with the current classifier even if the stored value
    // is stale (see data-cleanup.ts).
    const sport = classifySport(b) ?? "Other";
    const cur = groups.get(sport) ?? {
      pl: 0,
      stake: 0,
      n: 0,
      wins: 0,
      oddsSum: 0,
    };
    cur.pl += b.pl;
    cur.stake += b.stake;
    cur.n++;
    cur.oddsSum += b.odds;
    if (isWin(b)) cur.wins++;
    groups.set(sport, cur);
  }
  const rows: Leak[] = [];
  for (const [label, v] of groups.entries()) {
    if (v.n < MIN_N_FOR_ROI_LEAK) continue;
    rows.push({
      dimension: "sport",
      label,
      n: v.n,
      pl: round2(v.pl),
      yieldPct: v.stake > 0 ? round2((v.pl / v.stake) * 100) : 0,
      avgOdds: round2(v.oddsSum / v.n),
      winRate: round1((v.wins / v.n) * 100),
      confidence: confidenceOf(v.n),
      score: Math.abs(v.pl) * Math.sqrt(v.n),
    });
  }
  return rows;
}

// ─ Adapter: wrap byMarket / byCompetition rows into Leak shape ───────────

function marketLeaks(bets: ImportedBet[]): Leak[] {
  return byMarket(bets)
    .filter((r) => r.bets >= MIN_N_FOR_ROI_LEAK)
    .map((r) => ({
      dimension: "market" as const,
      label: r.label,
      n: r.bets,
      pl: r.pl,
      yieldPct: r.yieldPct,
      avgOdds: r.avgOdds,
      winRate: r.winRate,
      confidence: confidenceOf(r.bets),
      score: Math.abs(r.pl) * Math.sqrt(r.bets),
    }));
}

function competitionLeaks(bets: ImportedBet[]): Leak[] {
  return byCompetition(bets)
    .filter((r) => r.bets >= MIN_N_FOR_ROI_LEAK)
    .map((r) => ({
      dimension: "competition" as const,
      label: r.label,
      n: r.bets,
      pl: r.pl,
      yieldPct: r.yieldPct,
      avgOdds: r.avgOdds,
      winRate: r.winRate,
      confidence: confidenceOf(r.bets),
      score: Math.abs(r.pl) * Math.sqrt(r.bets),
    }));
}

// ─ Public API ────────────────────────────────────────────────────────────

export function analyzeLeaks(bets: ImportedBet[]): LeakAnalysis {
  const settledCount = bets.filter(isSettled).length;
  const all: Leak[] = [
    ...bySport(bets),
    ...competitionLeaks(bets),
    ...marketLeaks(bets),
    ...byOddsBucket(bets),
  ];

  const leaks = all
    .filter((l) => l.pl < 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_LEAKS);

  const strengths = all
    .filter((l) => l.pl > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_STRENGTHS);

  return { totalSettled: settledCount, leaks, strengths };
}

// ─ Helpers ───────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
