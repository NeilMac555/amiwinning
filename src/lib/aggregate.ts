// Aggregations: turn a flat ImportedBet[] into the DashboardData shape that the
// dashboard components already consume. Keeps mock-data and real-data paths
// interchangeable.
//
// Imported bets have no CLV (Pinnacle closing odds aren't in bettin.gs exports)
// so anything CLV-related falls back to 0 / empty. CLV will populate as users
// log bets through the app pre-kickoff.

import type {
  BreakdownRow,
  ClvDistBin,
  DashboardData,
  EquityData,
  EquityPoint,
  HeatmapCell,
  KPIs,
  OpenPosition,
  ProfileKey,
  SecondaryStats,
  SettledBet,
  Sparks,
  TickerItem,
} from "./data";
import type { ImportedBet } from "./import/types";
import { guessMarket } from "./import/normalise";
import { betClv, meanClvPct } from "./clv";
import { classifySport } from "./sport-classify";

const DAY_MS = 86400000;

function kickoffMs(b: ImportedBet): number {
  return new Date(b.kickoff).getTime();
}

function isSettled(b: ImportedBet): boolean {
  return (
    b.status === "won" ||
    b.status === "lost" ||
    b.status === "push" ||
    b.status === "void" ||
    b.status === "half_won" ||
    b.status === "half_lost"
  );
}

function isWin(b: ImportedBet): boolean {
  return b.status === "won" || b.status === "half_won";
}

function isLoss(b: ImportedBet): boolean {
  return b.status === "lost" || b.status === "half_lost";
}

// KPIs ---------------------------------------------------------------------

function computeKpis(bets: ImportedBet[]): KPIs {
  const settled = bets.filter(isSettled).sort((a, b) => kickoffMs(a) - kickoffMs(b));
  const totalStake = settled.reduce((s, b) => s + b.stake, 0);
  const totalPl = settled.reduce((s, b) => s + b.pl, 0);
  const yieldPct = totalStake > 0 ? (totalPl / totalStake) * 100 : 0;

  // Walk cumulative P/L; track running peak and the deepest dollar drawdown.
  // peakDrawdown $ = the worst hole you ever climbed out of = the minimum
  // capital you needed to weather the worst stretch.
  let peak = 0;
  let cum = 0;
  let peakDrawdown = 0; // positive dollar amount
  for (const b of settled) {
    cum += b.pl;
    if (cum > peak) peak = cum;
    const dd = peak - cum;
    if (dd > peakDrawdown) peakDrawdown = dd;
  }

  // Return on capital — lifetime profit / the minimum risk capital you'd have
  // needed to survive your worst losing stretch (peakDrawdown).
  //
  // Only annualise when the window is *materially* longer than a year — inside
  // ~1 year, annualisation either does nothing (year = 1) or distorts short
  // windows by extrapolating noise. Below the threshold we show the raw
  // period return.
  let rocPct = 0;
  let rocAnnualised = false;
  if (peakDrawdown > 0 && settled.length > 1) {
    const days =
      (kickoffMs(settled[settled.length - 1]) - kickoffMs(settled[0])) / DAY_MS;
    const years = days / 365.25;
    const totalRoc = (totalPl / peakDrawdown) * 100;
    if (years >= 1.1) {
      rocPct = totalRoc / years;
      rocAnnualised = true;
    } else {
      rocPct = totalRoc;
      rocAnnualised = false;
    }
  }

  // Max drawdown as a percentage of the peak (informational; not the ROC base).
  const maxDdPct =
    peak > 0 ? -(peakDrawdown / Math.max(peak, peakDrawdown)) * 100 : 0;

  // Human-readable last bet time.
  const last = settled[settled.length - 1];
  const lastBetAgo = last ? humanAgo(Date.now() - kickoffMs(last)) : undefined;

  return {
    clvPct: round(meanClvPct(bets), 2),
    yieldPct: round(yieldPct, 2),
    rocPct: round(rocPct, 1),
    maxDdPct: round(maxDdPct, 2),
    sampleSize: bets.length,
    lifetimePl: round(totalPl, 2),
    peakDrawdown: round(peakDrawdown, 2),
    lastBetAgo,
    rocAnnualised,
  };
}

