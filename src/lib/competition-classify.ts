// Multi-sport competition classifier — derives the competition name from a
// bet's text (league / event / selection) without requiring a stored column.
// Used at display time only; the bet schema is unchanged.
//
// Returns a canonical display label (e.g. "Premier League", "ATP Tour",
// "NBA", "MLB") or null when no competition can be confidently inferred.
//
// v2 (2026-07): extended beyond soccer to cover Tennis (ATP / WTA / Grand
// Slams / Masters 1000), Basketball (NBA / WNBA / EuroLeague / NCAA),
// Baseball (MLB / NPB / KBO), and American Football (NFL / NCAA). Each
// sport has its own scoped rule list — a soccer bet can never resolve
// to "NBA", and vice versa.

import { classifySport } from "./sport-classify";

interface ClassifyInput {
  selection?: string;
  event?: string;
  league?: string;
  sport?: string;
  home?: string;
  away?: string;
  market?: string;
}

interface Rule {
  re: RegExp;
  label: string;
}

// ─ Soccer competitions (unchanged from v1) ───────────────────────────────
const SOCCER_RULES: Rule[] = [
  // European club competitions
  { re: /\bchampions\s*league\b|\bucl\b/, label: "Champions League" },
  { re: /\beuropa\s*league\b|\buel\b/, label: "Europa League" },
  { re: /\beuropa\s*conference\b|\buecl\b|\bconference\s*league\b/, label: "Europa Conference" },
  // England
  { re: /\b(?:english\s*)?premier\s*league\b|\bepl\b/, label: "Premier League" },
  { re: /\befl\s*championship\b|\bchampionship\b/, label: "Championship" },
  { re: /\befl\s*league\s*one\b|\bleague\s*one\b/, label: "League One" },
  { re: /\befl\s*league\s*two\b|\bleague\s*two\b/, label: "League Two" },
  { re: /\bnational\s*league\b/, label: "National League" },
  { re: /\bfa\s*cup\b/, label: "FA Cup" },
  { re: /\b(?:efl|carabao)\s*cup\b|\bleague\s*cup\b/, label: "EFL Cup" },
  // Spain
  { re: /\bla\s*liga\b|\blaliga\b/, label: "La Liga" },
  { re: /\bsegunda(?:\s*division)?\b|\bla\s*liga\s*2\b/, label: "La Liga 2" },
  { re: /\bcopa\s*del\s*rey\b/, label: "Copa del Rey" },
  // Italy
  { re: /\bserie\s*a\b/, label: "Serie A" },
  { re: /\bserie\s*b\b/, label: "Serie B" },
  { re: /\bcoppa\s*italia\b/, label: "Coppa Italia" },
  // Germany
  { re: /\b(?:1\.?\s*)?bundesliga\b/, label: "Bundesliga" },
  { re: /\b2\.?\s*bundesliga\b|\bbundesliga\s*2\b/, label: "2. Bundesliga" },
  { re: /\bdfb[\s-]?pokal\b/, label: "DFB-Pokal" },
  // France
  { re: /\bligue\s*1\b/, label: "Ligue 1" },
  { re: /\bligue\s*2\b/, label: "Ligue 2" },
  { re: /\bcoupe\s*de\s*france\b/, label: "Coupe de France" },
  // Other top European
  { re: /\beredivisie\b/, label: "Eredivisie" },
  { re: /\bprimeira\s*liga\b|\bliga\s*portugal\b/, label: "Primeira Liga" },
  { re: /\b(?:turkish\s*)?süper\s*lig\b|\bsuper\s*lig\b/, label: "Süper Lig" },
  { re: /\bbelgian\s*pro\s*league\b|\bjupiler\s*pro\s*league\b/, label: "Belgian Pro League" },
  { re: /\bscottish\s*premiership\b|\bspl\b/, label: "Scottish Premiership" },
  // Americas
  { re: /\bmls\b|\bmajor\s*league\s*soccer\b/, label: "MLS" },
  { re: /\bliga\s*mx\b/, label: "Liga MX" },
  { re: /\bbrasileir(?:a|ão|ao)\b|\bserie\s*a\s*brazil\b/, label: "Brasileirão" },
  { re: /\bcopa\s*libertadores\b|\blibertadores\b/, label: "Copa Libertadores" },
  { re: /\bcopa\s*sudamericana\b/, label: "Copa Sudamericana" },
  { re: /\bcopa\s*america\b|\bcopa\s*américa\b/, label: "Copa América" },
  // Asia / Oceania
  { re: /\bj[\s-]?league\b/, label: "J-League" },
  { re: /\bk[\s-]?league\b/, label: "K-League" },
  { re: /\bchinese\s*super\s*league\b|\bcsl\b/, label: "Chinese Super League" },
  { re: /\ba[\s-]?league\b/, label: "A-League" },
  { re: /\basian\s*cup\b/, label: "Asian Cup" },
  { re: /\bafc\s*champions\s*league\b/, label: "AFC Champions League" },
  // Africa
  { re: /\bafrica\s*cup\s*of\s*nations\b|\bafcon\b/, label: "AFCON" },
  // International
  { re: /\bworld\s*cup\s*qualif/, label: "World Cup Qualifiers" },
  { re: /\bworld\s*cup\b|\bfifa\s*world\s*cup\b/, label: "World Cup" },
  { re: /\beuros?\b|\beuro\s*\d{4}\b|\beuropean\s*championship\b/, label: "Euros" },
  { re: /\bnations\s*league\b/, label: "Nations League" },
  { re: /\binternational\s*friendly\b/, label: "International Friendly" },
  { re: /\bclub\s*world\s*cup\b/, label: "Club World Cup" },
];

