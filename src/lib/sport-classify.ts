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

// NBA player surnames — current stars + role players with prop-bet
// volume + recent legends. Player-prop bets often skip the team
// ("LeBron over 25.5 points") so name detection drives classification.
//
// Deliberately omitted: bare ambiguous surnames that collide with
// common English ("ball", "green", "white", "brown", "young", "smart",
// "george", "thomas", "fox", "miller", "powell", "turner", "porter").
// Those are matched only via "<first> <last>" full-name forms below.
const NBA_PLAYERS: string[] = [
  // Top stars (high prop volume)
  "lebron", "lebron james", "stephen curry", "steph curry", "durant",
  "kevin durant", "giannis", "antetokounmpo", "doncic", "luka doncic",
  "dončić", "tatum", "jayson tatum", "jokic", "nikola jokic", "jokić",
  "embiid", "joel embiid", "shai", "sga", "gilgeous-alexander",
  "anthony edwards", "wembanyama", "wemby", "victor wembanyama",
  // Established stars
  "harden", "james harden", "lillard", "damian lillard", "kyrie irving",
  "russell westbrook", "jimmy butler", "kawhi", "kawhi leonard",
  "paul george", "anthony davis", "ja morant", "devin booker",
  "donovan mitchell", "darius garland", "haliburton", "tyrese haliburton",
  "siakam", "pascal siakam", "demar derozan",
  // Other current rotation players
  "lavine", "zach lavine", "kuminga", "andrew wiggins", "draymond green",
  "klay thompson", "jordan poole", "scottie barnes", "fred vanvleet",
  "porzingis", "kristaps porzingis", "jaylen brown", "derrick white",
  "jrue holiday", "michael porter jr", "mpj", "kcp", "caldwell-pope",
  "aaron gordon", "jamal murray", "brunson", "jalen brunson",
  "julius randle", "hartenstein", "og anunoby", "rj barrett",
  "brandon ingram", "zion", "zion williamson", "cj mccollum",
  "valanciunas", "lamelo ball", "lonzo ball", "brandon miller",
  "mikal bridges", "miles bridges", "nic claxton", "cam thomas",
  "dennis schroder", "dennis schröder", "trae young", "dejounte murray",
  "capela", "okongwu", "franz wagner", "banchero", "paolo banchero",
  "fultz", "markelle fultz", "jonathan isaac", "norman powell",
  "ivica zubac", "alperen sengun", "jabari smith", "amen thompson",
  "ausar thompson", "mathurin", "bennedict mathurin", "myles turner",
  "aaron nesmith", "nembhard", "marcus smart", "coby white",
  "nikola vucevic", "patrick williams", "buzelis", "cade cunningham",
  "jaden ivey", "jalen duren", "james wiseman", "malik monk",
  "deaaron fox", "de'aaron fox", "domantas sabonis", "kevin huerter",
  "harrison barnes", "kispert",
  // Big legends still bet on history props
  "kobe bryant", "shaq", "shaquille", "michael jordan",
];

// NFL teams. "Giants", "Cardinals", "Jets", "Panthers" all collide
// with MLB / NHL nicknames, so those four are matched only via
// disambiguated forms (city + nickname). Bare nicknames stay out.
const NFL_TEAMS: string[] = [
  "patriots", "bills", "dolphins", "ravens", "bengals", "browns",
  "steelers", "texans", "colts", "jaguars", "titans", "broncos", "chiefs",
  "raiders", "chargers", "cowboys", "eagles", "commanders",
  "bears", "lions", "packers", "vikings", "falcons", "saints",
  "buccaneers", "rams", "49ers", "seahawks",
  // Disambiguated nicknames
  "new york giants", "ny giants", "n.y. giants",
  "arizona cardinals", "az cardinals",
  "new york jets", "ny jets", "n.y. jets",
  "carolina panthers",
];

// MLB teams. Same disambiguation for "Giants", "Cardinals", "Rangers"
// (all collide with NFL or NHL). Bare nicknames stay out; we match the
// city-qualified forms instead.
const MLB_TEAMS: string[] = [
  "yankees", "red sox", "blue jays", "rays", "orioles", "white sox",
  "guardians", "tigers", "twins", "royals", "astros", "mariners",
  "angels", "athletics", "braves", "phillies", "mets", "marlins",
  "nationals", "cubs", "brewers", "reds", "pirates", "dodgers",
  "padres", "diamondbacks", "d-backs", "dbacks", "rockies",
  // Disambiguated nicknames
  "san francisco giants", "sf giants",
  "st louis cardinals", "st. louis cardinals", "stl cardinals",
  "texas rangers", "tx rangers",
];

