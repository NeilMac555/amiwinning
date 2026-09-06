"use client";

// Marketing landing page for signed-out visitors at "/".
//
// Three beats:
//   1. Hero: headline + sub + primary CTA on the left, live DemoPasteBox
//      on the right. The demo is the wedge: pasting text and seeing bets
//      come back beats any copy we could write.
//   2. Proof: condensed Johnny Bets card — equity curve + three KPIs
//      (Yield, ROC, CLV). No numbered 01/02/03 feature cards.
//   3. Final CTA: sign-up.
//
// Copy rules: no em dashes anywhere. Rewritten with full stops or
// colons. No emojis. Headline renders entirely in white; no green
// accent word.

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { DemoPasteBox } from "@/components/DemoPasteBox";
import { UtmCapture } from "@/components/UtmCapture";

const SAMPLE_HANDLE = "sample";

// Tiny sparkline. 40x14 viewBox, fits under a KPI value in the preview
// tile. tone picks the stroke color from the existing palette tokens.
// endDot adds a small filled circle at the path's endpoint, like a
// live "current value" marker.
function Spark({
  d,
  tone,
  endDot,
}: {
  d: string;
  tone: "pos" | "neg" | "neutral";
  endDot?: boolean;
}) {
  const stroke =
    tone === "pos"
      ? "var(--green)"
      : tone === "neg"
        ? "var(--red)"
        : "var(--text-muted)";
  let endX: number | null = null;
  let endY: number | null = null;
  if (endDot) {
    const match = d.match(/([0-9.]+)\s*,\s*([0-9.]+)\s*$/);
    if (match) {
      endX = parseFloat(match[1]);
      endY = parseFloat(match[2]);
    }
  }
  return (
    <svg
      className="landing-preview-spark"
      viewBox="0 0 40 14"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={d}
        stroke={stroke}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.85"
      />
      {endX != null && endY != null && (
        <circle cx={endX} cy={endY} r="1.2" fill={stroke} />
      )}
    </svg>
  );
}

// Johnny Bets equity path: dense 68-point walk with two visible drawdowns.
// Same path used previously; extracted to a constant so both the line and
// the area-fill can share it.
const EQUITY_PATH =
  "M0,30 L3,29.6 L6,29.3 L9,29.5 L12,28.8 L15,28.5 L18,29.1 L21,28.4 L24,27.9 L27,28.3 L30,27.6 L33,26.9 L36,27.3 L39,26.5 L42,25.8 L45,26.2 L48,25.5 L51,24.8 L54,25.3 L57,24.6 L60,23.9 L63,24.4 L66,23.5 L69,22.7 L72,21.9 L75,22.6 L78,21.7 L81,22.5 L84,23.8 L87,25.2 L90,26.1 L93,26.8 L96,26.3 L99,25.4 L102,24.5 L105,23.4 L108,22.1 L111,21.0 L114,20.2 L117,19.1 L120,18.4 L123,19.2 L126,18.3 L129,17.5 L132,17.9 L135,16.8 L138,15.9 L141,16.4 L144,17.6 L147,19.2 L150,20.5 L153,21.1 L156,20.4 L159,19.3 L162,18.1 L165,17.0 L168,15.8 L171,14.6 L174,13.5 L177,14.1 L180,12.9 L183,11.7 L186,10.5 L189,11.2 L192,9.8 L195,8.3 L198,6.5 L200,4";

