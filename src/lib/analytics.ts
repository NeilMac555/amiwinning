// Analytics-page aggregations. All bookmaker-free, unit-tracker-friendly.
// Inputs: ImportedBet[] from localStorage. Outputs: shapes the panels consume.

import type { ImportedBet } from "./import/types";
import { guessMarket } from "./import/normalise";
import { classifyCompetition } from "./competition-classify";

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

function round(n: number, dp: number): number {
  const p = Math.pow(10, dp);
  return Math.round(n * p) / p;
}

// ─────────────────────────────────────────────────────────────────────────
// Monthly P/L — bar per calendar month over the last `months` months.
// ─────────────────────────────────────────────────────────────────────────

export interface MonthlyRow {
  ym: string; // "2025-08"
  label: string; // "Aug '25"
  pl: number;
  stake: number;
  bets: number;
  yieldPct: number;
}

export function monthlyPL(
  bets: ImportedBet[],
  months?: number,
): MonthlyRow[] {
  const settled = bets.filter(isSettled);
  const now = new Date();
  // Determine the start month: explicit window if `months` given, otherwise
  // span from the earliest settled bet so we render the user's full career.
  let startYear: number;
  let startMonth: number;
  if (months != null) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    startYear = d.getFullYear();
    startMonth = d.getMonth();
  } else if (settled.length > 0) {
    let earliestMs = Infinity;
    for (const b of settled) {
      const t = new Date(b.kickoff).getTime();
      if (t < earliestMs) earliestMs = t;
    }
    const e = new Date(earliestMs);
    startYear = e.getFullYear();
    startMonth = e.getMonth();
  } else {
    // No bets at all — fall back to 24 trailing months for chart skeleton.
    const d = new Date(now.getFullYear(), now.getMonth() - 23, 1);
    startYear = d.getFullYear();
    startMonth = d.getMonth();
  }
  const totalMonths =
    (now.getFullYear() - startYear) * 12 +
    (now.getMonth() - startMonth) +
    1;
  // Pre-fill every month in the span so gap months render as zero bars.
  const rows: MonthlyRow[] = [];
  for (let i = 0; i < totalMonths; i++) {
    const d = new Date(startYear, startMonth + i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    rows.push({
      ym,
      label:
        d.toLocaleDateString("en-GB", { month: "short" }) +
        " '" + String(d.getFullYear()).slice(2),
      pl: 0,
      stake: 0,
      bets: 0,
      yieldPct: 0,
    });
  }
  const idx = new Map(rows.map((r, i) => [r.ym, i]));
  for (const b of settled) {
    const k = b.kickoff.slice(0, 7);
    const i = idx.get(k);
    if (i == null) continue;
    rows[i].pl += b.pl;
    rows[i].stake += b.stake;
    rows[i].bets++;
  }
  for (const r of rows) {
    r.pl = round(r.pl, 2);
    r.stake = round(r.stake, 2);
    r.yieldPct = r.stake > 0 ? round((r.pl / r.stake) * 100, 2) : 0;
  }
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────
// Month calendar — Pikkit-style red/green day grid for a single month.
// Returns a 7×N grid (where N is the number of weeks the month spans),
// padded at the start/end with the trailing days of the adjacent months
// so the weekday columns line up.
// ─────────────────────────────────────────────────────────────────────────

export interface CalendarDay {
  dateIso: string; // YYYY-MM-DD
  day: number; // 1-31
  pl: number;
  bets: number;
  wins: number;
  losses: number;
  pushes: number;
  /** False for padding cells from the previous / next month. */
  inMonth: boolean;
}

export interface MonthCalendar {
  year: number;
  month: number; // 0-11
  monthLabel: string; // "November 2025"
  cells: CalendarDay[]; // grid cells (Monday-first), length = weeks × 7
  weeksCount: number;
  // Aggregates for the visible month only (padding cells excluded).
  totalPl: number;
  wins: number;
  losses: number;
  pushes: number;
  totalBets: number;
  bestDayPl: number;
  worstDayPl: number;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function isoDateLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function monthCalendar(
  bets: ImportedBet[],
  year: number,
  month: number, // 0 = Jan
): MonthCalendar {
  // Roll up settled bets by local-date string (kickoff's date portion).
  const byDate = new Map<
    string,
    { pl: number; bets: number; wins: number; losses: number; pushes: number }
  >();
  for (const b of bets) {
    if (!isSettled(b)) continue;
    const k = b.kickoff.slice(0, 10);
    const cur =
      byDate.get(k) ??
      { pl: 0, bets: 0, wins: 0, losses: 0, pushes: 0 };
    cur.pl += b.pl;
    cur.bets++;
    if (isWin(b)) cur.wins++;
    else if (isLoss(b)) cur.losses++;
    else if (b.status === "push" || b.status === "void") cur.pushes++;
    byDate.set(k, cur);
  }

  // First day of the month.
  const first = new Date(year, month, 1);

  // Pikkit uses Sunday-first but UK convention is Monday-first. We stick
  // with Monday-first for consistency with byDayOfWeek elsewhere in the app.
  // (Shift JS Sunday=0 to Monday=0.)
  const startWeekday = (first.getDay() + 6) % 7; // 0=Mon ... 6=Sun
  // Grid starts on the Monday before (or equal to) the 1st of the month.
  const gridStart = new Date(year, month, 1 - startWeekday);

  // Walk 6 weeks max; trim trailing all-pad rows below.
  const cells: CalendarDay[] = [];
  let totalPl = 0;
  let wins = 0;
  let losses = 0;
  let pushes = 0;
  let totalBets = 0;
  let bestDayPl = 0;
  let worstDayPl = 0;

  for (let i = 0; i < 42; i++) {
    const d = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + i,
    );
    const dateIso = isoDateLocal(d);
    const inMonth = d.getMonth() === month && d.getFullYear() === year;
    const slot =
      byDate.get(dateIso) ??
      { pl: 0, bets: 0, wins: 0, losses: 0, pushes: 0 };
    cells.push({
      dateIso,
      day: d.getDate(),
      pl: round(slot.pl, 2),
      bets: slot.bets,
      wins: slot.wins,
      losses: slot.losses,
      pushes: slot.pushes,
      inMonth,
    });
    if (inMonth) {
      totalPl += slot.pl;
      wins += slot.wins;
      losses += slot.losses;
      pushes += slot.pushes;
      totalBets += slot.bets;
      if (slot.pl > bestDayPl) bestDayPl = slot.pl;
      if (slot.pl < worstDayPl) worstDayPl = slot.pl;
    }
  }

  // Trim trailing weeks that contain only padding cells (months that fit in
  // 4 or 5 weeks shouldn't get an empty 6th row).
  let weeksCount = 6;
  while (weeksCount > 4) {
    const lastRow = cells.slice((weeksCount - 1) * 7, weeksCount * 7);
    if (lastRow.every((c) => !c.inMonth)) {
      weeksCount--;
    } else break;
  }
  const trimmed = cells.slice(0, weeksCount * 7);

  const monthLabel = first.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return {
    year,
    month,
    monthLabel,
    cells: trimmed,
    weeksCount,
    totalPl: round(totalPl, 2),
    wins,
    losses,
    pushes,
    totalBets,
    bestDayPl: round(bestDayPl, 2),
    worstDayPl: round(worstDayPl, 2),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Week calendar — 7 days, Monday-first. Used by the week view of the
// calendar card. Returns rich per-day detail since the week view has space
// to show it (win/loss split, bet count).
// ─────────────────────────────────────────────────────────────────────────

export interface WeekCalendar {
  startIso: string; // YYYY-MM-DD of the Monday
  endIso: string; // YYYY-MM-DD of the Sunday
  label: string; // "19 — 25 May 2026"
  days: CalendarDay[]; // length 7
  totalPl: number;
  wins: number;
  losses: number;
  pushes: number;
  totalBets: number;
  bestDayPl: number;
  worstDayPl: number;
}

/** Return the Monday on or before the given date (Monday-first weeks). */
function mondayOf(d: Date): Date {
  const wd = (d.getDay() + 6) % 7; // Mon=0..Sun=6
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - wd);
}

export function weekCalendar(
  bets: ImportedBet[],
  anchor: Date,
): WeekCalendar {
  const start = mondayOf(anchor);

  // Roll up by date.
  const byDate = new Map<
    string,
    { pl: number; bets: number; wins: number; losses: number; pushes: number }
  >();
  for (const b of bets) {
    if (!isSettled(b)) continue;
    const k = b.kickoff.slice(0, 10);
    const cur =
      byDate.get(k) ??
      { pl: 0, bets: 0, wins: 0, losses: 0, pushes: 0 };
    cur.pl += b.pl;
    cur.bets++;
    if (isWin(b)) cur.wins++;
    else if (isLoss(b)) cur.losses++;
    else if (b.status === "push" || b.status === "void") cur.pushes++;
    byDate.set(k, cur);
  }

  const days: CalendarDay[] = [];
  let totalPl = 0;
  let wins = 0;
  let losses = 0;
  let pushes = 0;
  let totalBets = 0;
  let bestDayPl = 0;
  let worstDayPl = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + i,
    );
    const dateIso = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    const slot =
      byDate.get(dateIso) ??
      { pl: 0, bets: 0, wins: 0, losses: 0, pushes: 0 };
    days.push({
      dateIso,
      day: d.getDate(),
      pl: round(slot.pl, 2),
      bets: slot.bets,
      wins: slot.wins,
      losses: slot.losses,
      pushes: slot.pushes,
      inMonth: true,
    });
    totalPl += slot.pl;
    wins += slot.wins;
    losses += slot.losses;
    pushes += slot.pushes;
    totalBets += slot.bets;
    if (slot.pl > bestDayPl) bestDayPl = slot.pl;
    if (slot.pl < worstDayPl) worstDayPl = slot.pl;
  }

  const end = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + 6,
  );
  // "19 — 25 May 2026" if the week sits in one month, else "27 Apr — 3 May 2026".
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();
  const label = sameMonth
    ? `${start.getDate()} — ${end.getDate()} ${end.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`
    : sameYear
      ? `${start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} — ${end.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
      : `${start.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} — ${end.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

  return {
    startIso: days[0].dateIso,
    endIso: days[6].dateIso,
    label,
    days,
    totalPl: round(totalPl, 2),
    wins,
    losses,
    pushes,
    totalBets,
    bestDayPl: round(bestDayPl, 2),
    worstDayPl: round(worstDayPl, 2),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Year calendar — 12 mini month grids. Aggregates roll up the full year.
// ─────────────────────────────────────────────────────────────────────────

export interface YearCalendar {
  year: number;
  months: MonthCalendar[]; // length 12, Jan → Dec
  totalPl: number;
  wins: number;
  losses: number;
  pushes: number;
  totalBets: number;
  bestDayPl: number;
  worstDayPl: number;
}

export function yearCalendar(bets: ImportedBet[], year: number): YearCalendar {
  const months: MonthCalendar[] = [];
  let totalPl = 0;
  let wins = 0;
  let losses = 0;
  let pushes = 0;
  let totalBets = 0;
  let bestDayPl = 0;
  let worstDayPl = 0;
  for (let m = 0; m < 12; m++) {
    const mc = monthCalendar(bets, year, m);
    months.push(mc);
    totalPl += mc.totalPl;
    wins += mc.wins;
    losses += mc.losses;
    pushes += mc.pushes;
    totalBets += mc.totalBets;
    if (mc.bestDayPl > bestDayPl) bestDayPl = mc.bestDayPl;
    if (mc.worstDayPl < worstDayPl) worstDayPl = mc.worstDayPl;
  }
  return {
    year,
    months,
    totalPl: round(totalPl, 2),
    wins,
    losses,
    pushes,
    totalBets,
    bestDayPl: round(bestDayPl, 2),
    worstDayPl: round(worstDayPl, 2),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Seasonality — calendar month aggregated across all years. Answers "is
// August always brutal?" / "do I crush the season opener?". Each row pools
// every January (or February, etc.) regardless of year, and tracks how many
// distinct years contributed so the user can read significance.
// ─────────────────────────────────────────────────────────────────────────

export interface SeasonalMonthRow {
  monthIdx: number; // 0 = Jan
  label: string; // "Jan"
  pl: number;
  stake: number;
  bets: number;
  yieldPct: number;
  years: number; // distinct years with at least one bet in this month
  avgPlPerYear: number; // pl / years, for "typical" framing
}

export function bySeasonalMonth(bets: ImportedBet[]): SeasonalMonthRow[] {
  const labels = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const rows: SeasonalMonthRow[] = labels.map((label, i) => ({
    monthIdx: i,
    label,
    pl: 0,
    stake: 0,
    bets: 0,
    yieldPct: 0,
    years: 0,
    avgPlPerYear: 0,
  }));
  const yearsByMonth: Set<number>[] = labels.map(() => new Set<number>());
  for (const b of bets) {
    if (!isSettled(b)) continue;
    const d = new Date(b.kickoff);
    const m = d.getUTCMonth();
    const y = d.getUTCFullYear();
    rows[m].pl += b.pl;
    rows[m].stake += b.stake;
    rows[m].bets++;
    yearsByMonth[m].add(y);
  }
  for (let i = 0; i < 12; i++) {
    rows[i].pl = round(rows[i].pl, 2);
    rows[i].stake = round(rows[i].stake, 2);
    rows[i].yieldPct =
      rows[i].stake > 0 ? round((rows[i].pl / rows[i].stake) * 100, 2) : 0;
    rows[i].years = yearsByMonth[i].size;
    rows[i].avgPlPerYear =
      rows[i].years > 0 ? round(rows[i].pl / rows[i].years, 2) : 0;
  }
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────
// By market — group settled bets by market type (BTTS, AH, O/U, etc.).
// Sorted by total P/L descending so the most profitable markets lead.
// Re-classifies markets on the fly using guessMarket() so legacy bets that
// pre-date a market category benefit from current heuristics.
// ─────────────────────────────────────────────────────────────────────────

export interface MarketRow {
  key: string; // canonical market key, e.g. "btts"
  label: string; // human label, e.g. "BTTS"
  pl: number;
  stake: number;
  bets: number;
  yieldPct: number;
  winRate: number;
  avgOdds: number;
}

const MARKET_LABELS: Record<string, string> = {
  "1X2": "1X2 / moneyline",
  ah: "Asian handicap",
  ou: "Over / under (goals)",
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

export function byMarket(bets: ImportedBet[]): MarketRow[] {
  const groups = new Map<
    string,
    { pl: number; stake: number; bets: number; wins: number; oddsSum: number }
  >();
  for (const b of bets) {
    if (!isSettled(b)) continue;
    const k = guessMarket(b.selection);
    if (!k) continue;
    const cur =
      groups.get(k) ?? { pl: 0, stake: 0, bets: 0, wins: 0, oddsSum: 0 };
    cur.pl += b.pl;
    cur.stake += b.stake;
    cur.bets++;
    cur.oddsSum += b.odds;
    if (isWin(b)) cur.wins++;
    groups.set(k, cur);
  }
  const rows: MarketRow[] = [];
  for (const [k, v] of groups.entries()) {
    if (v.bets < 20) continue; // suppress small samples
    rows.push({
      key: k,
      label: MARKET_LABELS[k] ?? k,
      pl: round(v.pl, 2),
      stake: round(v.stake, 2),
      bets: v.bets,
      yieldPct: v.stake > 0 ? round((v.pl / v.stake) * 100, 2) : 0,
      winRate: round((v.wins / v.bets) * 100, 1),
      avgOdds: round(v.oddsSum / v.bets, 2),
    });
  }
  // Sort by total P/L descending — "most profitable markets" intent.
  rows.sort((a, b) => b.pl - a.pl);
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────
// By soccer competition (Premier League, Champions League, La Liga, etc.).
// Pure-derived via classifyCompetition — no schema change. Rows with fewer
// than 20 settled bets are suppressed to avoid spurious leaderboards.
// ─────────────────────────────────────────────────────────────────────────

export interface CompetitionRow {
  label: string; // human label, e.g. "Premier League"
  pl: number;
  stake: number;
  bets: number;
  yieldPct: number;
  winRate: number;
  avgOdds: number;
}

export function byCompetition(bets: ImportedBet[]): CompetitionRow[] {
  const groups = new Map<
    string,
    { pl: number; stake: number; bets: number; wins: number; oddsSum: number }
  >();
  for (const b of bets) {
    if (!isSettled(b)) continue;
    const k = classifyCompetition(b);
    if (!k) continue;
    const cur =
      groups.get(k) ?? { pl: 0, stake: 0, bets: 0, wins: 0, oddsSum: 0 };
    cur.pl += b.pl;
    cur.stake += b.stake;
    cur.bets++;
    cur.oddsSum += b.odds;
    if (isWin(b)) cur.wins++;
    groups.set(k, cur);
  }
  const rows: CompetitionRow[] = [];
  for (const [k, v] of groups.entries()) {
    if (v.bets < 20) continue; // suppress small samples
    rows.push({
      label: k,
      pl: round(v.pl, 2),
      stake: round(v.stake, 2),
      bets: v.bets,
      yieldPct: v.stake > 0 ? round((v.pl / v.stake) * 100, 2) : 0,
      winRate: round((v.wins / v.bets) * 100, 1),
      avgOdds: round(v.oddsSum / v.bets, 2),
    });
  }
  rows.sort((a, b) => b.pl - a.pl);
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────
// By day of week — Mon-first. UK convention.
// ─────────────────────────────────────────────────────────────────────────

export interface DowRow {
  label: string; // "Mon"
  pl: number;
  stake: number;
  bets: number;
  yieldPct: number;
  winRate: number;
}

export function byDayOfWeek(bets: ImportedBet[]): DowRow[] {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const rows: DowRow[] = labels.map((label) => ({
    label,
    pl: 0,
    stake: 0,
    bets: 0,
    yieldPct: 0,
    winRate: 0,
  }));
  const wins = new Array(7).fill(0);
  const settledByDow = new Array(7).fill(0);
  for (const b of bets) {
    if (!isSettled(b)) continue;
    const d = new Date(b.kickoff);
    // Mon=0 ... Sun=6 (shift JS Sun=0 to Mon=0)
    const dow = (d.getUTCDay() + 6) % 7;
    rows[dow].pl += b.pl;
    rows[dow].stake += b.stake;
    rows[dow].bets++;
    settledByDow[dow]++;
    if (isWin(b)) wins[dow]++;
  }
  for (let i = 0; i < 7; i++) {
    rows[i].pl = round(rows[i].pl, 2);
    rows[i].stake = round(rows[i].stake, 2);
    rows[i].yieldPct = rows[i].stake > 0 ? round((rows[i].pl / rows[i].stake) * 100, 2) : 0;
    rows[i].winRate = settledByDow[i] > 0 ? round((wins[i] / settledByDow[i]) * 100, 1) : 0;
  }
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────
// By stake size — bucket by integer stake. Tells you whether confidence
// (= larger stake) actually tracks edge, or you're overbetting.
// ─────────────────────────────────────────────────────────────────────────

export interface StakeBucketRow {
  label: string;
  min: number;
  max: number;
  pl: number;
  stake: number;
  bets: number;
  yieldPct: number;
}

const STAKE_BUCKETS: Array<{ label: string; min: number; max: number }> = [
  { label: "1u", min: 0.01, max: 1.5 },
  { label: "2u", min: 1.5, max: 2.5 },
  { label: "3u", min: 2.5, max: 3.5 },
  { label: "4–5u", min: 3.5, max: 5.5 },
  { label: "6u+", min: 5.5, max: Infinity },
];

export function byStakeSize(bets: ImportedBet[]): StakeBucketRow[] {
  const rows: StakeBucketRow[] = STAKE_BUCKETS.map((b) => ({
    label: b.label,
    min: b.min,
    max: b.max,
    pl: 0,
    stake: 0,
    bets: 0,
    yieldPct: 0,
  }));
  for (const b of bets) {
    if (!isSettled(b)) continue;
    const idx = STAKE_BUCKETS.findIndex(
      (g) => b.stake >= g.min && b.stake < g.max,
    );
    if (idx < 0) continue;
    rows[idx].pl += b.pl;
    rows[idx].stake += b.stake;
    rows[idx].bets++;
  }
  for (const r of rows) {
    r.pl = round(r.pl, 2);
    r.stake = round(r.stake, 2);
    r.yieldPct = r.stake > 0 ? round((r.pl / r.stake) * 100, 2) : 0;
  }
  return rows.filter((r) => r.bets >= 20);
}

// ─────────────────────────────────────────────────────────────────────────
// Streaks — counted in DAYS, not individual bets. Most imports lose per-bet
// timestamps inside a single day (bettin.gs / Track-A-Bet defaults to 00:00:00
// when kickoff time isn't recorded), so a per-bet streak inside one day is
// meaningless — they're a bag, not a sequence. A day, on the other hand, is
// well-defined: did you finish the day in profit, in loss, or flat?
// ─────────────────────────────────────────────────────────────────────────

export interface StreakSummary {
  longestWin: number; // winning days in a row
  longestLoss: number; // losing days in a row
  currentStreak: number;
  currentDirection: "win" | "loss" | "none";
}

export function streaks(bets: ImportedBet[]): StreakSummary {
  // Roll up to daily P/L. Skip days with no settled bets (they don't break
  // streaks). Push/void days with zero P/L do break streaks since they're
  // really days that finished at break-even, not "not bet".
  const byDay = new Map<string, { pl: number; settled: number }>();
  for (const b of bets) {
    if (!isSettled(b)) continue;
    const k = b.kickoff.slice(0, 10);
    const cur = byDay.get(k) ?? { pl: 0, settled: 0 };
    cur.pl += b.pl;
    cur.settled++;
    byDay.set(k, cur);
  }
  const days = Array.from(byDay.entries())
    .filter(([, v]) => v.settled > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([d, v]) => ({ d, pl: v.pl }));

  let longestWin = 0;
  let longestLoss = 0;
  let curWin = 0;
  let curLoss = 0;
  for (const day of days) {
    if (day.pl > 0) {
      curWin++;
      curLoss = 0;
      if (curWin > longestWin) longestWin = curWin;
    } else if (day.pl < 0) {
      curLoss++;
      curWin = 0;
      if (curLoss > longestLoss) longestLoss = curLoss;
    } else {
      // exactly flat day — break both streaks
      curWin = 0;
      curLoss = 0;
    }
  }
  let currentStreak = 0;
  let currentDirection: StreakSummary["currentDirection"] = "none";
  if (curWin > 0) {
    currentStreak = curWin;
    currentDirection = "win";
  } else if (curLoss > 0) {
    currentStreak = curLoss;
    currentDirection = "loss";
  }
  return { longestWin, longestLoss, currentStreak, currentDirection };
}
