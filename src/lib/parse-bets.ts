// Shared constants + validator for the Claude Haiku bet parser.
//
// Both the authed real route (/api/bets/parse) and the rate-limited demo
// route (/api/demo/parse) import from here. Extracting these keeps the two
// routes in sync (same system prompt, same tool schema, same field validation)
// without duplicating multi-KB strings.
//
// This file is a pure re-export/refactor: values are copied verbatim from
// the pre-existing /api/bets/parse route. Behaviour of the real route does
// not change.

import type { MarketGuess, Status } from "@/lib/import/types";

export const VALID_MARKETS: MarketGuess[] = [
  "1X2",
  "ah",
  "ou",
  "btts",
  "dnb",
  "totals_team",
  "shots",
  "corners",
  "scorer",
  "cards",
  "half_time",
  "ht_ft",
  "clean_sheet",
  "winning_margin",
  "exact_score",
  "tournament",
  "parlay",
  "other",
];

export const VALID_STATUS: Status[] = [
  "won",
  "lost",
  "push",
  "void",
  "pending",
  "half_won",
  "half_lost",
];

export const SYSTEM_PROMPT = `You are a betting tracker's input parser. The user pastes descriptions of one or more sports bets — could be prose, tabular columns, a screenshot transcription, OR a direct screenshot (bookmaker app, Telegram tip, X post, paper bet slip). If you receive an image, read every bet visible in it including kickoff dates/times, stakes, odds, selections, and results. If you receive both an image and accompanying text, the text is supplementary context (e.g. "these are from yesterday, 2u default stake"). Extract each bet as a structured record and call the submit_bets tool with the full list.

Field guidance:
- kickoff: ISO YYYY-MM-DD. Resolve relative dates ("Sunday", "yesterday") against TODAY. CRITICAL: A bet that is already settled (won/lost/push/half_won/half_lost) MUST have a kickoff in the past — never today or future. When a relative day is ambiguous (e.g. "Sunday" with no week) and the bet is settled, resolve to the MOST RECENT past occurrence of that day, not the upcoming one. Pending bets may use today or future.
- event: full fixture text, e.g. "Mensik vs Struff" / "Barcelona vs Real Madrid".
- selection: the pick text, exactly as the user wrote it, e.g. "Mensik -1.5 sets" / "Barcelona -0.75 AH" / "BTTS yes".
- market: pick the best match from the enum. For tennis: "ah" for set/game spreads, "ou" for over/under games or sets, "1X2" for moneyline. For multi-leg bets: "parlay".
- odds: ALWAYS decimal. Convert American (+150 → 2.50, -110 → 1.91) and fractional (5/2 → 3.50). Never return American or fractional.
- stake: number in units. "2 units", "2u", just "2" → 2.
- status: "(W)" or "(win)" → "won". "(L)" or "(lost)" → "lost". "(P)" or "(push)" → "push". "(half-won)" / "(half-lost)" → "half_won"/"half_lost". If not stated, "pending".

- bookmaker: OPTIONAL. Extract the bookmaker name when the text mentions one ("with Pinnacle", "on Bet365", "DraftKings", "William Hill", "@ Bet365"). Normalise to the canonical brand name in Title Case ("Pinnacle", "Bet365", "DraftKings", "William Hill", "Betfair", "Betfair Exchange", "Smarkets", "Unibet", "Paddy Power", "Ladbrokes", "Coral", "Sky Bet", "888sport", "BetVictor", "FanDuel", "Caesars", "BetMGM", "PointsBet", "Circa", "Hard Rock", "ESPN Bet"). If no bookmaker is mentioned, OMIT the field entirely rather than guessing.

CRITICAL — multi-leg / parlay handling:
Multi-leg bets go under market="parlay" as ONE row. The trigger vocabulary is broad — recognise ALL of these as parlays:
  - UK/EU: Double, Treble, 4-fold, 5-fold, Accumulator, Acca, Yankee, Lucky 15, Lucky 31, Lucky 63
  - US: Parlay, Same Game Parlay, SGP, SGPx (cross-game SGP), Bet Builder, Same Game Bet Builder, Round Robin, Teaser, Progressive Parlay, PP, "3-leg parlay", "5-leg parlay", "6-team teaser"
  - Structural signal (any language): two or more picks presented together AND a single combined price at the bottom of the group ("Bet Slip Total", "Combined Odds", "To Win", "Payout", "$X to win $Y"). If you see a group of picks that each have their own individual odds AND there's a total/combined price at the bottom, that group is ONE parlay — the total price is the parlay odds, NOT the sum.

Parlay output rules:
  - ONE row, market="parlay". selection field summarises the legs, e.g. "3-leg SGP: Lakers ML + LeBron o25.5 pts + Over 224.5" or "Double: Arsenal −0.5 AH + Man City to win". Keep leg text short but recognisable.
  - odds = the combined/parlay price (NOT the individual leg prices, NOT their product).
  - stake = the total stake on the parlay (NOT stake per leg).
  - If the parlay is settled, ONE status covers the whole ticket. A single losing leg loses the whole parlay.
  - Bet builder / SGP screenshots from DraftKings, FanDuel, BetMGM, Caesars, Fanatics, ESPN Bet almost always show individual leg prices AND a combined price at the bottom — treat as ONE parlay row using the combined price.
  - Round Robin is a group of parlays (e.g. "3-team round robin" is 3 separate 2-leg parlays covering every pair). Output ONE row per constituent parlay in the round robin if the source lists each with its own price; otherwise output ONE row with selection prefixed "Round Robin: <legs>" and stake = total staked across the round robin.
  - Teasers use modified point spreads across N legs but pay one combined price — treat as a parlay with selection prefixed "Teaser: ".

- Be aggressive about extraction even from messy tabular data. Each line/row that has odds + a pick is probably a bet.
- IMPORTANT COUNTER-RULE: A run of picks WITHOUT a combined price is NOT a parlay — it's N separate single bets. Only fold into one parlay row when a combined/total price is present or when the source explicitly calls it a parlay/SGP/bet builder/acca/round robin/teaser.

Sport classification (read in order, first match wins):
- "Tennis" if the text mentions ATP / WTA / sets / games / known tennis players (Zverev, Sinner, Alcaraz, Djokovic, Sabalenka, Swiatek, Medvedev, Tsitsipas, Rublev, Auger-Aliassime, Monfils, Tien, Michelsen, etc.).
- "Basketball" if the text mentions NBA, basketball-specific player props (points / rebounds / assists / 3-pointers / blocks / steals / double-double / triple-double / PRA), NBA team names (Lakers, Celtics, Warriors, Bucks, Heat, Knicks, Nets, 76ers, Mavericks, Nuggets, Thunder, Suns, Clippers, Pacers, Cavaliers, Magic, etc.), or NBA player names (LeBron, Curry, Durant, Giannis, Dončić, Tatum, Jokić, Embiid, Shai / Gilgeous-Alexander, Wembanyama, Brunson, Anthony Davis, Jaylen Brown, Booker, Edwards, Ant, etc.). Three-digit point totals (e.g. "over 224.5") are strong basketball signals.
- "Baseball" if the text mentions MLB, baseball-specific markets (run line, NRFI, YRFI, F5 / first 5 innings, anytime home run, total bases, strikeouts / Ks, RBIs, earned runs, innings pitched, walk-off, extra innings, World Series, ALDS / NLDS / ALCS / NLCS), MLB team names (Yankees, Red Sox, Dodgers, Astros, Braves, Phillies, Mets, Padres, San Francisco Giants, St Louis Cardinals, Texas Rangers, Blue Jays, etc. — note: bare "Giants" / "Cardinals" / "Rangers" need the city to be MLB), or MLB player names (Aaron Judge, Ohtani, Mookie Betts, Soto, Acuña, Bryce Harper, Tatis, Guerrero, Yordan Alvarez, José Ramírez, Bobby Witt, Henderson, Carroll, Julio Rodríguez, Kyle Tucker, Freeman, Alonso, Machado, Trea Turner, Seager, Lindor, Trout, Altuve, Bregman, Devers, Schwarber, Stanton, Gerrit Cole, Skubal, Skenes, Strider, Wheeler, Burnes, Yamamoto, Snell, Verlander, Scherzer, Kershaw, etc.).
- "American Football" if NFL team names (Chiefs, Cowboys, Eagles, 49ers, Bills, Ravens, Steelers, Patriots, etc. — note: bare "Giants" / "Cardinals" / "Jets" / "Panthers" need the city to disambiguate) or NFL-specific markets (first touchdown, anytime touchdown scorer, passing yards, rushing yards).
- "Ice Hockey" if NHL team names (Bruins, Maple Leafs, Oilers, New York Rangers, Florida Panthers, Winnipeg Jets, etc.) or NHL markets (puck line, period-specific goals).
- "Horse Racing" if the text mentions: horse-racing-specific markets (each-way / EW, non-runner / NR, Rule 4, BOG, starting price / SP, forecast / tricast / exacta / trifecta / superfecta, ante post, going state — good / soft / heavy / firm, race class — maiden / novice / handicap / Group 1 / Grade 1, distance in furlongs — e.g. "5f", "1m4f"); famous race names (Cheltenham Gold Cup, Champion Hurdle, Queen Mother Champion Chase, Stayers' Hurdle, Grand National, Kentucky Derby, Preakness, Belmont, Breeders' Cup, Royal Ascot, Epsom Derby, 2000 Guineas, St Leger, Melbourne Cup, Cox Plate, Prix de l'Arc de Triomphe, Dubai World Cup, etc.); famous racecourses (Ascot, Newmarket, Aintree, Epsom, Goodwood, York Racecourse, Doncaster Racecourse, Kempton Park, Sandown, Newbury, the Curragh, Leopardstown, Churchill Downs, Saratoga, Belmont Park, Santa Anita, Longchamp, Meydan, Sha Tin, Flemington, etc.); famous recent horses (Constitution Hill, State Man, Galopin Des Champs, Energumene, Honeysuckle, Shishkin, City of Troy, Auguste Rodin, Baaeed, Frankel, Stradivarius, Enable, Equinox, Justify, etc.); famous jockeys (Frankie Dettori, Ryan Moore, William Buick, Oisin Murphy, Rachael Blackmore, Paul Townend, Jack Kennedy, Irad Ortiz, Joel Rosario, Flavien Prat, John Velazquez, etc.); or famous trainers (Aidan O'Brien, John Gosden, Charlie Appleby, William Haggas, Willie Mullins, Gordon Elliott, Henry de Bromhead, Nicky Henderson, Paul Nicholls, Bob Baffert, Todd Pletcher, etc.).
- "Soccer" otherwise (default).

For basketball markets specifically:
- Point spread (e.g. "Lakers -5.5") → market="ah"
- Point total (e.g. "Over 224.5") → market="ou"
- Money line (e.g. "Lakers ML") → market="1X2"
- Player props (e.g. "LeBron over 25.5 points") → market="other" with selection preserving the player name and stat
- Quarter/half markets → market="other"

For baseball markets specifically:
- Run line (e.g. "Dodgers -1.5") → market="ah"
- Total runs / over-under (e.g. "Over 8.5 runs") → market="ou"
- Money line (e.g. "Yankees ML") → market="1X2"
- Pitcher strikeouts / hitter total bases / RBIs / hits (e.g. "Skubal over 7.5 Ks", "Judge 1+ TB") → market="other" with selection preserving the player + stat
- Anytime / 2+ home runs (e.g. "Ohtani anytime HR") → market="other"
- NRFI / YRFI / F5 markets → market="other"

For horse racing markets specifically:
- Win bet (e.g. "Constitution Hill to win", "City of Troy WIN") → market="1X2"
- Each-way / EW (win + place combined) → market="other" with selection noting "EW" so the user keeps that information
- Place only / to place → market="other"
- Forecast / Reverse Forecast / Straight Forecast / Tricast / Exacta / Quinella / Trifecta / Superfecta → market="other"
- Ante-post (futures market on a race months away) → market="other" with selection noting "Ante-post"
- Selection should be the horse name (e.g. selection="Constitution Hill", event="Champion Hurdle, Cheltenham Day 1"). If the horse is unnamed but a jockey or trainer is, fall back to that, then to the race + time.
- Kickoff for horse racing is the race-off time (the post time of that specific race). If only a date is given, use 00:00 on that date.`;