// Sparks: 32-point series. We bucket settled bets into 32 chronological windows
// and compute cumulative metrics. CLV stays flat since imported bets have none.

function computeSparks(bets: ImportedBet[]): Sparks {
  const settled = bets.filter(isSettled).sort((a, b) => kickoffMs(a) - kickoffMs(b));
  const N = 32;
  if (settled.length === 0) {
    const zeros = Array(N).fill(0);
    return { clv: zeros, yld: [...zeros], roi: [...zeros], dd: [...zeros], sample: [...zeros] };
  }
  const buckets: ImportedBet[][] = Array.from({ length: N }, () => []);
  settled.forEach((b, i) => {
    const idx = Math.min(N - 1, Math.floor((i / settled.length) * N));
    buckets[idx].push(b);
  });
  let cumPl = 0;
  let cumStake = 0;
  let peak = 0;
  const yld: number[] = [];
  const roi: number[] = [];
  const dd: number[] = [];
  const sample: number[] = [];
  buckets.forEach((bucket, i) => {
    for (const b of bucket) {
      cumPl += b.pl;
      cumStake += b.stake;
    }
    if (cumPl > peak) peak = cumPl;
    yld.push(cumStake > 0 ? (cumPl / cumStake) * 100 : 0);
    roi.push(cumStake > 0 ? (cumPl / cumStake) * 100 : 0);
    dd.push(cumPl - peak);
    sample.push(i);
  });
  return { clv: Array(N).fill(0), yld, roi, dd, sample };
}

// Equity curve --------------------------------------------------------------

/**
 * Cumulative P/L curve — no bankroll assumption. Y axis = running profit since
 * the first bet. Honest, comparable across users, no phantom starting balance.
 *
 * Uses the full bet history. The component's range tabs filter the display.
 */
