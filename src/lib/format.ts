export function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function fmtDateTime(d: Date): string {
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${fmtDate(d)} · ${h}:${m}`;
}

export function fmtCountdown(d: Date, now = Date.now()): string | null {
  const ms = d.getTime() - now;
  if (ms < 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export interface FmtMoneyOpts {
  signed?: boolean;
  dp?: number;
  unit?: string;
}

export function fmtMoney(v: number, opts: FmtMoneyOpts = {}): string {
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  const abs = Math.abs(v);
  const dp = opts.dp ?? 0;
  const txt = abs.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
  const leading = opts.signed ? sign : v < 0 ? "−" : "";
  return leading + (opts.unit ?? "$") + txt;
}

export function fmtPct(v: number, dp = 2): string {
  const s = v >= 0 ? "+" : "−";
  return s + Math.abs(v).toFixed(dp) + "%";
}

export function fmtNum(v: number): string {
  return v.toLocaleString("en-US");
}

export function decimalToAmerican(d: number): string {
  if (d >= 2) return "+" + Math.round((d - 1) * 100);
  return "-" + Math.round(100 / (d - 1));
}