// ─ Tennis competitions ──────────────────────────────────────────────────
// Grand Slams come first (specific), then Masters/WTA 1000 tournaments,
// then generic tour matches. WTA rules include "wta" AND female stars
// so a tour match with only player names still routes to WTA.
const TENNIS_RULES: Rule[] = [
  // Grand Slams — most specific
  { re: /\bwimbledon\b/, label: "Wimbledon" },
  { re: /\b(?:us|u\.s\.)\s*open\b/, label: "US Open (Tennis)" },
  { re: /\bfrench\s*open\b|\broland[\s-]?garros\b/, label: "Roland Garros" },
  { re: /\baustralian\s*open\b|\bausopen\b/, label: "Australian Open" },
  // ATP Masters 1000
  { re: /\bindian\s*wells\b|\bbnp\s*paribas\s*open\b/, label: "Indian Wells" },
  { re: /\bmiami\s*open\b|\bmiami\s*masters\b/, label: "Miami Open" },
  { re: /\bmonte[\s-]?carlo\s*(?:masters|rolex)\b|\bmonte[\s-]?carlo\b/, label: "Monte-Carlo Masters" },
  { re: /\bmadrid\s*open\b|\bmutua\s*madrid\b/, label: "Madrid Open" },
  { re: /\bitalian\s*open\b|\brome\s*(?:masters|open)\b|\binternazionali\s*bnl\b/, label: "Rome Masters" },
  { re: /\bcanadian\s*open\b|\bcanada\s*(?:masters|open)\b|\brogers\s*cup\b|\bnational\s*bank\s*open\b/, label: "Canadian Open" },
  { re: /\bcincinnati\s*(?:masters|open)\b|\bwestern\s*(?:&|and)\s*southern\b/, label: "Cincinnati Masters" },
  { re: /\bshanghai\s*(?:masters|rolex)\b/, label: "Shanghai Masters" },
  { re: /\bparis\s*masters\b|\brolex\s*paris\s*masters\b/, label: "Paris Masters" },
  // Year-end / team events
  { re: /\batp\s*finals\b|\batp\s*world\s*tour\s*finals\b|\bnitto\s*atp\s*finals\b/, label: "ATP Finals" },
  { re: /\bwta\s*finals\b/, label: "WTA Finals" },
  { re: /\bdavis\s*cup\b/, label: "Davis Cup" },
  { re: /\bbillie\s*jean\s*king\s*cup\b|\bfed\s*cup\b/, label: "BJK Cup" },
  // Generic tour buckets (fallbacks — lowest priority)
  { re: /\bwta\b|\bhalep\b|\bsabalenka\b|\bswiatek\b|\bgauff\b|\brybakina\b|\bpegula\b|\bkeys\b|\bosaka\b|\bkrejcikova\b|\bpaolini\b|\bnavarro\b|\bmuchova\b|\bostapenko\b/, label: "WTA Tour" },
  { re: /\batp\b|\bchallenger\b/, label: "ATP Tour" },
  // ITF fallback
  { re: /\bitf\b/, label: "ITF" },
];

// ─ Basketball competitions ──────────────────────────────────────────────
const BASKETBALL_RULES: Rule[] = [
  { re: /\bnba\b|\bnba\s*(?:finals|playoffs|all-?star)\b/, label: "NBA" },
  { re: /\bwnba\b/, label: "WNBA" },
  { re: /\beuroleague\b|\beuro\s*league\b/, label: "EuroLeague" },
  { re: /\beurocup\b/, label: "EuroCup" },
  { re: /\bncaa\s*(?:basketball|mbb|wbb|tournament|march\s*madness)\b|\bmarch\s*madness\b|\bfinal\s*four\b/, label: "NCAA Basketball" },
  { re: /\bfiba\s*world\s*cup\b|\bworld\s*basketball\s*cup\b/, label: "FIBA World Cup" },
  { re: /\bolympic\s*basketball\b/, label: "Olympic Basketball" },
];

