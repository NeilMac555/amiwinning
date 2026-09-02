// Weekly Sharp Report — data layer.
//
// Turns a user's full bet history into the compact JSON payload the model
// reasons over. Three analysis axes, per Neil's spec: the competitions
// they bet, the markets they bet, and the odds bands they bet. Deliberately
// NO time-of-day / day-of-week / month slicing — that produces "you lose
// on Tuesdays" noise that nobody can act on.
//
// Everything here is pure and server-safe (no localStorage, no window).
// The cron route feeds it rows from Supabase via the service-role key.

import type { ImportedBet, MarketGuess, Status } from "@/lib/import/types";
import { aggregateFromBets } from "@/lib/aggregate";
import { analyzeLeaks, type Confidence, type LeakDimension } from "@/lib/leaks";
import { byCompetition, byMarket } from "@/lib/analytics";
import { classifySport } from "@/lib/sport-classify";

// ─ Types ─────────────────────────────────────────────────────────────────

export interface SegmentStat {
  dimension: LeakDimension;
  label: string;
  n: number;          // settled bets in the segment
  pl: number;         // units, 2dp
  yieldPct: number;   // pl / staked * 100, 2dp
  avgOdds: number;    // decimal, 2dp
  winRate: number;    // percent, 1dp
  confidence: Confidence;
}

export interface WeeklyReportInput {
  handle: string;
  /** ISO dates, inclusive start / exclusive end, UTC. */
  week: { start: string; end: string };
  lifetime: {
    settled: number;
    pl: number;
    yieldPct: number;
    /** null when the user has no closing odds logged — CLV is untracked, not zero. */
    clvPct: number | null;
    clvSample: number;
    maxDdPct: number;
    peakDrawdownUnits: number;
  };
  thisWeek: {
    settled: number;
    pending: number;
    pl: number;
    yieldPct: number;
    wins: number;
    losses: number;
    pushes: number;
  };
  /** Ranked by |P/L| * sqrt(n); n >= 30 only. May be empty for smaller accounts. */
  leaks: SegmentStat[];
  strengths: SegmentStat[];
  /** Full tables, floor n >= 5, sorted by |pl| desc. Context beyond the top-5 lists. */
  competitions: SegmentStat[];
  markets: SegmentStat[];
  oddsBands: SegmentStat[];
  /** Included only when no single sport is > 70% of volume (otherwise it's a tautology). */
  sports: SegmentStat[];
}

// Minimum settled bets before the report is worth sending. Under this the
// per-segment slices are all "early signal" and the email would be four
// bullets of "wait for more data".
export const MIN_SETTLED_FOR_REPORT = 30;

// ─ Supabase row → ImportedBet ────────────────────────────────────────────
//
// Mirror of rowToBet() in src/lib/bet-sync.ts. Duplicated here rather than
// imported because bet-sync pulls in the browser Supabase client and the
// localStorage store at module load, which a Node cron route must not do.

export interface BetRow {
  id: string;
  user_id: string;
  book_id: string;
  kickoff: string;
  sport: string;
  league: string | null;
  home: string | null;
  away: string | null;
  event: string;
  market: string | null;
  selection: string;
  odds: string | number;
  stake: string | number;
  closing_odds: string | number | null;
  bookmaker: string | null;
  tipster: string | null;
  tags: string[] | null;
  notes: string | null;
  status: string;
  pl: string | number;
  source: string;
  imported_at: string;
  raw: Record<string, string> | null;
}

export function betRowToImported(r: BetRow): ImportedBet {
  return {
    id: r.id,
    bookId: r.book_id,
    kickoff: r.kickoff,
    sport: r.sport,
    league: r.league ?? undefined,
    home: r.home ?? undefined,
    away: r.away ?? undefined,
    event: r.event,
    market: (r.market as MarketGuess) ?? undefined,
    selection: r.selection,
    odds: Number(r.odds),
    stake: Number(r.stake),
    closingOdds: r.closing_odds != null ? Number(r.closing_odds) : undefined,
    bookmaker: r.bookmaker ?? undefined,
    tipster: r.tipster ?? undefined,
    tags: r.tags ?? undefined,
    notes: r.notes ?? undefined,
    status: r.status as Status,
    pl: Number(r.pl),
    source: r.source,
    importedAt: r.imported_at,
    raw: r.raw ?? {},
  };
}

// ─ Week window ───────────────────────────────────────────────────────────

