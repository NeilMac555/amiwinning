// Time-range filter for the dashboard.
// Used to slice the bet history before aggregation, so KPIs, equity, breakdowns
// all reflect the selected window. "All" returns everything.

export type Range = "7D" | "1M" | "3M" | "6M" | "YTD" | "12M" | "All";

export const RANGES: Range[] = ["7D", "1M", "3M", "6M", "YTD", "12M", "All"];

const DAY_MS = 86400000;

export function rangeStartMs(range: Range, now: number = Date.now()): number {
  if (range === "All") return 0;
  if (range === "YTD") {
    const d = new Date(now);
    return new Date(d.getFullYear(), 0, 1).getTime();
  }
  const days: Record<Exclude<Range, "All" | "YTD">, number> = {
    "7D": 7,
    "1M": 30,
    "3M": 90,
    "6M": 180,
    "12M": 365,
  };
  return now - days[range] * DAY_MS;
}

export function filterByRange<T extends { kickoff: string }>(
  bets: T[],
  range: Range,
  now: number = Date.now(),
): T[] {
  const start = rangeStartMs(range, now);
  if (start === 0) return bets;
  return bets.filter((b) => new Date(b.kickoff).getTime() >= start);
}

/** Human-readable summary, e.g. "last 30 days" / "since 1 Jan" / "all time". */
export function rangeLabel(range: Range, now: number = Date.now()): string {
  if (range === "All") return "all time";
  if (range === "YTD") {
    const yr = new Date(now).getFullYear();
    return `since 1 Jan ${yr}`;
  }
  const map: Record<Exclude<Range, "All" | "YTD">, string> = {
    "7D": "last 7 days",
    "1M": "last 30 days",
    "3M": "last 90 days",
    "6M": "last 180 days",
    "12M": "last 12 months",
  };
  return map[range];
}
