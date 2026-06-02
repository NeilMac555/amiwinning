// Curated demo profile shown at /u/sample.
//
// The landing page links here so visitors can see what their own profile
// could look like, without exposing the founder's real /u/neilmac555.
// All data here is generated deterministically — same numbers every page
// load, no Supabase dependency, no PII.
//
// Stats target: ~150 settled bets, win rate around 53%, average odds in
// the 1.8-2.2 zone, finishing net positive. Soccer-heavy with tennis
// mixed in, mirroring our two-sport focus.

import type { ImportedBet, MarketGuess, Status } from "./import/types";
import type { Profile } from "./profiles";

export const SAMPLE_HANDLE = "sample";
export const SAMPLE_USER_ID = "sample-user-fake-id-000000000000";

export const SAMPLE_PROFILE: Profile = {
  userId: SAMPLE_USER_ID,
  handle: SAMPLE_HANDLE,
  isPublic: true,
  displayName: "Sample Bettor",
  bio: "A demo profile showing what your public page could look like. Sign up to build your own.",
  avatarUrl: null,
  createdAt: "2026-01-01T00:00:00.000Z",
};

// ─ Deterministic PRNG ──────────────────────────────────────────────────
// xorshift32. Fixed seed → identical output across every server render.

function makeRand(seed: number) {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 100000) / 100000;
  };
}

// ─ Source materials for plausible events ───────────────────────────────

const SOCCER_FIXTURES: Array<[string, string, string]> = [
  // [home, away, league]
  ["Arsenal", "Liverpool", "EPL"],
  ["Man City", "Tottenham", "EPL"],
  ["Chelsea", "Newcastle", "EPL"],
  ["Aston Villa", "Brighton", "EPL"],
  ["Real Madrid", "Barcelona", "La Liga"],
  ["Atletico Madrid", "Sevilla", "La Liga"],
  ["Villarreal", "Real Betis", "La Liga"],
  ["Inter", "Juventus", "Serie A"],
  ["Milan", "Napoli", "Serie A"],
  ["Roma", "Lazio", "Serie A"],
  ["Bayern", "Dortmund", "Bundesliga"],
  ["Leipzig", "Leverkusen", "Bundesliga"],
  ["PSG", "Marseille", "Ligue 1"],
  ["Monaco", "Lyon", "Ligue 1"],
  ["Lens", "Nice", "Ligue 1"],
];

const TENNIS_FIXTURES: Array<[string, string]> = [
  ["Alcaraz", "Sinner"],
  ["Djokovic", "Medvedev"],
  ["Zverev", "Rublev"],
  ["Tsitsipas", "Ruud"],
  ["Fritz", "Shelton"],
  ["Draper", "Musetti"],
  ["Sabalenka", "Swiatek"],
  ["Rybakina", "Gauff"],
  ["Pegula", "Paolini"],
];

const SOCCER_MARKETS: Array<{ market: MarketGuess; selection: (h: string, a: string) => string }> = [
  { market: "1X2", selection: (h) => `${h} ML` },
  { market: "ah", selection: (h) => `${h} -0.5 AH` },
  { market: "ah", selection: (h) => `${h} +0.5 AH` },
  { market: "ou", selection: () => "Over 2.5 goals" },
  { market: "ou", selection: () => "Under 2.5 goals" },
  { market: "btts", selection: () => "BTTS yes" },
  { market: "btts", selection: () => "BTTS no" },
  { market: "dnb", selection: (h) => `${h} DNB` },
];

const TENNIS_MARKETS: Array<{ market: MarketGuess; selection: (a: string, b: string) => string }> = [
  { market: "1X2", selection: (a) => `${a} ML` },
  { market: "ah", selection: (a) => `${a} -1.5 sets` },
  { market: "ah", selection: (b) => `${b} +1.5 sets` },
  { market: "ou", selection: () => "Over 22.5 games" },
  { market: "ou", selection: () => "Under 22.5 games" },
];

// ─ Generator ───────────────────────────────────────────────────────────
// Walks day-by-day from sample-start backwards, emits 0-2 bets per day,
// alternates soccer/tennis weighted 70/30. Win rate biased to 53%.

function generate(): ImportedBet[] {
  const rand = makeRand(2026_06_02);
  const bets: ImportedBet[] = [];
  const startMs = Date.parse("2026-06-01T12:00:00Z");
  let id = 0;

  // 220 days back; ~0.7 bets per day → ~150 bets total
  for (let day = 220; day >= 1; day--) {
    const dayMs = startMs - day * 86_400_000;
    const dayDate = new Date(dayMs);
    // Probability of any bet on this day
    if (rand() < 0.30) continue;
    const betsToday = rand() < 0.25 ? 2 : 1;
    for (let i = 0; i < betsToday; i++) {
      const isSoccer = rand() < 0.70;
      let event: string;
      let home: string | undefined;
      let away: string | undefined;
      let league: string | undefined;
      let market: MarketGuess;
      let selection: string;
      let sport: string;
      if (isSoccer) {
        const fx = SOCCER_FIXTURES[Math.floor(rand() * SOCCER_FIXTURES.length)];
        home = fx[0];
        away = fx[1];
        league = fx[2];
        event = `${home} vs ${away}`;
        const mkt = SOCCER_MARKETS[Math.floor(rand() * SOCCER_MARKETS.length)];
        market = mkt.market;
        selection = mkt.selection(home, away);
        sport = "Soccer";
      } else {
        const fx = TENNIS_FIXTURES[Math.floor(rand() * TENNIS_FIXTURES.length)];
        home = fx[0];
        away = fx[1];
        league = "ATP";
        event = `${home} vs ${away}`;
        const mkt = TENNIS_MARKETS[Math.floor(rand() * TENNIS_MARKETS.length)];
        market = mkt.market;
        selection = mkt.selection(home, away);
        sport = "Tennis";
      }
      // Odds in the 1.6-2.6 range, mostly clustered around 1.85-2.05
      const oddsRaw = 1.65 + rand() * 1.0;
      const odds = Math.round(oddsRaw * 100) / 100;
      const stake = rand() < 0.15 ? 2 : 1; // occasional 2u
      // Win probability: 53% (slight edge over fair, gives a positive
      // expected return at ~2.0 mean odds → believable tipster)
      const won = rand() < 0.53;
      const status: Status = won ? "won" : "lost";
      const pl = won
        ? Math.round(stake * (odds - 1) * 100) / 100
        : -stake;
      // closing odds (manual entry analog): ~80% of bets have a close,
      // beat the close by a small margin most of the time
      let closingOdds: number | undefined;
      if (rand() < 0.80) {
        const beat = rand() < 0.55; // beat the close 55% of the time
        const delta = (rand() * 0.10) * (beat ? -1 : 1); // small drift
        closingOdds = Math.max(1.01, Math.round((odds + delta) * 100) / 100);
      }
      bets.push({
        id: `sample-${id++}`,
        bookId: "sample-book",
        kickoff: dayDate.toISOString().slice(0, 10),
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
        source: "sample",
        importedAt: dayDate.toISOString(),
        raw: {},
      });
    }
  }
  return bets;
}

export const SAMPLE_BETS: ImportedBet[] = generate();
