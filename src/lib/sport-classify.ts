// Sport classifier — single source of truth for "what sport is this bet?".
//
// Used at: import time (parser, single-bet form, paste), display time
// (aggregate.ts overrides stored sport when confident), and the data-cleanup
// migration (one-shot fixup of legacy bets that were all stamped "Soccer").
//
// Priority order:
//   1. Strong market-text signals — "+1.5 sets" / "BTTS" — almost unambiguous.
//   2. Known players / teams / leagues — Zverev, Real Madrid, NBA, etc.
//   3. Existing stored sport if specific (not "Soccer" default).
//   4. Fall back to "Soccer" (the historic default — most bets are soccer).
//
// We err on the side of *not* overriding when uncertain. The classifier is
// designed to be aggressive about correcting obvious cases (tennis bets
// stamped as Soccer because of a hardcoded default) and conservative about
// everything else.

export type SportLabel =
  | "Tennis"
  | "Soccer"
  | "Basketball"
  | "American Football"
  | "Baseball"
  | "Ice Hockey"
  | "Cricket"
  | "Golf"
  | "Boxing"
  | "MMA"
  | "Horse Racing"
  | "Rugby"
  | "Darts"
  | "Snooker"
  | "Esports"
  | "Other";

interface ClassifyInput {
  selection: string;
  event?: string;
  market?: string;
  league?: string;
  sport?: string;
  home?: string;
  away?: string;
}

interface Signal {
  label: SportLabel;
  confidence: "high" | "medium" | "low";
}

// ─────────────────────────────────────────────────────────────────────────
// Known names — pruned to high-recognition players/teams/leagues. Tennis
// rosters are stable enough year-to-year that this stays valid for years.
// ─────────────────────────────────────────────────────────────────────────

// Active + recently-retired ATP/WTA players. Surnames only — first names rare
// in betting text. Lowercase, word-boundary matched.
const TENNIS_PLAYERS: string[] = [
  // Current ATP top names
  "alcaraz", "sinner", "djokovic", "medvedev", "zverev", "rublev", "tsitsipas",
  "ruud", "rune", "hurkacz", "dimitrov", "fritz", "auger-aliassime", "aliassime",
  "shelton", "tiafoe", "paul", "korda", "humbert", "khachanov", "berrettini",
  "musetti", "draper", "lehecka", "etcheverry", "fils", "michelsen", "tien",
  "monfils", "wawrinka", "mensik", "struff", "norrie", "evans", "bublik",
  "thompson", "altmaier", "popyrin", "machac", "kecmanovic", "munar", "carballes",
  "navone", "carreno", "moutet", "fucsovics", "halys", "majchrzak", "borges",
  "marterer", "vukic", "diallo", "bautista", "agut", "humbert", "shapovalov",
  "kyrgios", "fognini", "ramos-vinolas", "ramos", "vinolas", "cilic", "bautista",
  "garin", "lopez", "darderi", "mpetshi", "perricard", "cobolli", "muller",
  "bonzi", "nakashima", "purcell", "albot", "harris", "kotov", "kovacevic",
  "wu", "shang", "shevchenko", "ofner", "comesana", "tabilo", "kovalik",
  "carballes baena", "mannarino", "collignon", "brooksby", "struff", "altmaier",
  "djere", "norrie", "thompson", "etcheverry", "draper", "auger", "tsonga",
  "anderson", "isner", "querrey", "raonic", "goffin", "schwartzman", "monfils",
  "gasquet", "verdasco", "lajovic", "kohlschreiber", "millman", "paire",
  "basilashvili", "krajinovic", "humbert", "fokina", "davidovich", "munar",
  "bedene", "duckworth", "hanfmann", "djokovic", "sock", "tomic", "gulbis",
  "mayer", "hurkacz", "korda", "an. murray", "andy murray",
  // Top WTA
  "swiatek", "sabalenka", "rybakina", "gauff", "pegula", "paolini", "jabeur",
  "zheng", "kasatkina", "navarro", "vekic", "haddad maia", "haddad", "ostapenko",
  "krejcikova", "muchova", "andreeva", "anisimova", "kostyuk", "azarenka",
  "kerber", "samsonova", "putintseva", "alexandrova", "tomljanovic", "kalinskaya",
  "schmiedlova", "stearns", "tauson", "siegemund", "wozniacki", "venus", "williams",
  "linette", "vondrousova", "shnaider", "noskova", "yastremska", "frech",
  "boulter", "fernandez", "raducanu", "townsend", "garcia", "potapova",
  "kenin", "collins", "keys", "azarenka", "begu", "siniakova", "krunic",
  "blinkova", "burrage", "bouzkova", "dolehide", "rakhimova", "watson",
  "uchijima", "sakkari", "kvitova", "konta", "barty", "bertens", "halep",
  "pliskova", "stephens", "sevastova", "vondrousova", "bencic", "mertens",
  "jankovic", "ivanovic", "sharapova", "schiavone", "errani", "vinci",
  // Doubles / legends still occasionally bet
  "federer", "nadal", "murray", "del potro", "thiem", "wawrinka", "ferrer",
  "soderling", "nishikori", "berdych", "ferrero", "hewitt", "roddick", "agassi",
  "sampras", "edberg", "becker", "mcenroe", "borg",
];

