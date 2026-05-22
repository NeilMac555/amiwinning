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
