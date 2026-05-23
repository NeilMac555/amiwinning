import type { ClvDistBin } from "@/lib/data";

interface Props {
  dist: ClvDistBin[];
  mean: number;
}

export function ClvDistribution({ dist, mean }: Props) {
  const max = Math.max(...dist.map((d) => d.count));
  const total = dist.reduce((a, d) => a + d.count, 0);

  // No CLV captured yet: don't render a meaningless chart — show an empty
  // state explaining why and what to do.
  if (total === 0) {
    return (
      <div className="card dist-card">
        <div className="card-header">
          <div>
            <div className="card-title">CLV distribution</div>
            <div className="card-meta" style={{ marginTop: 4 }}>
              <span>No closing lines captured yet</span>
            </div>
          </div>
        </div>
        <div
          style={{
            padding: "32px 24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--serif)",
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: "-0.015em",
              fontVariationSettings: '"opsz" 36, "SOFT" 60',
              color: "var(--text-muted)",
            }}
          >
            Nothing to plot
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-faint)",
              lineHeight: 1.55,
              maxWidth: 320,
            }}
          >
            Add a Pinnacle closing line to each bet (or wait for the auto-capture)
            and your distribution will populate here.
          </div>
        </div>
      </div>
    );
  }

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