/**
 * The most recent COMPLETE Monday-to-Sunday week (UTC) as of `now`.
 * Cron fires Monday morning, so this is "last week". If it fires on any
 * other day (manual test), it's still the last full week, which keeps
 * the idempotency key stable across a re-run.
 */
export function lastCompleteWeek(now: Date = new Date()): { start: Date; end: Date } {
  const day = now.getUTCDay(); // 0 = Sunday
  const daysSinceMonday = (day + 6) % 7;
  const thisMonday = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - daysSinceMonday,
  );
  const DAY = 86_400_000;
  return { start: new Date(thisMonday - 7 * DAY), end: new Date(thisMonday) };
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─ Helpers ───────────────────────────────────────────────────────────────

function isSettled(b: ImportedBet): boolean {
  return b.status !== "pending" && b.status !== "void";
}
function isWin(b: ImportedBet): boolean {
  return b.status === "won" || b.status === "half_won";
}
function isLoss(b: ImportedBet): boolean {
  return b.status === "lost" || b.status === "half_lost";
}
function r2(n: number): number {
  return Math.round(n * 100) / 100;
}
function r1(n: number): number {
  return Math.round(n * 10) / 10;
}
function confidenceOf(n: number): Confidence {
  if (n >= 100) return "strong";
  if (n >= 30) return "moderate";
  return "early";
}

const TABLE_FLOOR_N = 5;
const TABLE_MAX_ROWS = 12;

interface Acc {
  pl: number;
  stake: number;
  n: number;
  wins: number;
  oddsSum: number;
}
function newAcc(): Acc {
  return { pl: 0, stake: 0, n: 0, wins: 0, oddsSum: 0 };
}
function accToStat(dimension: LeakDimension, label: string, v: Acc): SegmentStat {
  return {
    dimension,
    label,
    n: v.n,
    pl: r2(v.pl),
    yieldPct: v.stake > 0 ? r2((v.pl / v.stake) * 100) : 0,
    avgOdds: r2(v.oddsSum / v.n),
    winRate: r1((v.wins / v.n) * 100),
    confidence: confidenceOf(v.n),
  };
}
function finishTable(rows: SegmentStat[]): SegmentStat[] {
  return rows
    .filter((r) => r.n >= TABLE_FLOOR_N)
    .sort((a, b) => Math.abs(b.pl) - Math.abs(a.pl))
    .slice(0, TABLE_MAX_ROWS);
}

// Same four bands as /analytics/leaks so the email and the page agree.
const ODDS_BANDS: Array<{ label: string; min: number; max: number }> = [
  { label: "Short odds (< 1.7)", min: 0, max: 1.7 },
  { label: "Mid odds (1.7 to 2.5)", min: 1.7, max: 2.5 },
  { label: "Longshots (2.5 to 4.0)", min: 2.5, max: 4.0 },
  { label: "Big longshots (4.0+)", min: 4.0, max: Infinity },
];

function oddsBandTable(bets: ImportedBet[]): SegmentStat[] {
  const groups = new Map<string, Acc>();
  for (const b of bets) {
    if (!isSettled(b)) continue;
    const band = ODDS_BANDS.find((x) => b.odds >= x.min && b.odds < x.max);
    if (!band) continue;
    const cur = groups.get(band.label) ?? newAcc();
    cur.pl += b.pl;
    cur.stake += b.stake;
    cur.n++;
    cur.oddsSum += b.odds;
    if (isWin(b)) cur.wins++;
    groups.set(band.label, cur);
  }
  const rows: SegmentStat[] = [];
  for (const [label, v] of groups) rows.push(accToStat("odds", label, v));
  // Keep band order (short → long) rather than |pl| order; it reads better.
  return rows.filter((r) => r.n >= TABLE_FLOOR_N);
}

function sportTable(bets: ImportedBet[], settledTotal: number): SegmentStat[] {
  const groups = new Map<string, Acc>();
  for (const b of bets) {
    if (!isSettled(b)) continue;
    const sport = classifySport(b) ?? "Other";
    if (sport.toLowerCase() === "other") continue;
    const cur = groups.get(sport) ?? newAcc();
    cur.pl += b.pl;
    cur.stake += b.stake;
    cur.n++;
    cur.oddsSum += b.odds;
    if (isWin(b)) cur.wins++;
    groups.set(sport, cur);
  }
  const rows: SegmentStat[] = [];
  for (const [label, v] of groups) rows.push(accToStat("sport", label, v));
  // Dominance rule mirrors leaks.ts: if one sport is >70% of volume, the
  // sport axis says nothing useful. Drop it entirely.
  const dominant = rows.some((r) => settledTotal > 0 && r.n / settledTotal > 0.7);
  return dominant ? [] : finishTable(rows);
}

