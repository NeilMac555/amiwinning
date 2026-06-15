"use client";

import { useMemo, useState } from "react";
import type { OpenPosition } from "@/lib/data";
import { fmtCountdown } from "@/lib/format";
import { Sparkline } from "./Sparkline";
import { fmtStake, useUnit } from "./UnitContext";
import { useAuth } from "@/lib/auth";
import { formatOdds } from "@/lib/format-odds";

type SortKey = "kickoff" | "odds" | "stake" | "clv" | "toWin";
type SortDir = "asc" | "desc";

interface Props {
  positions: OpenPosition[];
  density: "dense" | "comfortable";
  now: number;
}

export function OpenPositions({ positions, density, now }: Props) {
  const unit = useUnit();
  const { activeBook } = useAuth();
  const oddsFormat = activeBook?.oddsFormat ?? "decimal";
  const [sortKey, setSortKey] = useState<SortKey>("kickoff");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    const arr = [...positions];
    arr.sort((a, b) => {
      let av = 0,
        bv = 0;
      switch (sortKey) {
        case "kickoff":
          av = a.kickoff.getTime();
          bv = b.kickoff.getTime();
          break;
        case "odds":
          av = a.odds;
          bv = b.odds;
          break;
        case "stake":
          av = a.stake;
          bv = b.stake;
          break;
        case "clv":
          av = a.clvBp;
          bv = b.clvBp;
          break;
        case "toWin":
          av = a.toWin;
          bv = b.toWin;
          break;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return arr;
  }, [positions, sortKey, sortDir]);

  const onSort = (k: SortKey) => {
    if (k === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir(k === "clv" || k === "stake" || k === "toWin" ? "desc" : "asc");
    }
  };

  const arrow = (k: SortKey) =>
    sortKey === k ? (
      <span className="sort-arrow">{sortDir === "asc" ? "↑" : "↓"}</span>
    ) : null;

  const totalStake = positions.reduce((a, p) => a + p.stake, 0);
  const totalToWin = positions.reduce((a, p) => a + p.toWin, 0);

  return (
    <div className="card table-card">
      <div className="card-header">
        <div>
          <div className="card-title">
            Open positions{" "}
            <em
              style={{
                color: "var(--text-faint)",
                fontWeight: 500,
                fontFamily: "var(--mono)",
                letterSpacing: "0.02em",
                marginLeft: 8,
                fontStyle: "normal",
              }}
            >
              {positions.length}
            </em>
          </div>
          <div className="card-meta" style={{ marginTop: 4 }}>
            <span className="mono">{fmtStake(totalStake, unit)} staked</span>
            <span style={{ color: "var(--text-faint)" }}>·</span>
            <span className="mono" style={{ color: "var(--green)" }}>
              {fmtStake(totalToWin, unit)} to win
            </span>
          </div>
        </div>
        <div className="card-actions">
          <button className="btn-ghost">Filter</button>
          <button className="btn-ghost">Export</button>
        </div>
      </div>

      <table className="tbl" data-density={density}>
        <thead>
          <tr>
            <th className="sortable" onClick={() => onSort("kickoff")}>
              Event {arrow("kickoff")}
            </th>
            <th>Selection</th>
            <th className="num sortable" onClick={() => onSort("odds")}>
              Odds {arrow("odds")}
            </th>
            <th style={{ textAlign: "center", width: 76 }}>24h move</th>
            <th className="num sortable" onClick={() => onSort("stake")}>
              Stake {arrow("stake")}
            </th>
            <th className="num sortable" onClick={() => onSort("toWin")}>
              To win {arrow("toWin")}
            </th>
            <th className="num sortable" onClick={() => onSort("clv")}>
              CLV est. {arrow("clv")}
            </th>
            <th>Status</th>
            <th className="actions"></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const cd = fmtCountdown(p.kickoff, now);
            const status: "live" | "soon" | "pre" = p.isLive
              ? "live"
              : cd && p.kickoff.getTime() - now < 6 * 3600 * 1000
                ? "soon"
                : "pre";
            const clvSign =
              p.clvBp > 0 ? "num-pos" : p.clvBp < 0 ? "num-neg" : "num-flat";
            const oddsDelta = p.odds - p.oddsOpen;
            const moveColor =
              oddsDelta > 0
                ? "var(--green)"
                : oddsDelta < 0
                  ? "var(--red)"
                  : "var(--text-muted)";
            return (
              <tr key={p.id}>
                <td className="event">
                  <span className="league">
                    {p.league} ·{" "}
                    {p.kickoff.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })}{" "}
                    {p.kickoff.toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {p.home}{" "}
                  <span style={{ color: "var(--text-faint)" }}>v</span> {p.away}
                </td>
                <td className="selection">
                  <span className="sel-main">{p.selection}</span>
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 10.5,
                      color: "var(--text-faint)",
                    }}
                  >
                    {p.market}
                  </span>
                </td>
                <td className="num">
                  {formatOdds(p.odds, oddsFormat)}
                  <div
                    style={{
                      fontSize: 9.5,
                      color: moveColor,
                      marginTop: 1,
                      letterSpacing: 0.04,
                    }}
                  >
                    {oddsDelta >= 0 ? "+" : "−"}
                    {Math.abs(oddsDelta).toFixed(2)}
                  </div>
                </td>
                <td className="spark-cell" style={{ color: moveColor }}>
                  <Sparkline
                    data={p.oddsHist}
                    color="currentColor"
                    width={64}
                    height={20}
                  />
                </td>
                <td className="num">{fmtStake(p.stake, unit)}</td>
                <td className="num" style={{ color: "var(--green)" }}>
                  {fmtStake(p.toWin, unit)}
                </td>
                <td className={`num ${clvSign}`}>
                  {p.clvBp >= 0 ? "+" : "−"}
                  {Math.abs(p.clvBp / 100).toFixed(2)}%
                </td>
                <td>
                  {status === "live" && (
                    <span className="badge live">In play</span>
                  )}
                  {status === "soon" && <span className="badge soon">{cd}</span>}
                  {status === "pre" && <span className="badge">{cd}</span>}
                </td>
                <td className="actions">
                  <span className="row-actions">
                    <button className="row-icon-btn" title="Cash out">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 14 14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                      >
                        <path d="M3 7h8M8 4l3 3-3 3" />
                      </svg>
                    </button>
                    <button className="row-icon-btn" title="Edit">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 14 14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                      >
                        <path d="M2 12l2 -.5L11 4l-1.5 -1.5L2.5 9.5z" />
                      </svg>
                    </button>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