// Top-flight soccer clubs and national teams — covers most events.
const SOCCER_CLUBS: string[] = [
  // EPL
  "arsenal", "aston villa", "bournemouth", "brentford", "brighton", "burnley",
  "chelsea", "crystal palace", "everton", "fulham", "leeds", "leicester",
  "liverpool", "luton", "man city", "manchester city", "man utd", "manchester united",
  "newcastle", "nottingham", "forest", "sheffield", "tottenham", "spurs",
  "west ham", "wolves", "ipswich",
  // La Liga
  "real madrid", "barcelona", "atletico", "atletico madrid", "sevilla", "valencia",
  "villarreal", "real betis", "athletic bilbao", "athletic", "real sociedad",
  "celta", "celta vigo", "osasuna", "girona", "getafe", "espanyol", "rayo",
  "vallecano", "mallorca", "alaves", "leganes", "valladolid", "las palmas",
  "cadiz", "almeria",
  // Serie A
  "juventus", "milan", "ac milan", "inter", "inter milan", "roma", "lazio",
  "napoli", "atalanta", "fiorentina", "torino", "bologna", "udinese", "sassuolo",
  "verona", "salernitana", "lecce", "genoa", "monza", "frosinone", "cagliari",
  "empoli", "parma", "como", "venezia",
  // Bundesliga
  "bayern", "bayern munich", "dortmund", "bvb", "leverkusen", "leipzig",
  "rb leipzig", "frankfurt", "wolfsburg", "stuttgart", "freiburg", "mainz",
  "hoffenheim", "augsburg", "bochum", "union berlin", "werder bremen", "werder",
  "monchengladbach", "gladbach", "köln", "koln", "darmstadt", "heidenheim",
  "st. pauli", "holstein kiel",
  // Ligue 1
  "psg", "paris saint-germain", "marseille", "om", "lyon", "monaco", "lille",
  "rennes", "nice", "lens", "nantes", "toulouse", "strasbourg", "reims",
  "montpellier", "brest", "le havre", "saint-etienne", "angers", "auxerre",
  // National teams / int'l
  "england", "germany", "france", "spain", "italy", "netherlands", "portugal",
  "argentina", "brazil", "uruguay", "colombia", "mexico", "usa", "japan",
];

const SOCCER_LEAGUES: string[] = [
  "epl", "premier league", "la liga", "laliga", "serie a", "bundesliga",
  "ligue 1", "ligue 2", "championship", "league one", "league two", "eredivisie",
  "primeira liga", "süper lig", "super lig", "mls", "liga mx", "j-league",
  "j league", "k-league", "k league", "ucl", "champions league", "europa league",
  "europa conference", "world cup", "euros", "copa america", "africa cup",
  "asian cup", "international friendly", "uefa", "fifa",
];

const TENNIS_TOURNAMENTS: string[] = [
  "atp", "wta", "grand slam", "australian open", "french open", "roland garros",
  "wimbledon", "us open", "masters 1000", "masters cup", "atp finals",
  "wta finals", "davis cup", "fed cup", "billie jean king cup", "olympics tennis",
];

const NBA_TEAMS: string[] = [
  "lakers", "celtics", "warriors", "bulls", "heat", "knicks", "nets",
  "76ers", "sixers", "raptors", "bucks", "cavaliers", "cavs", "pistons",
  "pacers", "hawks", "hornets", "magic", "wizards", "rockets", "mavericks",
  "mavs", "spurs", "grizzlies", "pelicans", "thunder", "jazz", "nuggets",
  "timberwolves", "wolves", "trail blazers", "blazers", "kings", "suns",
  "clippers",
];

