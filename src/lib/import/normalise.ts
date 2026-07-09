// Applies a ColumnMap to a ParsedFile to produce ImportedBet[] plus a list of
// per-row issues. Deterministic, no LLM. Designed so the same input always
// produces the same output.

import type {
  ColumnMap,
  FieldKey,
  ImportedBet,
  MarketGuess,
  NormalisationIssue,
  NormalisationResult,
  ParsedFile,
  Status,
} from "./types";

function findCol(map: ColumnMap, key: FieldKey): number | null {
  for (const k of Object.keys(map)) {
    const idx = Number(k);
    if (map[idx] === key) return idx;
  }
  return null;
}

function val(row: string[], idx: number | null): string {
  if (idx == null) return "";
  return (row[idx] ?? "").trim();
}

// Date / time parsing -------------------------------------------------------

const DATE_PATTERNS: { rx: RegExp; build: (m: RegExpMatchArray) => string }[] = [
  // YYYY-MM-DD
  { rx: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, build: (m) => `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` },
  // YYYY/MM/DD
  { rx: /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, build: (m) => `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` },
  // DD/MM/YYYY (UK default — bettin.gs is European)
  { rx: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, build: (m) => `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` },
  // DD-MM-YYYY
  { rx: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, build: (m) => `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` },
  // YYYY-MM-DD HH:mm:ss (timestamp) — date part only
  { rx: /^(\d{4})-(\d{1,2})-(\d{1,2})[T ].*$/, build: (m) => `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` },
];

function parseDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  for (const p of DATE_PATTERNS) {
    const m = s.match(p.rx);
    if (m) return p.build(m);
  }
  // Last resort: Date constructor. Read the LOCAL calendar components,
  // not UTC. A date typed into a spreadsheet by a punter means the
  // wall-clock date on their calendar; extracting via getUTC* shifted
  // every fallback-parsed date back a day for users east of UTC (all
  // of Europe / UK / Asia in the summer). This bit spreadsheets whose
  // date cells came out of Excel with a time attached, e.g.
  //   "7/5/2026 12:00:00 AM"  (US Excel)
  //   "05/07/2026 00:00"      (UK Excel)
  //   "Sun Jul 05 2026"       (long date)
  // None of those match the regex-based patterns above, so they all
  // fall through here.
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

function parseTime(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const h = m[1].padStart(2, "0");
  const min = m[2];
  const sec = (m[3] ?? "00").padStart(2, "0");
  if (h === "00" && min === "00" && sec === "00") return null; // bettin.gs "unknown" sentinel
  return `${h}:${min}:${sec}`;
}

// Numbers -------------------------------------------------------------------

function parseNum(raw: string): number | null {
  const s = raw.trim().replace(/[$£€,]/g, "");
  if (!s) return null;
  const n = parseFloat(s);
  return isFinite(n) ? n : null;
}

function parseOdds(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  // Decimal (1.85)
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = parseFloat(s);
    if (n >= 1.01 && n <= 1000) return n;
  }
  // Fractional (5/6, 11/4)
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) {
    const a = parseInt(frac[1], 10);
    const b = parseInt(frac[2], 10);
    if (b > 0) return a / b + 1;
  }
  // American (+150, -120)
  const am = s.match(/^([+-]?)(\d+)$/);
  if (am) {
    const sign = am[1] === "-" ? -1 : 1;
    const n = parseInt(am[2], 10);
    if (sign > 0) return n / 100 + 1;
    return 100 / n + 1;
  }
  return null;
}

// Status --------------------------------------------------------------------

function parseStatus(raw: string): Status | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (["won", "win", "w", "winner"].includes(s)) return "won";
  if (["lost", "loss", "l", "loser"].includes(s)) return "lost";
  if (["push", "p", "draw", "void where push"].includes(s)) return "push";
  if (["void", "v", "cancelled", "canceled"].includes(s)) return "void";
  if (["pending", "open", "live"].includes(s)) return "pending";
  // bettin.gs Asian-handicap split outcomes — bet split into two halves,
  // one won/lost and the other pushed. P/L column already reflects the net.
  if (["half-won", "half won", "half_won"].includes(s)) return "half_won";
  if (["half-lost", "half lost", "half_lost"].includes(s)) return "half_lost";
  return null;
}

// Event split ---------------------------------------------------------------

function splitEvent(raw: string): { home?: string; away?: string; event: string } {
  const s = raw.trim();
  // Common separators in bettin.gs / generic bettors' tools.
  const seps = [" -v- ", " v ", " vs. ", " vs ", " @ ", " - "];
  for (const sep of seps) {
    const idx = s.indexOf(sep);
    if (idx > 0 && idx < s.length - sep.length) {
      return {
        home: s.slice(0, idx).trim(),
        away: s.slice(idx + sep.length).trim(),
        event: s,
      };
    }
  }
  return { event: s };
}

// Market heuristics ---------------------------------------------------------

