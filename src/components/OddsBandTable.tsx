"use client";
import { useMemo, useState } from "react";
import type { ImportedBet } from "@/lib/import/types";
import { analyzeOddsBands } from "@/lib/odds-bands";
import { fmtPL, fmtStake, useUnit } from "./UnitContext";

export function OddsBandTable({ bets }: { bets: ImportedBet[] }) {
  const bands = useMemo(() => analyzeOddsBands(bets), [bets]);
  const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const unit = useUnit();
  const active = bands.find(b => b.label === selected);
  const sorted = useMemo(() => active ? [...active.bets].sort((a,b)=>b.kickoff.localeCompare(a.kickoff)) : [], [active]);
  const safePage = Math.min(page, Math.max(0, Math.ceil(sorted.length/25)-1));
  const pct = (v: number | null) => v === null ? "—" : `${v>0?"+":""}${v.toFixed(2)}%`;
  return <section className="card odds-band-report">
    <h2>Performance by odds band</h2>
    <p>Your recorded bets for the selected book and date range. Select a band to inspect its bets. Fewer than 30 bets is a small sample.</p>
    <div className="odds-band-scroll"><table>
      <caption className="sr-only">Settled performance by decimal odds</caption>
      <thead><tr>{["Decimal odds", "Bets", "Staked", "P/L", "Yield", "Average CLV"].map(h=><th key={h} scope="col">{h}</th>)}</tr></thead>
      <tbody>{bands.map(b=><tr key={b.label}>
        <th scope="row"><button type="button" disabled={!b.bets.length} aria-expanded={selected===b.label} aria-controls="odds-band-bets" onClick={()=>{setSelected(selected===b.label?null:b.label);setPage(0);}}>{b.label}</button></th>
        <td>{b.bets.length.toLocaleString()}{b.bets.length>0&&b.bets.length<30&&<small>Small sample</small>}</td>
        <td>{fmtStake(b.stake,unit)}</td><td className={b.pl<0?"num-neg":b.pl>0?"num-pos":""}>{fmtPL(b.pl,unit)}</td>
        <td>{pct(b.yieldPct)}</td><td>{pct(b.clv)}<small>{b.clvCount} with closing odds</small></td>
      </tr>)}</tbody>
    </table></div>
    <p className="odds-band-note">Pending, void and demo bets are excluded. Boundaries use exact odds: 1.749 belongs below 1.75. Yield is profit divided by stake. CLV is the unweighted mean for available closing prices, without removing bookmaker margin. Past results do not establish a future edge.</p>
    <div id="odds-band-bets">{active&&<>
      <h3>{active.label}: {sorted.length.toLocaleString()} bets</h3>
      <div className="odds-band-scroll"><table><thead><tr>{["Date (UTC)","Event / selection","Odds","Stake","Result","P/L"].map(h=><th key={h} scope="col">{h}</th>)}</tr></thead>
      <tbody>{sorted.slice(safePage*25,(safePage+1)*25).map(b=><tr key={b.id}><td>{b.kickoff.slice(0,10)}</td><td>{b.event}<small>{b.selection}</small></td><td>{b.odds}</td><td>{fmtStake(b.stake,unit)}</td><td>{b.status.replaceAll("_"," ")}</td><td>{fmtPL(b.pl,unit)}</td></tr>)}</tbody></table></div>
      <div className="odds-band-pages"><button type="button" disabled={safePage===0} onClick={()=>setPage(safePage-1)}>Previous</button><span>{sorted.length ? safePage*25+1 : 0}–{Math.min((safePage+1)*25,sorted.length)} of {sorted.length}</span><button type="button" disabled={(safePage+1)*25>=sorted.length} onClick={()=>setPage(safePage+1)}>Next</button></div>
    </>}</div>
  </section>;
}