const NFL_TEAMS: string[] = [
  "patriots", "bills", "dolphins", "jets", "ravens", "bengals", "browns",
  "steelers", "texans", "colts", "jaguars", "titans", "broncos", "chiefs",
  "raiders", "chargers", "cowboys", "giants", "eagles", "commanders",
  "bears", "lions", "packers", "vikings", "falcons", "panthers", "saints",
  "buccaneers", "cardinals", "rams", "49ers", "seahawks",
];

const MLB_TEAMS: string[] = [
  "yankees", "red sox", "blue jays", "rays", "orioles", "white sox", "guardians",
  "tigers", "twins", "royals", "astros", "mariners", "rangers", "angels",
  "athletics", "braves", "phillies", "mets", "marlins", "nationals", "cubs",
  "brewers", "cardinals", "reds", "pirates", "dodgers", "giants", "padres",
  "diamondbacks", "rockies",
];

const NHL_TEAMS: string[] = [
  "bruins", "rangers", "islanders", "devils", "flyers", "penguins", "capitals",
  "panthers", "lightning", "maple leafs", "canadiens", "senators", "red wings",
  "sabres", "blue jackets", "hurricanes", "blackhawks", "blues", "stars",
  "predators", "wild", "avalanche", "jets", "oilers", "flames", "canucks",
  "kraken", "ducks", "kings", "sharks", "golden knights", "coyotes", "utah hc",
];

// ─────────────────────────────────────────────────────────────────────────
// Pattern matchers
// ─────────────────────────────────────────────────────────────────────────

// Tennis market signatures: "+1.5 sets", "Over 22.5 games", "Set 2 winner", etc.
const TENNIS_MARKETS = [
  /\b[+\-−]?\d+(?:\.\d+)?\s*sets?\b/i,
  /\b[+\-−]?\d+(?:\.\d+)?\s*games?\b/i,
  /\bover\s+\d+(?:\.\d+)?\s*games?\b/i,
  /\bunder\s+\d+(?:\.\d+)?\s*games?\b/i,
  /\bover\s+\d+(?:\.\d+)?\s*sets?\b/i,
  /\bunder\s+\d+(?:\.\d+)?\s*sets?\b/i,
  /\bset\s*\d+\s*(?:winner|score)\b/i,
  /\bsets?\s*(?:handicap|spread)\b/i,
  /\btie[\s-]?break\b/i,
  /\bservice\s*break\b/i,
  /\bbreak\s*of\s*serve\b/i,
  /\b(?:to\s*win\s*)?in\s*straight\s*sets\b/i,
  /\bmatch\s*tie[\s-]?break\b/i,
];

// Soccer market signatures: "BTTS", "Over 2.5 goals", AH +0.5, 1X2, DNB
const SOCCER_MARKETS = [
  /\bbtts\b/i,
  /\bboth\s*teams\s*to\s*score\b/i,
  /\bover\s+\d+(?:\.\d+)?\s*goals?\b/i,
  /\bunder\s+\d+(?:\.\d+)?\s*goals?\b/i,
  /\b\d+(?:\.\d+)?\s*goals?\b/i,
  /\bah\s*[+\-−]\d+(?:\.\d+)?\b/i,
  /\basian\s*handicap\b/i,
  /\bdraw\s*no\s*bet\b/i,
  /\bdnb\b/i,
  /\b1x2\b/i,
  /\bcorrect\s*score\b/i,
  /\bclean\s*sheet\b/i,
  /\bhalf[\s-]?time\b/i,
  /\bht[/]ft\b/i,
  /\b(?:first|second)\s*half\b/i,
  /\b(?:total\s*)?corners?\b/i,
  /\b(?:total\s*)?cards?\b/i,
  /\bgoalscorer\b/i,
  /\bfirst\s*goal\b/i,
];

// Basketball signatures: "points", "+X.5 spread" with NBA names, quarter handicaps
const BASKETBALL_MARKETS = [
  /\bover\s+\d+(?:\.\d+)?\s*points?\b/i,
  /\bunder\s+\d+(?:\.\d+)?\s*points?\b/i,
  /\b(?:1st|2nd|3rd|4th)\s*quarter\b/i,
  /\b\d+(?:\.\d+)?\s*rebounds?\b/i,
  /\b\d+(?:\.\d+)?\s*assists?\b/i,
];

