import type { ClvDistBin } from "@/lib/data";

interface Props {
  dist: ClvDistBin[];
  mean: number;
}

export function ClvDistribution({ dist, mean }: Props) {
  const max = Math.max(...dist.map((d) => d.count));
  const total = dist.reduce((a, d) => a + d.count, 0);
  return (
    <div className="card dist-card">
      <div className="card-header">
        <div>
          <div className="card-title">CLV distribution</div>
          <div className="card-meta" style={{ marginTop: 4 }}>
            <span>{total.toLocaleString()} bets · last 90d</span>
          </div>
        </div>
        <div className="card-actions">
          <button className="btn-ghost" data-active="true">
            90d
          </button>
          <button className="btn-ghost">All</button>
        </div>
      </div>
      <div className="dist-headline">
        <span className="num num-pos">μ +{mean.toFixed(2)}%</span>
        <span className="sub">σ 2.6% · p25 −1.5% · p75 +3.4%</span>
      </div>
      <div className="dist-chart">
        {dist.map((d, i) => {
          const h = (d.count / max) * 100;
          const cls =
            d.binCenter > 0.2 ? "pos" : d.binCenter < -0.2 ? "neg" : "zero";
          return (
            <div key={i} className={`dist-bar ${cls}`} style={{ height: `${h}%` }} />
          );
        })}
        <div className="dist-marker" style={{ left: "50%" }}>
          <span className="label" style={{ color: "var(--text-muted)" }}>
            0
          </span>
        </div>
        <div
          className="dist-marker"
          style={{
            left: `${50 + (mean / 8) * 50}%`,
            background: "var(--green)",
            opacity: 0.8,
          }}
        >
          <span className="label" style={{ color: "var(--green)" }}>
            μ
          </span>
        </div>
      </div>
      <div className="dist-axis">
        <span>−8%</span>
        <span>−4%</span>
        <span>0</span>
        <span>+4%</span>
        <span>+8%</span>
      </div>
    </div>
  );
}
