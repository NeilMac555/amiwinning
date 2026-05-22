import type { BreakdownRow } from "@/lib/data";

interface Props {
  title: string;
  rows: BreakdownRow[];
  suffix?: string;
}

export function Breakdown({ title, rows, suffix }: Props) {
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.yieldPct)), 1);
  const zeroPos = 50;
  return (
    <div className="card dist-card">
      <div className="card-header">
        <div>
          <div className="card-title">{title}</div>
          <div className="card-meta" style={{ marginTop: 4 }}>
            <span>Yield % · sorted</span>
          </div>
        </div>
        <div className="card-actions">
          <button className="btn-ghost" data-active="true">
            Yield
          </button>
          <button className="btn-ghost">CLV</button>
        </div>
      </div>
      <div className="breakdown">
        {rows.map((r, i) => {
          const w = (Math.abs(r.yieldPct) / maxAbs) * 50;
          const left = r.yieldPct >= 0 ? zeroPos : zeroPos - w;
          const color = r.yieldPct >= 0 ? "var(--green)" : "var(--red)";
          return (
            <div className="bk-row" key={i}>
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
                  {Math.abs(r.yieldPct).toFixed(2)}
                  {suffix || "%"}
                </div>
                <div className="bk-sample">n={r.sample}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
