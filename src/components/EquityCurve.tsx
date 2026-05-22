"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { EquityData } from "@/lib/data";
import { fmtPct } from "@/lib/format";
import { fmtUnit, useUnit } from "./UnitContext";
import { WeeklyBars } from "./WeeklyBars";

import type { Range } from "@/lib/range";

interface EquityCurveProps {
  data: EquityData;
  weekly: number[];
  lastBetAgo?: string;
  /** "cumulative": Y axis is cumulative P/L starting at 0 (real imported data).
   *  "bankroll": Y axis is a running bankroll balance (mock demo data). */
  mode?: "cumulative" | "bankroll";
  /** Selected range, controlled by the parent dashboard. */
  range?: Range;
  onRangeChange?: (r: Range) => void;
}

export function EquityCurve({
  data,
  weekly,
  lastBetAgo,
  mode = "bankroll",
  range,
}: EquityCurveProps) {
  const unit = useUnit();
  const { points } = data;
  const W = 920;
  const H = 280;
  const padL = 36,
    padR = 28,
    padT = 8,
    padB = 26;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const eqs = points.map((p) => p.equity);
  const clvs = points.map((p) => p.clvPct);
  const eqMin = Math.min(...eqs);
  const eqMax = Math.max(...eqs);
  const eqRange = eqMax - eqMin || 1;
  const clvMin = Math.min(...clvs, 0);
  const clvMax = Math.max(...clvs, 0.1);
  const clvRange = clvMax - clvMin || 1;

  const xOf = (i: number) => padL + (i / (points.length - 1)) * innerW;
  const yEq = (v: number) => padT + (1 - (v - eqMin) / eqRange) * innerH;
  const yClv = (v: number) => padT + (1 - (v - clvMin) / clvRange) * innerH;

  const eqPath = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yEq(p.equity).toFixed(1)}`,
    )
    .join(" ");
  const eqFill = `${eqPath} L${xOf(points.length - 1).toFixed(1)},${(padT + innerH).toFixed(1)} L${xOf(0).toFixed(1)},${(padT + innerH).toFixed(1)} Z`;
  const clvPath = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yClv(p.clvPct).toFixed(1)}`,
    )
    .join(" ");

  const start = points[0].equity;
  const end = points[points.length - 1].equity;
  const isCumulative = mode === "cumulative";
  const totalPL = isCumulative ? end : end - start;
  const totalPct = isCumulative || start === 0 ? 0 : (end / start - 1) * 100;
  const colorPL = totalPL >= 0 ? "var(--green)" : "var(--red)";

  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const svg = ref.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * W;
      if (x < padL || x > W - padR) {
        setHover(null);
        return;
      }
      const i = Math.min(
        points.length - 1,
        Math.max(0, Math.round(((x - padL) / innerW) * (points.length - 1))),
      );
      setHover(i);
    },
    [points.length, innerW],
  );
  const onLeave = useCallback(() => setHover(null), []);

  const hovered = hover != null ? points[hover] : null;

  const yTicks = useMemo(() => {
    const ticks = [eqMin, eqMin + eqRange * 0.5, eqMax];
    return ticks.map((v) => ({ v, y: yEq(v) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eqMin, eqRange, eqMax]);

  return (
    <div className="card equity-card">
      <div className="card-header">
        <div>
          <div className="card-title">
            {isCumulative ? "Cumulative P/L" : "Bankroll equity"}
          </div>
          <div className="card-meta" style={{ marginTop: 4 }}>
            <span>
              <span className="dot-live"></span>Live · last bet{" "}
              {lastBetAgo ?? "12m ago"}
            </span>
          </div>
        </div>
        <div className="card-actions">
          {range && (
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                color: "var(--text-faint)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {range === "All" ? "All time" : range}
            </span>
          )}
        </div>
      </div>

      <div className="equity-headline">
        <div
          className="equity-num"
          style={{ color: isCumulative ? colorPL : undefined }}
        >
          {isCumulative
            ? fmtUnit(end, unit, { signed: true, dp: 0 })
            : fmtUnit(end, unit, { dp: 0 })}
        </div>
        {!isCumulative && (
          <div className="equity-sub" style={{ color: colorPL }}>
            {fmtUnit(totalPL, unit, { signed: true, dp: 0 })}{" "}
            <span style={{ color: "var(--text-faint)", marginLeft: 4 }}>
              {fmtPct(totalPct, 2)}
            </span>
          </div>
        )}
        <div className="equity-legend">
          <span className="legend-dot" style={{ color: colorPL }}>
            {isCumulative ? "P/L" : "Equity"}
          </span>
          <span
            className="legend-dot legend-clv"
            style={{ color: "var(--text-muted)" }}
          >
            CLV (cum)
          </span>
        </div>
      </div>

      <div className="chart-wrap" onMouseMove={onMove} onMouseLeave={onLeave}>
        <svg
          ref={ref}
          viewBox={`0 0 ${W} ${H}`}
          className="chart-svg"
          preserveAspectRatio="none"
        >
          {yTicks.map((t, i) => (
            <line
              key={i}
              x1={padL}
              x2={W - padR}
              y1={t.y}
              y2={t.y}
              stroke="var(--border)"
              strokeWidth="0.5"
              strokeDasharray={i === 0 || i === yTicks.length - 1 ? "0" : "3 3"}
            />
          ))}
          <path
            d={clvPath}
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.6"
          />
          <path d={eqFill} fill={colorPL} opacity="0.05" />
          <path
            d={eqPath}
            fill="none"
            stroke={colorPL}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={xOf(points.length - 1)} cy={yEq(end)} r="3" fill={colorPL} />
          <circle
            cx={xOf(points.length - 1)}
            cy={yEq(end)}
            r="6"
            fill={colorPL}
            opacity="0.18"
          />

          {yTicks.map((t, i) => (
            <text
              key={`yt${i}`}
              x={padL - 6}
              y={t.y + 3}
              textAnchor="end"
              fontFamily="var(--mono)"
              fontSize="10"
              fill="var(--text-faint)"
            >
              {fmtUnit(Math.round(t.v), unit, { dp: 0 })}
            </text>
          ))}

          {hovered && hover != null && (
            <g>
              <line
                x1={xOf(hover)}
                x2={xOf(hover)}
                y1={padT}
                y2={padT + innerH}
                className="chart-crosshair-line"
              />
              <circle
                cx={xOf(hover)}
                cy={yEq(hovered.equity)}
                r="3"
                className="chart-cursor-dot"
              />
              <circle
                cx={xOf(hover)}
                cy={yClv(hovered.clvPct)}
                r="2.5"
                fill="var(--text-muted)"
              />
            </g>
          )}
        </svg>

        <div className="chart-axis-x">
          {Array.from({ length: 7 }).map((_, i) => {
            const idx = Math.round((points.length - 1) * (i / 6));
            return (
              <span key={i}>
                {points[idx].date.toLocaleDateString("en-GB", { month: "short" })}
              </span>
            );
          })}
        </div>

        {hovered &&
          hover != null &&
          (() => {
            const x = (xOf(hover) / W) * 100;
            const plFromStart = hovered.equity - start;
            const plColor = plFromStart >= 0 ? "var(--green)" : "var(--red)";
            const clvColor = hovered.clvPct >= 0 ? "var(--green)" : "var(--red)";
            return (
              <div
                className="chart-cursor-card"
                style={{ left: `${x}%`, top: 0 }}
              >
                <div className="when">
                  {hovered.date.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "2-digit",
                  })}
                </div>
                <div className="row">
                  <span className="lbl">{isCumulative ? "Cum P/L" : "Equity"}</span>
                  <span>{fmtUnit(Math.round(hovered.equity), unit, { signed: isCumulative, dp: 0 })}</span>
                </div>
                {!isCumulative && (
                  <div className="row">
                    <span className="lbl">P/L</span>
                    <span style={{ color: plColor }}>
                      {fmtUnit(Math.round(plFromStart), unit, { signed: true, dp: 0 })}
                    </span>
                  </div>
                )}
                <div className="row">
                  <span className="lbl">CLV</span>
                  <span style={{ color: clvColor }}>
                    {hovered.clvPct >= 0 ? "+" : "−"}
                    {Math.abs(hovered.clvPct).toFixed(2)}%
                  </span>
                </div>
                <div className="row">
                  <span className="lbl">Bets</span>
                  <span>{hovered.bets}</span>
                </div>
              </div>
            );
          })()}
      </div>

      {weekly && <WeeklyBars weekly={weekly} />}
    </div>
  );
}