export const TOOL_DEF = {
  name: "submit_bets",
  description:
    "Submit the structured list of bets extracted from the user's text.",
  input_schema: {
    type: "object" as const,
    properties: {
      bets: {
        type: "array" as const,
        description: "Each parsed bet as an object.",
        items: {
          type: "object" as const,
          properties: {
            kickoff: {
              type: "string",
              description: "ISO date YYYY-MM-DD.",
            },
            event: { type: "string" },
            selection: { type: "string" },
            market: { type: "string", enum: VALID_MARKETS },
            odds: {
              type: "number",
              description: "Decimal odds, e.g. 1.85.",
            },
            stake: { type: "number" },
            status: { type: "string", enum: VALID_STATUS },
            sport: {
              type: "string",
              description:
                "Best-guess sport label. MUST be one of: 'Tennis', 'Soccer', 'Basketball', 'Baseball', 'American Football', 'Ice Hockey', 'Cricket', 'Golf', 'Boxing', 'MMA', 'Horse Racing', 'Rugby', 'Darts', 'Snooker', 'Esports', or 'Other'. Use the FULL NAME — not 'NFL'/'MLB'/'NHL'. Infer from event text and player/team names per the sport classification rules in the system prompt.",
            },
            bookmaker: {
              type: "string",
              description:
                "OPTIONAL. Bookmaker the bet was placed at (e.g. 'Pinnacle', 'Bet365', 'DraftKings'). Extract only when explicitly mentioned. Omit the field entirely if no bookmaker appears in the source.",
            },
          },
          required: [
            "kickoff",
            "event",
            "selection",
            "market",
            "odds",
            "stake",
            "status",
            "sport",
          ],
        },
      },
    },
    required: ["bets"],
  },
};

