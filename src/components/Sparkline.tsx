interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  fill?: boolean;
}

export function Sparkline({
  data,
  color = "currentColor",
  width = 64,
  height = 22,
  fill = false,
}: SparklineProps) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data.map(
    (v, i) =>
      [i * stepX, height - ((v - min) / range) * (height - 2) - 1] as const,
  );
  const d = points
    .map((p, i) =>
      i === 0
        ? `M${p[0].toFixed(1)},${p[1].toFixed(1)}`
        : `L${p[0].toFixed(1)},${p[1].toFixed(1)}`,
    )
    .join(" ");
  const last = points[points.length - 1];
  const fillD = fill ? `${d} L${width},${height} L0,${height} Z` : "";
  const zeroY =
    min < 0 && max > 0 ? height - ((0 - min) / range) * (height - 2) - 1 : null;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {zeroY != null && (
        <line
          x1="0"
          x2={width}
          y1={zeroY}
          y2={zeroY}
          stroke="currentColor"
          strokeWidth="0.5"
          opacity="0.18"
          strokeDasharray="2 2"
        />
      )}
      {fill && <path d={fillD} fill={color} opacity="0.08" />}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="1.6" fill={color} />
    </svg>
  );
}