// ─ Baseball competitions ────────────────────────────────────────────────
const BASEBALL_RULES: Rule[] = [
  { re: /\bworld\s*series\b/, label: "World Series" },
  { re: /\balds\b|\balcs\b|\bnlds\b|\bnlcs\b|\bmlb\s*playoffs\b|\bpostseason\b/, label: "MLB Postseason" },
  { re: /\bmlb\b|\bmajor\s*league\s*baseball\b/, label: "MLB" },
  { re: /\bnpb\b|\bnippon\s*(?:pro\s*)?baseball\b/, label: "NPB (Japan)" },
  { re: /\bkbo\b|\bkorean\s*(?:pro\s*)?baseball\b/, label: "KBO (Korea)" },
  { re: /\bwbc\b|\bworld\s*baseball\s*classic\b/, label: "WBC" },
];

// ─ American Football ────────────────────────────────────────────────────
const NFL_RULES: Rule[] = [
  { re: /\bsuper\s*bowl\b/, label: "Super Bowl" },
  { re: /\bnfl\s*playoffs\b|\bwild\s*card\b|\bafc\s*championship\b|\bnfc\s*championship\b/, label: "NFL Playoffs" },
  { re: /\bnfl\b|\bnational\s*football\s*league\b/, label: "NFL" },
  { re: /\bncaa\s*football\b|\bcollege\s*football\b|\bcfp\b|\bcollege\s*football\s*playoff\b/, label: "NCAA Football" },
];

// ─ Ice Hockey ───────────────────────────────────────────────────────────
const HOCKEY_RULES: Rule[] = [
  { re: /\bstanley\s*cup\b/, label: "Stanley Cup Playoffs" },
  { re: /\bnhl\b|\bnational\s*hockey\s*league\b/, label: "NHL" },
  { re: /\bkhl\b/, label: "KHL" },
  { re: /\biihf\b|\bworld\s*hockey\b/, label: "IIHF World Championship" },
];

// ─ Horse Racing major meetings ──────────────────────────────────────────
const HORSE_RULES: Rule[] = [
  { re: /\bcheltenham\s*festival\b|\bcheltenham\s*gold\s*cup\b/, label: "Cheltenham Festival" },
  { re: /\bgrand\s*national\b/, label: "Grand National" },
  { re: /\broyal\s*ascot\b/, label: "Royal Ascot" },
  { re: /\bglorious\s*goodwood\b/, label: "Glorious Goodwood" },
  { re: /\bebor\s*(?:festival|meeting)\b|\byork\s*ebor\b/, label: "Ebor Festival" },
  { re: /\bkentucky\s*derby\b/, label: "Kentucky Derby" },
  { re: /\bpreakness\b/, label: "Preakness" },
  { re: /\bbelmont\s*stakes\b/, label: "Belmont Stakes" },
  { re: /\bbreeders[' ]?\s*cup\b/, label: "Breeders' Cup" },
  { re: /\bmelbourne\s*cup\b/, label: "Melbourne Cup" },
  { re: /\bcox\s*plate\b/, label: "Cox Plate" },
  { re: /\bdubai\s*world\s*cup\b/, label: "Dubai World Cup" },
  { re: /\bprix\s*de\s*l'?arc\s*de\s*triomphe\b|\barc\s*de\s*triomphe\b/, label: "Prix de l'Arc de Triomphe" },
];

// Per-sport rule table — sport name (as returned by classifySport)
// mapped to that sport's rule list. When a sport has no entry the
// classifier returns null (no competition granularity available).
const RULES_BY_SPORT: Record<string, Rule[]> = {
  Soccer: SOCCER_RULES,
  Tennis: TENNIS_RULES,
  Basketball: BASKETBALL_RULES,
  Baseball: BASEBALL_RULES,
  "American Football": NFL_RULES,
  "Ice Hockey": HOCKEY_RULES,
  "Horse Racing": HORSE_RULES,
};

/**
 * Derive the competition from a bet's text. Returns null when:
 *   - no sport-specific rule set exists for the bet's sport, or
 *   - no rule matches the bet text.
 *
 * Callers should bucket null results into an "Unknown" or "Other" group
 * rather than pretending every bet has a canonical competition.
 */
export function classifyCompetition(input: ClassifyInput): string | null {
  const sport = classifySport({
    selection: input.selection ?? "",
    event: input.event,
    league: input.league,
    sport: input.sport,
    home: input.home,
    away: input.away,
    market: input.market,
  });

  const rules = RULES_BY_SPORT[sport];
  if (!rules) return null;

  const haystack = [
    input.league ?? "",
    input.event ?? "",
    input.selection ?? "",
  ]
    .join(" \n ")
    .toLowerCase();

  for (const { re, label } of rules) {
    if (re.test(haystack)) return label;
  }
  return null;
}
