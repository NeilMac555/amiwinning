/** "3h 05m" / "2d 4h" until `d`, or null once it has passed. */
export function fmtCountdown(d: Date, now = Date.now()): string | null {
  const ms = d.getTime() - now;
  if (ms < 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

/** Signed percentage, e.g. "+2.50%" / "−1.20%". */
export function fmtPct(v: number, dp = 2): string {
  const s = v >= 0 ? "+" : "−";
  return s + Math.abs(v).toFixed(dp) + "%";
}
