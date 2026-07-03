"use client";

// Pending Futures — dedicated workspace for unsettled bets (futures,
// ante-post, outrights, anything with status="pending"). Lives at /pending.
//
// Intentionally minimal: a focused header (count, stake at risk, max win,
// next settles) plus a kickoff-sorted table. No analytics, no filters
// beyond a search box. The bet log at /bets is still the place for
// arbitrary slicing.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { UnitProvider, fmtPL, fmtStake } from "@/components/UnitContext";
import { consumeSeed, loadBets } from "@/lib/import/store";
import type { ImportedBet } from "@/lib/import/types";
import { applyThemeForSignedIn, useSettings } from "@/lib/settings";
import { useAuth } from "@/lib/auth";
import { formatOdds } from "@/lib/format-odds";
import { classifySport } from "@/lib/sport-classify";
import { SafeEvent, SafeField } from "@/components/SafeBetField";

type SortKey = "kickoff" | "odds" | "stake" | "maxWin";
type SortDir = "asc" | "desc";

export default function PendingPage() {
  const router = useRouter();
  const [bets, setBets] = useState<ImportedBet[]>([]);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("kickoff");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  // Snapshot of `now` taken whenever bets change. Lifted out of the
  // summary useMemo so React 19's purity rule doesn't flag Date.now().
  const [nowMs, setNowMs] = useState(() => Date.now());
  const unit = useSettings().unit;
  const { user, betsVersion, activeBook } = useAuth();

  useEffect(() => {
    applyThemeForSignedIn();
    if (!user) consumeSeed();
    const all = loadBets();
    const scoped = activeBook
      ? all.filter((b) => !b.bookId || b.bookId === activeBook.id)
      : all;
    // Pending status only. Defer the setState to satisfy React 19's
    // no-synchronous-setState-in-effect rule.
    queueMicrotask(() => {
      setBets(scoped.filter((b) => b.status === "pending"));
      setNowMs(Date.now());
    });
  }, [betsVersion, user, activeBook]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bets;
    return bets.filter((b) =>
      `${b.event} ${b.selection} ${b.league ?? ""}`.toLowerCase().includes(q),
    );
  }, [bets, query]);

  const sorted = useMemo(() => {
    const arr = filtered.map((b) => ({
      ...b,
      maxWin: Math.round(b.stake * (b.odds - 1) * 100) / 100,
    }));
    arr.sort((a, b) => {
      let av = 0;
      let bv = 0;
      switch (sortKey) {
        case "kickoff":
          av = new Date(a.kickoff).getTime();
          bv = new Date(b.kickoff).getTime();
          break;
        case "odds":
          av = a.odds;
          bv = b.odds;
          break;
        case "stake":
          av = a.stake;
          bv = b.stake;
          break;
        case "maxWin":
          av = a.maxWin;
          bv = b.maxWin;
          break;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const onSort = (k: SortKey) => {
    if (k === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir(k === "kickoff" ? "asc" : "desc");
    }
  };

  const arrow = (k: SortKey) =>
    sortKey === k ? (
      <span className="sort-arrow">{sortDir === "asc" ? "↑" : "↓"}</span>
    ) : null;

  // Header summary: total stake locked up, theoretical max return if every
  // pending bet wins, soonest kickoff (used for "next settles in X" hint).
  const summary = useMemo(() => {
    let stake = 0;
    let maxWin = 0;
    let soonestMs: number | null = null;
    for (const b of bets) {
      stake += b.stake;
      maxWin += b.stake * (b.odds - 1);
      const ms = new Date(b.kickoff).getTime();
      if (!Number.isNaN(ms) && ms >= nowMs) {
        if (soonestMs == null || ms < soonestMs) soonestMs = ms;
      }
    }
    return {
      count: bets.length,
      stake: Math.round(stake * 100) / 100,
      maxWin: Math.round(maxWin * 100) / 100,
      soonestMs,
    };
  }, [bets, nowMs]);

  return (
    <UnitProvider unit={unit}>
      <div className="app">
        <Sidebar />
        <div className="main-col">
          <TopBar />
          <div className="page">
            <div className="page-header">
              <div>
                <h1 className="page-title">Pending futures</h1>
                <div className="page-subtitle">
                  {summary.count === 0 ? (
                    <>
                      Outrights, ante-post, futures, anything not settled yet.
                      Log a bet at <Link href="/bets/new">New bet</Link> or paste
                      one in from the dashboard and it lands here automatically.
                    </>
                  ) : (
                    <>
                      Open exposure — outrights, ante-post, futures, all the
                      stuff that won&rsquo;t settle today.
                    </>
                  )}
                </div>
              </div>
            </div>

            {summary.count > 0 && (
              <div
                className="card"
                style={{ marginBottom: 14, padding: "14px 16px" }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 28,
                    alignItems: "baseline",
                  }}
                >
                  <SumCell label="Open" value={`${summary.count}`} />
                  <SumCell
                    label="Stake at risk"
                    value={fmtStake(summary.stake, unit)}
                  />
                  <SumCell
                    label="Max return"
                    value={fmtPL(summary.maxWin, unit, { signed: false })}
                    tone="pos"
                  />
                  {summary.soonestMs != null && (
                    <SumCell
                      label="Next settles"
                      value={formatRelativeKickoff(summary.soonestMs)}
                    />
                  )}
                </div>
              </div>
            )}

            {summary.count > 0 && (
              <div
                style={{
                  marginBottom: 10,
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  placeholder="Search event, selection, league..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="topbar-search"
                  style={{ minWidth: 280, flex: "0 1 320px" }}
                />
                <span
                  style={{
                    color: "var(--text-faint)",
                    fontSize: 11,
                    fontFamily: "var(--mono)",
                  }}
                >
                  {sorted.length} shown
                </span>
              </div>
            )}

            {summary.count === 0 ? (
              <EmptyState />
            ) : (
              <div
                className="card"
                style={{
                  // overflowX: auto so the 8-column table can scroll horizontally
                  // on narrow viewports instead of clipping the Stake / Max win
                  // columns. overflowY: hidden keeps the card's rounded corners.
                  padding: 0,
                  overflowX: "auto",
                  overflowY: "hidden",
                }}
              >
                <table className="tbl" data-density="dense">
                  <thead>
                    <tr>
                      <th
                        className="sortable"
                        onClick={() => onSort("kickoff")}
                      >
                        Kickoff {arrow("kickoff")}
                      </th>
                      <th>Event</th>
                      <th>Selection</th>
                      <th>Sport</th>
                      <th>Market</th>
                      <th
                        className="num sortable"
                        onClick={() => onSort("odds")}
                      >
                        Odds {arrow("odds")}
                      </th>
                      <th
                        className="num sortable"
                        onClick={() => onSort("stake")}
                      >
                        Stake {arrow("stake")}
                      </th>
                      <th
                        className="num sortable"
                        onClick={() => onSort("maxWin")}
                      >
                        Max win {arrow("maxWin")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((b) => {
                      const sport = classifySport(b);
                      return (
                        <tr
                          key={b.id}
                          onClick={() => router.push(`/bets/${b.id}/edit`)}
                          style={{ cursor: "pointer" }}
                        >
                          <td className="mono" style={{ fontSize: 11 }}>
                            {formatKickoffCell(b.kickoff)}
                          </td>
                          <td className="event">
                            <SafeEvent value={b.event} />
                          </td>
                          <td className="selection">
                            <span className="sel-main">
                              <SafeField value={b.selection} label="selection" />
                            </span>
                          </td>
                          <td
                            className="mono"
                            style={{ fontSize: 11, color: "var(--text-muted)" }}
                          >
                            {sport}
                          </td>
                          <td
                            className="mono"
                            style={{ fontSize: 11, color: "var(--text-muted)" }}
                          >
                            {b.market ?? "—"}
                          </td>
                          <td className="num">
                            {formatOdds(
                              b.odds,
                              activeBook?.oddsFormat ?? "decimal",
                            )}
                          </td>
                          <td className="num">{fmtStake(b.stake, unit)}</td>
                          <td
                            className="num"
                            style={{ color: "var(--green)" }}
                          >
                            {fmtStake(b.maxWin, unit)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </UnitProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────

function SumCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "pos" | "neg";
}) {
  const color =
    tone === "pos" ? "var(--green)" : tone === "neg" ? "var(--red)" : undefined;
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.08em",
          color: "var(--text-faint)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        className="mono"
        style={{ fontSize: 20, marginTop: 2, color }}
      >
        {value}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="card"
      style={{
        padding: "48px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 14,
          color: "var(--text-muted)",
          marginBottom: 8,
        }}
      >
        Nothing pending right now.
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--text-faint)",
          maxWidth: 460,
          margin: "0 auto",
        }}
      >
        When you log a bet that won&rsquo;t settle today — outrights, ante-post,
        futures, season-long props — it&rsquo;ll land here. Use this view to
        track open exposure between settlement dates.
      </div>
    </div>
  );
}

// Render the kickoff cell as YYYY-MM-DD + a short relative hint ("· in 5d",
// "· today", "· past"). The relative hint uses the local now() since the
// component is client-only.
function formatKickoffCell(kickoff: string): string {
  if (!kickoff) return "—";
  const ms = new Date(kickoff).getTime();
  if (Number.isNaN(ms)) return kickoff;
  const dateStr = kickoff.slice(0, 10);
  const relative = formatRelativeKickoff(ms);
  return relative ? `${dateStr} · ${relative}` : dateStr;
}

// Convert a future-or-past kickoff ms into "in 3d" / "in 2mo" / "today" /
// "past". Returns "" when input is invalid.
function formatRelativeKickoff(ms: number): string {
  if (Number.isNaN(ms)) return "";
  const now = Date.now();
  const diffMs = ms - now;
  const absDays = Math.abs(diffMs) / 86_400_000;
  if (absDays < 1) return diffMs >= 0 ? "today" : "today";
  if (diffMs < 0) return "past";
  const days = Math.round(absDays);
  if (days < 30) return `in ${days}d`;
  const months = Math.round(days / 30);
  if (months < 12) return `in ${months}mo`;
  const years = Math.round(months / 12);
  return `in ${years}y`;
}
