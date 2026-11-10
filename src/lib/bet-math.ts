// Bet arithmetic shared by every place that turns a result into a P/L:
// the edit form, the inline status control on the bet log, the paste
// parser commit, and the landing-demo import. Pure functions, no I/O.

import type { ImportedBet, Status } from "./import/types";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * The P/L a bet should carry for a given status, in stake units, rounded
 * to 2 decimal places (the precision the database stores).
 * Half results (Asian handicap quarter lines) pay or lose half the stake.
 * Push, void, and pending are flat.
 */
export function autoPl(status: Status, odds: number, stake: number): number {
  switch (status) {
    case "won":
      return round2(stake * (odds - 1));
    case "lost":
      return round2(-stake);
    case "half_won":
      return round2((stake * (odds - 1)) / 2);
    case "half_lost":
      return round2(-stake / 2);
    case "push":
    case "void":
    case "pending":
    default:
      return 0;
  }
}

/**
 * True when the bet's stored P/L is what autoPl() produces for its
 * current status. If it is not, someone typed a custom P/L (a cash-out,
 * a partial payout, a bookmaker rounding), and an inline status change
 * must not silently overwrite it.
 *
 * Tolerance is one cent: the database rounds half-cent values away from
 * zero while Math.round rounds them up, so an exact comparison would
 * misread e.g. a half-lost 1.25u stake (-0.625) as hand-typed.
 */
export function plMatchesStatus(
  b: Pick<ImportedBet, "status" | "odds" | "stake" | "pl">,
): boolean {
  return Math.abs(b.pl - autoPl(b.status, b.odds, b.stake)) <= 0.0101;
}

export type StatusTone = "win" | "loss" | "void";

export const STATUS_OPTIONS: ReadonlyArray<{
  value: Status;
  label: string;
  tone: StatusTone;
}> = [
  { value: "won", label: "Won", tone: "win" },
  { value: "half_won", label: "Half won", tone: "win" },
  { value: "push", label: "Push", tone: "void" },
  { value: "void", label: "Void", tone: "void" },
  { value: "half_lost", label: "Half lost", tone: "loss" },
  { value: "lost", label: "Lost", tone: "loss" },
  { value: "pending", label: "Pending", tone: "void" },
];

export function statusLabel(s: Status): string {
  return STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;
}

/** Badge colour class for a status: "win" | "loss" | "void". */
export function statusTone(s: Status): StatusTone {
  return STATUS_OPTIONS.find((o) => o.value === s)?.tone ?? "void";
}
