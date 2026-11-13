import type { ImportedBet } from "./import/types";

export const YLOSE_SOCCER_BOOK = "b57026a4-ff33-4752-a49f-dd3deb90c665";
const OWNER = "e54b2aaa-35be-41b9-9803-3c201e5ab8b3";
const START = Date.parse("2026-02-01T00:00:00Z");

export function hasYloseTrackingPeriod(userId?: string, bookId?: string): boolean {
  return userId === OWNER && bookId === YLOSE_SOCCER_BOOK;
}

// Display only: no stored bets are changed or removed.
export function bookPerformanceBets(bets: ImportedBet[], userId?: string): ImportedBet[] {
  return bets.filter(bet => !hasYloseTrackingPeriod(userId, bet.bookId) || Date.parse(bet.kickoff) >= START);
}
