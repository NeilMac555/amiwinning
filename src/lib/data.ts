// Mock data for Am I Winning — typed port of the prototype data.js.
// Three profiles (sharp / mixed / drawdown) build all dashboard slices off a
// seeded PRNG so renders are deterministic.

export type ProfileKey = "sharp" | "mixed" | "drawdown";

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

export interface SettledBet {
  id: string;
  league: string;
  home: string;
  away: string;
  market: string;
  selection: string;
  odds: number;
  stake: number;
  result: "win" | "loss";
  pl: number;
  clvBp: number;
  settledAt: Date;
}

export interface HeatmapCell {
  date: Date;
  bets: number;
  pl: number;
  /** Avg CLV % across bets with closing odds on that day, or null if none. */
  avgClv: number | null;
}

export interface TickerItem {
  id: string;
  league: string;
  match: string;
  sel: string;
  from: string;
  to: string;
  moved: number;
  tag: string;
}

export interface SecondaryStats {
  winRate: number;
  avgOdds: number;
  avgStake: number;
  turnover: number;
  stakeRoll: number;
  avgClv: number;
  lastBet: string;
  /** Win-rate gauge / stake-scaler need these. Optional for back-compat with
   *  the mock data path which doesn't compute them. */
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
  profile: ProfileKey;
  kpis: KPIs;
  sparks: Sparks;
  equity: EquityData;
  open: OpenPosition[];
  settled: SettledBet[];
  heatmap: HeatmapCell[];
  ticker: TickerItem[];
  secondary: SecondaryStats;
  clvDist: ClvDistBin[];
  marketBd: BreakdownRow[];
  /** Was "by bookmaker"; bookmaker tracking removed. Now "by odds range". */
  oddsBd: BreakdownRow[];
  weekly: number[];
}

interface Profile {
  yieldBps: number;
  clvBps: number;
  drawdownPct: number;
  sampleSize: number;
  openClvBps: number;
  equityNoise: number;
  endTarget: number;
}

const PROFILES: Record<ProfileKey, Profile> = {
  sharp: { yieldBps: 380, clvBps: 250, drawdownPct: 7.4, sampleSize: 2143, openClvBps: 240, equityNoise: 0.0055, endTarget: 1.42 },
  mixed: { yieldBps: 40, clvBps: 190, drawdownPct: 8.7, sampleSize: 1847, openClvBps: 165, equityNoise: 0.0065, endTarget: 1.062 },
  drawdown: { yieldBps: -110, clvBps: 80, drawdownPct: 14.2, sampleSize: 1612, openClvBps: 90, equityNoise: 0.008, endTarget: 0.91 },
};

const SEEDS: Record<ProfileKey, number> = { sharp: 7, mixed: 42, drawdown: 91 };

