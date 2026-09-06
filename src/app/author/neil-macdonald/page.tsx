// /author/neil-macdonald — the site's canonical author entity page.
//
// SEO / GEO rationale:
//   Google's E-E-A-T evaluation for YMYL topics (sports betting is
//   textbook YMYL) weights author identity heavily. Every /learn page's
//   Article JSON-LD points its `author` field at this URL via `@id`, so
//   Google and AI answer engines resolve one authoritative Person entity
//   for the whole glossary instead of 13 disconnected byline mentions.
//
//   The Person schema below carries the sameAs edges to X and GitHub and
//   to Neil's own bettor profile at /neilmac555 — that verifiable off-
//   site presence is what turns "amiup.io says X" into "Neil Macdonald,
//   whose X profile is @NeilMac555, says X" in an LLM citation. Same
//   trick Google uses for its own author card panels.
//
//   ProfilePage wraps the Person as Google's recommended container for
//   an author bio. Breadcrumbs give search the crawl hierarchy.
//
// This page is deliberately plain — no data-driven state, no client
// components. It's an entity anchor first and a human-readable bio
// second.

import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { buildBreadcrumbList } from "@/lib/breadcrumb-schema";

// Absolute URL for @id anchors — must match verbatim across every
// /learn page's Article.author reference. Changing this breaks the
// entity graph.
const AUTHOR_ID = "https://amiup.io/author/neil-macdonald#person";
const AUTHOR_URL = "https://amiup.io/author/neil-macdonald";

export const metadata: Metadata = {
  alternates: { canonical: "/author/neil-macdonald" },
  title: "Neil Macdonald — Founder of Am I Up and SteamWatch",
  description:
    "Neil Macdonald builds Am I Up, a free bet tracker, and SteamWatch, a football odds movement and market analysis tool. Read about the founder and both products.",
  openGraph: {
    title: "Neil Macdonald — Sports betting analyst",
    description:
      "Founder of Am I Up. Writes on CLV, positive EV, bankroll, and the math behind sharp betting.",
    type: "profile",
    url: AUTHOR_URL,
  },
  twitter: {
    card: "summary",
    title: "Neil Macdonald — Sports betting analyst",
    description:
      "Founder of Am I Up. Writes on CLV, positive EV, and the math behind sharp betting.",
  },
};

// Every /learn glossary page authored by Neil. Rendered as a link list
// below AND wired into the Person schema's `knowsAbout` array so the
// entity graph shows the breadth of topics he writes on.
const ARTICLES: Array<{ slug: string; title: string; topic: string }> = [
  { slug: "clv", title: "What is Closing Line Value (CLV)?", topic: "Closing line value" },
  { slug: "expected-value", title: "What is Expected Value (EV)?", topic: "Expected value" },
  { slug: "positive-ev-betting", title: "Positive EV Betting", topic: "Positive EV betting" },
  { slug: "yield", title: "What is Yield in sports betting?", topic: "Yield" },
  { slug: "roi", title: "What is ROI in Sports Betting?", topic: "Return on investment" },
  { slug: "roc", title: "What is Return on Capital (ROC)?", topic: "Return on capital" },
  { slug: "kelly-criterion", title: "Kelly Criterion for Sports Betting", topic: "Kelly Criterion" },
  { slug: "bankroll-management", title: "Bankroll Management for Sports Betting", topic: "Bankroll management" },
  { slug: "devigging", title: "Devigging Odds", topic: "Devigging" },
  { slug: "parlay", title: "What is a Parlay in Sports Betting?", topic: "Parlays" },
  { slug: "moneyline", title: "What is a Moneyline Bet?", topic: "Moneyline bets" },
  { slug: "point-spread", title: "What is a Point Spread?", topic: "Point spreads" },
  { slug: "over-under-betting", title: "What is Over/Under (Totals) Betting?", topic: "Totals betting" },
];

