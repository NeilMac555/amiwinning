interface WeeklyBarsProps {
  weekly: number[];
}

export function WeeklyBars({ weekly }: WeeklyBarsProps) {
  const W = 920,
    H = 56,
    padL = 36,
    padR = 28;
  const innerW = W - padL - padR;
  const max = Math.max(...weekly.map(Math.abs)) || 1;
  const barW = innerW / weekly.length;
  const zeroY = H / 2;
  return (
    <>
      <div className="equity-bars-label">
        <span>Weekly P/L · 52w</span>
        <span>Bar = one week</span>
      </div>
      <div className="equity-bars-wrap">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          style={{ height: H }}
        >
          <line
            x1={padL}
            x2={W - padR}
            y1={zeroY}
            y2={zeroY}
            stroke="var(--border-strong)"
            strokeWidth="0.5"
          />
          {weekly.map((v, i) => {
            const h = (Math.abs(v) / max) * (H / 2 - 4);
            const y = v >= 0 ? zeroY - h : zeroY;
            const x = padL + i * barW + barW * 0.15;
            const w = barW * 0.7;
            const color = v >= 0 ? "var(--green)" : "var(--red)";
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={w}
                height={h}
                fill={color}
                opacity="0.7"
                rx="0.5"
              />
            );
          })}
        </svg>
      </div>
    </>
  );
}