export function guessMarket(selection: string): MarketGuess {
  const s = selection.toLowerCase();

  // Player props — check first because "Salah to score" otherwise matches AH
  // with the embedded "to" word.
  if (/\b(anytime|first|last)\s+(goal)?scorer\b/.test(s)) return "scorer";
  if (/\bto score\b/.test(s) && !/\bteams\b/.test(s)) return "scorer";
  if (/\bscorecast\b/.test(s) || /\bwincast\b/.test(s)) return "scorer";

  // Cards
  if (/\bcard(s|ed)?\b/.test(s) && !/scorecard/.test(s)) return "cards";
  if (/\b(yellow|red)\s+card\b/.test(s)) return "cards";
  if (/\bsent\s+off\b/.test(s)) return "cards";

  // Half-time / period markets
  if (/\bht\/ft\b/.test(s) || /\bhalf.?time.*full.?time\b/.test(s)) return "ht_ft";
  if (/\bht\b|\bhalf.?time\b|\bfirst half\b|\b1st half\b/.test(s)) return "half_time";

  // Clean sheet / win to nil
  if (/\bto nil\b/.test(s) || /\bclean sheet\b/.test(s)) return "clean_sheet";

  // Winning margin
  if (/\bwinning margin\b/.test(s) || /\bby \d+\s+goal/.test(s)) return "winning_margin";

  // Exact / correct score
  if (/\bcorrect score\b/.test(s) || /\bexact score\b/.test(s)) return "exact_score";

  // Tournament markets
  if (/\bto (qualify|advance|win the (group|tournament|cup|league|trophy))\b/.test(s))
    return "tournament";
  if (/\boutright\b/.test(s)) return "tournament";

  // BTTS / DNB — explicit keywords
  if (/\bbtts\b/.test(s) || /both teams to score/.test(s)) return "btts";
  if (/\bdnb\b/.test(s) || /draw no bet/.test(s)) return "dnb";

  // Corners (specific)
  if (/\bcorners?\b/.test(s)) return "corners";

  // Shots (specific)
  if (/\bsot\b/.test(s) || /\bshots? on target\b/.test(s) || /\bshots?\b/.test(s)) {
    if (/\b(over|under)\b/.test(s) || /[ou]\s+\d/.test(s)) return "shots";
  }

  // Team totals (e.g. "Liverpool Over 1.5 TT")
  if (/\b(over|under)\s+\d/.test(s) && (/\btt\b/.test(s) || /\bteam (goals|total)\b/.test(s)))
    return "totals_team";

  // Generic over/under
  if (/\b(over|under)\s+\d/.test(s)) return "ou";

  // Asian handicap (e.g. "Liverpool -1", "Wolves +0.5 AH")
  if (
    /[-+]\d+(\.\d+)?\s*(ah|asian\s+handicap)?$/i.test(s.trim()) ||
    /\bah\b/.test(s) ||
    /asian handicap/.test(s)
  )
    return "ah";

  // 1X2 / moneyline — last because it's the broadest
  if (/\bto win\b/.test(s)) return "1X2";
  if (/\bml\b|\bmoneyline\b/.test(s)) return "1X2";
  if (/\bdraw\b/.test(s)) return "1X2";

  return "other";
}

// Source UUIDs --------------------------------------------------------------

let _uuidCounter = 0;
function uid(seed: string): string {
  // Deterministic-ish: hash the seed text + a monotonic counter.
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  _uuidCounter++;
  return (
    (h >>> 0).toString(16).padStart(8, "0") +
    "-" +
    _uuidCounter.toString(16).padStart(6, "0")
  );
}

// Main entry ----------------------------------------------------------------

export interface NormaliseOptions {
  sourceId: string; // e.g. "bettings" | "manual"
  defaultSport?: string;
  defaultStatus?: Status;
}

