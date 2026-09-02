// Dev-only preview page for the dormant-user drip emails.
//
// Renders all three templates (day3, day7, day14) in isolated iframes
// so Neil can eyeball what a real recipient sees BEFORE the cron ever
// sends one. Not linked from anywhere in the nav — just navigate to
// /dev/emails/preview to view.
//
// Gate: guard on NODE_ENV to keep this off production. If we later
// want a live-site staging preview, add a simple auth gate; for the
// initial build-and-review flow local dev is enough.

import { notFound } from "next/navigation";
import { renderDrip, DRIP_KEYS, DAYS_FOR_KEY, type DripKey } from "@/lib/emails/drip";
import { renderWeeklyReport } from "@/lib/emails/weekly-report";
import type { WeeklyReport } from "@/lib/weekly-report/ai";
import type { WeeklyReportInput } from "@/lib/weekly-report/data";

export const dynamic = "force-dynamic";

const SAMPLE_CTX = {
  userId: "00000000-0000-0000-0000-000000000000",
  handle: "yourhandle",
  siteUrl: "http://localhost:3020",
};

// Fixture for the weekly Sharp Report so the layout can be eyeballed
// without a model call. Numbers are illustrative only.
const SAMPLE_WEEKLY_INPUT: WeeklyReportInput = {
  handle: "yourhandle",
  week: { start: "2026-08-24", end: "2026-08-31" },
  lifetime: { settled: 412, pl: 27.4, yieldPct: 4.1, clvPct: 1.9, clvSample: 288, maxDdPct: -22.5, peakDrawdownUnits: 31 },
  thisWeek: { settled: 14, pending: 3, pl: 3.4, yieldPct: 11.2, wins: 8, losses: 6, pushes: 0 },
  leaks: [],
  strengths: [],
  competitions: [],
  markets: [],
  oddsBands: [],
  sports: [],
};
const SAMPLE_WEEKLY_REPORT: WeeklyReport = {
  headline: "A +3.4u week, but Premier League handicaps are still your biggest hole.",
  bullets: [
    { kind: "leak", segment: "Premier League", text: "-9.2u on 58 settled bets, -7.8% yield. Moderate sample. Your Asian handicap picks here are the whole loss. Stop until the Serie A edge below is funding it." },
    { kind: "edge", segment: "Serie A", text: "+11.6u on 71 settled, +9.3% yield at an average price of 1.92. Moderate sample and a positive CLV. Keep going and consider 1.5u instead of 1u." },
    { kind: "edge", segment: "Mid odds (1.7 to 2.5)", text: "+18.1u across 203 bets. Strong sample. This is where your edge lives. Nearly every profitable segment sits in this band." },
    { kind: "leak", segment: "Big longshots (4.0+)", text: "-6.4u on 19 bets. Early signal only, but the pattern is consistent with the rest of your data. Wait for more before drawing a conclusion." },
    { kind: "note", segment: "Closing odds", text: "CLV is logged on 288 of 412 bets. The 124 without it are invisible to the edge test. Log the close when you can." },
  ],
  closing: "Skip Premier League handicaps this week and put the stake into Serie A at mid odds.",
};

export default async function PreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const weekly = renderWeeklyReport(SAMPLE_CTX, SAMPLE_WEEKLY_REPORT, SAMPLE_WEEKLY_INPUT);

  const emails = [
    {
      key: "weekly" as DripKey | "weekly",
      days: 0,
      label: "weekly · Sharp Report · every Monday",
      email: weekly,
    },
    ...DRIP_KEYS.map((key) => ({
      key: key as DripKey | "weekly",
      days: DAYS_FOR_KEY[key],
      label: `${key} · day ${DAYS_FOR_KEY[key]}`,
      email: renderDrip(key, SAMPLE_CTX),
    })),
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "#eee",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: "24px 20px 80px",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 6px", fontWeight: 600 }}>
          Drip email preview
        </h1>
        <p style={{ fontSize: 13, color: "#999", margin: "0 0 32px" }}>
          Three dormant-user drip emails. Rendered exactly as Resend will send
          them (same HTML, same inline styles). Real recipient sees{" "}
          <code style={{ color: "#F5A623" }}>yourhandle</code> replaced with
          their handle and the unsubscribe link keyed to their user ID.
        </p>

        {emails.map((e) => (
          <div
            key={e.key}
            style={{
              marginBottom: 36,
              border: "1px solid #222",
              borderRadius: 8,
              overflow: "hidden",
              background: "#0A0C10",
            }}
          >
            <div
              style={{
                padding: "14px 18px",
                background: "#161B22",
                borderBottom: "1px solid #222",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#F5A623",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  {e.label}
                </div>
                <div style={{ fontSize: 16, marginTop: 4, fontWeight: 500 }}>
                  Subject: {e.email.subject}
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#8B949E" }}>
                From: hi@amiup.io &nbsp;·&nbsp;{" "}
                {e.days > 0 ? `sent day ${e.days} after signup` : "sent Monday morning to active users"}
              </div>
            </div>
            <iframe
              srcDoc={e.email.html}
              title={`${e.key} email preview`}
              style={{
                width: "100%",
                height: 620,
                border: 0,
                background: "#0A0C10",
                display: "block",
              }}
            />
            <details style={{ padding: "14px 18px", borderTop: "1px solid #222" }}>
              <summary style={{ cursor: "pointer", fontSize: 13, color: "#8B949E" }}>
                Plain-text version (what recipients on text-only clients see)
              </summary>
              <pre
                style={{
                  marginTop: 12,
                  padding: 14,
                  background: "#161B22",
                  borderRadius: 6,
                  fontSize: 12,
                  lineHeight: 1.55,
                  color: "#C9D1D9",
                  whiteSpace: "pre-wrap",
                  overflow: "auto",
                }}
              >
                {e.email.text}
              </pre>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
