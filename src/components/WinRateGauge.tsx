"use client";

// Win-rate donut gauge. Visualises the user's settled-bet win rate as a
// circular progress arc, with the % at centre and a break-even comparison
// underneath. Above break-even (1 / avgOdds) it tints green; below, red.

interface Props {
  winRatePct: number;
  wins: number;
  settledCount: number;
  /** Average decimal odds — break-even is 100 / avgOdds. */
  avgOdds: number;
}

export function WinRateGauge({
  winRatePct,
  wins,
  settledCount,
  avgOdds,
}: Props) {
  const size = 124;
  const stroke = 13;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, winRatePct));
  const dash = (pct / 100) * circ;
  const breakEven = avgOdds > 0 ? 100 / avgOdds : 0;
  const above = winRatePct >= breakEven && breakEven > 0;
  const ringColor = !breakEven
    ? "var(--text-muted)"
    : above
      ? "var(--green)"
      : "var(--red)";
  const deltaPP = winRatePct - breakEven;

  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="kpi-label" style={{ marginBottom: 4 }}>
        Win rate
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--surface-2)"
            strokeWidth={stroke}
            fill="none"
          />
          {/* Break-even tick — small notch on the ring at break-even % position */}
          {breakEven > 0 && (
            <line
              x1={size / 2}
              y1={stroke / 2 + 1}
              x2={size / 2}
              y2={stroke + 4}
              stroke="var(--text-faint)"
              strokeWidth="1.5"
              strokeLinecap="round"
              transform={`rotate(${(breakEven / 100) * 360} ${size / 2} ${size / 2})`}
            />
          )}
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${dash} ${circ}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.35s ease" }}
          />
          {/* Centre label */}
          <text
            x={size / 2}
            y={size / 2 - 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--text)"
            fontFamily="var(--serif)"
            fontSize="26"
            fontWeight="500"
            style={{
              fontVariationSettings: '"opsz" 48, "SOFT" 50',
              letterSpacing: "-0.02em",
            }}
          >
            {winRatePct.toFixed(1)}%
          </text>
          <text
            x={size / 2}
            y={size / 2 + 18}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--text-faint)"
            fontFamily="var(--mono)"
            fontSize="9"
            letterSpacing="0.08em"
          >
            WIN RATE
          </text>
        </svg>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            {wins.toLocaleString()}
            <span style={{ color: "var(--text-faint)" }}> / </span>
            {settledCount.toLocaleString()}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-faint)",
              marginTop: 2,
            }}
          >
            settled bets won
          </div>
          {breakEven > 0 && (
            <div
              style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: "var(--border-w) solid var(--border)",
                fontSize: 11,
                color: "var(--text-muted)",
              }}
            >
              <div>
                Break-even:{" "}
                <span className="mono" style={{ color: "var(--text)" }}>
                  {breakEven.toFixed(1)}%
                </span>
              </div>
              <div
                style={{
                  marginTop: 3,
                  fontFamily: "var(--mono)",
                  fontWeight: 600,
                  color: above ? "var(--green)" : "var(--red)",
                }}
              >
                {above ? "+" : "−"}
                {Math.abs(deltaPP).toFixed(2)}pp
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