export function normalise(
  file: ParsedFile,
  map: ColumnMap,
  opts: NormaliseOptions,
): NormalisationResult {
  _uuidCounter = 0;
  const bets: ImportedBet[] = [];
  const issues: NormalisationIssue[] = [];
  const importedAt = new Date().toISOString();

  // Resolve column indices once.
  const idx = {
    date: findCol(map, "date"),
    time: findCol(map, "time"),
    kickoff: findCol(map, "kickoff"),
    event: findCol(map, "event"),
    home: findCol(map, "home"),
    away: findCol(map, "away"),
    sport: findCol(map, "sport"),
    league: findCol(map, "league"),
    market: findCol(map, "market"),
    selection: findCol(map, "selection"),
    odds: findCol(map, "odds"),
    stake: findCol(map, "stake"),
    status: findCol(map, "status"),
    result: findCol(map, "result"),
    returns: findCol(map, "returns"),
    // bookmaker tracking removed; field intentionally not resolved
    tipster: findCol(map, "tipster"),
    tags: findCol(map, "tags"),
    notes: findCol(map, "notes"),
  };

  for (let r = 0; r < file.rows.length; r++) {
    const row = file.rows[r];
    const raw: Record<string, string> = {};
    file.headers.forEach((h, i) => (raw[h] = row[i] ?? ""));

    // Kickoff: prefer combined, else date + optional time.
    let kickoff: string | null = null;
    if (idx.kickoff != null) {
      kickoff = parseDate(val(row, idx.kickoff));
      const timePart = val(row, idx.kickoff).match(/\d{1,2}:\d{2}(:\d{2})?/);
      if (kickoff && timePart) kickoff = `${kickoff}T${timePart[0].length === 5 ? timePart[0] + ":00" : timePart[0]}Z`;
    } else {
      const d = idx.date != null ? parseDate(val(row, idx.date)) : null;
      const t = idx.time != null ? parseTime(val(row, idx.time)) : null;
      if (d && t) kickoff = `${d}T${t}Z`;
      else if (d) kickoff = d;
    }
    if (!kickoff) {
      issues.push({
        rowIndex: r,
        field: idx.date != null ? "date" : "kickoff",
        message: "Could not parse kickoff date.",
        severity: "error",
      });
      continue;
    }

    // Event / teams.
    let event = "";
    let home: string | undefined;
    let away: string | undefined;
    if (idx.home != null && idx.away != null) {
      home = val(row, idx.home) || undefined;
      away = val(row, idx.away) || undefined;
      event = home && away ? `${home} v ${away}` : home || away || "";
    } else if (idx.event != null) {
      const evRaw = val(row, idx.event);
      const split = splitEvent(evRaw);
      home = split.home;
      away = split.away;
      event = split.event;
    }
    if (!event) {
      issues.push({ rowIndex: r, field: "event", message: "Missing event/fixture.", severity: "error" });
      continue;
    }

    const selection = val(row, idx.selection);
    if (!selection) {
      issues.push({ rowIndex: r, field: "selection", message: "Missing selection.", severity: "error" });
      continue;
    }

    const odds = parseOdds(val(row, idx.odds));
    if (odds == null) {
      issues.push({ rowIndex: r, field: "odds", message: `Could not parse odds: "${val(row, idx.odds)}".`, severity: "error" });
      continue;
    }

    const stake = parseNum(val(row, idx.stake));
    if (stake == null || stake <= 0) {
      issues.push({ rowIndex: r, field: "stake", message: `Invalid stake: "${val(row, idx.stake)}".`, severity: "error" });
      continue;
    }

    const status = idx.status != null ? parseStatus(val(row, idx.status)) : opts.defaultStatus ?? "pending";
    if (!status) {
      issues.push({ rowIndex: r, field: "status", message: `Unrecognised status: "${val(row, idx.status)}".`, severity: "warning" });
    }

    // P/L: prefer "result" column (net P/L). Otherwise derive from returns - stake.
    // Otherwise derive from status + odds + stake.
    let pl = 0;
    const finalStatus: Status = status ?? "pending";
    if (idx.result != null) {
      const p = parseNum(val(row, idx.result));
      if (p == null) {
        issues.push({ rowIndex: r, field: "result", message: `Could not parse P/L: "${val(row, idx.result)}".`, severity: "warning" });
      } else {
        pl = p;
      }
    } else if (idx.returns != null) {
      const ret = parseNum(val(row, idx.returns));
      if (ret == null) {
        issues.push({ rowIndex: r, field: "returns", message: `Could not parse returns: "${val(row, idx.returns)}".`, severity: "warning" });
      } else {
        pl = ret - stake;
      }
    } else {
      // Derive
      if (finalStatus === "won") pl = stake * (odds - 1);
      else if (finalStatus === "lost") pl = -stake;
      else if (finalStatus === "half_won") pl = (stake * (odds - 1)) / 2;
      else if (finalStatus === "half_lost") pl = -stake / 2;
      else pl = 0;
    }

    const market = idx.market != null ? (val(row, idx.market) as MarketGuess) : guessMarket(selection);

    const sportRaw = idx.sport != null ? val(row, idx.sport) : "";
    const sport = sportRaw
      ? sportRaw.toLowerCase() === "football"
        ? "Soccer"
        : sportRaw
      : opts.defaultSport ?? "Soccer";

    const tipster = idx.tipster != null ? val(row, idx.tipster) || undefined : undefined;
    // bookmaker tracking removed
    const notes = idx.notes != null ? val(row, idx.notes) || undefined : undefined;
    const tags = idx.tags != null
      ? val(row, idx.tags).split(/[,;]/).map((t) => t.trim()).filter(Boolean)
      : undefined;
    const league = idx.league != null ? val(row, idx.league) || undefined : undefined;

    bets.push({
      id: uid(`${kickoff}|${event}|${selection}|${r}`),
      kickoff,
      sport,
      league,
      home,
      away,
      event,
      market,
      selection,
      odds: Math.round(odds * 1000) / 1000,
      stake: Math.round(stake * 100) / 100,
      tipster,
      tags,
      notes,
      status: finalStatus,
      pl: Math.round(pl * 100) / 100,
      source: `import:${opts.sourceId}`,
      importedAt,
      raw,
    });
  }

  return { bets, issues };
}