// Mulberry32 seeded PRNG
type Rng = () => number;
function rng(seed: number): Rng {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller single sample
function gaussian(rand: Rng): number {
  let u = 0,
    v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const EPL = [
  "Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton",
  "Chelsea", "Crystal Palace", "Everton", "Fulham", "Liverpool",
  "Man City", "Man Utd", "Newcastle", "Nottm Forest", "Spurs",
  "West Ham", "Wolves", "Ipswich", "Leicester", "Southampton",
];
const UCL = [
  "Real Madrid", "Bayern", "PSG", "Inter", "Atletico",
  "Dortmund", "Barcelona", "Atalanta", "Bayer Leverkusen", "Sporting",
  "Juventus", "AC Milan", "Benfica", "Feyenoord", "PSV", "Celtic",
];

interface MarketDef {
  name: string;
  mk: string;
}
const MARKETS: MarketDef[] = [
  { name: "1X2", mk: "h2h" },
  { name: "BTTS", mk: "btts" },
  { name: "Asian handicap", mk: "ah" },
  { name: "Over/under 2.5", mk: "ou25" },
  { name: "Over/under 3.5", mk: "ou35" },
  { name: "Draw no bet", mk: "dnb" },
  { name: "Corners O/U", mk: "corners" },
  { name: "Player shots O/U", mk: "shots" },
];

function pickPair(teams: string[], rand: Rng): [string, string] {
  const i = Math.floor(rand() * teams.length);
  let j = Math.floor(rand() * teams.length);
  while (j === i) j = Math.floor(rand() * teams.length);
  return [teams[i], teams[j]];
}

function generateSelection(
  home: string,
  away: string,
  market: MarketDef,
  rand: Rng,
): string {
  switch (market.mk) {
    case "h2h":
      return rand() < 0.5 ? `${home} ML` : rand() < 0.5 ? `${away} ML` : "Draw";
    case "btts":
      return rand() < 0.5 ? "BTTS yes" : "BTTS no";
    case "ah": {
      const lines = ["-1.5", "-1", "-0.5", "+0.5", "+1", "+1.5"];
      const l = lines[Math.floor(rand() * lines.length)];
      const team = rand() < 0.5 ? home : away;
      return `${team} ${l} AH`;
    }
    case "ou25":
      return rand() < 0.5 ? "Over 2.5" : "Under 2.5";
    case "ou35":
      return rand() < 0.5 ? "Over 3.5" : "Under 3.5";
    case "dnb":
      return rand() < 0.5 ? `${home} DNB` : `${away} DNB`;
    case "corners": {
      const l = [8.5, 9.5, 10.5][Math.floor(rand() * 3)];
      return `${rand() < 0.5 ? "Over" : "Under"} ${l} corners`;
    }
    case "shots": {
      const players = [
        "Salah", "Haaland", "Saka", "Palmer", "Foden",
        "Son", "Vinicius", "Mbappé", "Bellingham",
      ];
      const p = players[Math.floor(rand() * players.length)];
      const l = [1.5, 2.5, 3.5][Math.floor(rand() * 3)];
      return `${p} ${rand() < 0.5 ? "O" : "U"} ${l} SOT`;
    }
    default:
      return "Selection";
  }
}

// Stable "now" anchor so server and client agree on the date math.
// The dashboard isn't real-time, so freezing this is fine for v1 mock data.
export const NOW = new Date("2026-05-13T20:00:00Z").getTime();

function generateEquityCurve(profile: Profile, rand: Rng): EquityData {
  const days = 240;
  const start = 10000;
  const targetEnd = start * profile.endTarget;
  const baseDrift = Math.log(profile.endTarget) / days;
  const points: { i: number; equityRaw: number }[] = [];
  let equity = start;
  const drawdownCenter = profile.endTarget < 1 ? 0.75 : 0.55;
  const drawdownWidth = 0.18;
  const dipMagnitude = profile.drawdownPct * 0.0009;

  for (let i = 0; i < days; i++) {
    const t = i / days;
    const phase =
      Math.sin((t - drawdownCenter) / drawdownWidth) *
      Math.exp(-Math.pow((t - drawdownCenter) / drawdownWidth, 2) * 2);
    const dipBias = -phase * dipMagnitude;
    const shock = gaussian(rand) * profile.equityNoise;
    equity = equity * Math.exp(baseDrift + dipBias + shock);
    points.push({ i, equityRaw: equity });
  }

  const drift = Math.log(targetEnd / points[points.length - 1].equityRaw);
  let peak = start,
    maxDd = 0;
  let clvCum = 0;
  const out: EquityPoint[] = [];
  for (let i = 0; i < days; i++) {
    const adj = points[i].equityRaw * Math.exp(drift * (i / (days - 1)));
    if (adj > peak) peak = adj;
    const ddNow = (adj / peak - 1) * 100;
    if (ddNow < maxDd) maxDd = ddNow;

    clvCum += profile.clvBps / 100 / days + gaussian(rand) * 0.04;

    const date = new Date(NOW);
    date.setDate(date.getDate() - (days - 1 - i));
    out.push({
      i,
      date,
      equity: Math.round(adj * 100) / 100,
      clvPct: Math.round(clvCum * 100) / 100,
      bets: Math.max(1, Math.round(6 + gaussian(rand) * 3 + (rand() < 0.05 ? 12 : 0))),
    });
  }
  return { points: out, maxDrawdown: maxDd };
}

function generateOddsHistory(currentOdds: number, rand: Rng): number[] {
  const n = 24;
  const out: number[] = [];
  let v = currentOdds + (rand() - 0.5) * 0.25;
  for (let i = 0; i < n; i++) {
    v += gaussian(rand) * 0.018;
    out.push(Math.round(v * 100) / 100);
  }
  out[n - 1] = currentOdds;
  return out;
}

function generateOpenPositions(profile: Profile, rand: Rng): OpenPosition[] {
  const out: OpenPosition[] = [];
  const pools = [
    { league: "EPL", teams: EPL },
    { league: "UCL", teams: UCL },
  ];
  const count = 7;
  const kickoffOffsets = [
    -25 * 60 * 1000,
    2 * 3600 * 1000,
    6 * 3600 * 1000,
    22 * 3600 * 1000,
    36 * 3600 * 1000,
    50 * 3600 * 1000,
    72 * 3600 * 1000,
  ];
  for (let i = 0; i < count; i++) {
    const pool = pools[Math.floor(rand() * pools.length)];
    const [home, away] = pickPair(pool.teams, rand);
    const market = MARKETS[Math.floor(rand() * MARKETS.length)];
    const odds = 1.55 + rand() * 2.8;
    const stake = Math.round(50 + rand() * 350);
    const toWin = Math.round(stake * (odds - 1));
    const clvBp = profile.openClvBps + Math.round(gaussian(rand) * 120);
    const kickoff = new Date(NOW + kickoffOffsets[i]);
    const isLive = kickoffOffsets[i] < 0;
    const oddsHist = generateOddsHistory(Math.round(odds * 100) / 100, rand);
    out.push({
      id: "p" + i,
      league: pool.league,
      home,
      away,
      market: market.name,
      selection: generateSelection(home, away, market, rand),
      odds: Math.round(odds * 100) / 100,
      oddsOpen: oddsHist[0],
      oddsHist,
      stake,
      toWin,
      clvBp,
      kickoff,
      isLive,
    });
  }
  return out;
}

function generateSettled(profile: Profile, rand: Rng): SettledBet[] {
  const out: SettledBet[] = [];
  const pools = [
    { league: "EPL", teams: EPL },
    { league: "UCL", teams: UCL },
  ];
  const winBias = 0.5 + profile.yieldBps / 4000;
  const count = 14;
  for (let i = 0; i < count; i++) {
    const pool = pools[Math.floor(rand() * pools.length)];
    const [home, away] = pickPair(pool.teams, rand);
    const market = MARKETS[Math.floor(rand() * MARKETS.length)];
    const odds = 1.55 + rand() * 2.4;
    const stake = Math.round(50 + rand() * 350);
    const won = rand() < winBias / (odds / 2);
    const settledAt = new Date(NOW - (i * 4 + rand() * 10) * 3600 * 1000);
    const clvBp = profile.clvBps + Math.round(gaussian(rand) * 200);
    out.push({
      id: "s" + i,
      league: pool.league,
      home,
      away,
      market: market.name,
      selection: generateSelection(home, away, market, rand),
      odds: Math.round(odds * 100) / 100,
      stake,
      result: won ? "win" : "loss",
      pl: won ? Math.round(stake * (odds - 1)) : -stake,
      clvBp,
      settledAt,
    });
  }
  out.sort((a, b) => b.settledAt.getTime() - a.settledAt.getTime());
  return out;
}

function generateHeatmap(profile: Profile, rand: Rng): HeatmapCell[] {
  const out: HeatmapCell[] = [];
  const today = new Date(NOW);
  today.setHours(0, 0, 0, 0);
  const dayMs = 86400000;
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today.getTime() - i * dayMs);
    const restDay = rand() < 0.18;
    const bets = restDay ? 0 : Math.max(0, Math.round(2 + gaussian(rand) * 3));
    let pl = 0;
    let avgClv: number | null = null;
    if (bets > 0) {
      const meanPerBet = (profile.yieldBps / 10000) * 180;
      pl = Math.round(bets * meanPerBet + gaussian(rand) * 60 * Math.sqrt(bets));
      avgClv = Math.round((profile.clvBps / 100 + gaussian(rand) * 1.5) * 100) / 100;
    }
    out.push({ date, bets, pl, avgClv });
  }
  return out;
}

