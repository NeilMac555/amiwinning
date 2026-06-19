"use client";

// Marketing landing page for signed-out visitors at "/".
//
// Hero → 3 feature cards → sample-profile preview → final CTA.
// Linked sample is Neil's real profile, not a fake one — the +369u
// hero number is more compelling than a fabricated example.

import Link from "next/link";
import { BRAND } from "@/lib/brand";

const SAMPLE_HANDLE = "sample";

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
              No more painstaking data entry. Paste any source —
              screenshots, X posts, group chats — and AI extracts every
              bet. Then track your real edge with CLV, equity curves,
              and a shareable profile.
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

          {/* App-mockup hero — a faithful HTML port of the desktop hero
              slide. Shows the product as it actually looks (sidebar +
              KPI strip + equity curve + per-league panel + recent bets)
              so first-time visitors see what they're getting. Numbers
              are illustrative — the "Live demo" badge in the corner
              makes that explicit. */}
          <DesktopHeroMockup />
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

      {/* App-mockup hero rendered above. Defined at module bottom so the
          marketing copy stays at the top of the file. */}

      <footer className="landing-foot">
        <div className="brand" style={{ fontSize: 13 }}>
          <div className="brand-mark" aria-hidden="true"></div>
          <span style={{ fontWeight: 600 }}>{BRAND.name}</span>
        </div>
        <div className="landing-foot-links">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href={`/u/${SAMPLE_HANDLE}`}>Sample profile</Link>
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

// ─────────────────────────────────────────────────────────────────────────
// Desktop hero mockup
//
// A faithful HTML port of the Am_I_Up___Desktop_Hero.pptx hero slide: an
// in-browser product mockup showing the dashboard the user will land in
// once they sign up. Uses the existing theme tokens so it follows the
// visitor's selected colour scheme.
//
// Numbers are illustrative — the "Live demo" badge in the top-right makes
// that explicit. Deliberately omitted from the original PPTX: "trusted
// by 1,000+ bettors", "4.5 ★" rating, "Pro" tier badge — none of which
// are honest claims today. Also dropped the fake top-nav routes
// (Product / Method / Pricing) that don't exist on the live site.
// ─────────────────────────────────────────────────────────────────────────

