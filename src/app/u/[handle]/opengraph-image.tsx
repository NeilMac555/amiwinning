// Per-profile OG card. Generated on-demand the first time someone links to
// /u/<handle> from Twitter / Telegram / Discord; cached after that. The
// card shows handle, lifetime profit (giant Fraunces number), sample size,
// and a sparkline of the equity curve. Branded with "amiup.io".
//
// Renders via @vercel/og (Satori under the hood) so we're limited to a
// subset of CSS — no custom font variables, no CSS classes from globals.
// Everything is inline-style.

import { ImageResponse } from "next/og";
import { getPublicProfileServer } from "@/lib/profiles";
import { aggregateFromBets } from "@/lib/aggregate";

export const alt = "Am I Up profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface OgProps {
  params: Promise<{ handle: string }>;
}

// Palette mirrors the app's --bg / --text / --green / --red so the card
// looks at home next to the live site.
const C = {
  bg: "#F5F2EA",
  surface: "#FBF9F3",
  text: "#1A1817",
  textMuted: "#5F574F",
  textFaint: "#8F857A",
  border: "#E5DFD2",
  green: "#1E7E4F",
  red: "#B5402E",
};

function fmtPl(pl: number): { value: string; tone: "pos" | "neg" | "flat" } {
  if (pl > 0.05) return { value: `+${pl.toFixed(1)}u`, tone: "pos" };
  if (pl < -0.05) return { value: `${pl.toFixed(1)}u`, tone: "neg" };
  return { value: "0.0u", tone: "flat" };
}

function sparkPath(values: number[], w: number, h: number): string {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export default async function Image({ params }: OgProps) {
  const { handle } = await params;
  const { profile, bets } = await getPublicProfileServer(handle);

  // Fallback card if the profile doesn't exist or is private.
  if (!profile) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: C.bg,
            color: C.text,
            fontSize: 64,
            fontFamily: "serif",
          }}
        >
          Am I Up
        </div>
      ),
      size,
    );
  }

  const settledCount = bets.filter((b) => b.status !== "pending").length;
  const lifetimePl = bets.reduce((s, b) => s + b.pl, 0);
  const lifetime = fmtPl(lifetimePl);
  const plColor =
    lifetime.tone === "pos"
      ? C.green
      : lifetime.tone === "neg"
        ? C.red
        : C.textMuted;
  const name = profile.displayName ?? profile.handle;

  // Pre-compute the equity sparkline. computeEquity already gives us the
  // cumulative series — pluck the equity value off each point.
  const equity =
    settledCount > 0 ? aggregateFromBets(bets).equity.points.map((p) => p.equity) : [];
  const sparkD = sparkPath(equity, 700, 120);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: C.bg,
          color: C.text,
          padding: "56px 64px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* Header — brand mark + Am I Up + handle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: C.text,
                borderRadius: 6,
              }}
            />
            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              Am I Up
            </div>
          </div>
          <div
            style={{
              fontSize: 24,
              color: C.textMuted,
              fontFamily: "monospace",
            }}
          >
            amiup.io/u/{profile.handle}
          </div>
        </div>

        {/* Middle — name + lifetime P/L */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              fontSize: 38,
              fontWeight: 500,
              fontFamily: "serif",
              letterSpacing: "-0.02em",
              color: C.text,
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: 18,
              color: C.textFaint,
              fontFamily: "monospace",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Lifetime P/L
          </div>
          <div
            style={{
              fontSize: 200,
              fontWeight: 400,
              fontFamily: "serif",
              letterSpacing: "-0.04em",
              color: plColor,
              lineHeight: 1,
              marginTop: -6,
            }}
          >
            {lifetime.value}
          </div>
        </div>

        {/* Footer — sample size + sparkline */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div
              style={{
                fontSize: 18,
                color: C.textFaint,
                fontFamily: "monospace",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Sample
            </div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 500,
                fontFamily: "monospace",
                color: C.text,
              }}
            >
              {settledCount.toLocaleString()} bets
            </div>
          </div>
          {sparkD && (
            <svg
              width="700"
              height="120"
              viewBox="0 0 700 120"
              style={{ display: "block" }}
            >
              <path
                d={sparkD}
                fill="none"
                stroke={plColor}
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
      </div>
    ),
    size,
  );
}
