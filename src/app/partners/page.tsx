// /partners — tipster partnership landing.
//
// Target audience: tipsters with real X / Substack / Telegram audiences
// who saw Neil's "reach out" tweet and want to know the terms before
// they DM. The page has to do three things:
//   1. Explain why Am I Up wants to pay tipsters (so it doesn't read
//      as desperate or shady).
//   2. State the commitment and payment model clearly, in one place,
//      so the first DM is not spent haggling over structure.
//   3. Convert those who fit by giving them exactly what to include
//      in their message.
//
// Copy follows the terminal-dark voice: terse, businesslike, no
// em dashes, no emojis. Same shell as the /learn/* pages so it
// inherits the same dark styling without extra CSS.

import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { PartnerApplicationForm } from "@/components/PartnerApplicationForm";

const CONTACT_EMAIL = "filthyjabba@gmail.com";
const CONTACT_X = "NeilMac555";

export const metadata: Metadata = {
  title: "Partners. Get paid to prove your edge.",
  description:
    "Am I Up pays tipsters with real audiences to adopt it as their tracker of record. Monthly cash for logging real bets and posting an honest summary. Terms in one page.",
  openGraph: {
    title: "Am I Up Partners. Get paid to prove your edge.",
    description:
      "Cash-for-adoption partnership for tipsters. Monthly bets, monthly summary post, monthly payment. Terms in one page.",
    type: "website",
  },
};