export interface ParsedBet {
  kickoff: string;
  event: string;
  selection: string;
  market: MarketGuess;
  odds: number;
  stake: number;
  status: Status;
  sport: string;
  /** Optional bookmaker the bet was placed at, as extracted from
   *  the source text (e.g. "Pinnacle", "Bet365"). Omitted when the
   *  source didn't mention one. */
  bookmaker?: string;
}

/**
 * Apply the same per-bet validation the real route uses: date-shape check,
 * required-field check, odds/stake numeric coercion, enum backstop for
 * market/status, and future-kickoff clamping for settled bets. Returns
 * both the cleaned list and the issues array so callers can surface them.
 *
 * Extracted verbatim from the pre-existing /api/bets/parse route so both
 * the real and demo routes stay in lockstep on what "a valid bet" means.
 */
export function validateAndClean(
  rawBets: unknown[],
  today: string,
): { cleaned: ParsedBet[]; issues: string[] } {
  const cleaned: ParsedBet[] = [];
  const issues: string[] = [];
  for (let i = 0; i < rawBets.length; i++) {
    const b = rawBets[i] as Partial<ParsedBet>;
    if (
      !b.kickoff ||
      typeof b.kickoff !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(b.kickoff)
    ) {
      issues.push(`Bet ${i + 1}: missing or invalid kickoff date`);
      continue;
    }
    if (!b.event || !b.selection) {
      issues.push(`Bet ${i + 1}: missing event or selection`);
      continue;
    }
    const odds =
      typeof b.odds === "number" ? b.odds : parseFloat(String(b.odds));
    if (!isFinite(odds) || odds < 1.01) {
      issues.push(`Bet ${i + 1}: invalid odds`);
      continue;
    }
    const stake =
      typeof b.stake === "number" ? b.stake : parseFloat(String(b.stake));
    if (!isFinite(stake) || stake <= 0) {
      issues.push(`Bet ${i + 1}: invalid stake`);
      continue;
    }
    const market: MarketGuess = VALID_MARKETS.includes(b.market as MarketGuess)
      ? (b.market as MarketGuess)
      : "other";
    const status: Status = VALID_STATUS.includes(b.status as Status)
      ? (b.status as Status)
      : "pending";
    let kickoff = b.kickoff;
    const isSettled =
      status === "won" ||
      status === "lost" ||
      status === "push" ||
      status === "half_won" ||
      status === "half_lost";
    if (isSettled && kickoff > today) {
      kickoff = today;
      issues.push(
        `Bet ${i + 1}: future kickoff clamped to today (settled bet)`,
      );
    }
    const sport =
      typeof b.sport === "string" && b.sport.trim().length > 0
        ? b.sport.trim()
        : "Soccer";
    // Bookmaker: trim, cap length so a runaway model output can't
    // bloat the row. Empty/whitespace or missing → omitted (undefined),
    // which persists as NULL and shows as "Unspecified" in analytics.
    const bookmakerRaw =
      typeof b.bookmaker === "string" ? b.bookmaker.trim() : "";
    const bookmaker =
      bookmakerRaw.length > 0 ? bookmakerRaw.slice(0, 60) : undefined;
    cleaned.push({
      kickoff,
      event: String(b.event).trim(),
      selection: String(b.selection).trim(),
      market,
      odds: Math.round(odds * 1000) / 1000,
      stake: Math.round(stake * 100) / 100,
      status,
      sport,
      ...(bookmaker ? { bookmaker } : {}),
    });
  }
  return { cleaned, issues };
}