function computeEquity(bets: ImportedBet[]): EquityData {
  const settled = bets.filter(isSettled).sort((a, b) => kickoffMs(a) - kickoffMs(b));
  if (settled.length === 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fallbackDays = 30;
    return {
      points: Array.from({ length: fallbackDays }, (_, i) => ({
        i,
        date: new Date(today.getTime() - (fallbackDays - 1 - i) * DAY_MS),
        equity: 0,
        clvPct: 0,
        bets: 0,
      })),
      maxDrawdown: 0,
    };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const earliest = new Date(kickoffMs(settled[0]));
  earliest.setHours(0, 0, 0, 0);
  // Walk day by day from earliest to today, accumulating P/L from 0.
  const totalDays = Math.round((today.getTime() - earliest.getTime()) / DAY_MS) + 1;
  const points: EquityPoint[] = [];
  let cum = 0;
  let peak = 0;
  let maxDdAbs = 0;
  let i = 0;
  for (let d = 0; d < totalDays; d++) {
    const dayStart = new Date(earliest.getTime() + d * DAY_MS);
    const dayEnd = dayStart.getTime() + DAY_MS;
    let betsToday = 0;
    while (i < settled.length && kickoffMs(settled[i]) < dayEnd) {
      cum += settled[i].pl;
      betsToday++;
      i++;
    }
    if (cum > peak) peak = cum;
    const ddAbs = peak - cum;
    if (ddAbs > maxDdAbs) maxDdAbs = ddAbs;
    points.push({
      i: d,
      date: dayStart,
      equity: round(cum, 2),
      clvPct: 0,
      bets: betsToday,
    });
  }
  // Report max drawdown as a percentage of peak P/L. If peak is tiny, this
  // overstates — the absolute dollar drawdown is the more honest measure
  // (carried in KPIs.peakDrawdown).
  const maxDrawdown = peak > 0 ? -(maxDdAbs / peak) * 100 : 0;
  return { points, maxDrawdown: round(maxDrawdown, 2) };
}

// Recent settled ------------------------------------------------------------

function computeRecentSettled(bets: ImportedBet[], n = 14): SettledBet[] {
  // Settled bets can't have happened in the future — clamp the sort key so a
  // bet with an erroneous future kickoff (e.g. the parser couldn't resolve a
  // date and guessed "next Sunday") doesn't jump above genuinely recent bets.
  const nowMs = Date.now();
  const effective = (b: ImportedBet) => Math.min(kickoffMs(b), nowMs);
  const settled = bets
    .filter((b) => isWin(b) || isLoss(b))
    .sort((a, b) => effective(b) - effective(a))
    .slice(0, n);
  return settled.map((b, idx) => ({
    id: b.id || `s${idx}`,
    // Use the classifier so even un-migrated bets display the correct sport.
    league: b.league || classifySport(b),
    home: b.home ?? splitFallback(b.event).home ?? "",
    away: b.away ?? splitFallback(b.event).away ?? "",
    market: b.market ?? "other",
    selection: b.selection,
    odds: b.odds,
    stake: b.stake,
    result: isWin(b) ? "win" : "loss",
    pl: Math.round(b.pl * 100) / 100,
    clvBp: 0,
    // Same clamp on display: if the stored kickoff is in the future, treat
    // "settled at" as now so the relative-time label reads sensibly instead
    // of showing "1m ago" for a bet placed weeks ago.
    settledAt: new Date(Math.min(kickoffMs(b), nowMs)),
  }));
}

// Open positions ------------------------------------------------------------

function computeOpenPositions(bets: ImportedBet[]): OpenPosition[] {
  const open = bets
    .filter((b) => b.status === "pending")
    .sort((a, b) => kickoffMs(a) - kickoffMs(b))
    .slice(0, 12);
  return open.map((b, i) => ({
    id: b.id || `p${i}`,
    league: b.league || classifySport(b),
    home: b.home ?? splitFallback(b.event).home ?? "",
    away: b.away ?? splitFallback(b.event).away ?? "",
    market: b.market ?? "other",
    selection: b.selection,
    odds: b.odds,
    oddsOpen: b.odds,
    oddsHist: Array(24).fill(b.odds),
    stake: b.stake,
    toWin: Math.round(b.stake * (b.odds - 1)),
    clvBp: 0,
    kickoff: new Date(b.kickoff),
    isLive: false,
  }));
}

// Heatmap -------------------------------------------------------------------

function computeHeatmap(bets: ImportedBet[]): HeatmapCell[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cells: HeatmapCell[] = [];
  // Group by date — track bet count, sum of P/L, sum + count of CLV (only
  // bets that have a closing line contribute to the average).
  const byDate = new Map<
    string,
    { bets: number; pl: number; clvSum: number; clvN: number }
  >();
  for (const b of bets) {
    const d = new Date(b.kickoff);
    d.setHours(0, 0, 0, 0);
    const k = d.toISOString().slice(0, 10);
    const cur = byDate.get(k) ?? { bets: 0, pl: 0, clvSum: 0, clvN: 0 };
    cur.bets++;
    cur.pl += b.pl;
    const c = betClv(b);
    if (c != null) {
      cur.clvSum += c;
      cur.clvN++;
    }
    byDate.set(k, cur);
  }
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS);
    const k = d.toISOString().slice(0, 10);
    const slot = byDate.get(k) ?? { bets: 0, pl: 0, clvSum: 0, clvN: 0 };
    cells.push({
      date: d,
      bets: slot.bets,
      pl: Math.round(slot.pl),
      avgClv: slot.clvN > 0 ? round(slot.clvSum / slot.clvN, 2) : null,
    });
  }
  return cells;
}

// Ticker: imported bets have no closing-line moves; show recent imports as a
// placeholder so the strip isn't empty.

