"use client";

// First-run ghost preview shown on the dashboard and analytics pages
// when the active book has zero committed bets. Sits below PasteHero on
// the dashboard and replaces the analytics body on /analytics.
//
// Presentational only — reads a static fixture, never any real bet
// data. Content below the header renders at 65% opacity with
// pointer-events: none so it reads as a preview rather than the actual
// state.
//
// Consumers pass an optional `closing` React node for the centred line
// under the ghost. The dashboard passes plain text; the analytics
// variant passes a link back to the dashboard.

import type { ReactNode } from "react";
import { SAMPLE_BOOK } from "@/lib/first-run-fixture";

interface Props {
  closing?: ReactNode;
}

// Format helpers scoped to the ghost — the fixture is tiny and this
// avoids pulling the full fmtStake/fmtPL system just to render four
// static numbers. If we ever theme these ghost numbers off user
// settings, swap in the shared formatters.
function fmtSignedU(v: number): string {
  const abs = Math.abs(v);
  const s = abs % 1 === 0 ? String(abs) : abs.toFixed(2).replace(/0$/, "");
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${s}u`;
}
function fmtSignedPct(v: number): string {
  const abs = Math.abs(v);
  const s = abs % 1 === 0 ? String(abs) : abs.toFixed(1);
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${s}%`;
}

export function GhostPreview({ closing }: Props) {
  const { kpis, equity, bets } = SAMPLE_BOOK;

  // Build the equity polyline "x,y x,y ..." attribute. Fixture points
  // are in 0..100 space; the SVG viewBox matches so this is a direct
  // pass-through. Y is flipped because SVG y grows downward but the
  // fixture uses "higher = more profit" convention.
  const polylinePoints = equity.map((p) => `${p.x},${100 - p.y}`).join(" ");
  const areaPoints = `0,100 ${polylinePoints} 100,100`;

  return (
    <section className="ghost-preview" aria-label="First-run preview">
      <header className="ghost-preview-head">
        <span className="ghost-preview-title">
          After your first parse, this becomes yours
        </span>
        <span className="ghost-preview-pill">Sample data</span>
      </header>

      {/* Preview wrapper — opacity + pointer-events applied here so the
          closing line below can be interactive without opting out of
          the effect per-element. */}
      <div className="ghost-preview-body" aria-hidden="true">
        <div className="ghost-preview-kpis">
          <div className="ghost-preview-kpi">
            <div className="ghost-preview-kpi-label">Profit / loss</div>
            <div
              className={`ghost-preview-kpi-value ${
                kpis.pl > 0
                  ? "num-pos"
                  : kpis.pl < 0
                    ? "num-neg"
                    : "num-flat"
              }`}
            >
              {fmtSignedU(kpis.pl)}
            </div>
          </div>
          <div className="ghost-preview-kpi">
            <div className="ghost-preview-kpi-label">ROI</div>
            <div
              className={`ghost-preview-kpi-value ${
                kpis.roi > 0
                  ? "num-pos"
                  : kpis.roi < 0
                    ? "num-neg"
                    : "num-flat"
              }`}
            >
              {fmtSignedPct(kpis.roi)}
            </div>
          </div>
          <div className="ghost-preview-kpi">
            <div className="ghost-preview-kpi-label">Strike rate</div>
            <div className="ghost-preview-kpi-value">
              {kpis.strikeRate}%
            </div>
          </div>
          <div className="ghost-preview-kpi">
            <div className="ghost-preview-kpi-label">Bets tracked</div>
            <div className="ghost-preview-kpi-value">
              {kpis.betsTracked.toLocaleString("en-US")}
            </div>
          </div>
        </div>

        <div className="ghost-preview-card">
          <div className="ghost-preview-card-label">Cumulative P/L</div>
          <svg
            className="ghost-preview-chart"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {/* Faint zero baseline for visual grounding */}
            <line
              x1="0"
              x2="100"
              y1="100"
              y2="100"
              stroke="var(--border)"
              strokeWidth="0.5"
            />
            {/* Area fill for depth */}
            <polygon
              points={areaPoints}
              fill="var(--green)"
              opacity="0.08"
            />
            {/* Main equity path */}
            <polyline
              points={polylinePoints}
              fill="none"
              stroke="var(--green)"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        <div className="ghost-preview-card ghost-preview-betlog">
          {bets.map((b, i) => {
            const tone =
              b.pl > 0 ? "num-pos" : b.pl < 0 ? "num-neg" : "num-flat";
            return (
              <div key={i} className="ghost-preview-bet-row">
                <span className="ghost-preview-bet-text">{b.text}</span>
                <span className={`ghost-preview-bet-pl ${tone}`}>
                  {fmtSignedU(b.pl)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Closing line — rendered outside the pointer-events: none
          wrapper so any Link inside remains interactive. Default text
          matches the dashboard mockup; analytics passes a Link back
          to the dashboard. */}
      <div className="ghost-preview-closing">
        {closing ?? "Parse your first bets and this becomes your real record"}
      </div>
    </section>
  );
}
