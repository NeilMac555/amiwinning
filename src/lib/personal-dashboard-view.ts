import type { ImportedBet } from "./import/types";

export type PersonalDashboardView = "personal" | "sharp-side-soccer";
export const SHARP_SIDE_START = Date.parse("2026-08-12T00:00:00Z");

export function canUsePersonalDashboardView(userId?: string, bookId?: string): boolean {
  return userId === "e54b2aaa-35be-41b9-9803-3c201e5ab8b3" &&
    bookId === "b2860ddf-f443-4848-8ed7-4db8f9a77d8c";
}

// A read-only view of the existing book, never a second book or a copied ledger.
export function personalDashboardBets(bets: ImportedBet[], view: PersonalDashboardView): ImportedBet[] {
  return view === "sharp-side-soccer"
    ? bets.filter((bet) => Date.parse(bet.kickoff) >= SHARP_SIDE_START)
    : bets;
}
