// /compare — bet tracker comparison hub. Bare /compare currently 404s
// because only the child routes (/compare/bettin-gs, /compare/pikkit,
// /compare/betdiary) exist. Hub page consolidates PageRank across
// them, wins its own long-tail rankings ("bet tracker comparison",
// "best bet tracker"), and gives Google a topical-authority signal.
//
// Shape: one card per competitor with a one-sentence positioning
// note, plus a CollectionPage JSON-LD payload so the whole set is
// recognised as a related-content group.

import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Bet Tracker Comparisons. Am I Up vs the alternatives.",
  description:
    "Honest head-to-head comparisons of Am I Up against every major sports bet tracker. bettin.gs, Pikkit, Bet Diary, and more. Pick the tool that fits your betting style.",
  openGraph: {
    title: `${BRAND.name} Bet Tracker Comparisons`,
    description:
      "Honest head-to-head vs bettin.gs, Pikkit, Bet Diary and more.",
    type: "website",
  },
};

interface Comparison {
  slug: string;
  competitor: string;
  short: string;
}

const COMPARISONS: Comparison[] = [
  {
    slug: "bettin-gs",
    competitor: "bettin.gs",
    short:
      "The established European tracker. Manual entry, community + tipster leaderboards, ten years of polish. Honest side-by-side from a former ten-year user.",
  },
  {
    slug: "pikkit",
    competitor: "Pikkit",
    short:
      "US-focused, bookmaker-connected tracker (DraftKings, FanDuel, etc). Great if you have all your action at connected US sportsbooks. Am I Up covers you if you don't.",
  },
  {
    slug: "betdiary",
    competitor: "Bet Diary",
    short:
      "UK-focused manual bet tracker with a long horse-racing lineage. Fine if UK racing is 90% of what you do. Am I Up wins on data entry and CLV.",
  },
];

export default function CompareHubPage() {
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${BRAND.name} Bet Tracker Comparisons`,
    description:
      "Honest head-to-head comparisons of Am I Up vs every major sports bet tracker.",
    url: "https://amiup.io/compare",
    isPartOf: {
      "@type": "WebSite",
      name: BRAND.name,
      url: "https://amiup.io",
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: COMPARISONS.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://amiup.io/compare/${c.slug}`,
        name: `${BRAND.name} vs ${c.competitor}`,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      <div className="compare-page">
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
            Try Am I Up free →
          </Link>
        </header>

        <main className="compare-main">
          <nav className="learn-crumbs" aria-label="Breadcrumb">
            <Link href="/">Am I Up</Link>
            <span>›</span>
            <span>Compare</span>
          </nav>

          <p className="compare-eyebrow">Bet tracker comparisons</p>
          <h1 className="compare-title">
            Am I Up <span className="compare-vs">vs</span> the rest.
          </h1>
          <p className="compare-deck">
            Honest side-by-side reviews of Am I Up against every major
            sports bet tracker. No competitor-bashing. If another tool is
            the better fit for you, these pages will tell you that.
          </p>

          <section className="compare-section">
            <ul
              className="compare-list"
              style={{ listStyle: "none", padding: 0 }}
            >
              {COMPARISONS.map((c) => (
                <li
                  key={c.slug}
                  style={{
                    padding: "18px 20px",
                    marginBottom: 10,
                    border: "var(--border-w) solid var(--border)",
                    borderRadius: 8,
                    background: "var(--surface)",
                  }}
                >
                  <Link
                    href={`/compare/${c.slug}`}
                    style={{
                      fontSize: 17,
                      fontWeight: 600,
                      color: "var(--text)",
                      textDecoration: "none",
                      letterSpacing: "-0.005em",
                    }}
                  >
                    Am I Up vs {c.competitor}
                  </Link>
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: 13.5,
                      color: "var(--text-muted)",
                      lineHeight: 1.5,
                    }}
                  >
                    {c.short}
                  </p>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 11,
                      fontFamily: "var(--mono)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    <Link
                      href={`/compare/${c.slug}`}
                      style={{
                        color: "var(--text-muted)",
                        textDecoration: "none",
                        borderBottom:
                          "var(--border-w) solid var(--border-strong)",
                      }}
                    >
                      Read the comparison →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="compare-section">
            <h2 className="compare-h2">How we write these</h2>
            <p>
              Every comparison is written to be useful to a bettor
              choosing between tools, not to sell them Am I Up. We name
              the competitor&rsquo;s real strengths, we name where they
              beat us, we tell the reader when the other tool is the
              better pick.
            </p>
            <p>
              Trust beats sales copy on this kind of page because the
              search intent is deep-funnel: someone reading &ldquo;X
              alternative&rdquo; is already inside the buying decision.
              We would rather earn the reader&rsquo;s trust and lose the
              signup than land a signup on a false comparison and see
              them churn.
            </p>
          </section>

          <section className="compare-cta">
            <div>
              <div className="compare-cta-title">
                Ready to try Am I Up?
              </div>
              <div className="compare-cta-sub">
                Free. No credit card. Full CSV export any time. Take
                your data with you if you leave.
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

          <footer className="compare-foot">
            <Link href="/">Back to Am I Up</Link>
            <Link href="/u/sample">See a sample profile</Link>
            <Link href="/learn">Glossary</Link>
            <Link href="/learn/clv">What is CLV?</Link>
            <Link href="/learn/yield">What is Yield?</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </footer>
        </main>
      </div>
    </>
  );
}