// ─ Public API ────────────────────────────────────────────────────────────

export function buildWeeklyReportInput(args: {
  handle: string;
  bets: ImportedBet[];
  now?: Date;
}): WeeklyReportInput {
  const { handle, bets } = args;
  const now = args.now ?? new Date();
  const week = lastCompleteWeek(now);
  const weekStartMs = week.start.getTime();
  const weekEndMs = week.end.getTime();

  const settledAll = bets.filter(isSettled);
  const agg = aggregateFromBets(bets);
  const k = agg.kpis;

  const clvSample = settledAll.filter((b) => b.closingOdds != null && b.closingOdds > 0).length;

  // This week's bets: kickoff inside the window.
  const inWeek = bets.filter((b) => {
    const t = new Date(b.kickoff).getTime();
    return t >= weekStartMs && t < weekEndMs;
  });
  const weekSettled = inWeek.filter(isSettled);
  const weekStake = weekSettled.reduce((s, b) => s + b.stake, 0);
  const weekPl = weekSettled.reduce((s, b) => s + b.pl, 0);

  const leakAnalysis = analyzeLeaks(bets);
  const toStat = (l: (typeof leakAnalysis.leaks)[number]): SegmentStat => ({
    dimension: l.dimension,
    // leaks.ts labels odds bands with an en dash ("1.7 – 2.5"); the table
    // below uses "1.7 to 2.5". Normalise so one band has one name in the
    // payload, and so no dash ever reaches the email copy.
    label: l.dimension === "odds" ? l.label.replace(/\s[–—-]\s/g, " to ") : l.label,
    n: l.n,
    pl: l.pl,
    yieldPct: l.yieldPct,
    avgOdds: l.avgOdds,
    winRate: l.winRate,
    confidence: l.confidence,
  });

  return {
    handle,
    week: { start: isoDate(week.start), end: isoDate(week.end) },
    lifetime: {
      settled: settledAll.length,
      pl: r2(k.lifetimePl ?? settledAll.reduce((s, b) => s + b.pl, 0)),
      yieldPct: r2(k.yieldPct),
      clvPct: clvSample > 0 ? r2(k.clvPct) : null,
      clvSample,
      // -100% is the "never had a positive peak" artifact the dashboard
      // suppresses too (see Kpis.tsx). Send 0 rather than let the model
      // tell someone they have a 100% drawdown; peakDrawdownUnits still
      // carries the real number.
      maxDdPct: k.maxDdPct <= -99.5 ? 0 : r2(k.maxDdPct),
      peakDrawdownUnits: r2(Math.abs(k.peakDrawdown ?? 0)),
    },
    thisWeek: {
      settled: weekSettled.length,
      pending: inWeek.filter((b) => b.status === "pending").length,
      pl: r2(weekPl),
      yieldPct: weekStake > 0 ? r2((weekPl / weekStake) * 100) : 0,
      wins: weekSettled.filter(isWin).length,
      losses: weekSettled.filter(isLoss).length,
      pushes: weekSettled.filter((b) => b.status === "push").length,
    },
    leaks: leakAnalysis.leaks.map(toStat),
    strengths: leakAnalysis.strengths.map(toStat),
    competitions: finishTable(
      byCompetition(bets).map((r) => ({
        dimension: "competition" as const,
        label: r.label,
        n: r.bets,
        pl: r.pl,
        yieldPct: r.yieldPct,
        avgOdds: r.avgOdds,
        winRate: r.winRate,
        confidence: confidenceOf(r.bets),
      })),
    ),
    markets: finishTable(
      byMarket(bets)
        .filter((r) => r.label.toLowerCase() !== "other")
        .map((r) => ({
          dimension: "market" as const,
          label: r.label,
          n: r.bets,
          pl: r.pl,
          yieldPct: r.yieldPct,
          avgOdds: r.avgOdds,
          winRate: r.winRate,
          confidence: confidenceOf(r.bets),
        })),
    ),
    oddsBands: oddsBandTable(bets),
    sports: sportTable(bets, settledAll.length),
  };
}