// MLB player names — current stars (hitters + starting pitchers) with
// the most prop-bet volume. Bare surnames are dropped where they
// collide with common English ("judge", "trout", "cole", "sale") or
// other sports rosters; those are matched via full "first last" form
// only. Lowercase, word-boundary matched.
const MLB_PLAYERS: string[] = [
  // Top hitters (high prop volume)
  "aaron judge", "ohtani", "shohei ohtani", "mookie betts", "betts",
  "juan soto", "soto", "ronald acuna", "ronald acuña", "acuna", "acuña",
  "bryce harper", "vlad guerrero", "guerrero jr", "vladimir guerrero",
  "fernando tatis", "tatis jr", "yordan alvarez", "yordan",
  "jose ramirez", "josé ramírez", "rafael devers", "devers",
  "bobby witt", "witt jr", "gunnar henderson", "corbin carroll",
  "adley rutschman", "rutschman", "julio rodriguez", "julio rodríguez",
  "kyle tucker", "freddie freeman", "pete alonso", "alonso",
  "manny machado", "machado", "trea turner", "marcus semien", "semien",
  "corey seager", "seager", "francisco lindor", "lindor",
  "paul goldschmidt", "goldschmidt", "cody bellinger", "bellinger",
  "mike trout", "jose altuve", "altuve", "alex bregman", "bregman",
  "matt olson", "austin riley", "ozzie albies", "albies",
  "kyle schwarber", "schwarber", "max kepler",
  "mccutchen", "andrew mccutchen", "j.t. realmuto", "realmuto",
  "ketel marte", "starling marte", "giancarlo stanton", "stanton",
  "jake cronenworth", "alec bohm", "nick castellanos", "castellanos",
  "willy adames", "matt chapman", "luis arraez", "arraez",
  "jarren duran", "anthony santander", "adolis garcia", "adolis garcía",
  // Top starting pitchers
  "gerrit cole", "spencer strider", "strider", "zack wheeler", "wheeler",
  "corbin burnes", "burnes", "yoshinobu yamamoto", "yamamoto",
  "logan webb", "tarik skubal", "skubal", "paul skenes", "skenes",
  "blake snell", "snell", "justin verlander", "verlander",
  "max scherzer", "scherzer", "clayton kershaw", "kershaw",
  "sandy alcantara", "alcantara", "tyler glasnow", "glasnow",
  "garrett crochet", "crochet", "cole ragans", "ragans",
  "pablo lopez", "pablo lópez", "hunter greene", "george kirby",
  "logan gilbert", "bobby miller", "bryan woo",
  "grayson rodriguez", "chris sale", "kevin gausman", "gausman",
  "zach eflin", "eflin", "luis castillo", "framber valdez", "framber",
  "kodai senga", "senga", "shota imanaga", "imanaga",
  "freddy peralta", "michael king",
  "ranger suarez", "ranger suárez", "aaron nola", "nola",
  // Recently retired / legends still bet on history props
  "albert pujols", "pujols", "miguel cabrera",
];

// ─── Horse racing dictionaries ──────────────────────────────────────────