const NHL_MARKETS = [
  /\bpuck\s*line\b/i,
  /\bover\s+\d+(?:\.\d+)?\s*goals?\s*-\s*hockey\b/i,
];

const MLB_MARKETS = [
  /\brun\s*line\b/i,
  /\bnrfi\b/i,
  /\byrfi\b/i,
  /\b(?:home\s*runs?|hr)\s*\d+(?:\.\d+)?\b/i,
];

const NFL_MARKETS = [
  /\b(?:first|1st)\s*touchdown\b/i,
  /\bspread\s*[+\-−]\d+(?:\.\d+)?\b/i,
];

const HORSE_RACING_MARKETS = [
  /\bto\s*win\s*race\b/i,
  /\beach\s*way\b/i,
  /\b\d+\s*to\s*\d+\b/i, // simple fractional, weak signal
  /\bplaced?\b/i,
  /\bforecast\b/i,
  /\btricast\b/i,
];

const BOXING_MMA_MARKETS = [
  /\b(?:ko|tko)\b/i,
  /\bdecision\b/i,
  /\bsubmission\b/i,
  /\bround\s*\d+\b/i,
  /\bfight\s*to\s*go\s*the\s*distance\b/i,
];

const GOLF_MARKETS = [
  /\btop\s*\d+\s*finish\b/i,
  /\bmake\s*the\s*cut\b/i,
  /\bmissed?\s*cut\b/i,
  /\bhead\s*to\s*head\s*-?\s*golf\b/i,
];

const CRICKET_MARKETS = [
  /\bover\s+\d+(?:\.\d+)?\s*runs?\b/i,
  /\btop\s*batsman\b/i,
  /\btop\s*bowler\b/i,
  /\bman\s*of\s*the\s*match\b/i,
  /\b\d+\s*overs?\s*match\b/i,
];

// ─────────────────────────────────────────────────────────────────────────
// Build a regex matching any whole-word entry in a name list. Lowercase input.
// ─────────────────────────────────────────────────────────────────────────

