"use client";

// Marketing landing page for signed-out visitors at "/".
//
// Hero → 3 feature cards → sample-profile preview → final CTA.
// Linked sample is Neil's real profile, not a fake one — the +369u
// hero number is more compelling than a fabricated example.

import Link from "next/link";
import { BRAND } from "@/lib/brand";

const SAMPLE_HANDLE = "neilmac555";

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
            <p className="landing-eyebrow">For tipsters who give a damn.</p>
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
              profile page hero. */}
          <div className="landing-preview" aria-hidden="true">
            <div className="landing-preview-head">
              <div className="landing-preview-avatar">NE</div>
              <div>
                <div className="landing-preview-name">Neil Mac</div>
                <div className="landing-preview-handle">@neilmac555</div>
              </div>
            </div>
            <div className="landing-preview-label">Lifetime P/L</div>
            <div className="landing-preview-pl">+369.4u</div>
            <div className="landing-preview-sub">
              across 8,330 settled bets
            </div>
            <div className="landing-preview-kpi-row">
              <div>
                <div className="landing-preview-kpi-label">Yield</div>
                <div className="landing-preview-kpi-value num-pos">+3.7%</div>
              </div>
              <div>
                <div className="landing-preview-kpi-label">Win rate</div>
                <div className="landing-preview-kpi-value">50.3%</div>
              </div>
              <div>
                <div className="landing-preview-kpi-label">CLV</div>
                <div className="landing-preview-kpi-value num-pos">+1.30%</div>
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
                Pinnacle closing line auto-captured at kickoff. Track your
                real edge over the market, not just your luck. Edge or
                luck? The chart tells you.
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
              View {SAMPLE_HANDLE}&rsquo;s profile →
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
