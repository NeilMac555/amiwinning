// Soccer competition classifier — derives the competition name from a bet's
// text (league / event / selection) without requiring a stored column. Used
// at display time only; the bet schema is unchanged.
//
// Returns a canonical display label (e.g. "Premier League", "Champions League")
// or null when no competition can be confidently inferred. Soccer-only for v1.

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

// Each rule: a regex pattern matched against lowercased combined text, and the
// canonical label to assign when it hits. Order matters — more specific names
// come first so "champions league" wins over a generic "league" match.
const RULES: Array<{ re: RegExp; label: string }> = [
  // ─── European club competitions ──────────────────────────────
  { re: /\bchampions\s*league\b|\bucl\b/, label: "Champions League" },
  { re: /\beuropa\s*league\b|\buel\b/, label: "Europa League" },
  { re: /\beuropa\s*conference\b|\buecl\b|\bconference\s*league\b/, label: "Europa Conference" },

  // ─── England ─────────────────────────────────────────────────
  { re: /\b(?:english\s*)?premier\s*league\b|\bepl\b/, label: "Premier League" },
  { re: /\befl\s*championship\b|\bchampionship\b/, label: "Championship" },
  { re: /\befl\s*league\s*one\b|\bleague\s*one\b/, label: "League One" },
  { re: /\befl\s*league\s*two\b|\bleague\s*two\b/, label: "League Two" },
  { re: /\bnational\s*league\b/, label: "National League" },
  { re: /\bfa\s*cup\b/, label: "FA Cup" },
  { re: /\b(?:efl|carabao)\s*cup\b|\bleague\s*cup\b/, label: "EFL Cup" },

  // ─── Spain ───────────────────────────────────────────────────
  { re: /\bla\s*liga\b|\blaliga\b/, label: "La Liga" },
  { re: /\bsegunda(?:\s*division)?\b|\bla\s*liga\s*2\b/, label: "La Liga 2" },
  { re: /\bcopa\s*del\s*rey\b/, label: "Copa del Rey" },

  // ─── Italy ───────────────────────────────────────────────────
  { re: /\bserie\s*a\b/, label: "Serie A" },
  { re: /\bserie\s*b\b/, label: "Serie B" },
  { re: /\bcoppa\s*italia\b/, label: "Coppa Italia" },

  // ─── Germany ─────────────────────────────────────────────────
  { re: /\b(?:1\.?\s*)?bundesliga\b/, label: "Bundesliga" },
  { re: /\b2\.?\s*bundesliga\b|\bbundesliga\s*2\b/, label: "2. Bundesliga" },
  { re: /\bdfb[\s-]?pokal\b/, label: "DFB-Pokal" },

  // ─── France ──────────────────────────────────────────────────
  { re: /\bligue\s*1\b/, label: "Ligue 1" },
  { re: /\bligue\s*2\b/, label: "Ligue 2" },
  { re: /\bcoupe\s*de\s*france\b/, label: "Coupe de France" },

  // ─── Other top European leagues ──────────────────────────────
  { re: /\beredivisie\b/, label: "Eredivisie" },
  { re: /\bprimeira\s*liga\b|\bliga\s*portugal\b/, label: "Primeira Liga" },
  { re: /\b(?:turkish\s*)?süper\s*lig\b|\bsuper\s*lig\b/, label: "Süper Lig" },
  { re: /\bbelgian\s*pro\s*league\b|\bjupiler\s*pro\s*league\b/, label: "Belgian Pro League" },
  { re: /\bscottish\s*premiership\b|\bspl\b/, label: "Scottish Premiership" },

  // ─── Americas ────────────────────────────────────────────────
  { re: /\bmls\b|\bmajor\s*league\s*soccer\b/, label: "MLS" },
  { re: /\bliga\s*mx\b/, label: "Liga MX" },
  { re: /\bbrasileir(?:a|ão|ao)\b|\bserie\s*a\s*brazil\b/, label: "Brasileirão" },
  { re: /\bcopa\s*libertadores\b|\blibertadores\b/, label: "Copa Libertadores" },
  { re: /\bcopa\s*sudamericana\b/, label: "Copa Sudamericana" },
  { re: /\bcopa\s*america\b|\bcopa\s*américa\b/, label: "Copa América" },

  // ─── Asia / Oceania ──────────────────────────────────────────
  { re: /\bj[\s-]?league\b/, label: "J-League" },
  { re: /\bk[\s-]?league\b/, label: "K-League" },
  { re: /\bchinese\s*super\s*league\b|\bcsl\b/, label: "Chinese Super League" },
  { re: /\ba[\s-]?league\b/, label: "A-League" },
  { re: /\basian\s*cup\b/, label: "Asian Cup" },
  { re: /\bafc\s*champions\s*league\b/, label: "AFC Champions League" },

  // ─── Africa ──────────────────────────────────────────────────
  { re: /\bafrica\s*cup\s*of\s*nations\b|\bafcon\b/, label: "AFCON" },

  // ─── International ───────────────────────────────────────────
  { re: /\bworld\s*cup\s*qualif/, label: "World Cup Qualifiers" },
  { re: /\bworld\s*cup\b|\bfifa\s*world\s*cup\b/, label: "World Cup" },
  { re: /\beuros?\b|\beuro\s*\d{4}\b|\beuropean\s*championship\b/, label: "Euros" },
  { re: /\bnations\s*league\b/, label: "Nations League" },
  { re: /\binternational\s*friendly\b/, label: "International Friendly" },
  { re: /\bclub\s*world\s*cup\b/, label: "Club World Cup" },
];

/**
 * Derive the soccer competition from a bet's text. Returns null when:
 *   - the bet is not soccer (per the existing sport classifier), or
 *   - no competition rule matches.
 *
 * Callers should bucket null results into an "Unknown" or "Other" group.
 */
export function classifyCompetition(input: ClassifyInput): string | null {
  // Only soccer bets carry a competition for v1.
  const sport = classifySport({
    selection: input.selection ?? "",
    event: input.event,
    league: input.league,
    sport: input.sport,
    home: input.home,
    away: input.away,
    market: input.market,
  });
  if (sport !== "Soccer") return null;

  const haystack = [
    input.league ?? "",
    input.event ?? "",
    input.selection ?? "",
  ]
    .join(" \n ")
    .toLowerCase();

  for (const { re, label } of RULES) {
    if (re.test(haystack)) return label;
  }
  return null;
}