// Famous race names — uniquely horse racing. Multi-word forms only;
// no bare "Derby" or "Cup" because they collide with everything.
const HORSE_RACES: string[] = [
  // UK + IRE flat
  "epsom derby", "the derby", "epsom oaks", "the oaks", "2000 guineas",
  "1000 guineas", "st leger", "st. leger", "king george vi", "king george",
  "diamond jubilee stakes", "queen anne stakes", "king's stand",
  "prince of wales's stakes", "prince of wales stakes", "ascot gold cup",
  "gold cup", "queen elizabeth ii stakes", "champion stakes", "july cup",
  "nunthorpe stakes", "international stakes", "yorkshire oaks", "ebor",
  "ebor handicap", "sussex stakes", "goodwood cup", "stewards' cup",
  "irish derby", "irish oaks", "irish 2000 guineas", "irish 1000 guineas",
  "irish champion stakes",
  // UK + IRE jumps
  "cheltenham gold cup", "champion hurdle", "queen mother champion chase",
  "stayers' hurdle", "stayers hurdle", "ryanair chase", "supreme novices' hurdle",
  "supreme novices hurdle", "arkle challenge trophy", "arkle chase",
  "albert bartlett", "triumph hurdle", "mares' hurdle", "mares hurdle",
  "grand national", "aintree grand national", "topham chase", "foxhunters' chase",
  "betfair chase", "king george chase", "tingle creek", "betway bowl",
  "irish gold cup", "leopardstown chase",
  // US triple crown + majors
  "kentucky derby", "preakness stakes", "belmont stakes", "the preakness",
  "the belmont", "breeders' cup", "breeders cup", "breeders' cup classic",
  "breeders cup classic", "breeders' cup turf", "breeders' cup mile",
  "breeders' cup sprint", "travers stakes", "pegasus world cup",
  "santa anita derby", "wood memorial", "florida derby", "arkansas derby",
  "dubai world cup", "saudi cup",
  // France / Europe
  "prix de l'arc de triomphe", "arc de triomphe", "qatar prix de l'arc",
  "prix du jockey club", "french derby", "prix de diane", "french oaks",
  "grand prix de paris",
  // Australia
  "melbourne cup", "cox plate", "caulfield cup", "the everest",
  "golden slipper", "australian derby",
  // Japan / HK
  "japan cup", "tenno sho", "hong kong cup", "hong kong vase",
  "dubai sheema classic",
];

// Famous racecourses / tracks. Bare "Cheltenham" is intentionally
// omitted — collides with Cheltenham Town FC in soccer. Cheltenham
// Festival bets are caught via the race names (Gold Cup, Champion
// Hurdle, Queen Mother, Stayers' Hurdle, Mares' Hurdle) instead.
const HORSE_TRACKS: string[] = [
  // UK
  "ascot", "newmarket", "aintree", "epsom", "goodwood",
  "york racecourse", "doncaster racecourse", "haydock park", "haydock",
  "kempton park", "kempton", "sandown park", "sandown", "newbury",
  "lingfield", "wolverhampton", "chepstow", "chester racecourse",
  "ffos las", "ludlow", "uttoxeter", "warwick racecourse",
  "wetherby", "carlisle racecourse", "catterick", "ayr racecourse",
  "kelso racecourse", "musselburgh", "hexham", "perth racecourse",
  "fakenham", "fontwell", "huntingdon racecourse", "leicester racecourse",
  "lingfield park", "market rasen", "newton abbot", "plumpton",
  "redcar racecourse", "ripon racecourse", "salisbury racecourse",
  "southwell", "stratford racecourse", "taunton racecourse",
  "thirsk racecourse", "towcester", "yarmouth racecourse",
  // IRE
  "the curragh", "leopardstown", "fairyhouse", "punchestown",
  "naas racecourse", "navan", "galway races", "killarney",
  "tipperary racecourse", "tramore", "ballinrobe", "bellewstown",
  "clonmel racecourse", "cork racecourse", "downpatrick",
  "down royal", "dundalk", "gowran park", "kilbeggan", "limerick racecourse",
  "listowel", "roscommon racecourse", "sligo racecourse", "thurles",
  "wexford racecourse",
  // US
  "churchill downs", "saratoga race course", "saratoga", "belmont park",
  "santa anita", "del mar racetrack", "del mar", "keeneland",
  "pimlico race course", "pimlico", "gulfstream park", "aqueduct",
  "oaklawn park", "fair grounds", "tampa bay downs",
  // World
  "longchamp", "chantilly", "deauville", "meydan", "sha tin", "happy valley",
  "tokyo racecourse", "kyoto racecourse", "flemington", "randwick",
  "rosehill", "moonee valley", "caulfield", "ellerslie",
];