function DesktopHeroMockup() {
  return (
    <div className="hero-mockup" aria-hidden="true">
      {/* Browser chrome — sets the "in a real browser" frame. */}
      <div className="hero-mockup-chrome">
        <div className="hero-mockup-dots">
          <span className="hero-mockup-dot" data-tone="red" />
          <span className="hero-mockup-dot" data-tone="amber" />
          <span className="hero-mockup-dot" data-tone="green" />
        </div>
        <div className="hero-mockup-urlbar">amiup.io</div>
        <span className="hero-mockup-livebadge">Live demo</span>
      </div>

      <div className="hero-mockup-app">
        {/* Sidebar — mirrors the real app sidebar. */}
        <aside className="hero-mockup-sidebar">
          <div className="hero-mockup-brand">
            <div className="brand-mark" aria-hidden="true" />
            <span>Am I Up</span>
          </div>
          <div className="hero-mockup-nav">
            <div className="hero-mockup-nav-heading">Workspace</div>
            <div className="hero-mockup-nav-item is-active">Ledger</div>
            <div className="hero-mockup-nav-item">Paste a bet</div>
            <div className="hero-mockup-nav-item">Performance</div>
            <div className="hero-mockup-nav-item">CLV report</div>
            <div className="hero-mockup-nav-item">Settings</div>
          </div>
        </aside>

        {/* Main column. */}
        <main className="hero-mockup-main">
          <div className="hero-mockup-mainhead">
            <div className="hero-mockup-h1">
              Ledger
              <span className="hero-mockup-season">2025–26 Season</span>
            </div>
            <div className="hero-mockup-tabs">
              <span className="hero-mockup-tab is-active">All</span>
              <span className="hero-mockup-tab">YTD</span>
              <span className="hero-mockup-tab">1M</span>
              <span className="hero-mockup-tab">1W</span>
            </div>
          </div>

          {/* KPI strip — 4 cells, matching the slide. */}
          <div className="hero-mockup-kpis">
            <div className="hero-mockup-kpi">
              <div className="hero-mockup-kpi-label">Units</div>
              <div className="hero-mockup-kpi-value num-pos">+62.4u</div>
            </div>
            <div className="hero-mockup-kpi">
              <div className="hero-mockup-kpi-label">Record</div>
              <div className="hero-mockup-kpi-value">182–146–9</div>
            </div>
            <div className="hero-mockup-kpi">
              <div className="hero-mockup-kpi-label">ROI</div>
              <div className="hero-mockup-kpi-value num-pos">+11.4%</div>
            </div>
            <div className="hero-mockup-kpi">
              <div className="hero-mockup-kpi-label">Win rate</div>
              <div className="hero-mockup-kpi-value">55.5%</div>
            </div>
          </div>

          {/* Equity curve card. */}
          <div className="hero-mockup-card hero-mockup-equity-card">
            <div className="hero-mockup-card-head">
              <span className="hero-mockup-card-title">Equity curve · units</span>
              <span className="hero-mockup-card-meta num-pos">peak +64.8u</span>
            </div>
            <svg
              className="hero-mockup-equity"
              viewBox="0 0 600 110"
              preserveAspectRatio="none"
            >
              {/* baseline */}
              <line
                x1="0"
                x2="600"
                y1="95"
                y2="95"
                stroke="var(--border)"
                strokeWidth="0.6"
              />
              {/* equity path — choppy uptrend resembling real punter variance */}
              <path
                d="M0,90 L20,86 L42,82 L66,84 L92,76 L122,79 L148,68 L178,73 L206,62 L234,67 L262,56 L292,60 L320,48 L350,53 L380,40 L412,46 L442,32 L472,38 L504,22 L536,28 L568,14 L600,10"
                stroke="var(--green)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              {/* area fill */}
              <path
                d="M0,90 L20,86 L42,82 L66,84 L92,76 L122,79 L148,68 L178,73 L206,62 L234,67 L262,56 L292,60 L320,48 L350,53 L380,40 L412,46 L442,32 L472,38 L504,22 L536,28 L568,14 L600,10 L600,110 L0,110 Z"
                fill="var(--green)"
                opacity="0.09"
              />
              {/* peak marker */}
              <circle cx="600" cy="10" r="2.4" fill="var(--green)" />
            </svg>
          </div>

          {/* Two-column bottom row: By league + Recent bets. */}
          <div className="hero-mockup-grid">
            {/* By league. */}
            <div className="hero-mockup-card">
              <div className="hero-mockup-card-head">
                <span className="hero-mockup-card-title">By league</span>
                <span className="hero-mockup-card-meta">CLV adjusted</span>
              </div>
              <div className="hero-mockup-league-row">
                <span className="hero-mockup-league-tag">NFL</span>
                <span className="hero-mockup-league-name">Football</span>
                <span className="hero-mockup-league-record">48–31</span>
                <span className="hero-mockup-league-clv">CLV +2.1%</span>
                <span className="hero-mockup-league-pl num-pos">+18.4u</span>
              </div>
              <div className="hero-mockup-league-row">
                <span className="hero-mockup-league-tag">NBA</span>
                <span className="hero-mockup-league-name">Basketball</span>
                <span className="hero-mockup-league-record">61–52</span>
                <span className="hero-mockup-league-clv">CLV +1.4%</span>
                <span className="hero-mockup-league-pl num-pos">+9.2u</span>
              </div>
              <div className="hero-mockup-league-row">
                <span className="hero-mockup-league-tag">EPL</span>
                <span className="hero-mockup-league-name">Soccer</span>
                <span className="hero-mockup-league-record">39–28</span>
                <span className="hero-mockup-league-clv">CLV +0.6%</span>
                <span className="hero-mockup-league-pl num-neg">−2.1u</span>
              </div>
              <div className="hero-mockup-league-row">
                <span className="hero-mockup-league-tag">NHL</span>
                <span className="hero-mockup-league-name">Hockey</span>
                <span className="hero-mockup-league-record">22–19</span>
                <span className="hero-mockup-league-clv">CLV +1.9%</span>
                <span className="hero-mockup-league-pl num-pos">+6.8u</span>
              </div>
            </div>

            {/* Recent bets. */}
            <div className="hero-mockup-card">
              <div className="hero-mockup-card-head">
                <span className="hero-mockup-card-title">Recent bets</span>
                <span className="hero-mockup-card-meta">last settled</span>
              </div>
              <div className="hero-mockup-bet">
                <div className="hero-mockup-bet-main">
                  <span className="hero-mockup-bet-tag">NFL</span>
                  <span className="hero-mockup-bet-sel">Chiefs ML</span>
                </div>
                <div className="hero-mockup-bet-meta">
                  <span>2.0u @ −140</span>
                  <span className="num-pos">Won +2.86u</span>
                </div>
              </div>
              <div className="hero-mockup-bet">
                <div className="hero-mockup-bet-main">
                  <span className="hero-mockup-bet-tag">NBA</span>
                  <span className="hero-mockup-bet-sel">Nuggets/Lakers U 228.5</span>
                </div>
                <div className="hero-mockup-bet-meta">
                  <span>1.5u @ 1.91</span>
                  <span className="num-neg">Lost −1.50u</span>
                </div>
              </div>
              <div className="hero-mockup-bet">
                <div className="hero-mockup-bet-main">
                  <span className="hero-mockup-bet-tag">EPL</span>
                  <span className="hero-mockup-bet-sel">Arsenal −1 AH</span>
                </div>
                <div className="hero-mockup-bet-meta">
                  <span>1.0u @ 2.05</span>
                  <span className="num-pos">Won +1.05u</span>
                </div>
              </div>
              <div className="hero-mockup-bet">
                <div className="hero-mockup-bet-main">
                  <span className="hero-mockup-bet-tag">UFC</span>
                  <span className="hero-mockup-bet-sel">Makhachev by decision</span>
                </div>
                <div className="hero-mockup-bet-meta">
                  <span>0.5u @ +225</span>
                  <span className="num-pos">Won +1.13u</span>
                </div>
              </div>
            </div>
          </div>

          {/* Honest trust strip — no fabricated "1,000+ bettors" or "4.5 ★". */}
          <div className="hero-mockup-trust">
            <span>NO SPREADSHEET</span>
            <span className="hero-mockup-trust-sep">·</span>
            <span>CSV &amp; BOOK SYNC</span>
            <span className="hero-mockup-trust-sep">·</span>
            <span>CLOSING-LINE VALUE</span>
          </div>
        </main>
      </div>
    </div>
  );
}