function computeTicker(bets: ImportedBet[]): TickerItem[] {
  const recent = [...bets].sort((a, b) => kickoffMs(b) - kickoffMs(a)).slice(0, 14);
  return recent.map((b, i) => ({
    id: `tk${i}`,
    league: b.league || classifySport(b),
    match: b.event,
    sel: b.selection,
    from: b.odds.toFixed(2),
    to: b.odds.toFixed(2),
    moved: 0,
    tag: "IMPORTED",
  }));
}

// Secondary stats -----------------------------------------------------------

function computeSecondary(bets: ImportedBet[]): SecondaryStats {
  const settled = bets.filter(isSettled);
  const wins = settled.filter(isWin).length;
  const winRate = settled.length > 0 ? (wins / settled.length) * 100 : 0;
  const avgOdds =
    settled.length > 0
      ? settled.reduce((s, b) => s + b.odds, 0) / settled.length
      : 0;
  // Median odds — robust to longshot outliers. A single bet at 11.00 can
  // pull the mean above 2.5 even when 95% of the user's bets are 1.80-2.10.
  // The public profile uses median as the headline; the dashboard still
  // shows mean (more familiar to power users looking at their own data).
  const medianOdds = (() => {
    if (settled.length === 0) return 0;
    const sorted = settled.map((b) => b.odds).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  })();
  const avgStake =
    settled.length > 0
      ? settled.reduce((s, b) => s + b.stake, 0) / settled.length
      : 0;
  const turnover = settled.reduce((s, b) => s + b.stake, 0);
  const latest = settled.length
    ? Math.max(...settled.map(kickoffMs))
    : Date.now();
  const ago = Date.now() - latest;
  const lastBet = humanAgo(ago);
  return {
    winRate: round(winRate, 1),
    avgOdds: round(avgOdds, 2),
    medianOdds: round(medianOdds, 2),
    avgStake: Math.round(avgStake),
    turnover: Math.round(turnover),
    stakeRoll: avgStake > 0 ? round((avgStake / Math.max(turnover, 1)) * 100, 2) : 0,
    avgClv: round(meanClvPct(bets), 2),
    lastBet,
    wins,
    settledCount: settled.length,
  };
}