function nameMatcher(names: string[]): RegExp {
  // Escape regex specials in each name, then join with |. Word boundaries on
  // both sides (allowing hyphens like "auger-aliassime").
  const escaped = names.map((n) =>
    n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  return new RegExp(`(?<![a-z])(?:${escaped.join("|")})(?![a-z])`, "i");
}

const TENNIS_NAME_RE = nameMatcher(TENNIS_PLAYERS);
const SOCCER_CLUB_RE = nameMatcher(SOCCER_CLUBS);
const SOCCER_LEAGUE_RE = nameMatcher(SOCCER_LEAGUES);
const TENNIS_TOURNAMENT_RE = nameMatcher(TENNIS_TOURNAMENTS);
const NBA_RE = nameMatcher(NBA_TEAMS);
const NFL_RE = nameMatcher(NFL_TEAMS);
const MLB_RE = nameMatcher(MLB_TEAMS);
const NHL_RE = nameMatcher(NHL_TEAMS);

// ─────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────

/**
 * Determine the sport from a bet's text content. Returns the best label.
 * Confident-override semantics: when classifier confidence is `high` and it
 * disagrees with the input.sport, the classifier wins. Otherwise we keep the
 * stored sport (if any), falling back to "Soccer" historic default.
 */
export function classifySport(input: ClassifyInput): SportLabel {
  const sig = detectSignal(input);
  // Strong reclassification — only when the stored sport disagrees AND we're
  // confident. This is the "fix obviously wrong Soccer-tagged tennis bet" path.
  if (sig && sig.confidence === "high") {
    return sig.label;
  }
  // Medium — only override if stored value is the historic default ("Soccer")
  // and our medium-confidence guess differs.
  if (sig && sig.confidence === "medium") {
    const stored = input.sport;
    if (!stored || stored === "Soccer") return sig.label;
    return normaliseStoredSport(stored);
  }
  // No signal — trust stored.
  if (input.sport && input.sport.trim().length > 0) {
    return normaliseStoredSport(input.sport);
  }
  return "Soccer";
}

/**
 * Lower-level: detect the strongest sport signal in the bet's text.
 * Returns null if no signal beats the noise floor.
 */
function detectSignal(input: ClassifyInput): Signal | null {
  // Combine all the text we can search in. Lowercase for case-insensitive.
  const haystack = [
    input.selection,
    input.event ?? "",
    input.league ?? "",
    input.home ?? "",
    input.away ?? "",
    input.market ?? "",
  ]
    .join(" \n ")
    .toLowerCase();

  // ── Tennis: market signatures + tournaments + players. Most reliable.
  if (TENNIS_MARKETS.some((re) => re.test(haystack))) {
    return { label: "Tennis", confidence: "high" };
  }
  if (TENNIS_TOURNAMENT_RE.test(haystack)) {
    return { label: "Tennis", confidence: "high" };
  }
  if (TENNIS_NAME_RE.test(haystack)) {
    return { label: "Tennis", confidence: "high" };
  }

  // ── Soccer: market signatures, leagues, clubs.
  if (SOCCER_MARKETS.some((re) => re.test(haystack))) {
    return { label: "Soccer", confidence: "high" };
  }
  if (SOCCER_LEAGUE_RE.test(haystack)) {
    return { label: "Soccer", confidence: "high" };
  }
  if (SOCCER_CLUB_RE.test(haystack)) {
    return { label: "Soccer", confidence: "high" };
  }

  // ── Basketball
  if (BASKETBALL_MARKETS.some((re) => re.test(haystack))) {
    return { label: "Basketball", confidence: "high" };
  }
  if (NBA_RE.test(haystack)) {
    return { label: "Basketball", confidence: "high" };
  }

  // ── NHL
  if (NHL_MARKETS.some((re) => re.test(haystack))) {
    return { label: "Ice Hockey", confidence: "high" };
  }
  if (NHL_RE.test(haystack)) {
    return { label: "Ice Hockey", confidence: "high" };
  }

  // ── MLB
  if (MLB_MARKETS.some((re) => re.test(haystack))) {
    return { label: "Baseball", confidence: "high" };
  }
  if (MLB_RE.test(haystack)) {
    return { label: "Baseball", confidence: "high" };
  }

  // ── NFL
  if (NFL_MARKETS.some((re) => re.test(haystack))) {
    return { label: "American Football", confidence: "high" };
  }
  if (NFL_RE.test(haystack)) {
    return { label: "American Football", confidence: "high" };
  }

  // ── Combat sports / golf / cricket / horse racing — weaker signals
  if (BOXING_MMA_MARKETS.some((re) => re.test(haystack))) {
    return { label: "MMA", confidence: "medium" };
  }
  if (GOLF_MARKETS.some((re) => re.test(haystack))) {
    return { label: "Golf", confidence: "medium" };
  }
  if (CRICKET_MARKETS.some((re) => re.test(haystack))) {
    return { label: "Cricket", confidence: "medium" };
  }
  if (HORSE_RACING_MARKETS.some((re) => re.test(haystack))) {
    return { label: "Horse Racing", confidence: "low" };
  }

  return null;
}

/** Map odd stored values into the canonical SportLabel set. */
function normaliseStoredSport(s: string): SportLabel {
  const t = s.trim().toLowerCase();
  switch (t) {
    case "soccer":
    case "football":
    case "association football":
      return "Soccer";
    case "tennis":
      return "Tennis";
    case "basketball":
    case "nba":
      return "Basketball";
    case "american football":
    case "nfl":
    case "us football":
      return "American Football";
    case "baseball":
    case "mlb":
      return "Baseball";
    case "ice hockey":
    case "hockey":
    case "nhl":
      return "Ice Hockey";
    case "cricket":
      return "Cricket";
    case "golf":
      return "Golf";
    case "boxing":
      return "Boxing";
    case "mma":
    case "ufc":
      return "MMA";
    case "horse racing":
    case "horses":
    case "racing":
      return "Horse Racing";
    case "rugby":
    case "rugby union":
    case "rugby league":
      return "Rugby";
    case "darts":
      return "Darts";
    case "snooker":
      return "Snooker";
    case "esports":
    case "e-sports":
      return "Esports";
    case "other":
      return "Other";
    default:
      // Capitalise unknown values rather than dropping them — at least the
      // user's custom label survives.
      return (s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()) as SportLabel;
  }
}