// Recent star horses (flat + jumps, 2022-2026). Names tend to be
// distinctive multi-word constructs — low collision risk.
const HORSE_NAMES: string[] = [
  // Flat (UK / IRE / FR)
  "city of troy", "auguste rodin", "paddington", "baaeed", "frankel",
  "stradivarius", "enable", "kyprios", "luxembourg", "westover",
  "vadeni", "alpinista", "tuesday", "savethelastdance",
  "inspiral", "nashwa", "soul sister", "tahiyra", "shaquille",
  "rebel's romance", "rebels romance", "mostahdaf", "hukum",
  "warm heart", "porta fortuna", "lake forest", "fallen angel",
  // Jumps
  "constitution hill", "state man", "energumene", "galopin des champs",
  "honeysuckle", "shishkin", "el fabiolo", "allaho", "marine nationale",
  "mighty potter", "facile vega", "ballyburn", "fact to file",
  "il etait temps", "willmount", "monkfish", "appreciate it",
  "captain guinness", "envoi allen", "klassical dream", "rachael blackmore",
  // US triple-crown era
  "mystik dan", "mage", "rich strike", "country house", "authentic",
  "medina spirit", "justify", "american pharoah", "country grammer",
  // Australia
  "winx", "verry elleegant", "anamoe", "nature strip", "without a fight",
];

// Top jockeys (flat + jumps + US).
const JOCKEYS: string[] = [
  // UK flat
  "frankie dettori", "dettori", "ryan moore", "william buick", "buick",
  "oisin murphy", "oisín murphy", "rossa ryan", "tom marquand", "marquand",
  "hollie doyle", "jim crowley", "kieran shoemark", "shoemark",
  "james doyle", "danny tudhope", "tudhope", "robert havlin",
  "silvestre de sousa", "andrea atzeni", "atzeni", "rab havlin",
  // UK / IRE jumps
  "rachael blackmore", "blackmore", "paul townend", "townend",
  "jack kennedy", "davy russell", "sean bowen", "harry skelton",
  "nico de boinville", "de boinville", "harry cobden", "cobden",
  "brian hughes", "danny mcmenamin", "sam twiston-davies",
  "twiston-davies", "freddie gingell",
  // US
  "irad ortiz", "irad ortiz jr", "joel rosario", "rosario", "flavien prat",
  "prat", "tyler gaffalione", "gaffalione", "john velazquez", "velazquez",
  "javier castellano", "castellano", "luis saez", "luis sáez",
  "florent geroux", "geroux", "manny franco", "manny franco",
];

// Top trainers.
const TRAINERS: string[] = [
  // UK flat
  "john gosden", "gosden", "charlie appleby", "appleby", "william haggas",
  "haggas", "saeed bin suroor", "andrew balding", "balding", "roger varian",
  "varian", "richard hannon", "ralph beckett", "beckett", "mark johnston",
  // IRE flat
  "aidan o'brien", "joseph o'brien", "donnacha o'brien", "ger lyons",
  "jessica harrington", "harrington", "dermot weld", "weld",
  // UK jumps
  "nicky henderson", "paul nicholls", "dan skelton", "venetia williams",
  "jonjo o'neill", "alan king", "fergal o'brien", "kim bailey",
  "harry fry", "olly murphy", "lucinda russell",
  // IRE jumps
  "willie mullins", "gordon elliott", "henry de bromhead", "de bromhead",
  "joseph o'brien", "noel meade", "mouse morris",
  // US
  "bob baffert", "baffert", "todd pletcher", "pletcher", "steve asmussen",
  "asmussen", "brad cox", "chad brown", "william mott", "shug mcgaughey",
  "kenny mcpeek", "mcpeek",
];