export default function AuthorPage() {
  // Rich Person entity. Every field here is a signal Google + AI
  // engines use to establish who Neil is, what he can be trusted to
  // write about, and how to attribute quotes back to him.
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": AUTHOR_ID,
    name: "Neil Macdonald",
    givenName: "Neil",
    familyName: "Macdonald",
    url: AUTHOR_URL,
    jobTitle: "Founder",
    worksFor: {
      "@type": "Organization",
      name: BRAND.name,
      url: "https://amiup.io",
    },
    description:
      "Independent sports betting analyst and founder of Am I Up, a free AI-powered bet tracker. Writes on closing line value (CLV), positive EV betting, Kelly staking, and the applied math of sharp sports betting. Ten years' hands-on experience across soccer, tennis, and US majors.",
    knowsAbout: [
      "Sports betting",
      "Closing line value (CLV)",
      "Positive EV betting",
      "Kelly Criterion",
      "Bankroll management",
      "Devigging odds",
      "Sports betting analytics",
      "Bet tracking",
      "Pinnacle closing lines",
      "American odds",
      "Decimal odds",
      "Point spreads",
      "Moneyline bets",
      "Over/under totals",
      "Parlays",
    ],
    // sameAs is the entity graph edge. Every URL here should be a
    // verifiable, publicly-owned account. A broken sameAs is worse
    // than none — Google downweights an entity that points at 404s
    // or claimed accounts it can't verify.
    sameAs: [
      "https://www.steamwatch.io/about",
      "https://x.com/NeilMac555",
      "https://github.com/NeilMac555",
      "https://amiup.io/neilmac555",
    ],
  };

  // ProfilePage wraps the Person and tells Google "this page IS about
  // that Person" — the recommended container for an author bio page.
  const profilePageJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: { "@id": AUTHOR_ID },
    url: AUTHOR_URL,
    name: "Neil Macdonald — Sports betting analyst",
    dateModified: "2026-09-06",
  };

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: BRAND.name, url: "https://amiup.io" },
    { name: "Authors", url: AUTHOR_URL },
    { name: "Neil Macdonald", url: AUTHOR_URL },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
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
            style={{ padding: "7px 16px", fontSize: 13, textDecoration: "none" }}
          >
            Track your bets free →
          </Link>
        </header>

        <main className="learn-main">
          <nav className="learn-crumbs" aria-label="Breadcrumb">
            <Link href="/">Am I Up</Link>
            <span>›</span>
            <span>Author</span>
            <span>›</span>
            <span>Neil Macdonald</span>
          </nav>

          <p className="learn-eyebrow">Author</p>
          <h1 className="learn-title">Neil Macdonald</h1>
          <p className="learn-deck">
            Independent sports betting analyst. Founder of{" "}
            <Link href="/">{BRAND.name}</Link>, a free AI bet tracker. Writes
            on closing line value, positive EV, bankroll management, and the
            applied math of sharp sports betting.
          </p>

          <section className="learn-section">
            <h2 className="learn-h2">About</h2>
            <p>
              Ten years of hands-on sports betting across soccer, tennis, and
              the US majors. Built {BRAND.name} because the trackers that
              existed either cost too much, gated the interesting metrics
              behind subscriptions, or refused to accept anything but a
              hand-typed row. The wedge — paste a screenshot, a Telegram tip,
              a bookmaker copy-paste, and the AI extracts every bet — was the
              feature I wanted for myself first.
            </p>
            <p>
              Writing here is deliberately plain-English. Every article
              starts with a one-line definition, spells out the math with
              worked examples, and ends with an FAQ that answers the
              questions the plain-English version raised. No hype, no
              tipster hard-sells, no promises about turning $100 into
              $10,000.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">The tools I build</h2>
            <p>I built Am I Up and <a href="https://www.steamwatch.io/">SteamWatch</a>
              {" "}to support different parts of a bettor&rsquo;s workflow. Am I Up records
              your bets and measures your results. SteamWatch tracks Pinnacle football
              odds movement, with market analysis, closing lines and Telegram alerts.</p>
            <p>Use SteamWatch to investigate how a market is moving, then log the bets
              you choose to place in Am I Up. They are separate products from the same
              founder; a SteamWatch alert is not an automatically synced bet.</p>
            <p><a href="https://www.steamwatch.io/about">Read about Neil Mac and SteamWatch →</a></p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Where to find me</h2>
            <ul>
              <li>
                <a
                  href="https://x.com/NeilMac555"
                  rel="me noopener"
                  target="_blank"
                >
                  X (Twitter): @NeilMac555
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/NeilMac555"
                  rel="me noopener"
                  target="_blank"
                >
                  GitHub: NeilMac555
                </a>
              </li>
              <li>
                <Link href="/neilmac555">
                  My {BRAND.name} tracker profile — live bets, CLV, equity
                  curve
                </Link>
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Articles</h2>
            <p>
              Every glossary page on {BRAND.name} is written and maintained
              here.
            </p>
            <ul>
              {ARTICLES.map((a) => (
                <li key={a.slug}>
                  <Link href={`/learn/${a.slug}`}>{a.title}</Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Editorial policy</h2>
            <ul>
              <li>
                <strong>No fabricated stats.</strong> Every worked example
                uses either a real market number or a clearly-labelled
                illustrative price.
              </li>
              <li>
                <strong>Definitions before conclusions.</strong> Each
                glossary page opens with a plain one-line answer before any
                math or nuance.
              </li>
              <li>
                <strong>Freshness.</strong> Pages carry a visible
                last-updated date and are re-audited whenever a US market
                rule or a sportsbook convention changes materially.
              </li>
              <li>
                <strong>Disclosure.</strong> {BRAND.name} is a free bet
                tracker with no bookmaker affiliate revenue and no tipster
                paywall. Article recommendations are not investment advice.
              </li>
            </ul>
          </section>
        </main>
      </div>
    </>
  );
}
