"use client";

// Marketing landing page for signed-out visitors at "/".
//
// Hero → 3 feature cards → sample-profile preview → final CTA.
// Linked sample is Neil's real profile, not a fake one — the +369u
// hero number is more compelling than a fabricated example.

import Link from "next/link";
import { BRAND } from "@/lib/brand";

const SAMPLE_HANDLE = "sample";

// Tiny sparkline. 40x14 viewbox — fits under a KPI value in the preview
// tile. tone picks the stroke color from the existing palette tokens so
// it adapts when the visitor switches themes.
function Spark({
  d,
  tone,
}: {
  d: string;
  tone: "pos" | "neg" | "neutral";
}) {
  const stroke =
    tone === "pos"
      ? "var(--green)"
      : tone === "neg"
        ? "var(--red)"
        : "var(--text-muted)";
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
    </svg>
  );
}

export function LandingPage() {
  return (
    <div className="landing-page">
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
        {/* Hero ───────────────────────────────────────────────────── */}
        <section className="landing-hero">
          <div className="landing-hero-text">
            <p className="landing-eyebrow">For punters who give a damn.</p>
            <h1 className="landing-headline">
              The terminal for{" "}
              <span className="landing-headline-accent">serious punters.</span>
            </h1>
            <p className="landing-sub">
              Track your bets. Prove your edge with closing-line value.
              Share a single link that backs every claim with eight years
              of receipts.
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
                Start tracking — free
              </Link>
              <Link
                href={`/u/${SAMPLE_HANDLE}`}
                className="btn-ghost"
                style={{
                  padding: "11px 22px",
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                See a sample profile →
              </Link>
            </div>
            <p className="landing-fine">
              No credit card · your data exportable anytime · daily backups
            </p>
          </div>

          {/* A mock "preview card" — looks like a tiny version of the
              profile page hero. Values are illustrative; the real demo
              numbers live at /u/sample. */}
          <div className="landing-preview" aria-hidden="true">
            <div className="landing-preview-head">
              <div className="landing-preview-avatar">SA</div>
              <div>
                <div className="landing-preview-name">Sample Bettor</div>
                <div className="landing-preview-handle">@sample</div>
              </div>
            </div>
            <div className="landing-preview-label">Lifetime P/L</div>
            <div className="landing-preview-pl">+42.6u</div>
            {/* Mini equity curve — fills the dead space below the hero
                number and signals "this is a journey, not a snapshot." */}
            <svg
              className="landing-preview-equity"
              viewBox="0 0 200 36"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {/* Faint zero-baseline */}
              <line
                x1="0"
                x2="200"
                y1="30"
                y2="30"
                stroke="var(--border)"
                strokeWidth="0.5"
              />
              {/* Sample equity path — choppy but trending up.
                  Hand-tuned to look like real punter variance. */}
              <path
                d="M0,30 L8,28 L18,26 L28,29 L40,22 L52,24 L64,18 L78,21 L92,14 L106,17 L120,11 L134,15 L146,9 L160,12 L174,6 L188,8 L200,4"
                stroke="var(--green)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              {/* Subtle area fill under the curve */}
              <path
                d="M0,30 L8,28 L18,26 L28,29 L40,22 L52,24 L64,18 L78,21 L92,14 L106,17 L120,11 L134,15 L146,9 L160,12 L174,6 L188,8 L200,4 L200,36 L0,36 Z"
                fill="var(--green)"
                opacity="0.08"
              />
            </svg>
            <div className="landing-preview-sub">
              across ~150 settled bets
            </div>
            <div className="landing-preview-kpi-row">
              <div className="landing-preview-kpi">
                <div className="landing-preview-kpi-label">Yield</div>
                <div className="landing-preview-kpi-value num-pos">+4.1%</div>
                <Spark
                  d="M0,10 L7,8 L14,8 L21,6 L28,5 L35,4 L40,3"
                  tone="pos"
                />
              </div>
              <div className="landing-preview-kpi">
                <div className="landing-preview-kpi-label">ROC</div>
                <div className="landing-preview-kpi-value num-pos">+28%</div>
                <Spark
                  d="M0,11 L8,10 L16,7 L24,6 L32,4 L40,3"
                  tone="pos"
                />
              </div>
              <div className="landing-preview-kpi">
                <div className="landing-preview-kpi-label">Win rate</div>
                <div className="landing-preview-kpi-value">53%</div>
                <Spark
                  d="M0,7 L6,5 L12,8 L18,6 L24,4 L30,7 L36,6 L40,5"
                  tone="neutral"
                />
              </div>
              <div className="landing-preview-kpi">
                <div className="landing-preview-kpi-label">Max DD</div>
                <div className="landing-preview-kpi-value num-neg">−8.4%</div>
                {/* Classic drawdown shape: dip then recovery. */}
                <Spark
                  d="M0,4 L7,6 L14,9 L21,11 L28,9 L34,7 L40,5"
                  tone="neg"
                />
              </div>
              <div className="landing-preview-kpi">
                <div className="landing-preview-kpi-label">CLV</div>
                <div className="landing-preview-kpi-value num-pos">+0.8%</div>
                <Spark
                  d="M0,8 L8,8 L16,7 L24,7 L32,6 L40,5"
                  tone="pos"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features ───────────────────────────────────────────────── */}
        <section className="landing-features">
          <p className="landing-section-eyebrow">What it does</p>
          <div className="landing-features-grid">
            <div className="landing-feature">
              <div className="landing-feature-num">01</div>
              <h3 className="landing-feature-title">Paste anything</h3>
              <p className="landing-feature-body">
                X posts. Group-chat screenshots. Substack tips. Bookmaker
                copy-paste. AI extracts every bet — date, market, odds,
                stake, result — and commits it in one click.
              </p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-num">02</div>
              <h3 className="landing-feature-title">CLV vs the close</h3>
              <p className="landing-feature-body">
                Log the Pinnacle close on each bet and we compute your
                real edge over the market. The chart separates skill
                from variance.{" "}
                <span style={{ color: "var(--text-faint)" }}>
                  Bookmaker auto-capture coming.
                </span>
              </p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-num">03</div>
              <h3 className="landing-feature-title">Shareable proof</h3>
              <p className="landing-feature-body">
                Your <span className="landing-mono">amiup.io/u/handle</span>{" "}
                profile shows lifetime P/L, equity curve, and KPI grid. Drop
                it in your X bio. Every claim now has receipts.
              </p>
            </div>
          </div>
        </section>

        {/* Sample callout ─────────────────────────────────────────── */}
        <section className="landing-sample">
          <div className="landing-sample-text">
            <p className="landing-section-eyebrow">See it in action</p>
            <h2 className="landing-sample-title">
              A real profile, real numbers, real receipts.
            </h2>
            <p className="landing-sample-body">
              Every public profile shows aggregate stats, the equity curve,
              and the last 30 settled bets. Pending bets stay private —
              strangers can&rsquo;t see what you&rsquo;re about to bet on
              next. They only see what you&rsquo;ve already proven.
            </p>
            <Link
              href={`/u/${SAMPLE_HANDLE}`}
              className="btn-primary"
              style={{
                padding: "10px 20px",
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              View the sample profile →
            </Link>
          </div>
        </section>

        {/* Final CTA ──────────────────────────────────────────────── */}
        <section className="landing-final-cta">
          <h2 className="landing-final-title">Start tracking.</h2>
          <p className="landing-final-sub">
            Free. No credit card. Your data is yours — exportable as CSV
            whenever you want, deletable on request.
          </p>
          <Link
            href="/sign-in"
            className="btn-primary"
            style={{
              padding: "13px 28px",
              fontSize: 15,
              textDecoration: "none",
            }}
          >
            Sign up with email →
          </Link>
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
          <Link href={`/u/${SAMPLE_HANDLE}`}>Sample profile</Link>
        </div>
      </footer>
    </div>
  );
}
