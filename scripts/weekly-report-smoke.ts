// Smoke test for the weekly Sharp Report pipeline against the live model.
//
//   set -a; . .env.local; set +a; npx --yes tsx scripts/weekly-report-smoke.ts
//
// Builds ~130 synthetic bets with deliberate leaks and edges, runs the
// data layer, calls Claude Fable 5.1, and writes the rendered email to
// scripts/out/weekly-report-smoke.html so it can be opened in a browser.
// Costs roughly one report (~$0.05 to $0.10). Not part of the build.

import { writeFileSync, mkdirSync } from "node:fs";
import type { ImportedBet, MarketGuess } from "@/lib/import/types";
import { buildWeeklyReportInput } from "@/lib/weekly-report/data";
import { generateWeeklyReport } from "@/lib/weekly-report/ai";
import { renderWeeklyReport } from "@/lib/emails/weekly-report";

// Deterministic PRNG so the fixture is stable run to run.
let seed = 42;
function rnd(): number {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
function pick<T>(xs: readonly T[]): T {
  return xs[Math.floor(rnd() * xs.length)];
}

const DAY = 86_400_000;
const now = new Date("2026-09-01T09:00:00Z"); // a Tuesday → last week = 24–30 Aug

// Segment design: PL AH loses hard, Serie A OU wins, La Liga 1X2 flat,
// longshots (4.0+) lose, mid odds win.
interface Profile {
  league: string;
  market: MarketGuess;
  oddsRange: [number, number];
  winProb: number;
  n: number;
}
const PROFILES: Profile[] = [
  { league: "Premier League", market: "ah", oddsRange: [1.8, 2.1], winProb: 0.38, n: 48 },
  { league: "Serie A", market: "ou", oddsRange: [1.85, 2.05], winProb: 0.6, n: 44 },
  { league: "La Liga", market: "1X2", oddsRange: [2.2, 3.2], winProb: 0.4, n: 22 },
  { league: "Premier League", market: "ou", oddsRange: [4.2, 6.0], winProb: 0.12, n: 14 },
  { league: "Bundesliga", market: "btts", oddsRange: [1.7, 1.95], winProb: 0.55, n: 12 },
];

const bets: ImportedBet[] = [];
let id = 0;
for (const p of PROFILES) {
  for (let i = 0; i < p.n; i++) {
    const odds = Math.round((p.oddsRange[0] + rnd() * (p.oddsRange[1] - p.oddsRange[0])) * 100) / 100;
    const stake = pick([1, 1, 1, 1.5, 2]);
    // Spread kickoffs over the last 90 days; ~12% land in last week.
    const daysAgo = rnd() < 0.12 ? 2 + Math.floor(rnd() * 6) : 9 + Math.floor(rnd() * 80);
    const kickoff = new Date(now.getTime() - daysAgo * DAY);
    const pending = daysAgo < 2;
    const won = rnd() < p.winProb;
    const status = pending ? "pending" : won ? "won" : "lost";
    const pl = pending ? 0 : won ? Math.round(stake * (odds - 1) * 100) / 100 : -stake;
    const home = pick(["Arsenal", "Inter", "Real Madrid", "Bayern", "Napoli", "Sevilla", "Spurs", "Roma"]);
    const away = pick(["Chelsea", "Milan", "Barcelona", "Dortmund", "Lazio", "Betis", "Everton", "Torino"]);
    bets.push({
      id: `smoke-${id++}`,
      bookId: "book-1",
      kickoff: kickoff.toISOString(),
      sport: "Soccer",
      league: p.league,
      home,
      away,
      event: `${home} v ${away}`,
      market: p.market,
      selection: p.market === "ah" ? `${home} -0.5` : p.market === "ou" ? "Over 2.5" : p.market === "btts" ? "Yes" : home,
      odds,
      stake,
      closingOdds: rnd() < 0.7 ? Math.round((odds * (0.96 + rnd() * 0.06)) * 100) / 100 : undefined,
      status,
      pl,
      source: "smoke",
      importedAt: now.toISOString(),
      raw: {},
    });
  }
}

async function main() {
  const input = buildWeeklyReportInput({ handle: "smoketest", bets, now });
  console.log("── input summary ──");
  console.log({
    week: input.week,
    lifetime: input.lifetime,
    thisWeek: input.thisWeek,
    leaks: input.leaks.map((l) => `${l.dimension}:${l.label} ${l.pl}u n=${l.n}`),
    strengths: input.strengths.map((l) => `${l.dimension}:${l.label} ${l.pl}u n=${l.n}`),
    competitions: input.competitions.length,
    markets: input.markets.length,
    oddsBands: input.oddsBands.map((o) => `${o.label} ${o.pl}u n=${o.n}`),
    sports: input.sports.length,
  });
  console.log(`payload chars: ${JSON.stringify(input).length}`);

  console.log("\n── calling model ──");
  const t0 = Date.now();
  const gen = await generateWeeklyReport({ apiKey: process.env.ANTHROPIC_API_KEY, input });
  console.log(`model=${gen.model} in ${((Date.now() - t0) / 1000).toFixed(1)}s`, gen.usage);
  console.log(JSON.stringify(gen.report, null, 2));

  const email = renderWeeklyReport(
    { userId: "00000000-0000-0000-0000-000000000000", handle: "smoketest", siteUrl: "https://amiup.io" },
    gen.report,
    input,
  );
  mkdirSync("scripts/out", { recursive: true });
  writeFileSync("scripts/out/weekly-report-smoke.html", email.html);
  writeFileSync("scripts/out/weekly-report-smoke.txt", `Subject: ${email.subject}\n\n${email.text}`);
  console.log(`\nSubject: ${email.subject}`);
  console.log("wrote scripts/out/weekly-report-smoke.{html,txt}");
}

main().catch((e) => {
  console.error("SMOKE FAILED:", e);
  process.exit(1);
});