function generateTicker(profile: Profile, rand: Rng): TickerItem[] {
  const items: TickerItem[] = [];
  const pools = [
    { league: "EPL", teams: EPL },
    { league: "UCL", teams: UCL },
  ];
  const tags = ["SHARP MOVE", "STEAM", "CLOSER", "OPENER", "MARKET", "STALE"];
  for (let i = 0; i < 14; i++) {
    const pool = pools[Math.floor(rand() * pools.length)];
    const [home, away] = pickPair(pool.teams, rand);
    const market = MARKETS[Math.floor(rand() * MARKETS.length)];
    const sel = generateSelection(home, away, market, rand);
    const from = (1.55 + rand() * 2.4).toFixed(2);
    const drift = (rand() - 0.5) * 0.18;
    const to = Math.max(1.05, parseFloat(from) + drift).toFixed(2);
    items.push({
      id: "tk" + i,
      league: pool.league,
      match: `${home} v ${away}`,
      sel,
      from,
      to,
      moved: parseFloat(to) - parseFloat(from),
      tag: tags[Math.floor(rand() * tags.length)],
    });
  }
  // Suppress unused-profile warning while keeping the call signature consistent.
  void profile;
  return items;
}

function generateSecondary(profile: Profile, rand: Rng): SecondaryStats {
  const wrBase = 0.5 + profile.yieldBps / 8000;
  const winRate = Math.round(wrBase * 1000) / 10;
  const avgOdds = 1.92 + (rand() - 0.5) * 0.2;
  const avgStake = 178 + Math.round((rand() - 0.5) * 40);
  const turnover = Math.round(profile.sampleSize * avgStake);
  const stakeRoll = 1.78;
  return {
    winRate,
    avgOdds: Math.round(avgOdds * 100) / 100,
    avgStake,
    turnover,
    stakeRoll,
    avgClv: profile.clvBps / 100,
    lastBet: "12 min",
  };
}

