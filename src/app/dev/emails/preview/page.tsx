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

export const dynamic = "force-dynamic";

const SAMPLE_CTX = {
  userId: "00000000-0000-0000-0000-000000000000",
  handle: "yourhandle",
  siteUrl: "http://localhost:3020",
};

export default async function PreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const emails = DRIP_KEYS.map((key) => ({
    key,
    days: DAYS_FOR_KEY[key],
    email: renderDrip(key, SAMPLE_CTX),
  }));

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
                  {e.key} · day {e.days}
                </div>
                <div style={{ fontSize: 16, marginTop: 4, fontWeight: 500 }}>
                  Subject: {e.email.subject}
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#8B949E" }}>
                From: hi@amiup.io &nbsp;·&nbsp; sent day{" "}
                {e.days} after signup
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
