"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { UnitProvider, fmtStake, fmtUnit } from "@/components/UnitContext";
import { consumeSeed, deleteBet, loadBets } from "@/lib/import/store";
import type { ImportedBet, Status } from "@/lib/import/types";
import { applyTheme, useSettings } from "@/lib/settings";
import { useAuth } from "@/lib/auth";
import { formatOdds } from "@/lib/format-odds";
import { betClv } from "@/lib/clv";
import { classifySport } from "@/lib/sport-classify";

type SortKey = "kickoff" | "odds" | "stake" | "pl" | "clv";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 50;

export default function BetsPage() {
  const router = useRouter();
  // Sentinel for "no filter" — chosen so it can't collide with real values.
  const ALL = "__aiw_all__";
  const [bets, setBets] = useState<ImportedBet[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | typeof ALL>(ALL);
  const [marketFilter, setMarketFilter] = useState<string>(ALL);
  const [sortKey, setSortKey] = useState<SortKey>("kickoff");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [density, setDensity] = useState<"comfortable" | "dense">("dense");
  const unit = useSettings().unit;
  const { user, betsVersion, activeBook } = useAuth();

  useEffect(() => {
    applyTheme();
    if (!user) consumeSeed();
    const all = loadBets();
    const scoped = activeBook
      ? all.filter((b) => !b.bookId || b.bookId === activeBook.id)
      : all;
    // Deferred to next microtask to satisfy React 19's no-synchronous-
    // setState-in-effect rule (runs before paint, no visible flash).
    queueMicrotask(() => setBets(scoped));
  }, [betsVersion, user, activeBook]);

  const onDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // don't trigger row click
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    const next = deleteBet(id);
    setBets(next);
    setConfirmDeleteId(null);
  };

  const onRowClick = (id: string) => {
    if (confirmDeleteId) {
      setConfirmDeleteId(null);
      return;
    }
    router.push(`/bets/${id}/edit`);
  };

  const marketOptions = useMemo(() => {
    const set = new Set<string>();
    for (const b of bets) if (b.market) set.add(b.market);
    return Array.from(set).sort();
  }, [bets]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bets.filter((b) => {
      if (statusFilter !== ALL && b.status !== statusFilter) return false;
      if (marketFilter !== ALL && b.market !== marketFilter) return false;
      if (q && !`${b.event} ${b.selection}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [bets, query, statusFilter, marketFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av = 0,
        bv = 0;
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
        case "pl":
          av = a.pl;
          bv = b.pl;
          break;
        case "clv": {
          // Bets without CLV captured always sort to the bottom regardless of
          // direction — they're not comparable.
          const ac = betClv(a);
          const bc = betClv(b);
          if (ac == null && bc == null) return 0;
          if (ac == null) return 1;
          if (bc == null) return -1;
          av = ac;
          bv = bc;
          break;
        }
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const onSort = (k: SortKey) => {
    if (k === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir(k === "kickoff" ? "desc" : "desc");
    }
    setPage(0);
  };

  const arrow = (k: SortKey) =>
    sortKey === k ? <span className="sort-arrow">{sortDir === "asc" ? "↑" : "↓"}</span> : null;

  const summary = useMemo(() => {
    let pl = 0,
      stake = 0,
      wins = 0,
      settled = 0,
      withClv = 0;
    for (const b of filtered) {
      if (betClv(b) != null) withClv++;
      if (
        b.status === "won" ||
        b.status === "lost" ||
        b.status === "push" ||
        b.status === "half_won" ||
        b.status === "half_lost"
      ) {
        settled++;
        pl += b.pl;
        stake += b.stake;
        if (b.status === "won" || b.status === "half_won") wins++;
      }
    }
    return {
      count: filtered.length,
      settled,
      pl: Math.round(pl * 100) / 100,
      stake: Math.round(stake * 100) / 100,
      yield: stake > 0 ? Math.round((pl / stake) * 10000) / 100 : 0,
      winRate: settled > 0 ? Math.round((wins / settled) * 1000) / 10 : 0,
      withClv,
      clvCoveragePct:
        filtered.length > 0
          ? Math.round((withClv / filtered.length) * 1000) / 10
          : 0,
    };
  }, [filtered]);

  return (
    <UnitProvider unit={unit}>
      <div className="app">
        <Sidebar />
        <div className="main-col">
          <TopBar />
          <div className="page">
            <div className="page-header">
              <div>
                <h1 className="page-title">Bet log</h1>
                <div className="page-subtitle">
                  {bets.length === 0 ? (
                    <>
                      No bets yet —{" "}
                      <Link href="/bets/new" style={{ color: "var(--blue)" }}>
                        log one
                      </Link>{" "}
                      or{" "}
                      <Link href="/import" style={{ color: "var(--blue)" }}>
                        import a file
                      </Link>
                      .
                    </>
                  ) : (
                    <>
                      {summary.count.toLocaleString()} of {bets.length.toLocaleString()} bets shown ·{" "}
                      <span className={summary.pl >= 0 ? "num-pos" : "num-neg"}>
                        {fmtUnit(summary.pl, unit, { signed: true, dp: 0 })}
                      </span>{" "}
                      · {summary.yield.toFixed(2)}% yield · {summary.winRate.toFixed(1)}% win rate ·{" "}
                      <span
                        title={`${summary.withClv.toLocaleString()} of ${summary.count.toLocaleString()} have a Pinnacle closing line captured`}
                      >
                        CLV on{" "}
                        <span
                          style={{
                            color:
                              summary.clvCoveragePct > 50
                                ? "var(--green)"
                                : summary.clvCoveragePct > 0
                                  ? "var(--text)"
                                  : "var(--text-faint)",
                            fontWeight: 600,
                          }}
                        >
                          {summary.clvCoveragePct.toFixed(1)}%
                        </span>
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="btn-ghost"
                  data-active={density === "dense" ? "true" : undefined}
                  onClick={() => setDensity("dense")}
                  style={{ padding: "4px 10px", fontSize: 12 }}
                >
                  Dense
                </button>
                <button
                  className="btn-ghost"
                  data-active={density === "comfortable" ? "true" : undefined}
                  onClick={() => setDensity("comfortable")}
                  style={{ padding: "4px 10px", fontSize: 12 }}
                >
                  Comfy
                </button>
              </div>
            </div>

            <div
              className="card"
              style={{
                padding: "12px 16px",
                marginTop: 14,
                display: "grid",
                gridTemplateColumns: "1fr 200px 200px",
                gap: 10,
                alignItems: "center",
              }}
            >
              <FilterInput
                placeholder="Search event or selection…"
                value={query}
                onChange={(v) => {
                  setQuery(v);
                  setPage(0);
                }}
              />
              <FilterSelect
                value={statusFilter}
                onChange={(v) => {
                  setStatusFilter(v as Status | typeof ALL);
                  setPage(0);
                }}
                options={[
                  [ALL, "All statuses"],
                  ["won", "Won"],
                  ["lost", "Lost"],
                  ["push", "Push"],
                  ["half_won", "Half-won"],
                  ["half_lost", "Half-lost"],
                  ["void", "Void"],
                  ["pending", "Pending"],
                ]}
              />
              <FilterSelect
                value={marketFilter}
                onChange={(v) => {
                  setMarketFilter(v);
                  setPage(0);
                }}
                options={[[ALL, "All markets"], ...marketOptions.map((m) => [m, m] as [string, string])]}
              />
            </div>

            {/* overflowX: auto lets very long parlay-selection rows scroll
                horizontally inside the card instead of clipping the
                rightmost P/L column. overflowY: hidden preserves the
                card's rounded corners — no awkward vertical scrollbar. */}
            <div
              className="card"
              style={{
                marginTop: 14,
                padding: 0,
                overflowX: "auto",
                overflowY: "hidden",
              }}
            >
              <table className="tbl" data-density={density}>
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => onSort("kickoff")}>
                      Kickoff {arrow("kickoff")}
                    </th>
                    <th>Event</th>
                    <th>Selection</th>
                    <th>Market</th>
                    <th className="num sortable" onClick={() => onSort("odds")}>
                      Odds {arrow("odds")}
                    </th>
                    <th className="num sortable" onClick={() => onSort("stake")}>
                      Stake {arrow("stake")}
                    </th>
                    <th
                      className="num sortable"
                      onClick={() => onSort("clv")}
                      title="Closing-line value vs Pinnacle"
                    >
                      CLV {arrow("clv")}
                    </th>
                    <th>Status</th>
                    <th className="num sortable" onClick={() => onSort("pl")}>
                      P/L {arrow("pl")}
                    </th>
                    <th className="actions" aria-label="Row actions"></th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ padding: 32, textAlign: "center", color: "var(--text-faint)" }}>
                        No bets match the current filters.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((b) => {
                      const isConfirming = confirmDeleteId === b.id;
                      const clv = betClv(b);
                      return (
                        <tr
                          key={b.id}
                          onClick={() => onRowClick(b.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <td className="mono" style={{ fontSize: 11 }}>
                            {b.kickoff.slice(0, 10)}
                          </td>
                          <td className="event">
                            <span className="league">
                              {b.league || classifySport(b)}
                            </span>
                            {b.event}
                          </td>
                          <td className="selection">
                            <span className="sel-main">{b.selection}</span>
                          </td>
                          <td className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {b.market ?? "—"}
                          </td>
                          <td className="num">
                            {formatOdds(b.odds, activeBook?.oddsFormat ?? "decimal")}
                          </td>
                          <td className="num">{fmtStake(b.stake, unit)}</td>
                          <td
                            className={`num ${
                              clv == null
                                ? ""
                                : clv > 0
                                  ? "num-pos"
                                  : clv < 0
                                    ? "num-neg"
                                    : "num-flat"
                            }`}
                            title={
                              clv == null
                                ? "No closing line captured yet"
                                : `Pinnacle closed at ${b.closingOdds?.toFixed(2)}`
                            }
                          >
                            {clv == null ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  color: "var(--text-faint)",
                                  fontFamily: "var(--mono)",
                                  fontSize: 10.5,
                                  letterSpacing: "0.02em",
                                }}
                              >
                                <span
                                  style={{
                                    width: 5,
                                    height: 5,
                                    borderRadius: "50%",
                                    background: "var(--text-faint)",
                                    opacity: 0.5,
                                  }}
                                />
                                untracked
                              </span>
                            ) : (
                              <>
                                {clv >= 0 ? "+" : "−"}
                                {Math.abs(clv).toFixed(2)}%
                              </>
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                b.status === "won" || b.status === "half_won"
                                  ? "win"
                                  : b.status === "lost" || b.status === "half_lost"
                                    ? "loss"
                                    : "void"
                              }`}
                            >
                              {b.status.replace("_", "-")}
                            </span>
                          </td>
                          <td
                            className={`num ${b.pl > 0 ? "num-pos" : b.pl < 0 ? "num-neg" : "num-flat"}`}
                          >
                            {fmtUnit(b.pl, unit, { signed: true })}
                          </td>
                          <td className="actions" onClick={(e) => e.stopPropagation()}>
                            <span
                              className="row-actions"
                              style={{
                                opacity: isConfirming ? 1 : undefined,
                              }}
                            >
                              <button
                                type="button"
                                className="row-icon-btn"
                                onClick={(e) => onDelete(e, b.id)}
                                title={
                                  isConfirming
                                    ? "Click again to confirm"
                                    : "Delete bet"
                                }
                                style={{
                                  color: isConfirming ? "var(--red)" : undefined,
                                }}
                              >
                                {isConfirming ? (
                                  <span style={{ fontSize: 10, fontWeight: 600, padding: "0 4px" }}>
                                    Confirm?
                                  </span>
                                ) : (
                                  <svg
                                    width="13"
                                    height="13"
                                    viewBox="0 0 14 14"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.4"
                                    strokeLinecap="round"
                                  >
                                    <path d="M3 4h8M5.5 4V2.5h3V4M5 6.5v4M9 6.5v4M4 4l.5 8h5L10 4" />
                                  </svg>
                                )}
                              </button>
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div
              style={{
                marginTop: 14,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontFamily: "var(--mono)",
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              <span>
                Page {safePage + 1} of {pageCount} · showing{" "}
                {pageRows.length > 0 ? safePage * PAGE_SIZE + 1 : 0}–
                {safePage * PAGE_SIZE + pageRows.length} of {sorted.length.toLocaleString()}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="btn-ghost"
                  onClick={() => setPage(0)}
                  disabled={safePage === 0}
                  style={{
                    padding: "4px 10px",
                    fontSize: 12,
                    opacity: safePage === 0 ? 0.4 : 1,
                  }}
                >
                  « First
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => setPage(Math.max(0, safePage - 1))}
                  disabled={safePage === 0}
                  style={{
                    padding: "4px 10px",
                    fontSize: 12,
                    opacity: safePage === 0 ? 0.4 : 1,
                  }}
                >
                  ‹ Prev
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
                  disabled={safePage >= pageCount - 1}
                  style={{
                    padding: "4px 10px",
                    fontSize: 12,
                    opacity: safePage >= pageCount - 1 ? 0.4 : 1,
                  }}
                >
                  Next ›
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => setPage(pageCount - 1)}
                  disabled={safePage >= pageCount - 1}
                  style={{
                    padding: "4px 10px",
                    fontSize: 12,
                    opacity: safePage >= pageCount - 1 ? 0.4 : 1,
                  }}
                >
                  Last »
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UnitProvider>
  );
}

// ---------------------------------------------------------------------------

const ctrl: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  fontSize: 12.5,
  fontFamily: "var(--sans)",
  background: "var(--surface)",
  border: "var(--border-w) solid var(--border-strong)",
  borderRadius: 5,
  color: "var(--text)",
};

function FilterInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={ctrl}
    />
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={ctrl}>
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}
