// Display-time odds formatter. Storage is always decimal; conversion happens
// here based on the active book's preferred format.

import type { OddsFormat } from "./books";

/** Convert decimal odds to American (+150 / -110 style). */
function decimalToAmerican(d: number): string {
  if (d >= 2) return "+" + Math.round((d - 1) * 100);
  return "−" + Math.round(100 / (d - 1));
}

/** Convert decimal odds to fractional (5/2 style). Approximate — picks the
 *  closest "common" denominator from a small table. */
function decimalToFractional(d: number): string {
  const decimal = d - 1;
  if (decimal <= 0) return "0/1";
  const denominators = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20];
  let best = { num: 1, den: 1, diff: Infinity };
  for (const den of denominators) {
    const num = Math.round(decimal * den);
    if (num < 1) continue;
    const diff = Math.abs(num / den - decimal);
    if (diff < best.diff) best = { num, den, diff };
  }
  // Reduce trivially.
  if (best.den > 1 && best.num % best.den === 0) {
    return `${best.num / best.den}/1`;
  }
  return `${best.num}/${best.den}`;
}

/** Format decimal odds in the user's preferred display style. Always returns
 *  a clean string suitable for table cells, KPIs, etc. */
export function formatOdds(decimal: number, format: OddsFormat): string {
  if (!isFinite(decimal) || decimal < 1.01) return "—";
  switch (format) {
    case "american":
      return decimalToAmerican(decimal);
    case "fractional":
      return decimalToFractional(decimal);
    case "decimal":
    default:
      return decimal.toFixed(2);
  }
}

/** Short label, useful as a placeholder hint in odds inputs. */
export function oddsExample(format: OddsFormat): string {
  switch (format) {
    case "american":
      return "−110";
    case "fractional":
      return "5/6";
    default:
      return "1.85";
  }
}
