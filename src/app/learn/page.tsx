// /learn — glossary hub. Currently the bare /learn URL 404s because
// there's no page.tsx here; only the child routes (clv, yield,
// expected-value, roi, roc) exist. Broken hubs are a real SEO penalty
// AND a missed link-magnet: a hub page consolidates PageRank across
// the child entries, wins its own long-tail rankings (like "betting
// analytics glossary"), and gives Google a topical-authority signal.
//
// Shape: one entry per glossary page with a one-sentence description,
// author + last-updated notes, plus a DefinedTermSet JSON-LD payload
// so the whole set gets recognised as a coherent taxonomy.

import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Betting Analytics Glossary. CLV, Yield, EV, ROI, ROC.",
  description:
    "Plain-English definitions of the metrics that actually matter in sports betting analytics. Closing line value, yield, expected value, ROI, ROC. Each with formula and worked example.",
  openGraph: {
    title: `${BRAND.name} Betting Analytics Glossary`,
    description:
      "CLV, Yield, EV, ROI, ROC. Definitions, formulas, worked examples.",
    type: "website",
  },
};

interface Entry {
  slug: string;
  title: string;
  short: string;
  aka: string[];
}

const ENTRIES: Entry[] = [
  {
    slug: "clv",
    title: "Closing Line Value (CLV)",
    short:
      "The single best statistical signal that a punter has a real edge. Measures whether you beat the sharp closing odds.",
    aka: ["CLV", "Closing Line Value"],
  },
  {
    slug: "yield",
    title: "Yield",
    short:
      "The industry-standard headline metric. Profit per unit staked. Intuitive, easy to compute, and easier to game than most bettors realise.",
    aka: ["Yield", "Betting Yield"],
  },
  {
    slug: "expected-value",
    title: "Expected Value (EV)",
    short:
      "The single number underneath every profitable strategy. Average per-bet profit if the same situation happened infinite times.",
    aka: ["EV", "Expected Value"],
  },
  {
    slug: "roi",
    title: "Return on Investment (ROI)",
    short:
      "Borrowed from finance and used to mean two different things in betting. The stake-vs-bankroll ambiguity spelled out with a worked example.",
    aka: ["ROI", "Return on Investment"],
  },
  {
    slug: "roc",
    title: "Return on Capital (ROC)",
    short:
      "The honest money-on-money return. What your bankroll actually earned, not what your stake volume produced.",
    aka: ["ROC", "Return on Capital"],
  },
];

export default function LearnHubPage() {
  const definedTermSetJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: `${BRAND.name} Sports Betting Glossary`,
    description:
      "Definitions of the metrics that matter in sports betting analytics: closing line value, yield, expected value, ROI, ROC. Each entry includes a formula and a worked example.",
    url: "https://amiup.io/learn",
    hasDefinedTerm: ENTRIES.map((e) => ({
      "@type": "DefinedTerm",
      name: e.title,
      alternateName: e.aka,
      url: `https://amiup.io/learn/${e.slug}`,
    })),
  };

  const collectionPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${BRAND.name} Betting Analytics Glossary`,
    description:
      "Plain-English definitions of the metrics that actually matter in sports betting.",
    url: "https://amiup.io/learn",
    isPartOf: {
      "@type": "WebSite",
      name: BRAND.name,
      url: "https://amiup.io",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(definedTermSetJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionPageJsonLd),
        }}
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
            <span>Glossary</span>
          </nav>

          <p className="learn-eyebrow">Betting analytics glossary</p>
          <h1 className="learn-title">
            The metrics that actually matter.
          </h1>
          <p className="learn-deck">
            Plain-English definitions of the five numbers a serious
            sports bettor should understand. Each entry has the
            definition, the formula, a worked example, and a note on
            what the metric does not tell you.
          </p>

          <section className="learn-section">
            <ul
              className="learn-list learn-list--related"
              style={{ listStyle: "none", padding: 0 }}
            >
              {ENTRIES.map((e) => (
                <li
                  key={e.slug}
                  style={{
                    padding: "18px 20px",
                    marginBottom: 10,
                    border: "var(--border-w) solid var(--border)",
                    borderRadius: 8,
                    background: "var(--surface)",
                  }}
                >
                  <Link
                    href={`/learn/${e.slug}`}
                    style={{
                      fontSize: 17,
                      fontWeight: 600,
                      color: "var(--text)",
                      textDecoration: "none",
                      letterSpacing: "-0.005em",
                    }}
                  >
                    {e.title}
                  </Link>
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: 13.5,
                      color: "var(--text-muted)",
                      lineHeight: 1.5,
                    }}
                  >
                    {e.short}
                  </p>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 11,
                      fontFamily: "var(--mono)",
                      letterSpacing: "0.06em",
                      color: "var(--text-faint)",
                    }}
                  >
                    <Link
                      href={`/learn/${e.slug}`}
                      style={{
                        color: "var(--text-muted)",
                        textDecoration: "none",
                        borderBottom:
                          "var(--border-w) solid var(--border-strong)",
                      }}
                    >
                      Read →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Why these five</h2>
            <p>
              Betting analytics is drowning in vanity metrics. These
              five, understood together, are enough to answer the only
              questions a bettor needs the numbers to answer:
              <em> am I making money, was that a good decision, and
              would a rational observer say I have an edge.</em> The
              rest is noise or window dressing.
            </p>
            <p>
              If you understand these five you can hold your own in a
              conversation with any sharp bettor or oddsmaker. You can
              also spot the tipsters who quote yield without a bankroll
              context, quote ROI without saying which denominator, or
              never mention CLV at all.
            </p>
          </section>

          <section className="learn-cta">
            <div>
              <div className="learn-cta-title">
                See these metrics on your own dashboard.
              </div>
              <div className="learn-cta-sub">
                {BRAND.name} computes CLV, yield, ROC, and the rest
                automatically from the bets you log. Free, no credit
                card. Paste a tip, watch it parse, watch the numbers
                move.
              </div>
            </div>
            <Link
              href="/sign-in"
              className="btn-primary"
              style={{
                padding: "12px 22px",
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              Start tracking &rarr;
            </Link>
          </section>

          <footer className="learn-foot">
            <Link href="/">Back to {BRAND.name}</Link>
            <Link href="/u/sample">See a sample profile</Link>
            <Link href="/compare">All comparisons</Link>
            <Link href="/compare/bet-analytix">vs Bet Analytix</Link>
            <Link href="/compare/bettin-gs">vs bettin.gs</Link>
            <Link href="/compare/pikkit">vs Pikkit</Link>
            <Link href="/compare/betdiary">vs Bet Diary</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </footer>
        </main>
      </div>
    </>
  );
}
