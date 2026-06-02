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

  // Pick a palette for the avatar fallback — same hash → same gradient as
  // the live page's GeneratedAvatar. Kept in sync manually with the
  // component's PALETTES array.
  const avatarPalettes: Array<[string, string]> = [
    ["#2D4A3E", "#5A7B6B"],
    ["#7A3F2B", "#B5402E"],
    ["#3E4A6E", "#6B7BA5"],
    ["#5F3D6B", "#8B6BA0"],
    ["#1E5F4F", "#3FA083"],
    ["#6B5230", "#A88A4F"],
    ["#2D3D4F", "#5F7589"],
    ["#5A3030", "#8B5252"],
  ];
  let h = 0;
  for (let i = 0; i < profile.handle.length; i++) {
    h = (h * 31 + profile.handle.charCodeAt(i)) >>> 0;
  }
  const [avA, avB] = avatarPalettes[h % avatarPalettes.length];
  const avatarInitials = (profile.displayName ?? profile.handle)
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 2)
    .toUpperCase() || "·";

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
            <svg
              width="36"
              height="36"
              viewBox="0 0 100 100"
              style={{ display: "block" }}
            >
              <path
                fillRule="evenodd"
                d="M50 16 L85 84 L15 84 Z M50 46 L67 79 L33 79 Z"
                fill={C.text}
              />
            </svg>
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

        {/* Middle — avatar + name + lifetime P/L */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt=""
                width="96"
                height="96"
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 12,
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${avA} 0%, ${avB} 100%)`,
                  color: C.surface,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "monospace",
                  fontSize: 36,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                }}
              >
                {avatarInitials}
              </div>
            )}
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
