"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import {
  UnitProvider,
  fmtUnit,
  type DisplayUnit,
} from "@/components/UnitContext";
import { consumeSeed, loadBets } from "@/lib/import/store";
import type { ImportedBet } from "@/lib/import/types";
import { applyTheme, useSettings } from "@/lib/settings";
import { useAuth } from "@/lib/auth";
import {
  byDayOfWeek,
  byMarket,
  bySeasonalMonth,
  byStakeSize,
  monthCalendar,
  monthlyPL,
  streaks,
  weekCalendar,
  yearCalendar,
  type CalendarDay,
  type DowRow,
  type MarketRow,
  type MonthCalendar,
  type MonthlyRow,
  type SeasonalMonthRow,
  type StakeBucketRow,
  type StreakSummary,
  type WeekCalendar,
  type YearCalendar,
} from "@/lib/analytics";

export default function AnalyticsPage() {
  const [bets, setBets] = useState<ImportedBet[]>([]);
  const unit = useSettings().unit;
  const { user, betsVersion, activeBook } = useAuth();

  useEffect(() => {
    applyTheme();
    if (!user) consumeSeed();
    const all = loadBets();
    const scoped = activeBook
      ? all.filter((b) => !b.bookId || b.bookId === activeBook.id)
      : all;
    // Deferred to next microtask: React 19's set-state-in-effect rule
    // disallows synchronous setState here. The microtask runs before paint
    // so users never see the stale empty state flash.
    queueMicrotask(() => setBets(scoped));
  }, [betsVersion, user, activeBook]);

  const monthly = useMemo(() => monthlyPL(bets), [bets]);
  const seasonal = useMemo(() => bySeasonalMonth(bets), [bets]);
  const market = useMemo(() => byMarket(bets), [bets]);
  const dow = useMemo(() => byDayOfWeek(bets), [bets]);
  const stakeRows = useMemo(() => byStakeSize(bets), [bets]);
  const streak = useMemo(() => streaks(bets), [bets]);

  const empty = bets.length === 0;

  return (
    <UnitProvider unit={unit}>
      <div className="app">
        <Sidebar />
        <div className="main-col">
          <TopBar />
          <div className="page">
            <div className="page-header">
              <div>
                <h1 className="page-title">Analytics</h1>
                <div className="page-subtitle">
                  {empty ? (
                    <>
                      No bets yet —{" "}
                      <Link href="/import" style={{ color: "var(--blue)" }}>
                        import a file
                      </Link>{" "}
                      or{" "}
                      <Link href="/bets/new" style={{ color: "var(--blue)" }}>
                        log one
                      </Link>{" "}
                      to populate.
                    </>
                  ) : (
                    <>
                      Where the edge actually lives. Slice by time, day, and stake size.
                    </>
                  )}
                </div>
              </div>
            </div>

            {!empty && (
              <>
                <StreaksPanel streak={streak} />

                <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
                  <CalendarPanel bets={bets} unit={unit} />
                </div>

                <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
                  <MonthlyPanel rows={monthly} unit={unit} />
                </div>

                <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
                  <SeasonalPanel rows={seasonal} unit={unit} />
                </div>

                <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
                  <MarketPanel rows={market} unit={unit} />
                </div>

                <div className="dense-grid row-2">
                  <DowPanel rows={dow} unit={unit} />
                  <StakePanel rows={stakeRows} unit={unit} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </UnitProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────

function StreaksPanel({ streak }: { streak: StreakSummary }) {
  const currentColor =
    streak.currentDirection === "win"
      ? "var(--green)"
      : streak.currentDirection === "loss"
        ? "var(--red)"
        : "var(--text-muted)";
  const currentLabel =
    streak.currentDirection === "win"
      ? `${streak.currentStreak} W`
      : streak.currentDirection === "loss"
        ? `${streak.currentStreak} L`
        : "—";
  return (
    <div className="kpi-strip" style={{ marginTop: 14, gridTemplateColumns: "repeat(3, 1fr)" }}>
      <div className="kpi">
        <div className="kpi-label">Longest winning run</div>
        <div className="kpi-value mono num-pos">{streak.longestWin}</div>
        <div className="kpi-foot">
          <div className="kpi-meta">
            <span style={{ color: "var(--text-faint)" }}>days in green</span>
          </div>
        </div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Longest losing run</div>
        <div className="kpi-value mono num-neg">{streak.longestLoss}</div>
        <div className="kpi-foot">
          <div className="kpi-meta">
            <span style={{ color: "var(--text-faint)" }}>days in red</span>
          </div>
        </div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Current run</div>
        <div className="kpi-value mono" style={{ color: currentColor }}>
          {currentLabel}
        </div>
        <div className="kpi-foot">
          <div className="kpi-meta">
            <span style={{ color: "var(--text-faint)" }}>
              {streak.currentDirection === "none" ? "no settled days" : "as of last day with action"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────

function MonthlyPanel({ rows, unit }: { rows: MonthlyRow[]; unit: DisplayUnit }) {
  const W = 920;
  const H = 220;
  const padL = 36,
    padR = 16,
    padT = 16,
    padB = 36;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.pl)), 1);
  const zeroY = padT + innerH / 2;
  const barW = innerW / rows.length;
  const totalPl = rows.reduce((s, r) => s + r.pl, 0);
  const totalStake = rows.reduce((s, r) => s + r.stake, 0);
  const totalBets = rows.reduce((s, r) => s + r.bets, 0);
  const totalYield = totalStake > 0 ? (totalPl / totalStake) * 100 : 0;

  // Pick an x-label cadence that won't overcrowd. < 30 months → quarterly;
  // 30–100 → biannual; 100+ → yearly (start of each year).
  const labelEveryN =
    rows.length < 30 ? 3 : rows.length < 100 ? 6 : 12;
  // Use the first month with bets as the user's "since" anchor so the header
  // doesn't show a long empty pre-history if their earliest bet falls mid-year.
  const firstWithBets = rows.find((r) => r.bets > 0);
  const sinceLabel = firstWithBets?.label ?? rows[0]?.label ?? "—";

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", marginTop: 14 }}>
      <div className="card-header">
        <div>
          <div className="card-title">Monthly P/L</div>
          <div className="card-meta" style={{ marginTop: 4 }}>
            <span>All time · since {sinceLabel}</span>
            <span style={{ color: "var(--text-faint)" }}>·</span>
            <span
              className="mono"
              style={{ color: totalPl >= 0 ? "var(--green)" : "var(--red)" }}
            >
              {fmtUnit(totalPl, unit, { signed: true, dp: 0 })}
            </span>
            <span style={{ color: "var(--text-faint)" }}>·</span>
            <span className="mono">
              {totalYield >= 0 ? "+" : "−"}
              {Math.abs(totalYield).toFixed(2)}% yield · {totalBets.toLocaleString()} bets
            </span>
          </div>
        </div>
      </div>
      <div style={{ padding: "12px 20px 4px" }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: H }}>
          {/* gridlines */}
          <line
            x1={padL}
            x2={W - padR}
            y1={zeroY}
            y2={zeroY}
            stroke="var(--border-strong)"
            strokeWidth="0.5"
          />
          {[0.5, 1].map((frac, i) => (
            <g key={i}>
              <line
                x1={padL}
                x2={W - padR}
                y1={padT + (innerH / 2) * (1 - frac)}
                y2={padT + (innerH / 2) * (1 - frac)}
                stroke="var(--border)"
                strokeWidth="0.5"
                strokeDasharray="3 3"
              />
              <line
                x1={padL}
                x2={W - padR}
                y1={padT + innerH - (innerH / 2) * (1 - frac)}
                y2={padT + innerH - (innerH / 2) * (1 - frac)}
                stroke="var(--border)"
                strokeWidth="0.5"
                strokeDasharray="3 3"
              />
            </g>
          ))}
          {/* bars */}
          {rows.map((r, i) => {
            const h = (Math.abs(r.pl) / maxAbs) * (innerH / 2 - 4);
            const y = r.pl >= 0 ? zeroY - h : zeroY;
            const x = padL + i * barW + barW * 0.12;
            const w = barW * 0.76;
            const color = r.pl > 0 ? "var(--green)" : r.pl < 0 ? "var(--red)" : "var(--text-faint)";
            return (
              <g key={r.ym}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={Math.max(h, r.bets > 0 ? 1 : 0)}
                  fill={color}
                  opacity="0.75"
                  rx="1"
                >
                  <title>
                    {r.label} · {r.bets} bets · {fmtUnit(r.pl, unit, { signed: true })}
                    {r.stake > 0 ? ` · ${r.yieldPct >= 0 ? "+" : "−"}${Math.abs(r.yieldPct).toFixed(1)}% yield` : ""}
                  </title>
                </rect>
              </g>
            );
          })}
          {/* x labels — cadence scales with row count to prevent overcrowd. */}
          {rows.map((r, i) => {
            // For year-cadence, anchor labels on January starts so the axis
            // reads as clean "2014 · 2015 · 2016". For shorter spans just
            // every-Nth from the left edge.
            const isLast = i === rows.length - 1;
            let show: boolean;
            if (labelEveryN >= 12) {
              const month = parseInt(r.ym.slice(5, 7), 10);
              show = month === 1 || isLast || i === 0;
            } else {
              show = i % labelEveryN === 0 || isLast;
            }
            if (!show) return null;
            // For yearly cadence drop the "Mon '" prefix — just show the year.
            const text =
              labelEveryN >= 12
                ? `'${r.ym.slice(2, 4)}`
                : r.label;
            return (
              <text
                key={`xl${i}`}
                x={padL + i * barW + barW / 2}
                y={H - padB / 3}
                textAnchor="middle"
                fontFamily="var(--mono)"
                fontSize="10"
                fill="var(--text-faint)"
              >
                {text}
              </text>
            );
          })}
          {/* y axis labels */}
          <text x={padL - 6} y={padT + 4} textAnchor="end" fontFamily="var(--mono)" fontSize="10" fill="var(--text-faint)">
            {fmtUnit(maxAbs, unit, { signed: true, dp: 0 })}
          </text>
          <text x={padL - 6} y={zeroY + 3} textAnchor="end" fontFamily="var(--mono)" fontSize="10" fill="var(--text-faint)">
            0
          </text>
          <text x={padL - 6} y={padT + innerH + 3} textAnchor="end" fontFamily="var(--mono)" fontSize="10" fill="var(--text-faint)">
            −{Math.round(maxAbs)}{unit === "u" ? "u" : ""}
          </text>
        </svg>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────

type CalView = "week" | "month" | "year";

function CalendarPanel({
  bets,
  unit,
}: {
  bets: ImportedBet[];
  unit: DisplayUnit;
}) {
  const now = useMemo(() => new Date(), []);
  const [view, setView] = useState<CalView>("month");
  // The cursor anchors the visible period. For week view it's a date in the
  // visible week; for month/year, just inside the period.
  const [cursor, setCursor] = useState<Date>(now);

  const todayIso = isoDateLocal(now);

  const bounds = useMemo(() => {
    if (bets.length === 0) return null;
    let minMs = Infinity;
    let maxMs = -Infinity;
    for (const b of bets) {
      const t = new Date(b.kickoff).getTime();
      if (t < minMs) minMs = t;
      if (t > maxMs) maxMs = t;
    }
    return { earliest: new Date(minMs), latest: new Date(maxMs) };
  }, [bets]);

  // Navigation handlers: step by view unit.
  const step = (dir: -1 | 1) => {
    const c = new Date(cursor);
    if (view === "week") {
      c.setDate(c.getDate() + 7 * dir);
    } else if (view === "month") {
      c.setMonth(c.getMonth() + dir, 1);
    } else {
      c.setFullYear(c.getFullYear() + dir, 0, 1);
    }
    setCursor(c);
  };
  const goToday = () => setCursor(new Date());

  // Bounds check — disable navigation past the user's actual data span.
  const prevDisabled = (() => {
    if (!bounds) return false;
    const c = new Date(cursor);
    if (view === "week") c.setDate(c.getDate() - 7);
    else if (view === "month") c.setMonth(c.getMonth() - 1, 1);
    else c.setFullYear(c.getFullYear() - 1, 0, 1);
    return c < new Date(bounds.earliest.getFullYear(), 0, 1);
  })();
  const nextDisabled = (() => {
    if (!bounds) return false;
    const c = new Date(cursor);
    if (view === "week") c.setDate(c.getDate() + 7);
    else if (view === "month") c.setMonth(c.getMonth() + 1, 1);
    else c.setFullYear(c.getFullYear() + 1, 0, 1);
    return c > new Date(bounds.latest.getFullYear(), 11, 31);
  })();

  // Per-view label, body, and aggregates ---------------------------------

  let titleMain: React.ReactNode;
  let body: React.ReactNode;
  let totalPl = 0;
  let wins = 0;
  let losses = 0;
  let pushes = 0;
  let totalBets = 0;

  if (view === "week") {
    const w = weekCalendar(bets, cursor);
    titleMain = <span className="cal-month-only">{w.label}</span>;
    totalPl = w.totalPl;
    wins = w.wins;
    losses = w.losses;
    pushes = w.pushes;
    totalBets = w.totalBets;
    body = <WeekView w={w} todayIso={todayIso} unit={unit} />;
  } else if (view === "month") {
    const m = monthCalendar(bets, cursor.getFullYear(), cursor.getMonth());
    const monthName = new Date(m.year, m.month, 1).toLocaleDateString("en-GB", {
      month: "long",
    });
    titleMain = (
      <>
        <span className="cal-month-only">{monthName}</span>
        <span className="cal-year">{m.year}</span>
      </>
    );
    totalPl = m.totalPl;
    wins = m.wins;
    losses = m.losses;
    pushes = m.pushes;
    totalBets = m.totalBets;
    body = <MonthView m={m} todayIso={todayIso} unit={unit} />;
  } else {
    const y = yearCalendar(bets, cursor.getFullYear());
    titleMain = <span className="cal-month-only">{y.year}</span>;
    totalPl = y.totalPl;
    wins = y.wins;
    losses = y.losses;
    pushes = y.pushes;
    totalBets = y.totalBets;
    body = (
      <YearView
        y={y}
        unit={unit}
        onDrill={(mc) => {
          setCursor(new Date(mc.year, mc.month, 1));
          setView("month");
        }}
      />
    );
  }

  const settled = wins + losses;
  const winRate = settled > 0 ? (wins / settled) * 100 : 0;

  return (
    <div className="card cal" style={{ marginTop: 14, padding: 0 }}>
      <div className="cal-head">
        <h2 className="cal-title">{titleMain}</h2>
        <div style={{ display: "inline-flex", alignItems: "center" }}>
          <div className="cal-views" role="tablist" aria-label="Calendar view">
            {(["week", "month", "year"] as CalView[]).map((v) => (
              <button
                key={v}
                type="button"
                className="cal-views-btn"
                data-active={view === v ? "true" : undefined}
                onClick={() => setView(v)}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="cal-nav">
            <button
              type="button"
              className="cal-nav-btn"
              onClick={() => step(-1)}
              disabled={prevDisabled}
              title={`Previous ${view}`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 3l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={goToday}
              style={{ padding: "4px 10px", fontSize: 11 }}
            >
              Today
            </button>
            <button
              type="button"
              className="cal-nav-btn"
              onClick={() => step(1)}
              disabled={nextDisabled}
              title={`Next ${view}`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {body}

      <div className="cal-foot">
        <div className="cal-foot-block">
          <span className="cal-foot-label">Record</span>
          <span className="cal-foot-value">
            {wins}–{losses}
            {pushes > 0 ? `–${pushes}` : ""}
          </span>
        </div>
        <div className="cal-foot-block">
          <span className="cal-foot-label">Win rate</span>
          <span className="cal-foot-value">
            {settled > 0 ? `${winRate.toFixed(1)}%` : "—"}
          </span>
        </div>
        <div className="cal-foot-block">
          <span className="cal-foot-label">Bets</span>
          <span className="cal-foot-value">
            {totalBets.toLocaleString()}
          </span>
        </div>
        <div
          className="cal-foot-block"
          style={{ marginLeft: "auto", alignItems: "flex-end" }}
        >
          <span className="cal-foot-label">Profit</span>
          <span
            className="cal-foot-value cal-foot-value--big"
            style={{
              color:
                totalPl > 0
                  ? "var(--green)"
                  : totalPl < 0
                    ? "var(--red)"
                    : "var(--text-muted)",
            }}
          >
            {fmtUnit(totalPl, unit, { signed: true, dp: totalPl === 0 ? 0 : 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}

// Sub-views ----------------------------------------------------------------

function MonthView({
  m,
  todayIso,
  unit,
}: {
  m: MonthCalendar;
  todayIso: string;
  unit: DisplayUnit;
}) {
  const heatMax = Math.max(Math.abs(m.bestDayPl), Math.abs(m.worstDayPl), 1);
  return (
    <div className="cal-grid">
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
        <div className="cal-weekday" key={d}>{d}</div>
      ))}
      {m.cells.map((c) => (
        <CalCell
          key={c.dateIso}
          c={c}
          heatMax={heatMax}
          isToday={c.dateIso === todayIso}
          unit={unit}
        />
      ))}
    </div>
  );
}

function WeekView({
  w,
  todayIso,
  unit,
}: {
  w: WeekCalendar;
  todayIso: string;
  unit: DisplayUnit;
}) {
  const heatMax = Math.max(Math.abs(w.bestDayPl), Math.abs(w.worstDayPl), 1);
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="cal-week">
      {w.days.map((c, i) => {
        const cls = ["cal-week-cell"];
        let intensity = 0.7;
        if (c.pl > 0) {
          intensity = 0.55 + 0.40 * Math.min(1, Math.abs(c.pl) / heatMax);
          cls.push("cal-week-cell--green");
        } else if (c.pl < 0) {
          intensity = 0.55 + 0.40 * Math.min(1, Math.abs(c.pl) / heatMax);
          cls.push("cal-week-cell--red");
        }
        if (c.dateIso === todayIso) cls.push("cal-week-cell--today");
        const settled = c.wins + c.losses;
        return (
          <div
            key={c.dateIso}
            className={cls.join(" ")}
            style={{ ["--cal-intensity" as string]: intensity }}
            title={
              c.bets === 0
                ? c.dateIso
                : `${c.dateIso} · ${c.bets} bet${c.bets === 1 ? "" : "s"} · ${c.wins}W/${c.losses}L${c.pushes > 0 ? `/${c.pushes}P` : ""}`
            }
          >
            <div className="cal-week-cell-head">
              <span className="cal-week-cell-day">{c.day}</span>
              <span className="cal-week-cell-name">{dayNames[i]}</span>
            </div>
            {c.bets > 0 ? (
              <>
                <div className="cal-week-cell-pl">
                  {c.pl === 0
                    ? "flat"
                    : fmtUnit(c.pl, unit, { signed: true, dp: 0, compact: true })}
                </div>
                <div className="cal-week-cell-meta">
                  {c.bets} bet{c.bets === 1 ? "" : "s"} · {c.wins}W/{c.losses}L
                  {settled > 0 ? ` · ${((c.wins / settled) * 100).toFixed(0)}%` : ""}
                </div>
              </>
            ) : (
              <div className="cal-week-cell-meta" style={{ marginTop: "auto" }}>
                no action
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function YearView({
  y,
  unit,
  onDrill,
}: {
  y: YearCalendar;
  unit: DisplayUnit;
  onDrill: (m: MonthCalendar) => void;
}) {
  // One shared magnitude scale across all months so the busiest day of the
  // year reads as the most-saturated cell anywhere in the grid.
  const heatMax = Math.max(Math.abs(y.bestDayPl), Math.abs(y.worstDayPl), 1);
  return (
    <div className="cal-year">
      {y.months.map((m) => (
        <YearMonth
          key={`${m.year}-${m.month}`}
          m={m}
          heatMax={heatMax}
          unit={unit}
          onDrill={() => onDrill(m)}
        />
      ))}
    </div>
  );
}

function YearMonth({
  m,
  heatMax,
  unit,
  onDrill,
}: {
  m: MonthCalendar;
  heatMax: number;
  unit: DisplayUnit;
  onDrill: () => void;
}) {
  const monthLabel = new Date(m.year, m.month, 1).toLocaleDateString("en-GB", {
    month: "short",
  });
  return (
    <div
      className="cal-year-month"
      onClick={onDrill}
      role="button"
      title={`Open ${monthLabel} ${m.year}`}
    >
      <div className="cal-year-month-head">
        <span className="cal-year-month-title">{monthLabel}</span>
        <span
          className="cal-year-month-pl"
          style={{
            color:
              m.totalPl > 0
                ? "var(--green)"
                : m.totalPl < 0
                  ? "var(--red)"
                  : "var(--text-faint)",
          }}
        >
          {m.totalBets === 0
            ? "—"
            : fmtUnit(m.totalPl, unit, { signed: true, dp: 0, compact: true })}
        </span>
      </div>
      <div className="cal-year-month-grid">
        {m.cells.map((c) => {
          if (!c.inMonth) {
            return <div className="cal-year-cell cal-year-cell--out" key={c.dateIso} />;
          }
          const cls = ["cal-year-cell"];
          // Bumped min from 0.5 to 0.6 so cells stay saturated enough for
          // the embedded P/L text to read on dark themes (terminal, slate).
          let intensity = 0.7;
          if (c.pl > 0) {
            intensity = 0.6 + 0.35 * Math.min(1, Math.abs(c.pl) / heatMax);
            cls.push("cal-year-cell--green");
          } else if (c.pl < 0) {
            intensity = 0.6 + 0.35 * Math.min(1, Math.abs(c.pl) / heatMax);
            cls.push("cal-year-cell--red");
          } else if (c.bets > 0) {
            cls.push("cal-year-cell--break");
          }
          // Render P/L as a small signed integer inside the cell. Three
          // states:
          //   - no bets that day  → empty cell
          //   - net non-zero      → "+4" / "-2"
          //   - net exactly zero  → "·" (push/void day, has bets but flat)
          let label: string | null = null;
          if (c.bets > 0) {
            const n = Math.round(c.pl);
            if (n > 0) label = `+${n}`;
            else if (n < 0) label = `${n}`;
            else label = "·";
          }
          return (
            <div
              key={c.dateIso}
              className={cls.join(" ")}
              style={{ ["--cal-intensity" as string]: intensity }}
              title={
                c.bets === 0
                  ? c.dateIso
                  : `${c.dateIso} · ${c.bets} bet${c.bets === 1 ? "" : "s"} · ${fmtUnit(c.pl, unit, { signed: true, dp: 0 })}`
              }
            >
              {label && (
                <span className="cal-year-cell-pl">{label}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalCell({
  c,
  heatMax,
  isToday,
  unit,
}: {
  c: CalendarDay;
  heatMax: number;
  isToday: boolean;
  unit: DisplayUnit;
}) {
  if (!c.inMonth) {
    return (
      <div className="cal-cell cal-cell--out">
        <div className="cal-cell-day">{c.day}</div>
      </div>
    );
  }
  const cls = ["cal-cell"];
  // Intensity scales 0.55–0.95 — small days still look like solid blocks,
  // biggest day of the month is the most saturated. Below 0.55 the colour
  // washes out and you can't distinguish from no-action.
  let intensity = 0.7;
  if (c.pl > 0) {
    intensity = 0.55 + 0.40 * Math.min(1, Math.abs(c.pl) / heatMax);
    cls.push("cal-cell--green");
  } else if (c.pl < 0) {
    intensity = 0.55 + 0.40 * Math.min(1, Math.abs(c.pl) / heatMax);
    cls.push("cal-cell--red");
  } else if (c.bets > 0) {
    // Settled to exactly zero (e.g. push / void days, or matched wins and losses).
    cls.push("cal-cell--break");
  }
  if (isToday) cls.push("cal-cell--today");

  const settled = c.wins + c.losses;
  const tooltip =
    c.bets === 0
      ? c.dateIso
      : `${c.dateIso} · ${c.bets} bet${c.bets === 1 ? "" : "s"} · ${c.wins}W/${c.losses}L${c.pushes > 0 ? `/${c.pushes}P` : ""}${settled > 0 ? ` · ${((c.wins / settled) * 100).toFixed(0)}% wr` : ""}`;

  return (
    <div
      className={cls.join(" ")}
      style={{ ["--cal-intensity" as string]: intensity }}
      title={tooltip}
    >
      <div className="cal-cell-day">{c.day}</div>
      {c.bets > 0 && (
        <div className="cal-cell-pl">
          {c.pl === 0
            ? "flat"
            : fmtUnit(c.pl, unit, { signed: true, dp: 0, compact: true })}
        </div>
      )}
    </div>
  );
}

function isoDateLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────

type MarketSortKey = "pl" | "yieldPct" | "bets" | "winRate";

function MarketPanel({
  rows,
  unit,
}: {
  rows: MarketRow[];
  unit: DisplayUnit;
}) {
  const [sortKey, setSortKey] = useState<MarketSortKey>("pl");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  const onSort = (k: MarketSortKey) => {
    if (k === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir("desc");
    }
  };

  const arrow = (k: MarketSortKey) =>
    sortKey === k ? (
      <span className="sort-arrow">{sortDir === "asc" ? "↑" : "↓"}</span>
    ) : null;

  const best = sorted.length > 0 ? [...sorted].sort((a, b) => b.pl - a.pl)[0] : null;
  const worst = sorted.length > 0 ? [...sorted].sort((a, b) => a.pl - b.pl)[0] : null;

  if (rows.length === 0) {
    return (
      <div className="card" style={{ marginTop: 14, padding: 0 }}>
        <div className="card-header">
          <div>
            <div className="card-title">By market</div>
            <div className="card-meta" style={{ marginTop: 4 }}>
              <span>Where the edge actually lives — BTTS, AH, O/U, totals…</span>
            </div>
          </div>
        </div>
        <div
          style={{
            padding: 24,
            fontSize: 12,
            color: "var(--text-faint)",
            textAlign: "center",
          }}
        >
          No market has 20+ settled bets yet.
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: 14, padding: 0, overflow: "hidden" }}>
      <div className="card-header">
        <div>
          <div className="card-title">By market</div>
          <div className="card-meta" style={{ marginTop: 4 }}>
            <span>Where the edge actually lives</span>
            {best && worst && best.key !== worst.key && (
              <>
                <span style={{ color: "var(--text-faint)" }}>·</span>
                <span>
                  Best:{" "}
                  <span className="mono" style={{ color: "var(--green)" }}>
                    {best.label} {fmtUnit(best.pl, unit, { signed: true, dp: 0 })}
                  </span>
                </span>
                <span style={{ color: "var(--text-faint)" }}>·</span>
                <span>
                  Worst:{" "}
                  <span className="mono" style={{ color: "var(--red)" }}>
                    {worst.label} {fmtUnit(worst.pl, unit, { signed: true, dp: 0 })}
                  </span>
                </span>
              </>
            )}
            <span style={{ color: "var(--text-faint)" }}>·</span>
            <span>Sample suppressed below 20</span>
          </div>
        </div>
      </div>
      <table className="tbl" data-density="dense">
        <thead>
          <tr>
            <th>Market</th>
            <th className="num sortable" onClick={() => onSort("pl")}>
              P/L {arrow("pl")}
            </th>
            <th className="num sortable" onClick={() => onSort("yieldPct")}>
              Yield {arrow("yieldPct")}
            </th>
            <th className="num sortable" onClick={() => onSort("winRate")}>
              Win rate {arrow("winRate")}
            </th>
            <th className="num">Avg odds</th>
            <th className="num sortable" onClick={() => onSort("bets")}>
              Bets {arrow("bets")}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const plColor =
              r.pl > 0 ? "num-pos" : r.pl < 0 ? "num-neg" : "num-flat";
            const yieldColor =
              r.yieldPct > 0
                ? "num-pos"
                : r.yieldPct < 0
                  ? "num-neg"
                  : "num-flat";
            return (
              <tr key={r.key}>
                <td>{r.label}</td>
                <td className={`num ${plColor}`}>
                  {fmtUnit(r.pl, unit, { signed: true, dp: 0 })}
                </td>
                <td className={`num ${yieldColor}`}>
                  {r.yieldPct >= 0 ? "+" : "−"}
                  {Math.abs(r.yieldPct).toFixed(2)}%
                </td>
                <td className="num">{r.winRate.toFixed(1)}%</td>
                <td className="num">{r.avgOdds.toFixed(2)}</td>
                <td className="num mono" style={{ fontSize: 11 }}>
                  {r.bets.toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────

function SeasonalPanel({
  rows,
  unit,
}: {
  rows: SeasonalMonthRow[];
  unit: DisplayUnit;
}) {
  // Only rows with meaningful sample influence the scale — otherwise a
  // 3-bet outlier month would crush every legitimate bar.
  const eligible = rows.filter((r) => r.bets >= 20);
  const maxAbs = Math.max(...eligible.map((r) => Math.abs(r.pl)), 1);
  const best = eligible.length
    ? [...eligible].sort((a, b) => b.pl - a.pl)[0]
    : null;
  const worst = eligible.length
    ? [...eligible].sort((a, b) => a.pl - b.pl)[0]
    : null;
  const yearsSeen = Math.max(...rows.map((r) => r.years), 0);
  return (
    <div className="card dist-card" style={{ marginTop: 14 }}>
      <div className="card-header">
        <div>
          <div className="card-title">Most profitable months</div>
          <div className="card-meta" style={{ marginTop: 4 }}>
            <span>Calendar month, pooled across {yearsSeen} year{yearsSeen === 1 ? "" : "s"}</span>
            {best && worst && best.label !== worst.label && (
              <>
                <span style={{ color: "var(--text-faint)" }}>·</span>
                <span>
                  Best:{" "}
                  <span className="mono" style={{ color: "var(--green)" }}>
                    {best.label} {fmtUnit(best.pl, unit, { signed: true, dp: 0 })}
                  </span>
                </span>
                <span style={{ color: "var(--text-faint)" }}>·</span>
                <span>
                  Worst:{" "}
                  <span className="mono" style={{ color: "var(--red)" }}>
                    {worst.label} {fmtUnit(worst.pl, unit, { signed: true, dp: 0 })}
                  </span>
                </span>
              </>
            )}
            <span style={{ color: "var(--text-faint)" }}>·</span>
            <span>Sample suppressed below 20</span>
          </div>
        </div>
      </div>
      <div className="breakdown" style={{ maxWidth: 880, padding: "6px 0" }}>
        {rows.map((r) => {
          const hide = r.bets < 20;
          const w = (Math.abs(r.pl) / maxAbs) * 50;
          const left = r.pl >= 0 ? 50 : 50 - w;
          const color = r.pl >= 0 ? "var(--green)" : "var(--red)";
          const yieldText =
            !hide && r.stake > 0
              ? `${r.yieldPct >= 0 ? "+" : "−"}${Math.abs(r.yieldPct).toFixed(1)}% yield`
              : "";
          return (
            <div
              className="bk-row"
              key={r.label}
              style={{
                gridTemplateColumns: "44px minmax(0, 1fr) 120px",
                padding: "3px 20px",
                fontSize: 11.5,
              }}
              title={
                hide
                  ? `${r.label}: ${r.bets} bets — sample too small`
                  : `${r.label} · ${r.bets} bets across ${r.years} years · ${yieldText} · total ${fmtUnit(r.pl, unit, { signed: true, dp: 0 })}`
              }
            >
              <div className="bk-label">{r.label}</div>
              <div className="bk-bar">
                <div className="bk-zero" style={{ left: "50%" }}></div>
                {!hide && (
                  <div
                    className="bk-bar-fill"
                    style={{
                      left: `${left}%`,
                      width: `${w}%`,
                      background: color,
                      opacity: 0.55,
                    }}
                  ></div>
                )}
              </div>
              <div>
                <div
                  className="bk-val"
                  style={{ color: hide ? "var(--text-faint)" : color }}
                >
                  {hide ? "—" : fmtUnit(r.pl, unit, { signed: true, dp: 0 })}
                </div>
                <div className="bk-sample" style={{ whiteSpace: "nowrap" }}>
                  {hide
                    ? `n=${r.bets}`
                    : `${fmtUnit(r.avgPlPerYear, unit, { signed: true, dp: 0 })}/yr · ${r.years}y`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────

function DowPanel({ rows, unit }: { rows: DowRow[]; unit: DisplayUnit }) {
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.yieldPct)), 1);
  return (
    <div className="card dist-card">
      <div className="card-header">
        <div>
          <div className="card-title">By day of week</div>
          <div className="card-meta" style={{ marginTop: 4 }}>
            <span>Yield · sample suppressed below 20</span>
          </div>
        </div>
      </div>
      <div className="breakdown">
        {rows.map((r) => {
          const hide = r.bets < 20;
          const w = (Math.abs(r.yieldPct) / maxAbs) * 50;
          const left = r.yieldPct >= 0 ? 50 : 50 - w;
          const color = r.yieldPct >= 0 ? "var(--green)" : "var(--red)";
          return (
            <div className="bk-row" key={r.label}>
              <div className="bk-label">{r.label}</div>
              <div className="bk-bar">
                <div className="bk-zero" style={{ left: "50%" }}></div>
                {!hide && (
                  <div
                    className="bk-bar-fill"
                    style={{
                      left: `${left}%`,
                      width: `${w}%`,
                      background: color,
                      opacity: 0.55,
                    }}
                  ></div>
                )}
              </div>
              <div>
                <div
                  className="bk-val"
                  style={{ color: hide ? "var(--text-faint)" : color }}
                >
                  {hide
                    ? "—"
                    : `${r.yieldPct >= 0 ? "+" : "−"}${Math.abs(r.yieldPct).toFixed(2)}%`}
                </div>
                <div className="bk-sample">
                  n={r.bets}
                  {!hide ? ` · ${fmtUnit(r.pl, unit, { signed: true, dp: 0 })}` : ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────

function StakePanel({ rows, unit }: { rows: StakeBucketRow[]; unit: DisplayUnit }) {
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.yieldPct)), 1);
  return (
    <div className="card dist-card">
      <div className="card-header">
        <div>
          <div className="card-title">By stake size</div>
          <div className="card-meta" style={{ marginTop: 4 }}>
            <span>Does confidence track edge?</span>
          </div>
        </div>
      </div>
      <div className="breakdown">
        {rows.length === 0 ? (
          <div style={{ padding: 18, fontSize: 12, color: "var(--text-faint)" }}>
            Not enough volume in any bucket yet (need 20+ bets).
          </div>
        ) : (
          rows.map((r) => {
            const w = (Math.abs(r.yieldPct) / maxAbs) * 50;
            const left = r.yieldPct >= 0 ? 50 : 50 - w;
            const color = r.yieldPct >= 0 ? "var(--green)" : "var(--red)";
            return (
              <div className="bk-row" key={r.label}>
                <div className="bk-label">{r.label}</div>
                <div className="bk-bar">
                  <div className="bk-zero" style={{ left: "50%" }}></div>
                  <div
                    className="bk-bar-fill"
                    style={{
                      left: `${left}%`,
                      width: `${w}%`,
                      background: color,
                      opacity: 0.55,
                    }}
                  ></div>
                </div>
                <div>
                  <div className="bk-val" style={{ color }}>
                    {r.yieldPct >= 0 ? "+" : "−"}
                    {Math.abs(r.yieldPct).toFixed(2)}%
                  </div>
                  <div className="bk-sample">
                    n={r.bets} · {fmtUnit(r.pl, unit, { signed: true, dp: 0 })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
