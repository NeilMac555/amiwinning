// Weekly Sharp Report — email renderer.
//
// Takes the model's structured report plus the input payload (for the
// stat line) and produces subject / text / html. Reuses the drip email
// shell so palette, typography, and the unsubscribe footer are identical
// across everything we send.
//
// Model output is untrusted text: every string is HTML-escaped before it
// lands in the template.

import { wrapHtml, escapeHtml, type RenderContext } from "./drip";
import type { WeeklyReport, ReportBullet } from "@/lib/weekly-report/ai";
import type { WeeklyReportInput } from "@/lib/weekly-report/data";

export interface WeeklyEmail {
  subject: string;
  text: string;
  html: string;
}

function fmtUnits(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}${Math.abs(n).toFixed(1)}u`;
}

function fmtPct(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}${Math.abs(n).toFixed(1)}%`;
}

// "2026-08-24" → "24 Aug"
function fmtDay(iso: string): string {
  const [y, m, d] = iso.split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return iso;
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d} ${MONTHS[m - 1]}`;
}

// The week.end in the payload is exclusive (the next Monday). Show the
// Sunday in copy.
function weekLabel(input: WeeklyReportInput): string {
  const endInclusive = new Date(new Date(input.week.end).getTime() - 86_400_000);
  return `${fmtDay(input.week.start)} to ${fmtDay(endInclusive.toISOString().slice(0, 10))}`;
}

const KIND_LABEL: Record<ReportBullet["kind"], string> = {
  leak: "Leak",
  edge: "Edge",
  note: "Note",
};
const KIND_COLOUR: Record<ReportBullet["kind"], string> = {
  leak: "#FF4D4D",
  edge: "#00D26A",
  note: "#F5A623",
};

export function renderWeeklyReport(
  ctx: RenderContext,
  report: WeeklyReport,
  input: WeeklyReportInput,
): WeeklyEmail {
  const week = weekLabel(input);
  const tw = input.thisWeek;
  const lt = input.lifetime;

  const subject =
    tw.settled > 0
      ? `Sharp Report: ${fmtUnits(tw.pl)} on ${tw.settled} settled this week`
      : `Sharp Report: where your money is going`;

  const statLine =
    tw.settled > 0
      ? `This week: ${tw.settled} settled, ${tw.wins}W ${tw.losses}L${tw.pushes ? ` ${tw.pushes}P` : ""}, ${fmtUnits(tw.pl)} (${fmtPct(tw.yieldPct)} yield).`
      : `No bets settled this week. Lifetime numbers below.`;
  const lifetimeLine =
    `Lifetime: ${lt.settled} settled, ${fmtUnits(lt.pl)}, ${fmtPct(lt.yieldPct)} yield` +
    (lt.clvPct !== null ? `, ${fmtPct(lt.clvPct)} CLV on ${lt.clvSample} bets.` : `. CLV not tracked yet.`);

  const leaksUrl = `${ctx.siteUrl}/analytics/leaks`;
  const dashUrl = ctx.siteUrl;

  // ─ Plain text ─
  const text = [
    `Hi @${ctx.handle},`,
    ``,
    `Sharp Report for ${week}.`,
    ``,
    report.headline,
    ``,
    statLine,
    lifetimeLine,
    ``,
    ...report.bullets.flatMap((b) => [
      `${KIND_LABEL[b.kind].toUpperCase()} - ${b.segment}`,
      b.text,
      ``,
    ]),
    `This week: ${report.closing}`,
    ``,
    `Full breakdown: ${leaksUrl}`,
    `Log this week's bets: ${dashUrl}`,
    ``,
    `Neil`,
    `Am I Up`,
  ].join("\n");

  // ─ HTML ─
  const bullets = report.bullets.map(
    (b) =>
      `<span style="display:inline-block; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ${KIND_COLOUR[b.kind]}; margin-right: 8px;">${KIND_LABEL[b.kind]}</span>` +
      `<strong style="color:#E6EDF3;">${escapeHtml(b.segment)}</strong>` +
      `<br /><span style="color:#C9D1D9;">${escapeHtml(b.text)}</span>`,
  );

  const html = wrapHtml({
    ...ctx,
    eyebrow: `Am I Up · Sharp Report · ${week}`,
    headline: escapeHtml(report.headline),
    body: [
      escapeHtml(statLine),
      `<span style="color:#8B949E;">${escapeHtml(lifetimeLine)}</span>`,
    ],
    bullets,
    postBullets: `<strong style="color:#F5A623;">This week:</strong> ${escapeHtml(report.closing)}`,
    primaryCta: { href: leaksUrl, label: "See the full breakdown →" },
    secondaryCta: { href: dashUrl, label: "Log this week's bets" },
    footerLine: `Numbers are from your own logged bets. Segments under 30 bets are early signals, not verdicts.`,
  });

  return { subject, text, html };
}
