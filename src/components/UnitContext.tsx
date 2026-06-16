"use client";

// Display-unit context. The numbers in the data layer are dimensionless — this
// only changes how we format them: "u" for unit-based trackers (bettin.gs,
// Track-A-Bet, most pro bettors), "$"/"£"/"€" for users who stake in real money.
//
// Per-bet currency would be a per-bookmaker concern; not modelled in v1 since
// most bettors stake in a single denomination.

import { createContext, useContext } from "react";

export type DisplayUnit = "u" | "$" | "£" | "€";

const UnitContext = createContext<DisplayUnit>("$");

export function UnitProvider({
  unit,
  children,
}: {
  unit: DisplayUnit;
  children: React.ReactNode;
}) {
  return <UnitContext.Provider value={unit}>{children}</UnitContext.Provider>;
}

export function useUnit(): DisplayUnit {
  return useContext(UnitContext);
}

interface FmtOpts {
  signed?: boolean;
  dp?: number;
  /** Force compact thousands ("12K") even when not normally needed. */
  compact?: boolean;
}

/**
 * Format a numeric P/L or stake as a unit-aware string.
 *   fmtUnit(363, "u")           → "363u"
 *   fmtUnit(363, "$", { signed: true }) → "+$363"
 *   fmtUnit(-146.5, "u")        → "−146.5u"
 */
export function fmtUnit(v: number, unit: DisplayUnit, opts: FmtOpts = {}): string {
  const abs = Math.abs(v);
  const dp = opts.dp ?? (abs >= 100 || abs === 0 ? 0 : 2);
  const sign = opts.signed ? (v > 0 ? "+" : v < 0 ? "−" : "") : v < 0 ? "−" : "";
  let num: string;
  if (opts.compact && abs >= 1000) {
    num = (abs / 1000).toFixed(abs >= 10_000 ? 0 : 1) + "K";
  } else {
    num = abs.toLocaleString("en-US", {
      minimumFractionDigits: dp,
      maximumFractionDigits: dp,
    });
  }
  return unit === "u" ? `${sign}${num}u` : `${sign}${unit}${num}`;
}

/**
 * Compute the minimum dp (0/1/2) that represents `v` exactly after
 * rounding to 2dp. Used by fmtStake and fmtPL to drop trailing-zero
 * noise (1.50 → "1.5", not "1.50") while keeping real precision.
 */
function autoDp(v: number): number {
  const rounded = Math.round(v * 100) / 100;
  if (Number.isInteger(rounded)) return 0;
  if (Math.abs(rounded * 10 - Math.round(rounded * 10)) < 1e-9) return 1;
  return 2;
}

/**
 * Format a stake (or any quantity that should preserve user-entered
 * precision up to 2 decimal places, without trailing zero noise).
 *
 *   fmtStake(1, "u")     → "1u"
 *   fmtStake(1.5, "u")   → "1.5u"
 *   fmtStake(1.25, "u")  → "1.25u"
 *   fmtStake(1.50, "$")  → "$1.5"
 *   fmtStake(1000, "u")  → "1,000u"
 *
 * The default fmtUnit truncates fractional stakes at the dp:0 callsites
 * (bet log, PasteHero review, open positions), turning 1.5u into "2u".
 * Use this helper instead anywhere a stake or to-win amount is shown.
 */
export function fmtStake(v: number, unit: DisplayUnit, opts: { signed?: boolean } = {}): string {
  const abs = Math.abs(v);
  const sign = opts.signed ? (v > 0 ? "+" : v < 0 ? "−" : "") : v < 0 ? "−" : "";
  const rounded = Math.round(abs * 100) / 100;
  const dp = autoDp(rounded);
  const num = rounded.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
  return unit === "u" ? `${sign}${num}u` : `${sign}${unit}${num}`;
}

/**
 * Format a P/L (profit-or-loss) value with auto-precision. Mirrors
 * fmtStake but defaults to signed display and supports compact-thousands
 * mode for analytics calendar cells and equity bars.
 *
 *   fmtPL(1.5, "u")                       → "+1.5u"
 *   fmtPL(-2.25, "u")                     → "−2.25u"
 *   fmtPL(100, "u")                       → "+100u"
 *   fmtPL(12500, "u", { compact: true })  → "+13Ku"  (rounded to 0dp ≥10K)
 *   fmtPL(1500, "u", { compact: true })   → "+1.5Ku"
 *   fmtPL(0, "u")                         → "0u"
 *
 * Replaces the old `fmtUnit(x, unit, { signed: true, dp: 0, ... })`
 * idiom used throughout the analytics page. Old behavior truncated
 * fractional P/Ls (a +1.5u winning day showed as "+2u"), which became
 * visible noise now that stakes can be fractional.
 */
export function fmtPL(
  v: number,
  unit: DisplayUnit,
  opts: { signed?: boolean; compact?: boolean } = {},
): string {
  const signed = opts.signed !== false; // P/L is always signed unless explicitly opted out
  const compact = opts.compact ?? false;
  const abs = Math.abs(v);
  const sign = signed ? (v > 0 ? "+" : v < 0 ? "−" : "") : v < 0 ? "−" : "";
  let num: string;
  if (compact && abs >= 1000) {
    // Same compact rule as fmtUnit: ≥10K → 0dp, else 1dp.
    num = (abs / 1000).toFixed(abs >= 10_000 ? 0 : 1) + "K";
  } else {
    const rounded = Math.round(abs * 100) / 100;
    const dp = autoDp(rounded);
    num = rounded.toLocaleString("en-US", {
      minimumFractionDigits: dp,
      maximumFractionDigits: dp,
    });
  }
  return unit === "u" ? `${sign}${num}u` : `${sign}${unit}${num}`;
}
