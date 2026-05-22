"use client";

import { useMemo, useState } from "react";
import type { HeatmapCell } from "@/lib/data";
import { fmtUnit, useUnit } from "./UnitContext";

interface Props {
  data: HeatmapCell[];
}

type GridCell = HeatmapCell | { future: true } | null;
type Mode = "pl" | "volume" | "clv";

export function Heatmap({ data }: Props) {
  const unit = useUnit();
  const [mode, setMode] = useState<Mode>("pl");
  const weeks = useMemo<GridCell[][]>(() => {
    if (!data.length) return [];
    const firstDate = data[0].date;
    const dayMon = (d: Date) => (d.getDay() + 6) % 7;
    const offset = dayMon(firstDate);
    const cells: GridCell[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    cells.push(...data);
    while (cells.length % 7) cells.push({ future: true });
    const out: GridCell[][] = [];
    for (let c = 0; c < cells.length / 7; c++) {
      const col: GridCell[] = [];
      for (let r = 0; r < 7; r++) col.push(cells[c * 7 + r]);
      out.push(col);
    }
    return out;
  }, [data]);

  // Scale factors per mode — capped by maxes across the data set so the chart
  // adapts to whatever the user has.
  const scale = useMemo(() => {
    const plMax = Math.max(60, ...data.map((d) => Math.abs(d.pl || 0)));
    const volMax = Math.max(1, ...data.map((d) => d.bets || 0));
    const clvMax = Math.max(
      1,
      ...data.map((d) => (d.avgClv == null ? 0 : Math.abs(d.avgClv))),
    );
    return { plMax, volMax, clvMax };
  }, [data]);

  const colorFor = (d: GridCell): string => {
    if (!d) return "transparent";
    if ("future" in d) return "transparent";
    if (!d.bets) return "var(--surface-2)";
    if (mode === "volume") {
      // Volume only — magnitude only, single colour (green, neutral hue).
      const t = Math.min(1, d.bets / scale.volMax);
      const a = 0.15 + t * 0.85;
      return `color-mix(in oklab, var(--blue) ${a * 100}%, transparent)`;
    }
    if (mode === "clv") {
      if (d.avgClv == null) return "var(--surface-2)";
      const t = Math.min(1, Math.abs(d.avgClv) / scale.clvMax);
      const a = 0.15 + t * 0.85;
      if (d.avgClv > 0)
        return `color-mix(in oklab, var(--green) ${a * 100}%, transparent)`;
      if (d.avgClv < 0)
        return `color-mix(in oklab, var(--red) ${a * 100}%, transparent)`;
      return "var(--surface-2)";
    }
    // P/L (default)
    const t = Math.min(1, Math.abs(d.pl) / scale.plMax);
    if (d.pl > 0) {
      const a = 0.15 + t * 0.85;
      return `color-mix(in oklab, var(--green) ${a * 100}%, transparent)`;
    } else if (d.pl < 0) {
      const a = 0.15 + t * 0.85;
      return `color-mix(in oklab, var(--red) ${a * 100}%, transparent)`;
    }
    return "var(--surface-2)";
  };

  const [tip, setTip] = useState<{ d: HeatmapCell; x: number; y: number } | null>(
    null,
  );
  const onEnter = (d: GridCell, e: React.MouseEvent<HTMLDivElement>) => {
    if (!d || "future" in d) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTip({ d, x: rect.left + rect.width / 2, y: rect.top });
  };
  const onLeave = () => setTip(null);

  const monthLabels = useMemo(() => {
    const out: { ci: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((col, ci) => {
      const d = col.find((c): c is HeatmapCell => c != null && !("future" in c));
      if (d && d.date && d.date.getMonth() !== lastMonth) {
        lastMonth = d.date.getMonth();
        out.push({
          ci,
          label: d.date.toLocaleDateString("en-GB", { month: "short" }),
        });
      }
    });
    return out;
  }, [weeks]);

  const totalPL = data.reduce((a, d) => a + (d.pl || 0), 0);
  const totalBets = data.reduce((a, d) => a + d.bets, 0);
  const clvDays = data.filter((d) => d.avgClv != null);
  const weightedClv =
    clvDays.length > 0
      ? clvDays.reduce((s, d) => s + (d.avgClv ?? 0), 0) / clvDays.length
      : null;
  const activeDays = data.filter((d) => d.bets > 0).length;

  return (
    <div className="card heatmap-card">
      <div className="card-header">
        <div>
          <div className="card-title">Activity</div>
          <div className="card-meta" style={{ marginTop: 4 }}>
            <span className="mono">{activeDays} active days</span>
            <span style={{ color: "var(--text-faint)" }}>·</span>
            {mode === "pl" && (
              <>
                <span
                  className="mono"
                  style={{ color: totalPL >= 0 ? "var(--green)" : "var(--red)" }}
                >
                  {fmtUnit(totalPL, unit, { signed: true, dp: 0 })}
                </span>
                <span style={{ color: "var(--text-faint)" }}>net · 365d</span>
              </>
            )}
            {mode === "volume" && (
              <>
                <span className="mono">{totalBets.toLocaleString()}</span>
                <span style={{ color: "var(--text-faint)" }}>bets · 365d</span>
              </>
            )}
            {mode === "clv" && (
              <>
                {weightedClv == null ? (
                  <span className="mono" style={{ color: "var(--text-faint)" }}>
                    no closing lines captured yet
                  </span>
                ) : (
                  <>
                    <span
                      className="mono"
                      style={{
                        color: weightedClv >= 0 ? "var(--green)" : "var(--red)",
                      }}
                    >
                      {weightedClv >= 0 ? "+" : "−"}
                      {Math.abs(weightedClv).toFixed(2)}%
                    </span>
                    <span style={{ color: "var(--text-faint)" }}>
                      avg over {clvDays.length} days
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        <div className="card-actions">
          <div className="toggle-pill">
            <button
              data-active={mode === "pl" ? "true" : undefined}
              onClick={() => setMode("pl")}
            >
              P/L
            </button>
            <button
              data-active={mode === "volume" ? "true" : undefined}
              onClick={() => setMode("volume")}
            >
              Volume
            </button>
            <button
              data-active={mode === "clv" ? "true" : undefined}
              onClick={() => setMode("clv")}
            >
              CLV
            </button>
          </div>
        </div>
      </div>

      <div className="heatmap-wrap">
        <div className="heatmap-grid">
          <div className="hm-months">
            <div></div>
            <div
              className="hm-month-row"
              style={{ width: weeks.length * 14 }}
            >
              {monthLabels.map((m) => (
                <span key={m.ci} style={{ left: m.ci * 14 }}>
                  {m.label}
                </span>
              ))}
            </div>
          </div>
          <div className="hm-body">
            <div className="hm-days">
              <div>Mon</div>
              <div></div>
              <div>Wed</div>
              <div></div>
              <div>Fri</div>
              <div></div>
              <div></div>
            </div>
            <div
              className="hm-cells"
              style={{ gridTemplateColumns: `repeat(${weeks.length}, 12px)` }}
            >
              {weeks.map((col, ci) =>
                col.map((cell, ri) => {
                  if (!cell)
                    return (
                      <div
                        key={`${ci}-${ri}`}
                        className="hm-cell"
                        style={{ background: "transparent" }}
                      />
                    );
                  const isFuture = "future" in cell;
                  const isEmpty = !isFuture && !cell.bets;
                  return (
                    <div
                      key={`${ci}-${ri}`}
                      className={`hm-cell ${isFuture ? "future" : isEmpty ? "empty" : ""}`}
                      style={{
                        background: colorFor(cell),
                        gridColumn: ci + 1,
                        gridRow: ri + 1,
                      }}
                      onMouseEnter={(e) => onEnter(cell, e)}
                      onMouseLeave={onLeave}
                    />
                  );
                }),
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="heatmap-legend">
        <span>Each cell = one day · hover for detail</span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div className="legend-scale">
            <span style={{ background: "color-mix(in oklab, var(--red) 90%, transparent)" }}></span>
            <span style={{ background: "color-mix(in oklab, var(--red) 55%, transparent)" }}></span>
            <span style={{ background: "color-mix(in oklab, var(--red) 25%, transparent)" }}></span>
            <span style={{ background: "var(--surface-2)" }}></span>
            <span style={{ background: "color-mix(in oklab, var(--green) 25%, transparent)" }}></span>
            <span style={{ background: "color-mix(in oklab, var(--green) 55%, transparent)" }}></span>
            <span style={{ background: "color-mix(in oklab, var(--green) 90%, transparent)" }}></span>
          </div>
          <span>− / +</span>
        </div>
      </div>

      {tip && (
        <div className="hm-tip" style={{ left: tip.x, top: tip.y }}>
          <div className="when">
            {tip.d.date.toLocaleDateString("en-GB", {
              weekday: "short",
              day: "2-digit",
              month: "short",
            })}
          </div>
          <div className="row">
            <span className="lbl">P/L</span>
            <span
              style={{ color: tip.d.pl >= 0 ? "var(--green)" : "var(--red)" }}
            >
              {fmtUnit(tip.d.pl, unit, { signed: true })}
            </span>
          </div>
          <div className="row">
            <span className="lbl">Bets</span>
            <span>{tip.d.bets}</span>
          </div>
          {tip.d.avgClv != null && (
            <div className="row">
              <span className="lbl">CLV</span>
              <span
                style={{
                  color: tip.d.avgClv >= 0 ? "var(--green)" : "var(--red)",
                }}
              >
                {tip.d.avgClv >= 0 ? "+" : "−"}
                {Math.abs(tip.d.avgClv).toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
