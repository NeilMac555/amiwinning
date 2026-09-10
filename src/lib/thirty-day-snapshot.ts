import type { ImportedBet } from "./import/types";
import { betClv } from "./clv";

const DAY = 86_400_000;

export function thirtyDaySnapshot(bets: ImportedBet[], now: number) {
  const start = Math.floor(now / DAY) * DAY - 29 * DAY;
  const daily = Array<number>(30).fill(0);
  let count = 0;
  let stake = 0;
  let profit = 0;
  let clvSum = 0;
  let clvCount = 0;
  for (const bet of bets) {
    const time = Date.parse(bet.kickoff);
    if (time < start || time > now || !Number.isFinite(time) ||
      bet._pendingDelete || bet.source === "sample" || bet.id.startsWith("seed-") ||
      !["won", "lost", "push", "half_won", "half_lost"].includes(bet.status)) continue;
    count++;
    stake += bet.stake;
    profit += bet.pl;
    const clv = betClv(bet);
    if (clv !== null && Number.isFinite(clv) && Number.isFinite(bet.odds) && bet.odds > 1 && Number.isFinite(bet.closingOdds)) {
      clvSum += clv;
      clvCount++;
    }
    daily[Math.floor((time - start) / DAY)] += bet.pl;
  }
  let running = 0;
  const points = [0, ...daily.map((value) => (running += value))];
  return { count, stake, profit, yieldPct: stake > 0 ? profit / stake * 100 : null,
    clvPct: clvCount > 0 ? clvSum / clvCount : null, clvCount, points, start };
}
