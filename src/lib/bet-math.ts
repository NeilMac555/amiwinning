// Bet arithmetic shared by the edit form and the inline status control
// on the bet log. Pure functions, no I/O.

import type { ImportedBet, Status } from "./import/types";

/**
 * The P/L a bet should carry for a given status, in stake units.
 * Half results (Asian handicap quarter lines) pay or lose half the stake.
 * Push, void, and pending are flat.
 */
export function autoPl(status: Status, odds: number, stake: number): number {
  switch (status) {
    case "won":
      return Math.round(stake * (odds - 1) * 100) / 100;
    case "lost":
      return -stake;
    case "half_won":
      return Math.round(((stake * (odds - 1)) / 2) * 100) / 100;
    case "half_lost":
      return -stake / 2;
    case "push":
    case "void":
    case "pending":
    default:
      return 0;
  }
}

/**
 * True when the bet's stored P/L is exactly what autoPl() produces for its
 * current status. If it is not, someone typed a custom P/L (a cash-out, a
 * partial payout, a bookmaker rounding), and an inline status change must
 * not silently overwrite it.
 */
export function plMatchesStatus(
  b: Pick<ImportedBet, "status" | "odds" | "stake" | "pl">,
): boolean {
  return Math.abs(b.pl - autoPl(b.status, b.odds, b.stake)) < 0.005;
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

export function statusTone(s: Status): StatusTone {
  return STATUS_OPTIONS.find((o) => o.value === s)?.tone ?? "void";
}