export function LandingPage() {
  return (
    <div className="landing-page">
      {/* Captures utm_source / utm_medium / utm_campaign / referrer
          into sessionStorage on landing. Forwarded into user_metadata
          on signup via signInWithEmail in lib/auth.tsx, so Neil sees
          per-signup attribution in the new-user notification email
          and can query auth.users.raw_user_meta_data for aggregates. */}
      <UtmCapture />
      <header className="landing-topbar">
        <div className="brand" style={{ flex: 1 }}>
          <div className="brand-mark" aria-hidden="true"></div>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{BRAND.name}</span>
        </div>
        <Link
          href="/sign-in"
          className="btn-ghost"
          style={{
            padding: "7px 16px",
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          Sign in
        </Link>
      </header>

      <main className="landing-main">
        {/* Hero. Headline + sub + CTA on the left. Live DemoPasteBox
            on the right. */}
        <section className="landing-hero">
          <div className="landing-hero-text">
            <h1 className="landing-headline">
              Free bet tracker. Paste your bets. Know where you stand.
            </h1>
            <p className="landing-sub">
              Turn screenshots, bookmaker text and tips into a betting
              record. Track profit and loss, yield and performance.
              All free, with no credit card required.
            </p>
            <div className="landing-cta-row">
              <Link
                href="/sign-in"
                className="btn-primary"
                style={{
                  padding: "11px 22px",
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                Start tracking. Free.
              </Link>
              <Link
                href={`/${SAMPLE_HANDLE}`}
                className="btn-ghost"
                style={{
                  padding: "11px 22px",
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                See a sample profile
              </Link>
            </div>
            <p className="landing-fine">
              No credit card. Your data exportable anytime. Daily backups.
            </p>
          </div>

          <DemoPasteBox />
        </section>

        <section className="landing-explainer" aria-labelledby="tracker-how">
          <h2 id="tracker-how">How to track your bets with Am I Up</h2>
          <ol className="landing-steps">
            <li>
              <span className="landing-step-number" aria-hidden="true">01</span>
              <h3>Paste or import</h3>
              <p>Paste bookmaker text, X posts or group-chat tips. In your account,
                upload a screenshot or import a CSV or Excel betting spreadsheet.</p>
            </li>
            <li>
              <span className="landing-step-number" aria-hidden="true">02</span>
              <h3>Review and save</h3>
              <p>Check the selection, odds, stake and result before saving.
                You can also enter bets manually and update results when they settle.</p>
            </li>
            <li>
              <span className="landing-step-number" aria-hidden="true">03</span>
              <h3>See your performance</h3>
              <p>Follow your profit and loss, <Link href="/learn/yield">yield</Link> and
                equity curve. Compare sports and markets to understand where
                your results are coming from.</p>
            </li>
          </ol>
        </section>

        {/* Merged proof + CTA. Left column: heading, supporting copy,
            sign-up button. Right column: Johnny Bets sample profile
            card. One section replaces the old orphaned card + lopsided
            final-CTA blocks. */}
        <section className="landing-proof">
          <div className="landing-proof-copy">
            <h2 className="landing-proof-title">Your betting record, clearly explained.</h2>
            <p className="landing-proof-body">
              See lifetime profit and loss, an equity curve and performance
              breakdowns drawn from the bets you record. The sample profile
              shows how those figures look before you create an account.
            </p>
            <p className="landing-proof-body">
              Free. No credit card. Your data is yours: exportable as
              CSV whenever you want. Deletable on request.
            </p>
            <Link
              href="/sign-in"
              className="btn-primary landing-proof-cta"
            >
              Sign up with email
            </Link>
            <p className="landing-proof-fine">
              Backed by daily database backups. No card, no lock-in.
            </p>
          </div>

          <div className="landing-preview" aria-hidden="false">
            <div className="landing-preview-head">
              <div className="landing-preview-avatar">JB</div>
              <div>
                <div className="landing-preview-name">Johnny Bets</div>
                <div className="landing-preview-handle">Sample data · @johnnybets</div>
              </div>
            </div>
            <div className="landing-preview-label">Lifetime P/L</div>
            <div className="landing-preview-pl">+42.6u</div>
            <svg
              className="landing-preview-equity"
              viewBox="0 0 200 36"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <line
                x1="0"
                x2="200"
                y1="30"
                y2="30"
                stroke="var(--border)"
                strokeWidth="0.5"
              />
              <path
                d={EQUITY_PATH}
                stroke="var(--green)"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d={`${EQUITY_PATH} L200,36 L0,36 Z`}
                fill="var(--green)"
                opacity="0.08"
              />
            </svg>
            <div className="landing-preview-sub">
              across ~150 settled bets
            </div>
            <div className="landing-preview-kpi-row">
              <div className="landing-preview-kpi">
                <div className="landing-preview-kpi-label">Yield (ROI)</div>
                <div className="landing-preview-kpi-value num-pos">+4.1%</div>
                <Spark
                  d="M0,11 L3,12 L6,9 L9,10 L12,8 L15,9 L18,6 L21,7 L24,5 L27,6 L30,4 L33,5 L36,3 L40,2"
                  tone="pos"
                  endDot
                />
              </div>
              <div className="landing-preview-kpi">
                <div className="landing-preview-kpi-label">ROC</div>
                <div className="landing-preview-kpi-value num-pos">+28%</div>
                <Spark
                  d="M0,12 Q6,11.5 12,10 T24,7 T36,3 L40,2"
                  tone="pos"
                  endDot
                />
              </div>
              <div className="landing-preview-kpi">
                <div className="landing-preview-kpi-label">CLV</div>
                <div className="landing-preview-kpi-value num-pos">+0.8%</div>
                <Spark
                  d="M0,9 L4,9 L8,8 L12,8 L16,7 L20,8 L24,6 L28,7 L32,5 L36,6 L40,4"
                  tone="pos"
                  endDot
                />
              </div>
            </div>
            <Link
              href={`/${SAMPLE_HANDLE}`}
              className="landing-preview-view-link"
            >
              View the full sample profile
            </Link>
          </div>
        </section>

        <section className="landing-explainer landing-free" aria-labelledby="tracker-free">
          <div>
            <h2 id="tracker-free">What’s included in the free bet tracker?</h2>
            <p>Bet logging, your dashboard and CSV exports are free to use.
              Create an account with your email to save your record and access
              it across devices. No credit card required.</p>
            <p>Daily limits apply to AI parsing and automatic spreadsheet mapping.
              You can still log bets manually when you reach an AI limit.</p>
            <Link href="/sign-in" className="btn-primary landing-proof-cta">Start tracking for free</Link>
          </div>
          <ul className="landing-included">
            <li>Text and screenshot imports, plus manual bet entry</li>
            <li>CSV and Excel spreadsheet imports</li>
            <li>Profit and loss, yield, win rate and equity curves</li>
            <li>Performance breakdowns by sport and market</li>
            <li>Separate books and optional public profiles</li>
            <li>CSV export of your betting record</li>
          </ul>
        </section>

        <section className="landing-explainer landing-faq" aria-labelledby="tracker-questions">
          <h2 id="tracker-questions">Questions about tracking your bets</h2>
          <details>
            <summary>Why is Am I Up free?</summary>
            <p>Free, as a way of giving back to the betting community.</p>
          </details>
          <details>
            <summary>Do I need to connect my bookmaker account?</summary>
            <p>No. Am I Up works with the text, screenshots and spreadsheets
              you provide. You don’t need to share a bookmaker login.</p>
          </details>
          <details>
            <summary>Can I move from a betting spreadsheet?</summary>
            <p>Yes. Import a CSV or Excel file and review how its columns map
              to your bet records. You can export your bets as CSV later.</p>
          </details>
          <details>
            <summary>Does the tracker calculate closing line value?</summary>
            <p>Yes, when you supply the closing odds for a bet. Am I Up compares
              those with the odds you took; it does not automatically fetch
              a bookmaker’s closing prices. <Link href="/learn/clv">Learn how CLV works</Link>.</p>
          </details>
          <details>
            <summary>Will a bet tracker tell me what to bet on?</summary>
            <p>Am I Up records and analyses your bets. It doesn’t place bets
              or guarantee a profit. Its purpose is to help you understand
              your results over time.</p>
          </details>
        </section>
      </main>

      <footer className="landing-foot">
        <div className="brand" style={{ fontSize: 13 }}>
          <div className="brand-mark" aria-hidden="true"></div>
          <span style={{ fontWeight: 600 }}>{BRAND.name}</span>
        </div>
        <div className="landing-foot-links">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href={`/${SAMPLE_HANDLE}`}>Sample profile</Link>
          <Link href="/compare/bettin-gs">vs bettin.gs</Link>
          <Link href="/compare/pikkit">vs Pikkit</Link>
          <Link href="/learn/clv">What is CLV?</Link>
          <Link href="/learn/yield">What is Yield?</Link>
          <Link href="/learn/expected-value">What is EV?</Link>
        </div>
      </footer>
    </div>
  );
}
