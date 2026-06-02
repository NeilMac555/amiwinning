// CSV export of the signed-in user's bets.
//
// Pulls fresh rows from Supabase (not the localStorage cache) so the
// download is guaranteed-current even if a write hasn't synced back yet.
// Falls back to the local cache when Supabase isn't reachable.

import { supabase } from "./supabase";
import { loadBets } from "./import/store";
import type { ImportedBet } from "./import/types";

// CSV escaping per RFC 4180 — wrap in double quotes if the field contains
// a comma, quote, or newline, and double up any inner quotes.
function csvCell(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// Columns in download order. Kept stable so users can diff exports
// over time without column drift breaking their spreadsheets.
const COLUMNS: Array<{ key: keyof ExportRow; header: string }> = [
  { key: "id", header: "id" },
  { key: "book", header: "book" },
  { key: "kickoff", header: "kickoff" },
  { key: "sport", header: "sport" },
  { key: "league", header: "league" },
  { key: "home", header: "home" },
  { key: "away", header: "away" },
  { key: "event", header: "event" },
  { key: "market", header: "market" },
  { key: "selection", header: "selection" },
  { key: "odds", header: "odds" },
  { key: "stake", header: "stake" },
  { key: "closing_odds", header: "closing_odds" },
  { key: "tipster", header: "tipster" },
  { key: "tags", header: "tags" },
  { key: "notes", header: "notes" },
  { key: "status", header: "status" },
  { key: "pl", header: "pl" },
  { key: "source", header: "source" },
  { key: "imported_at", header: "imported_at" },
];

interface ExportRow {
  id: string;
  book: string;
  kickoff: string;
  sport: string;
  league: string;
  home: string;
  away: string;
  event: string;
  market: string;
  selection: string;
  odds: number;
  stake: number;
  closing_odds: string;
  tipster: string;
  tags: string;
  notes: string;
  status: string;
  pl: number;
  source: string;
  imported_at: string;
}

interface BetWithBook extends ImportedBet {
  _bookName: string;
}

function betToRow(b: BetWithBook): ExportRow {
  return {
    id: b.id,
    book: b._bookName,
    kickoff: b.kickoff,
    sport: b.sport,
    league: b.league ?? "",
    home: b.home ?? "",
    away: b.away ?? "",
    event: b.event,
    market: b.market ?? "",
    selection: b.selection,
    odds: b.odds,
    stake: b.stake,
    closing_odds: b.closingOdds != null ? String(b.closingOdds) : "",
    tipster: b.tipster ?? "",
    tags: b.tags?.join("; ") ?? "",
    notes: b.notes ?? "",
    status: b.status,
    pl: b.pl,
    source: b.source,
    imported_at: b.importedAt,
  };
}

function buildCsv(rows: ExportRow[]): string {
  const header = COLUMNS.map((c) => c.header).join(",");
  const body = rows
    .map((r) => COLUMNS.map((c) => csvCell(r[c.key])).join(","))
    .join("\n");
  return `${header}\n${body}\n`;
}

interface RawBetRow {
  id: string;
  book_id: string | null;
  kickoff: string;
  sport: string;
  league: string | null;
  home: string | null;
  away: string | null;
  event: string;
  market: string | null;
  selection: string;
  odds: number | string;
  stake: number | string;
  closing_odds: number | string | null;
  tipster: string | null;
  tags: string[] | null;
  notes: string | null;
  status: string;
  pl: number | string;
  source: string;
  imported_at: string;
}

interface BookLookup {
  [bookId: string]: string;
}

/**
 * Fetch ALL of the signed-in user's bets across all books straight from
 * Supabase. Returns an array of ImportedBet plus the book name attached so
 * the CSV can include it. Paginated to dodge Supabase's 1k row cap.
 *
 * On Supabase unavailable, falls back to the local cache (which may be
 * stale but is better than nothing).
 */
async function fetchAllUserBets(): Promise<BetWithBook[]> {
  if (!supabase) return loadBets().map((b) => ({ ...b, _bookName: "" }));

  const { data: sess } = await supabase.auth.getSession();
  const userId = sess.session?.user.id;
  if (!userId) return loadBets().map((b) => ({ ...b, _bookName: "" }));

  // Books first — used to attach human-readable names to each row.
  const { data: bookRows } = await supabase
    .from("books")
    .select("id, name")
    .eq("user_id", userId);
  const books: BookLookup = {};
  for (const b of (bookRows ?? []) as Array<{ id: string; name: string }>) {
    books[b.id] = b.name;
  }

  // Paginate through bets. select("*") and ignore the columns we don't
  // use — typed multi-column selects with line-broken strings can confuse
  // Supabase's TS inference.
  const PAGE = 1000;
  const all: RawBetRow[] = [];
  for (let from = 0; from < 100_000; from += PAGE) {
    const { data, error } = await supabase
      .from("bets")
      .select("*")
      .eq("user_id", userId)
      .order("kickoff", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) break;
    const rows = (data ?? []) as unknown as RawBetRow[];
    all.push(...rows);
    if (rows.length < PAGE) break;
  }

  return all.map((r) => ({
    id: r.id,
    bookId: r.book_id ?? undefined,
    kickoff: r.kickoff,
    sport: r.sport,
    league: r.league ?? undefined,
    home: r.home ?? undefined,
    away: r.away ?? undefined,
    event: r.event,
    market: (r.market as ImportedBet["market"]) ?? undefined,
    selection: r.selection,
    odds: Number(r.odds),
    stake: Number(r.stake),
    closingOdds: r.closing_odds != null ? Number(r.closing_odds) : undefined,
    tipster: r.tipster ?? undefined,
    tags: r.tags ?? undefined,
    notes: r.notes ?? undefined,
    status: r.status as ImportedBet["status"],
    pl: Number(r.pl),
    source: r.source,
    importedAt: r.imported_at,
    raw: {},
    _bookName: r.book_id ? books[r.book_id] ?? "" : "",
  }));
}

/**
 * Trigger a CSV download of every bet the signed-in user owns. Returns
 * the number of bets exported, or null if something failed.
 */
export async function downloadBetsCsv(): Promise<number | null> {
  const bets = await fetchAllUserBets();
  if (bets.length === 0) return 0;
  const rows = bets.map(betToRow);
  const csv = buildCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const stamp =
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-` +
    `${String(now.getDate()).padStart(2, "0")}`;
  const filename = `am-i-up_bets_${stamp}.csv`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer revoke so Chrome can finish the download initiation.
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return bets.length;
}
