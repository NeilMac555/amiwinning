import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

// Static artwork: illustrative interface, never account data.
export const alt = `${BRAND.name} — Your bets. Your edge. Free bet tracker. Paste anything. Track everything.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
const C = { bg: "#0A0C10", surface: "#161A21", input: "#1E232C", text: "#E6EDF3", muted: "#8B949E", border: "#303640", green: "#00D26A", amber: "#F5A623" };

export default function Image() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: "42px 52px", background: C.bg, color: C.text, fontFamily: "sans-serif" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 5, background: C.green }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 28, fontWeight: 700 }}>
          <svg width="32" height="32" viewBox="0 0 100 100"><path fillRule="evenodd" d="M50 16 L85 84 L15 84 Z M50 46 L67 79 L33 79 Z" fill={C.text} /></svg>
          {BRAND.name}
        </div>
        <div style={{ display: "flex", padding: "12px 20px", borderRadius: 8, background: C.amber, color: C.bg, fontSize: 20, fontWeight: 700, letterSpacing: 2 }}>FREE BET TRACKER</div>
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 38 }}>
        <div style={{ display: "flex", flexDirection: "column", width: 525 }}>
          <div style={{ fontSize: 86, fontWeight: 700, letterSpacing: -4, lineHeight: 1.05 }}>Your bets.</div>
          <div style={{ fontSize: 86, fontWeight: 700, letterSpacing: -4, lineHeight: 1.05, color: C.green }}>Your edge.</div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 27, fontSize: 29, lineHeight: 1.4, color: C.muted }}><span>Paste anything.</span><span>Track everything.</span></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: 533, gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", padding: "22px 24px", borderRadius: 14, border: `1px solid ${C.border}`, borderTop: `3px solid ${C.green}`, background: C.surface }}>
            <div style={{ color: C.green, fontSize: 17, letterSpacing: 3, fontWeight: 700 }}>PASTE & PARSE · AI</div>
            <div style={{ display: "flex", marginTop: 17, padding: "18px 16px", background: C.input, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 22 }}>England vs Mexico · England @ 2.49</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 17 }}>
              <div style={{ fontSize: 18, color: C.muted }}>Text, tips & screenshots</div>
              <div style={{ display: "flex", background: C.amber, color: C.bg, borderRadius: 6, padding: "10px 15px", fontSize: 18, fontWeight: 700 }}>Parse bets →</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", padding: "18px 24px", borderRadius: 14, border: `1px solid ${C.border}`, background: C.surface }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20 }}><span>Your performance</span><span style={{ color: C.muted, fontSize: 16 }}>ILLUSTRATIVE</span></div>
            <svg width="480" height="91" viewBox="0 0 480 91" style={{ marginTop: 9 }}>
              <path d="M0 78 H480 M0 40 H480" stroke={C.border} strokeDasharray="3 6" />
              <path d="M0 74 L24 68 L47 75 L70 59 L92 63 L113 43 L135 51 L156 38 L178 45 L199 25 L222 31 L242 20 L264 35 L286 30 L308 42 L332 24 L355 30 L379 14 L401 20 L425 8 L450 13 L480 4" fill="none" stroke={C.green} strokeWidth="4" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
        <div style={{ fontSize: 22, color: C.muted }}>P/L · CLV · Shareable results</div>
        <div style={{ fontSize: 28, fontWeight: 700 }}>amiup.io</div>
      </div>
    </div>, size,
  );
}
