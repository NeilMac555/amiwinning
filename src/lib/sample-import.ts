// Sample data for the "Try with sample data" button on /import.
//
// Generates ~25 fresh bets anchored to the current date, then builds a
// fake ParsedFile shaped like a real bookmaker CSV so the review screen
// can show the back-to-mapping flow even though no real file was dropped.
//
// Deliberately separate from src/lib/sample-profile.ts — that file
// generates a fixed ~150-bet history anchored to 2026-06-01 for the
// public /u/sample profile, and needs to be deterministic across page
// loads. Here we want bets that feel current (kickoffs from the last
// ~50 days, not stale), so we re-seed from Date.now() on every call.

import type {
  ImportedBet,
  MarketGuess,
  NormalisationIssue,
  ParsedFile,
  Status,
} from "./import/types";

// xorshift32 — fast, no deps, good enough for visual variety.
function makeRand(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 100000) / 100000;
  };
}

// ─ Source material — keep it tight to soccer + tennis (the app's focus). ──

const SOCCER_FIXTURES: Array<{ home: string; away: string; league: string }> = [
  { home: "Arsenal", away: "Chelsea", league: "EPL" },
  { home: "Liverpool", away: "Man City", league: "EPL" },
  { home: "Tottenham", away: "Newcastle", league: "EPL" },
  { home: "Aston Villa", away: "Brighton", league: "EPL" },
  { home: "Real Madrid", away: "Barcelona", league: "La Liga" },
  { home: "Atletico", away: "Sevilla", league: "La Liga" },
  { home: "Inter", away: "Juventus", league: "Serie A" },
  { home: "Milan", away: "Napoli", league: "Serie A" },
  { home: "Bayern", away: "Dortmund", league: "Bundesliga" },
  { home: "Leverkusen", away: "Leipzig", league: "Bundesliga" },
  { home: "PSG", away: "Marseille", league: "Ligue 1" },
];

const TENNIS_FIXTURES: Array<{ p1: string; p2: string }> = [
  { p1: "Alcaraz", p2: "Sinner" },
  { p1: "Djokovic", p2: "Medvedev" },
  { p1: "Zverev", p2: "Rublev" },
  { p1: "Sabalenka", p2: "Swiatek" },
  { p1: "Rybakina", p2: "Gauff" },
];

// Each soccer market produces a selection given (home, away).
const SOCCER_MARKETS: Array<{
  market: MarketGuess;
  pick: (home: string, away: string) => string;
}> = [
  { market: "1X2", pick: (h) => `${h} to win` },
  { market: "1X2", pick: (_h, a) => `${a} to win` },
  { market: "ah", pick: (h) => `${h} -0.5 AH` },
  { market: "ah", pick: (_h, a) => `${a} +0.5 AH` },
  { market: "ou", pick: () => "Over 2.5 goals" },
  { market: "ou", pick: () => "Under 2.5 goals" },
  { market: "btts", pick: () => "BTTS Yes" },
];

const TENNIS_MARKETS: Array<{
  market: MarketGuess;
  pick: (p1: string, p2: string) => string;
}> = [
  { market: "1X2", pick: (a) => `${a} to win` },
  { market: "ah", pick: (a) => `${a} -1.5 sets` },
  { market: "ou", pick: () => "Over 22.5 games" },
];

const TARGET_COUNT = 25;

export interface SampleImportResult {
  bets: ImportedBet[];
  file: ParsedFile;
  issues: NormalisationIssue[];
}

/**
 * Build a fresh batch of sample bets + a matching fake ParsedFile so the
 * /import review screen has everything it needs. Reseeded per call so
 * users who click "Try sample" twice see a slightly different sample —
 * keeps the tour feeling alive rather than canned.
 */
