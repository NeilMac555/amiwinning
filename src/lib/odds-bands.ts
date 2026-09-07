import type { ImportedBet } from "./import/types";
import { betClv } from "./clv";

export const ODDS_BANDS = [
  { label: "Below 1.50", min: 1, max: 1.5 },
  { label: "1.50–1.74", min: 1.5, max: 1.75 },
  { label: "1.75–1.99", min: 1.75, max: 2 },
  { label: "2.00–2.49", min: 2, max: 2.5 },
  { label: "2.50–2.99", min: 2.5, max: 3 },
  { label: "3.00–4.99", min: 3, max: 5 },
  { label: "5.00+", min: 5, max: Infinity },
];

export function analyzeOddsBands(bets: ImportedBet[]) {
  const eligible = bets.filter(b => !b._pendingDelete && !b.id.startsWith("seed-") && b.source !== "sample" &&
    ["won", "lost", "push", "half_won", "half_lost"].includes(b.status) && Number.isFinite(b.odds) && b.odds > 1);
  return ODDS_BANDS.map(band => {
    const rows = eligible.filter(b => b.odds >= band.min && b.odds < band.max);
    const stake = rows.reduce((s,b) => s+b.stake,0);
    const pl = rows.reduce((s,b) => s+b.pl,0);
    const clvs = rows.map(betClv).filter((v): v is number => v !== null && Number.isFinite(v));
    return { ...band, bets: rows, stake, pl, yieldPct: stake > 0 ? pl/stake*100 : null,
      clv: clvs.length ? clvs.reduce((s,v)=>s+v,0)/clvs.length : null, clvCount: clvs.length };
  });
}
