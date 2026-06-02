// Root social card. Shown when amiup.io itself is shared on X /
// Telegram / Discord (the /u/<handle> route has its own OG card that
// pulls per-profile stats).
//
// Static branded design, no dynamic data — every share of the homepage
// gets the same image.

import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

export const alt = `${BRAND.name} — The terminal for serious punters.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Palette mirrors the light theme — looks like a screenshot of the app
// rather than a generic marketing card.
const C = {
  bg: "#F1F0EB",
  surface: "#FBFAF7",
  text: "#1A1817",
  textMuted: "#5F574F",
  textFaint: "#8F857A",
  border: "#E5DFD2",
  green: "#0F6E56",
};

export default function Image() {
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
        {/* Top — brand mark + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: C.text,
              borderRadius: 7,
            }}
          />
          <div
            style={{
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            {BRAND.name}
          </div>
        </div>

        {/* Middle — hero headline + tagline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
            maxWidth: 1000,
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 400,
              fontFamily: "serif",
              letterSpacing: "-0.035em",
              lineHeight: 1.0,
              color: C.text,
            }}
          >
            The terminal for serious punters.
          </div>
          <div
            style={{
              fontSize: 30,
              color: C.textMuted,
              lineHeight: 1.3,
              maxWidth: 880,
            }}
          >
            Track your bets. Prove your edge. Share results.
          </div>
        </div>

        {/* Bottom — feature row + URL */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", gap: 38, fontSize: 18 }}>
            {[
              { n: "01", t: "Paste anything · AI parses it" },
              { n: "02", t: "CLV tracking · skill vs variance" },
              { n: "03", t: "Shareable public profile" },
            ].map((f) => (
              <div
                key={f.n}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  color: C.textMuted,
                  fontFamily: "monospace",
                  letterSpacing: "0.04em",
                }}
              >
                <div
                  style={{
                    color: C.green,
                    fontSize: 13,
                    letterSpacing: "0.1em",
                  }}
                >
                  {f.n}
                </div>
                <div>{f.t}</div>
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: 22,
              color: C.textFaint,
              fontFamily: "monospace",
            }}
          >
            amiup.io
          </div>
        </div>
      </div>
    ),
    size,
  );
}
