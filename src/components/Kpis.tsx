import { Sparkline } from "./Sparkline";
import type { KPIs, Sparks } from "@/lib/data";
import { fmtPct } from "@/lib/format";

interface KpiItem {
  id: "clv" | "yield" | "roi" | "dd" | "n";
  label: string;
  value: string;
  sign: "num-pos" | "num-neg" | "num-flat" | "";
  delta: string;
  deltaSign: "num-pos" | "num-neg" | "";
  deltaLabel: string;
  sparkData: number[];
  sparkColor: string;
}

function signClass(v: number): "num-pos" | "num-neg" | "num-flat" {
  return v > 0 ? "num-pos" : v < 0 ? "num-neg" : "num-flat";
}
function colorFor(v: number): string {
  return v > 0 ? "var(--green)" : v < 0 ? "var(--red)" : "var(--text-muted)";
}

function buildKpiItems(kpis: KPIs, sparks: Sparks): KpiItem[] {
  // Detect real (imported) data: aggregations always set `lifetimePl`, the
  // mock builder doesn't. Mock-era decorations only show in demo mode.
  const isReal = kpis.lifetimePl !== undefined;
  // Risk capital — the min bankroll you'd have needed to weather the worst
  // losing stretch. Honest denominator that doesn't assume a starting balance.
  const riskCap = Math.round(Math.abs(kpis.peakDrawdown ?? 0));
  // ROC is always computed lifetime (see Dashboard) — flag it so the user
  // knows this number doesn't move with the range tabs.
  const rocSub = isReal
    ? riskCap > 0
      ? kpis.rocAnnualised
        ? `Lifetime, annualised · on ${riskCap}u risk capital`
        : `Lifetime · on ${riskCap}u risk capital`
      : "Lifetime · risk capital"
    : "on risk capital";
  const rocDelta = isReal ? "lifetime" : "annualised";
  // Max drawdown as a %, but suppress the noisy -100% case (peak <= drawdown,
  // meaning the punter never had a sustained positive run inside the window).
  // Show the absolute u value as the headline instead — same info, less alarming.
  const ddPctMisleading = isReal && kpis.maxDdPct <= -99.5;
  return [
    {
      id: "clv",
      label: "CLV",
      value: fmtPct(kpis.clvPct),
      sign: signClass(kpis.clvPct),
      delta: isReal ? "" : "+0.14",
      deltaSign: isReal ? "" : "num-pos",
      deltaLabel: isReal ? (kpis.clvPct === 0 ? "not yet captured" : "") : "vs. 30d avg",
      sparkData: sparks.clv,
      sparkColor: colorFor(kpis.clvPct),
    },
    {
      id: "yield",
      label: "Yield",
      value: fmtPct(kpis.yieldPct),
      sign: signClass(kpis.yieldPct),
      delta: isReal ? "" : kpis.yieldPct > 0 ? "+0.03" : "−0.21",
      deltaSign: isReal ? "" : kpis.yieldPct > 0 ? "num-pos" : "num-neg",
      deltaLabel: isReal ? "profit ÷ turnover" : "vs. 30d avg",
      sparkData: sparks.yld,
      sparkColor: colorFor(kpis.yieldPct),
    },
    {
      id: "roi",
      label: "Return on capital",
      value: fmtPct(kpis.rocPct, 1),
      sign: signClass(kpis.rocPct),
      delta: rocDelta,
      deltaSign: "",
      deltaLabel: rocSub,
      sparkData: sparks.roi,
      sparkColor: colorFor(kpis.rocPct),
    },
    {
      id: "dd",
      label: "Max drawdown",
      value: ddPctMisleading
        ? `−${Math.round(Math.abs(kpis.peakDrawdown ?? 0))}u`
        : fmtPct(kpis.maxDdPct),
      sign: "num-neg",
      delta: ddPctMisleading
        ? ""
        : isReal && kpis.peakDrawdown
          ? `${Math.round(Math.abs(kpis.peakDrawdown))}u`
          : "54 days",
      deltaSign: "",
      deltaLabel: ddPctMisleading
        ? "no positive peak in window"
        : isReal
          ? "peak-to-trough"
          : "recovery",
      sparkData: sparks.dd,
      sparkColor: "var(--red)",
    },
    {
      id: "n",
      label: "Sample size",
      value: kpis.sampleSize.toLocaleString("en-US"),
      sign: "",
      delta: isReal ? "" : "+38",
      deltaSign: isReal ? "" : "num-pos",
      deltaLabel: isReal ? "in range" : "last 7d",
      sparkData: sparks.sample,
      sparkColor: "var(--text-muted)",
    },
  ];
}

interface KpiProps {
  kpis: KPIs;
  sparks: Sparks;
}

export function KpiStripCompact({ kpis, sparks }: KpiProps) {
  const items = buildKpiItems(kpis, sparks);
  return (
    <div className="kpi-strip">
      {items.map((k) => (
        <div className="kpi" key={k.id}>
          <div className="kpi-label">{k.label}</div>
          <div className={`kpi-value mono ${k.sign}`}>{k.value}</div>
          <div className="kpi-foot">
            <div className="kpi-meta">
              <span className={`kpi-delta mono ${k.deltaSign}`}>{k.delta}</span>
              <span style={{ color: "var(--text-faint)" }}>{k.deltaLabel}</span>
            </div>
            <div className="kpi-spark" style={{ color: k.sparkColor }}>
              <Sparkline
                data={k.sparkData}
                color="currentColor"
                width={52}
                height={20}
                fill={k.id === "clv" || k.id === "yield" || k.id === "roi"}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function KpiFeatured({ kpis, sparks }: KpiProps) {
  const items = buildKpiItems(kpis, sparks);
  return (
    <div className="kpi-featured">
      {items.map((k, i) => (
        <div className={`kpi${i === 0 ? " hero" : ""}`} key={k.id}>
          <div className="kpi-label">{k.label}</div>
          <div className={`kpi-value mono ${k.sign}`}>{k.value}</div>
          <div className="kpi-meta">
            <span className={`kpi-delta mono ${k.deltaSign}`}>{k.delta}</span>
            <span style={{ color: "var(--text-faint)" }}>{k.deltaLabel}</span>
          </div>
          <div className="kpi-spark" style={{ color: k.sparkColor }}>
            <Sparkline
              data={k.sparkData}
              color="currentColor"
              width={i === 0 ? 140 : 86}
              height={i === 0 ? 36 : 28}
              fill={k.id === "clv" || k.id === "yield" || k.id === "roi"}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
