// Closing-line value (CLV).
//
// v1 — raw single-side CLV: compare user's odds to Pinnacle's closing odds on
// the same selection. Computed as the relative edge in decimal-odds space:
//
//     clvPct = (user_odds / pinnacle_close - 1) * 100
//
// Positive = you got better odds than the closing line. The bigger the number,
// the more "value" you locked in vs where the market settled.
//
// v2 — Buchdahl logarithmic devig across the full market (both/all sides),
// which removes Pinnacle's overround. Requires the full price set, not just
// the selection's side. Comes when SteamWatch pushes closing-line data via
// the planned internal endpoint.

import type { ImportedBet } from "./import/types";

export function computeClvPct(
  odds: number | null | undefined,
  closingOdds: number | null | undefined,
): number | null {
  if (!odds || !closingOdds) return null;
  if (closingOdds < 1.01) return null;
  return (odds / closingOdds - 1) * 100;
}

/** Convenience for a bet record. Returns null if closing line not captured. */
export function betClv(bet: ImportedBet): number | null {
  return computeClvPct(bet.odds, bet.closingOdds);
}

/** Mean CLV across bets that have a closing line captured. */
export function meanClvPct(bets: ImportedBet[]): number {
  let sum = 0;
  let n = 0;
  for (const b of bets) {
    const c = betClv(b);
    if (c == null) continue;
    sum += c;
    n++;
  }
  return n > 0 ? sum / n : 0;
}

/** Number of bets with closing line captured. */
export function clvCoverage(bets: ImportedBet[]): { withClv: number; total: number } {
  let withClv = 0;
  for (const b of bets) if (betClv(b) != null) withClv++;
  return { withClv, total: bets.length };
}
