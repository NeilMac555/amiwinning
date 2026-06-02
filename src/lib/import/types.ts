// Types for the import pipeline.
// Pipeline shape: file → ParsedFile → ColumnMap (preset or manual) → ImportedBet[] →
// validate → user reviews → commit to store.

export type Status =
  | "won"
  | "lost"
  | "push"
  | "void"
  | "pending"
  | "half_won"
  | "half_lost";

export type MarketGuess =
  | "1X2"
  | "ah"
  | "ou"
  | "btts"
  | "dnb"
  | "totals_team"
  | "shots"
  | "corners"
  | "scorer"
  | "cards"
  | "half_time"
  | "ht_ft"
  | "clean_sheet"
  | "winning_margin"
  | "exact_score"
  | "tournament"
  | "parlay"
  | "other";

export interface ImportedBet {
  id: string;
  /** Which book this bet belongs to. Set on create; never null after the
   *  initial backfill migration. Optional in the type only because legacy
   *  cached records pre-books didn't have it. */
  bookId?: string;
  kickoff: string; // ISO timestamp; falls back to date-only when time is unknown.
  sport: string;
  league?: string;
  home?: string;
  away?: string;
  event: string;
  market?: MarketGuess;
  selection: string;
  odds: number;
  stake: number;
  /** Pinnacle closing-line price on the same selection. v1 is manual entry;
   *  SteamWatch integration will auto-populate at kickoff. */
  closingOdds?: number;
  /** @deprecated bookmaker tracking removed. Kept for backward-compat with
   *  already-persisted localStorage data; never displayed. */
  bookmaker?: string;
  tipster?: string;
  tags?: string[];
  notes?: string;
  status: Status;
  pl: number;
  source: string; // e.g. "import:bettings" / "import:manual"
  importedAt: string;
  raw: Record<string, string>;
  /** Local-only durability flag. Set true when the bet was written
   *  locally but hasn't been confirmed in Supabase yet. Cleared by
   *  pushBet/pushBets on a successful upsert. The flush-pending worker
   *  in bet-sync retries any bets that still carry this flag.
   *  Never persisted to Supabase. */
  _pending?: boolean;
  /** Local-only "this bet has been deleted locally but the delete
   *  hasn't reached Supabase yet". The flush worker retries deletes
   *  too. Tombstone is kept until the remote delete succeeds, then
   *  the row is fully removed from the cache. */
  _pendingDelete?: boolean;
}

// Fields a column can be mapped to.
// "result" is the net P/L column (bettin.gs convention). "returns" is gross
// (stake + winnings) — we convert to P/L during normalisation.
export type FieldKey =
  | "skip"
  | "date"
  | "time"
  | "kickoff"
  | "event"
  | "home"
  | "away"
  | "sport"
  | "league"
  | "market"
  | "selection"
  | "odds"
  | "stake"
  | "status"
  | "result"
  | "returns"
  | "tipster"
  | "tags"
  | "notes";

export const FIELD_LABELS: Record<FieldKey, string> = {
  skip: "— skip —",
  date: "Date",
  time: "Time",
  kickoff: "Kickoff (date + time)",
  event: "Event / fixture",
  home: "Home team",
  away: "Away team",
  sport: "Sport",
  league: "League",
  market: "Market",
  selection: "Selection / pick",
  odds: "Odds",
  stake: "Stake",
  status: "Status (won/lost/push)",
  result: "P/L (net)",
  returns: "Returns (gross)",
  tipster: "Tipster",
  tags: "Tags",
  notes: "Notes",
};

// Maps column index in the source file to a field key.
export type ColumnMap = Record<number, FieldKey>;

export interface ParsedFile {
  headers: string[];
  rows: string[][];
  totalRows: number;
  sourceName: string; // original filename
}

export interface NormalisationIssue {
  rowIndex: number; // 0-based into ParsedFile.rows
  field: FieldKey | "row";
  message: string;
  severity: "error" | "warning";
}

export interface NormalisationResult {
  bets: ImportedBet[];
  issues: NormalisationIssue[];
}

export interface SourcePreset {
  id: string;
  name: string;
  // Returns true when the headers unambiguously match this source.
  detect: (headers: string[]) => boolean;
  // Default column map for this source. The user can still override before commit.
  columnMap: (headers: string[]) => ColumnMap;
}
