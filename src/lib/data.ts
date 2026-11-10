// Shapes of the dashboard data. Built from real bets by aggregateFromBets
// in ./aggregate.ts and consumed by the dashboard and profile components.
//
// (This file used to also hold a seeded mock-data generator from the
// prototype. Nothing has rendered it since signed-out visitors started
// getting the landing page, so it was removed.)

export interface KPIs {
  clvPct: number;
  yieldPct: number;
  /**
   * Return on Capital, annualised.
   * = (lifetime P/L / peak-drawdown capital required) / years elapsed.
   * Differs from yield by dividing by the bankroll actually at risk, not the
   * sum of all stakes ever placed.
   */
  rocPct: number;
  maxDdPct: number;
  sampleSize: number;
  /** Headline cumulative P/L in units (for the equity card). */
  lifetimePl?: number;
  /** Peak dollar drawdown — the worst hole you climbed out of. */
  peakDrawdown?: number;
  /** "4d ago" / "12m" — last settled bet, human-readable. */
  lastBetAgo?: string;
  /** False = ROC shown as raw period return (short windows). True = annualised. */
  rocAnnualised?: boolean;
}

export interface Sparks {
  clv: number[];
  yld: number[];
  roi: number[];
  dd: number[];
  sample: number[];
}

export interface EquityPoint {
  i: number;
  date: Date;
  equity: number;
  clvPct: number;
  bets: number;
}

export interface EquityData {
  points: EquityPoint[];
  maxDrawdown: number;
}

export interface OpenPosition {
  id: string;
  league: string;
  home: string;
  away: string;
  market: string;
  selection: string;
  odds: number;
  oddsOpen: number;
  oddsHist: number[];
  stake: number;
  toWin: number;
  clvBp: number;
  kickoff: Date;
  isLive: boolean;
}

export interface HeatmapCell {
  date: Date;
  bets: number;
  pl: number;
  /** Avg CLV % across bets with closing odds on that day, or null if none. */
  avgClv: number | null;
}

export interface SecondaryStats {
  winRate: number;
  avgOdds: number;
  /** Median odds — robust to longshot outliers. Used as the headline
   *  number on the public profile. */
  medianOdds?: number;
  avgStake: number;
  turnover: number;
  avgClv: number;
  lastBet: string;
  /** Used by the win-rate gauge. */
  wins?: number;
  settledCount?: number;
}

export interface ClvDistBin {
  binCenter: number;
  count: number;
}

export interface BreakdownRow {
  label: string;
  yieldPct: number;
  sample: number;
}

export interface DashboardData {
  kpis: KPIs;
  sparks: Sparks;
  equity: EquityData;
  open: OpenPosition[];
  heatmap: HeatmapCell[];
  secondary: SecondaryStats;
  clvDist: ClvDistBin[];
  marketBd: BreakdownRow[];
  /** Yield breakdown by odds range (favs, mid, longshots). */
  oddsBd: BreakdownRow[];
  /** Yield breakdown by sport. */
  sportBd: BreakdownRow[];
  /** Yield breakdown by competition (Premier League, NBA, ATP Tour...). */
  competitionBd: BreakdownRow[];
  /** P/L per week for the last 52 weeks, oldest first. */
  weekly: number[];
}