export default function PartnersPage() {
  // WebPage schema so search engines and LLMs know this is a business
  // page, not a glossary entry. Keeps the structured-data flavour of
  // the site consistent across the /learn and /compare families.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${BRAND.name} Partners`,
    description:
      "Cash-for-adoption partnership terms for tipsters. Monthly commitment, monthly payment on delivery of an honest summary post.",
    url: "https://amiup.io/partners",
    isPartOf: {
      "@type": "WebSite",
      name: BRAND.name,
      url: "https://amiup.io",
    },
    audience: {
      "@type": "Audience",
      audienceType: "Sports betting tipsters with a public audience",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="learn-page">
        <header className="legal-topbar">
          <Link href="/" className="brand" style={{ textDecoration: "none" }}>
            <div className="brand-mark" aria-hidden="true"></div>
            <span>{BRAND.name}</span>
          </Link>
          <Link
            href="/sign-in"
            className="btn-primary"
            style={{
              padding: "7px 16px",
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Track your bets free →
          </Link>
        </header>

        <main className="learn-main">
          <nav className="learn-crumbs" aria-label="Breadcrumb">
            <Link href="/">Am I Up</Link>
            <span>›</span>
            <span>Partners</span>
          </nav>

          <p className="learn-eyebrow">Am I Up Partners</p>
          <h1 className="learn-title">Get paid to prove your edge.</h1>
          <p className="learn-deck">
            {BRAND.name} pays tipsters with real audiences to adopt it as
            their tracker of record. Monthly cash in exchange for logging
            real bets and posting one honest summary at the end of every
            month. Terms in one page. No fine print.
          </p>

          <section className="learn-section">
            <h2 className="learn-h2">Why the pay</h2>
            <p>
              Tipsters with real audiences have real distribution power.
              {" "}{BRAND.name} is early. We would rather pay real tipsters
              cash to migrate their record onto our public-profile system
              than spend the same money on ads. If your followers see your
              track record on amiup.io/u/&lt;yourhandle&gt; and a fraction
              sign up to compete, we win. So do you.
            </p>
            <p>
              This is not an affiliate scheme. The tool stays free for
              everyone. You do not get a cut of anything downstream. You
              get a flat monthly payment for the commitment described
              below, paid on delivery.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">What you get</h2>
            <ul className="learn-list">
              <li>
                <strong>Monthly cash payment</strong> at end of month, on
                delivery of the monthly summary post. Amount depends on
                your audience size and engagement, agreed on application.
              </li>
              <li>
                <strong>Featured placement</strong> when we launch the
                featured-tipsters section on the landing page (in build).
                Your public profile linked from the front of the site.
              </li>
              <li>
                <strong>Full use of the tracker.</strong> Paste-and-parse
                on text and screenshots. CLV vs Pinnacle close. Equity
                curve. KPI grid. Sport / market / odds-range breakdowns.
                No caps. All the features Am I Up has, no partner-tier
                gating.
              </li>
              <li>
                <strong>A short, memorable public URL</strong>{" "}
                (amiup.io/u/&lt;yourhandle&gt;). Yours to keep even after
                the partnership ends. You control the handle; we do not
                take it back.
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">What you commit to</h2>
            <p>
              Each calendar month, for as long as the partnership runs:
            </p>
            <ol className="learn-list">
              <li>
                <strong>Log at least 30 real bets to {BRAND.name}.</strong>{" "}
                Real means bets you actually placed at real stakes. Not
                backfilled screenshots. Not simulated picks. Every bet
                logged before its kickoff so CLV is captured.
              </li>
              <li>
                <strong>Post one monthly summary at end of month.</strong>{" "}
                A single X post (or Substack note, or Telegram broadcast,
                whichever is your main channel) linking your{" "}
                amiup.io/u/&lt;yourhandle&gt; profile with your month&rsquo;s
                P/L and a call to click through. Content wording is yours;
                the link and the honest number are non-negotiable.
              </li>
              <li>
                <strong>Sign a one-page partnership agreement.</strong>{" "}
                Plain English, no gotchas. Covers cancellation, non-
                exclusivity, and the payment schedule.
              </li>
            </ol>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">The public-profile reality</h2>
            <p>
              Your public profile at amiup.io/u/&lt;yourhandle&gt; shows
              lifetime P/L, equity curve, KPI grid, and the last 30
              settled bets. It is honest. If you lose money in a month,
              viewers see it. If you win, they see it. There is no way to
              fake the numbers on the platform. We deliberately built it
              that way.
            </p>
            <p>
              This self-selects who applies. If you do not have an edge,
              this page is not for you. If you do have an edge, this is
              exactly the receipt system you have been missing.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">How the money works</h2>
            <ul className="learn-list">
              <li>
                Paid at end of month, on delivery of the monthly summary
                post. First month is a trial: you log the 30 bets, post
                the summary, get paid.
              </li>
              <li>
                Continuing months are month-to-month by default, or on a
                rolling three-month agreement at a preferential rate if
                you prefer stability.
              </li>
              <li>
                Cancel any time. No claw-back on months already paid.
                Your public profile stays yours regardless.
              </li>
              <li>
                Payment methods: bank transfer, PayPal, USDT, or ETH.
                Whatever is cleanest for you.
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Who we are looking for</h2>
            <ul className="learn-list">
              <li>
                Tipster with a public track record on X, Substack,
                Telegram, or Discord.
              </li>
              <li>
                Real audience. Rough thresholds: 1,000+ X followers OR
                500+ paid Substack subscribers OR 300+ active Telegram /
                Discord members. Softer thresholds if engagement is
                exceptional.
              </li>
              <li>
                Willing to publish results honestly, including losing
                months.
              </li>
              <li>
                Focused on sports {BRAND.name} handles well: soccer,
                tennis, basketball, baseball, horse racing, American
                football, or ice hockey.
              </li>
              <li>
                Based anywhere. Am I Up is bookmaker-agnostic; no US or
                UK residency requirement.
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Apply</h2>
            <p>
              Fill in the form below. It emails Neil directly. Required
              fields are contact, handle, and a one-line pitch on your
              edge. The rest gets asked on the reply if you leave it
              blank.
            </p>
            <div style={{ marginTop: 16 }}>
              <PartnerApplicationForm />
            </div>
            <p
              style={{
                fontSize: 11.5,
                color: "var(--text-faint)",
                fontFamily: "var(--mono)",
                marginTop: 12,
              }}
            >
              Fallback: DM{" "}
              <a
                href={`https://x.com/${CONTACT_X}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                @{CONTACT_X}
              </a>{" "}
              on X or email{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=Am%20I%20Up%20partnership`}
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>

          <footer className="learn-foot">
            <Link href="/">Back to {BRAND.name}</Link>
            <Link href="/u/sample">See a sample profile</Link>
            <Link href="/learn/clv">What is CLV?</Link>
            <Link href="/learn/yield">What is Yield?</Link>
            <Link href="/learn/roi">What is ROI?</Link>
            <Link href="/learn/roc">What is ROC?</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </footer>
        </main>
      </div>
    </>
  );
}