function generateClvDist(profile: Profile, rand: Rng): ClvDistBin[] {
  const bins = 36;
  const min = -8,
    max = 8;
  const out = new Array(bins).fill(0);
  const mean = profile.clvBps / 100;
  const std = 2.6;
  const n = 1200;
  for (let i = 0; i < n; i++) {
    const v = mean + gaussian(rand) * std;
    const idx = Math.min(bins - 1, Math.max(0, Math.floor(((v - min) / (max - min)) * bins)));
    out[idx]++;
  }
  const step = (max - min) / bins;
  return out.map((c, i) => ({ binCenter: min + step * (i + 0.5), count: c }));
}

function generateMarketBreakdown(profile: Profile, rand: Rng): BreakdownRow[] {
  const labels = [
    "1X2",
    "Asian handicap",
    "Over/under 2.5",
    "BTTS",
    "Corners O/U",
    "Player shots O/U",
    "Draw no bet",
  ];
  return labels
    .map((name) => {
      const yieldBps = profile.yieldBps + Math.round(gaussian(rand) * 280);
      const n = Math.round(40 + rand() * 380);
      return { label: name, yieldPct: yieldBps / 100, sample: n };
    })
    .sort((a, b) => b.yieldPct - a.yieldPct);
}

function generateOddsRangeBreakdown(profile: Profile, rand: Rng): BreakdownRow[] {
  const buckets = [
    "Heavy favs (<1.50)",
    "Favs (1.50–1.80)",
    "Coin-flips (1.80–2.20)",
    "Dogs (2.20–3.00)",
    "Longshots (3.00+)",
  ];
  // Preserve odds-range order so the chart reads low-odds → high-odds.
  return buckets.map((label) => {
    const yieldBps = profile.yieldBps + Math.round(gaussian(rand) * 260);
    const n = Math.round(80 + rand() * 480);
    return { label, yieldPct: yieldBps / 100, sample: n };
  });
}