export function generateSampleImport(): SampleImportResult {
  const seed = Math.floor(Date.now() / 1000);
  const rand = makeRand(seed);
  const todayMs = Date.now();
  const bets: ImportedBet[] = [];

  // Walk back day-by-day, ~1 bet every 2 days, occasional same-day double.
  let i = 0;
  for (let daysAgo = 1; bets.length < TARGET_COUNT && daysAgo < 100; daysAgo++) {
    if (rand() < 0.45) continue; // skip ~45% of days for natural spacing
    const sameDayCount = rand() < 0.18 ? 2 : 1;
    for (let k = 0; k < sameDayCount && bets.length < TARGET_COUNT; k++) {
      const date = new Date(todayMs - daysAgo * 86_400_000);
      const isSoccer = rand() < 0.7;

      let event: string;
      let home: string | undefined;
      let away: string | undefined;
      let league: string | undefined;
      let market: MarketGuess;
      let selection: string;
      let sport: string;

      if (isSoccer) {
        const fx = SOCCER_FIXTURES[Math.floor(rand() * SOCCER_FIXTURES.length)];
        home = fx.home;
        away = fx.away;
        league = fx.league;
        event = `${home} vs ${away}`;
        const mkt = SOCCER_MARKETS[Math.floor(rand() * SOCCER_MARKETS.length)];
        market = mkt.market;
        selection = mkt.pick(home, away);
        sport = "Soccer";
      } else {
        const fx = TENNIS_FIXTURES[Math.floor(rand() * TENNIS_FIXTURES.length)];
        home = fx.p1;
        away = fx.p2;
        league = "ATP";
        event = `${fx.p1} vs ${fx.p2}`;
        const mkt = TENNIS_MARKETS[Math.floor(rand() * TENNIS_MARKETS.length)];
        market = mkt.market;
        selection = mkt.pick(fx.p1, fx.p2);
        sport = "Tennis";
      }

      // Odds 1.65–2.55, clustered around 1.85–2.05 (typical mainline value).
      const odds = Math.round((1.65 + rand() * 0.9) * 100) / 100;
      const stake = rand() < 0.15 ? 2 : 1;

      // 55% win rate — small positive edge, makes the demo profile end up
      // ahead which is what users want to see in a try-it-out tour.
      const won = rand() < 0.55;
      const status: Status = won ? "won" : "lost";
      const pl = won
        ? Math.round(stake * (odds - 1) * 100) / 100
        : -stake;

      // CLV captured on ~70% of bets, with a slight bias toward beating
      // the close so the equity curve has a positive lean.
      let closingOdds: number | undefined;
      if (rand() < 0.7) {
        const beat = rand() < 0.55;
        const delta = rand() * 0.10 * (beat ? -1 : 1);
        closingOdds = Math.max(1.01, Math.round((odds + delta) * 100) / 100);
      }

      bets.push({
        id: `sample-import-${seed}-${i++}`,
        kickoff: date.toISOString().slice(0, 10),
        sport,
        league,
        home,
        away,
        event,
        market,
        selection,
        odds,
        stake,
        closingOdds,
        status,
        pl,
        source: "sample-import",
        importedAt: date.toISOString(),
        raw: {},
      });
    }
  }

  // Sort newest-first so the review-screen preview shows the most recent
  // bets (matches what every other table in the app does).
  bets.sort((a, b) => (b.kickoff > a.kickoff ? 1 : -1));

  // Build a fake ParsedFile that mirrors what a real CSV from these bets
  // would look like — gives the user a believable "source" name and lets
  // the back-to-mapping button work without crashing.
  const headers = [
    "date",
    "event",
    "market",
    "selection",
    "odds",
    "stake",
    "closing odds",
    "status",
    "p/l",
  ];
  const rows = bets.map((b) => [
    b.kickoff,
    b.event,
    b.market ?? "",
    b.selection,
    b.odds.toFixed(2),
    String(b.stake),
    b.closingOdds != null ? b.closingOdds.toFixed(2) : "",
    b.status,
    b.pl.toFixed(2),
  ]);

  const file: ParsedFile = {
    headers,
    rows,
    totalRows: rows.length,
    sourceName: "sample-data.csv",
  };

  // No issues — sample data is clean by construction.
  return { bets, file, issues: [] };
}