function humanAgo(ms: number): string {
  if (ms < 60_000) return "just now";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

// CLV distribution: no data → centred placeholder so the chart renders.

function computeClvDist(bets: ImportedBet[]): ClvDistBin[] {
  const bins = 36;
  const min = -8,
    max = 8;
  const counts = new Array(bins).fill(0);
  for (const b of bets) {
    const c = betClv(b);
    if (c == null) continue;
    // Clamp into [min, max) so outliers still register at the edges.
    const clamped = Math.max(min, Math.min(max - 0.0001, c));
    const idx = Math.floor(((clamped - min) / (max - min)) * bins);
    counts[idx]++;
  }
  const step = (max - min) / bins;
  return counts.map((count, i) => ({
    binCenter: min + step * (i + 0.5),
    count,
  }));
}

// Breakdowns ---------------------------------------------------------------

function computeBreakdown(
  bets: ImportedBet[],
  key: (b: ImportedBet) => string | undefined,
  label?: (k: string) => string,
): BreakdownRow[] {
  const groups = new Map<string, { pl: number; stake: number; n: number }>();
  for (const b of bets) {
    if (!isSettled(b)) continue;
    const k = key(b);
    if (!k) continue;
    const cur = groups.get(k) ?? { pl: 0, stake: 0, n: 0 };
    cur.pl += b.pl;
    cur.stake += b.stake;
    cur.n++;
    groups.set(k, cur);
  }
  const rows: BreakdownRow[] = [];
  for (const [k, v] of groups.entries()) {
    if (v.n < 20) continue; // suppress small samples
    const yieldPct = v.stake > 0 ? (v.pl / v.stake) * 100 : 0;
    rows.push({
      label: label ? label(k) : k,
      yieldPct: round(yieldPct, 2),
      sample: v.n,
    });
  }
  rows.sort((a, b) => b.yieldPct - a.yieldPct);
  return rows;
}

const MARKET_LABELS: Record<string, string> = {
  "1X2": "1X2",
  ah: "Asian handicap",
  ou: "Over/under",
  btts: "BTTS",
  dnb: "Draw no bet",
  totals_team: "Team totals",
  shots: "Player shots",
  corners: "Corners",
  scorer: "Goalscorer",
  cards: "Cards",
  half_time: "Half-time",
  ht_ft: "HT/FT",
  clean_sheet: "Clean sheet",
  winning_margin: "Winning margin",
  exact_score: "Correct score",
  tournament: "Outrights",
  parlay: "Parlays / multis",
  other: "Other",
};

// Odds-range breakdown ------------------------------------------------------
// Bookmaker-agnostic insight: "where's my edge — favs, coin-flips, or dogs?"

const ODDS_BUCKETS: Array<{ label: string; min: number; max: number }> = [
  { label: "Heavy favs (<1.50)", min: 1, max: 1.5 },
  { label: "Favs (1.50–1.80)", min: 1.5, max: 1.8 },
  { label: "Coin-flips (1.80–2.20)", min: 1.8, max: 2.2 },
  { label: "Dogs (2.20–3.00)", min: 2.2, max: 3.0 },
  { label: "Longshots (3.00+)", min: 3.0, max: Infinity },
];

function computeOddsRangeBreakdown(bets: ImportedBet[]): BreakdownRow[] {
  const groups = ODDS_BUCKETS.map(() => ({ pl: 0, stake: 0, n: 0 }));
  for (const b of bets) {
    if (!isSettled(b)) continue;
    const idx = ODDS_BUCKETS.findIndex((g) => b.odds >= g.min && b.odds < g.max);
    if (idx < 0) continue;
    groups[idx].pl += b.pl;
    groups[idx].stake += b.stake;
    groups[idx].n++;
  }
  // Preserve odds-range order so the chart reads left-to-right as
  // "low-odds → high-odds". Suppress buckets with too few bets.
  return groups
    .map((g, i) => ({
      label: ODDS_BUCKETS[i].label,
      yieldPct: g.stake > 0 ? round((g.pl / g.stake) * 100, 2) : 0,
      sample: g.n,
    }))
    .filter((row) => row.sample >= 20);
}

// Weekly P/L ----------------------------------------------------------------

function computeWeekly(bets: ImportedBet[], weeks = 52): number[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = today.getTime() - (weeks - 1) * 7 * DAY_MS;
  const out = Array(weeks).fill(0);
  for (const b of bets) {
    if (!isSettled(b)) continue;
    const t = kickoffMs(b);
    if (t < start) continue;
    const idx = Math.floor((t - start) / (7 * DAY_MS));
    if (idx >= 0 && idx < weeks) out[idx] += b.pl;
  }
  return out.map((v) => Math.round(v));
}

// Helpers -------------------------------------------------------------------

function round(n: number, dp: number): number {
  const p = Math.pow(10, dp);
  return Math.round(n * p) / p;
}

function splitFallback(event: string): { home?: string; away?: string } {
  for (const sep of [" -v- ", " v ", " vs ", " vs. "]) {
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

// Public --------------------------------------------------------------------

export function aggregateFromBets(bets: ImportedBet[]): DashboardData {
  return {
    profile: "mixed" as ProfileKey, // not meaningful for real data, but shape requires it
    kpis: computeKpis(bets),
    sparks: computeSparks(bets),
    equity: computeEquity(bets),
    open: computeOpenPositions(bets),
    settled: computeRecentSettled(bets),
    heatmap: computeHeatmap(bets),
    ticker: computeTicker(bets),
    secondary: computeSecondary(bets),
    clvDist: computeClvDist(bets),
    marketBd: computeBreakdown(
      bets,
      // Re-classify on the fly so previously-imported "Other" rows benefit
      // from newer market heuristics without forcing a re-import.
      (b) => guessMarket(b.selection),
      (k) => MARKET_LABELS[k] ?? k,
    ),
    oddsBd: computeOddsRangeBreakdown(bets),
    weekly: computeWeekly(bets),
  };
}
