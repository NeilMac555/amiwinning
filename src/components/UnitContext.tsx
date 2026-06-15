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
  // Normalise to 2 decimal places first to dodge floating-point noise.
  const rounded = Math.round(abs * 100) / 100;
  // Pick the minimum dp that represents the value exactly:
  //   integer       → 0dp
  //   one-decimal   → 1dp
  //   two-decimal   → 2dp
  let dp: number;
  if (Number.isInteger(rounded)) dp = 0;
  else if (Math.abs(rounded * 10 - Math.round(rounded * 10)) < 1e-9) dp = 1;
  else dp = 2;
  const num = rounded.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
  return unit === "u" ? `${sign}${num}u` : `${sign}${unit}${num}`;
}