// NHL teams. "Rangers", "Jets", and "Panthers" collide with MLB / NFL —
// match only via city-qualified forms. Bare nicknames stay out.
const NHL_TEAMS: string[] = [
  "bruins", "islanders", "devils", "flyers", "penguins", "capitals",
  "lightning", "maple leafs", "canadiens", "senators", "red wings",
  "sabres", "blue jackets", "hurricanes", "blackhawks", "blues",
  "stars", "predators", "wild", "avalanche", "oilers", "flames",
  "canucks", "kraken", "ducks", "kings", "sharks", "golden knights",
  "coyotes", "utah hc",
  // Disambiguated nicknames
  "new york rangers", "ny rangers", "n.y. rangers",
  "winnipeg jets",
  "florida panthers",
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

// Basketball market signatures — tightly scoped to patterns that don't
// collide with NFL / NHL / MLB markets. Cross-sport language like "1st
// quarter", "spread X.5", or "playoffs" is intentionally NOT here — we
// rely on NBA team and player name matchers for those cases.
//
// What's in this list is exclusively basketball:
//   - Three-digit point totals (NBA games total 200-240; NFL totals
//     are 40-60, so a three-digit total can only be basketball)
//   - Player-prop stat words (rebounds, assists, threes, steals,
//     blocks-as-an-NBA-stat, PRA, double-double, triple-double)
//   - "NBA" explicitly
const BASKETBALL_MARKETS = [
  // Three-digit point totals — uniquely NBA
  /\bover\s+\d{3}(?:\.\d+)?\s*points?\b/i,
  /\bunder\s+\d{3}(?:\.\d+)?\s*points?\b/i,
  /\bo\s*\d{3}(?:\.\d+)?\b/i, // "o 224.5"
  /\bu\s*\d{3}(?:\.\d+)?\b/i,
  // Player props — NBA-specific stat words
  /\b\d+(?:\.\d+)?\s*rebounds?\b/i,
  /\b\d+(?:\.\d+)?\s*assists?\b/i,
  /\b\d+(?:\.\d+)?\s*(?:3-?pointers?|threes?|3pm|3ptm)\b/i,
  /\b\d+(?:\.\d+)?\s*steals?\b/i,
  /\bover\s+\d+(?:\.\d+)?\s*(?:rebounds?|assists?|threes?|3-?pointers?|steals?)\b/i,
  /\bunder\s+\d+(?:\.\d+)?\s*(?:rebounds?|assists?|threes?|3-?pointers?|steals?)\b/i,
  // Combined-stat props (pra = points+rebounds+assists)
  /\b(?:pra|p\+r\+a|points\s*\+?\s*rebounds\s*\+?\s*assists)\b/i,
  /\b\d+(?:\.\d+)?\s*(?:pra|p\+r\+a)\b/i,
  // Double-double / triple-double — uniquely NBA
  /\b(?:double|triple)\s*-?\s*double\b/i,
  // Explicit NBA mention
  /\bnba\b/i,
];

const NHL_MARKETS = [
  /\bpuck\s*line\b/i,
  /\bover\s+\d+(?:\.\d+)?\s*goals?\s*-\s*hockey\b/i,
];

// MLB markets — scoped to baseball-exclusive language. Includes the
// big-volume player-prop terminology (Ks, total bases, hits, RBIs)
// plus inning-specific markets (NRFI/YRFI, F5) and the run line.
//
// Deliberately omitted: "runs" alone (too ambiguous — could be cricket
// or generic), "hits" alone (rely on "hits X.5" form), and "RBIs" alone
// (covered by the numeric form).
const MLB_MARKETS = [
  // Spread / total / line markers
  /\brun\s*line\b/i,
  /\brl\s*[+\-−]\d+(?:\.\d+)?\b/i,
  // Inning-window markets — extremely common
  /\bnrfi\b/i, // no runs first inning
  /\byrfi\b/i, // yes runs first inning
  /\bf5\s*(?:spread|total|ml|moneyline|line)?\b/i, // first 5 innings
  /\b(?:1st|first|3rd|third|5th|fifth|7th|seventh|9th|ninth)\s*inning\b/i,
  /\b(?:first|1st)\s*5\s*innings?\b/i,
  // Anytime home run / multi-HR
  /\banytime\s*(?:home\s*run|hr)\b/i,
  /\bto\s*hit\s*(?:a\s*)?(?:home\s*run|hr)\b/i,
  /\b(?:2\+|two\s*\+?|multi)\s*(?:home\s*runs?|hrs?)\b/i,
  /\b(?:home\s*runs?|hr)\s*o(?:ver)?\s*\d+(?:\.\d+)?\b/i,
  // Pitcher props
  /\b\d+(?:\.\d+)?\s*(?:strikeouts?|ks|k's|punch\s*outs?)\b/i,
  /\bover\s+\d+(?:\.\d+)?\s*(?:strikeouts?|ks|k's)\b/i,
  /\bunder\s+\d+(?:\.\d+)?\s*(?:strikeouts?|ks|k's)\b/i,
  /\bpitcher\s*(?:strikeouts?|ks|outs?|walks?)\b/i,
  /\b\d+(?:\.\d+)?\s*earned\s*runs?\b/i,
  /\b\d+(?:\.\d+)?\s*innings\s*pitched\b/i,
  // Hitter props
  /\b\d+(?:\.\d+)?\s*total\s*bases\b/i,
  /\b\d+(?:\.\d+)?\s*hits?\s*\+?\s*runs?\s*\+?\s*rbis?\b/i,
  /\bover\s+\d+(?:\.\d+)?\s*hits?\b/i,
  /\bunder\s+\d+(?:\.\d+)?\s*hits?\b/i,
  /\b\d+(?:\.\d+)?\s*rbis?\b/i,
  /\b\d+(?:\.\d+)?\s*doubles?\b/i,
  /\b\d+(?:\.\d+)?\s*triples?\b/i,
  /\bgrand\s*slam\b/i,
  // Game-state / structure markers
  /\bextra\s*innings?\b/i,
  /\bwalk[\s-]?off\b/i,
  // Explicit league mention
  /\bmlb\b/i,
  /\bworld\s*series\b/i,
  /\balds?\b/i, // ALDS / NLDS
  /\bnlds\b/i,
  /\balcs\b/i,
  /\bnlcs\b/i,
];

const NFL_MARKETS = [
  /\b(?:first|1st)\s*touchdown\b/i,
  /\bspread\s*[+\-−]\d+(?:\.\d+)?\b/i,
];

// Horse racing markets — the vocabulary is highly distinctive once you
// strip out the generic "place" / "win" words that collide with every
// other sport. We rely on horse-racing-exclusive language: each-way,
// non-runner, Rule 4, BOG, starting price, forecast/tricast, ante post,
// going state (good/soft/heavy/firm), distance markers (furlongs),
// race-class language (handicap mark, maiden, novice, group/grade).
const HORSE_RACING_MARKETS = [
  // Stake structures unique to horse racing
  /\beach[\s-]?way\b/i,
  /\bew\s*(?:only|return)?\b/i, // "EW" as standalone — limited risk because it's word-boundary matched
  /\bplace\s*only\b/i,
  /\bto\s*place\b/i,
  /\bwin\s*\+?\s*place\b/i,
  /\bforecast\b/i,
  /\btricast\b/i,
  /\breverse\s*forecast\b/i,
  /\bstraight\s*forecast\b/i,
  /\bexacta\b/i,
  /\bquinella\b/i,
  /\btrifecta\b/i,
  /\bsuperfecta\b/i,
  /\bpick\s*\d\b/i, // Pick 3 / Pick 4 / Pick 6 — US tote
  // Pricing language unique to horse racing
  /\bnon[\s-]?runner\b/i,
  /\bnr\s+(?:rule|deduction|refund|applied)\b/i,
  /\brule\s*4\b/i,
  /\br4\s*(?:deduction)?\b/i,
  /\bbog\b/i,
  /\bbest\s*odds\s*guaranteed\b/i,
  /\bstarting\s*price\b/i,
  /\bsp\s*(?:only|favourite)\b/i,
  /\bante[\s-]?post\b/i,
  // Race-state / track conditions
  /\bgoing\s*[:=]?\s*(?:good|soft|heavy|firm|fast|slow|yielding|standard)\b/i,
  /\b(?:soft|heavy|good\s*to\s*soft|good\s*to\s*firm|firm)\s*going\b/i,
  // Race class / structure (UK + IRE NH and Flat)
  /\bmaiden\s*(?:race|hurdle|chase|stakes?)\b/i,
  /\bnovice\s*(?:hurdle|chase|stakes?)\b/i,
  /\bnovices?'?\s*(?:hurdle|chase)\b/i,
  /\bhandicap\s*(?:hurdle|chase|stakes?|mark|race)\b/i,
  /\bclaiming\s*race\b/i,
  /\bclaimer\b/i,
  /\bgroup\s*[1-3]\b/i,
  /\bgrade\s*[1-3]\b/i,
  /\blisted\s*race\b/i,
  /\bnational\s*hunt\b/i,
  /\bflat\s*race\b/i,
  /\b(?:hurdle|chase|bumper)\s*race\b/i,
  /\bnh\s*flat\b/i,
  // Distance (furlongs notation — uniquely horse racing in betting text)
  /\b\d+f\s*(?:\d+y)?\b/i, // "5f", "1m4f", "1m4f 207y"
  /\b\d+m\d+f\b/i, // "1m4f"
  /\b\d+\s*furlongs?\b/i,
  // Pool-betting language
  /\btote\s*(?:win|place|exacta|trifecta)\b/i,
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
const NBA_PLAYER_RE = nameMatcher(NBA_PLAYERS);
const NFL_RE = nameMatcher(NFL_TEAMS);
const MLB_RE = nameMatcher(MLB_TEAMS);
const MLB_PLAYER_RE = nameMatcher(MLB_PLAYERS);
const NHL_RE = nameMatcher(NHL_TEAMS);
const HORSE_RACES_RE = nameMatcher(HORSE_RACES);
const HORSE_TRACKS_RE = nameMatcher(HORSE_TRACKS);
const HORSE_NAMES_RE = nameMatcher(HORSE_NAMES);
const JOCKEYS_RE = nameMatcher(JOCKEYS);
const TRAINERS_RE = nameMatcher(TRAINERS);

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

  // ── Basketball: market signatures, NBA teams, NBA player names.
  // Player names are important here because player-prop bets ("LeBron
  // over 25.5 points") often don't mention the team at all.
  if (BASKETBALL_MARKETS.some((re) => re.test(haystack))) {
    return { label: "Basketball", confidence: "high" };
  }
  if (NBA_RE.test(haystack)) {
    return { label: "Basketball", confidence: "high" };
  }
  if (NBA_PLAYER_RE.test(haystack)) {
    return { label: "Basketball", confidence: "high" };
  }

  // ── NHL
  if (NHL_MARKETS.some((re) => re.test(haystack))) {
    return { label: "Ice Hockey", confidence: "high" };
  }
  if (NHL_RE.test(haystack)) {
    return { label: "Ice Hockey", confidence: "high" };
  }

  // ── MLB. Player names matter a lot here — strikeout / total-base
  // props often skip the team name ("Skubal over 7.5 Ks").
  if (MLB_MARKETS.some((re) => re.test(haystack))) {
    return { label: "Baseball", confidence: "high" };
  }
  if (MLB_RE.test(haystack)) {
    return { label: "Baseball", confidence: "high" };
  }
  if (MLB_PLAYER_RE.test(haystack)) {
    return { label: "Baseball", confidence: "high" };
  }

  // ── NFL
  if (NFL_MARKETS.some((re) => re.test(haystack))) {
    return { label: "American Football", confidence: "high" };
  }
  if (NFL_RE.test(haystack)) {
    return { label: "American Football", confidence: "high" };
  }

  // ── Horse Racing. High-confidence when ANY of the following hit:
  // a famous race name, a famous track, a recent star horse, a top
  // jockey or trainer, or the horse-racing-specific market vocabulary
  // (each-way, NR, Rule 4, BOG, forecast, tricast, distance in
  // furlongs, going state, race-class language).
  if (HORSE_RACES_RE.test(haystack)) {
    return { label: "Horse Racing", confidence: "high" };
  }
  if (HORSE_TRACKS_RE.test(haystack)) {
    return { label: "Horse Racing", confidence: "high" };
  }
  if (HORSE_NAMES_RE.test(haystack)) {
    return { label: "Horse Racing", confidence: "high" };
  }
  if (JOCKEYS_RE.test(haystack)) {
    return { label: "Horse Racing", confidence: "high" };
  }
  if (TRAINERS_RE.test(haystack)) {
    return { label: "Horse Racing", confidence: "high" };
  }
  if (HORSE_RACING_MARKETS.some((re) => re.test(haystack))) {
    return { label: "Horse Racing", confidence: "high" };
  }

  // ── Combat sports / golf / cricket — weaker signals
  if (BOXING_MMA_MARKETS.some((re) => re.test(haystack))) {
    return { label: "MMA", confidence: "medium" };
  }
  if (GOLF_MARKETS.some((re) => re.test(haystack))) {
    return { label: "Golf", confidence: "medium" };
  }
  if (CRICKET_MARKETS.some((re) => re.test(haystack))) {
    return { label: "Cricket", confidence: "medium" };
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