function generateWeeklyPL(profile: Profile, rand: Rng): number[] {
  const weeks = 52;
  const out: number[] = [];
  for (let i = 0; i < weeks; i++) {
    const t = i / weeks;
    const drift = (profile.yieldBps / 100) * 18;
    const dip =
      profile.endTarget < 1 ? -Math.exp(-Math.pow((t - 0.7) / 0.18, 2) * 2) * 220 : 0;
    const noise = gaussian(rand) * 160;
    out.push(Math.round(drift + dip + noise));
  }
  return out;
}

function generateSparks(profile: Profile, rand: Rng): Sparks {
  const make = (slope: number, vol: number) => {
    const arr: number[] = [];
    let v = 0;
    for (let i = 0; i < 32; i++) {
      v += slope + gaussian(rand) * vol;
      arr.push(v);
    }
    return arr;
  };
  return {
    clv: make(profile.clvBps / 100 / 32, 0.18),
    yld: make(profile.yieldBps / 100 / 32, 0.32),
    roi: make((profile.yieldBps - 30) / 100 / 32, 0.3),
    dd: (() => {
      const a: number[] = [];
      let v = 0,
        peak = 0;
      for (let i = 0; i < 32; i++) {
        v += profile.yieldBps / 100 / 32 + gaussian(rand) * 0.5;
        peak = Math.max(peak, v);
        a.push(v - peak);
      }
      return a;
    })(),
    sample: (() => {
      const a: number[] = [];
      for (let i = 0; i < 32; i++) a.push(i + 0.5 * gaussian(rand));
      return a;
    })(),
  };
}

function profileKPIs(profile: Profile): KPIs {
  // ROC for mock data: rough approximation of leverage on a bankroll-managed
  // book — typical sharp bettors deploy 2-4% of bankroll per bet, which gives
  // turnover/peak-capital ratios around 20-30×. We use 25 as a stand-in.
  const yieldPct = profile.yieldBps / 100;
  return {
    clvPct: profile.clvBps / 100,
    yieldPct,
    rocPct: yieldPct * 25,
    maxDdPct: -profile.drawdownPct,
    sampleSize: profile.sampleSize,
  };
}

export function buildAll(profileKey: ProfileKey = "mixed"): DashboardData {
  const profile = PROFILES[profileKey];
  const seed = SEEDS[profileKey];
  return {
    profile: profileKey,
    kpis: profileKPIs(profile),
    sparks: generateSparks(profile, rng(seed + 1)),
    equity: generateEquityCurve(profile, rng(seed + 2)),
    open: generateOpenPositions(profile, rng(seed + 3)),
    settled: generateSettled(profile, rng(seed + 4)),
    heatmap: generateHeatmap(profile, rng(seed + 5)),
    ticker: generateTicker(profile, rng(seed + 6)),
    secondary: generateSecondary(profile, rng(seed + 7)),
    clvDist: generateClvDist(profile, rng(seed + 8)),
    marketBd: generateMarketBreakdown(profile, rng(seed + 9)),
    oddsBd: generateOddsRangeBreakdown(profile, rng(seed + 10)),
    weekly: generateWeeklyPL(profile, rng(seed + 11)),
  };
}
