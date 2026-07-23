// /compare/bettin-gs — head-to-head comparison page targeting the
// "bettin.gs alternative" and "bet tracker comparison" search intent.
//
// SEO strategy: long-tail keyword targeting that bettin.gs themselves
// don't rank for ("bettin.gs alternative" type queries). Comparison
// pages are high-conversion-intent: someone searching this is already
// deep in the consideration funnel.
//
// Tone: honest. We acknowledge bettin.gs strengths (a real product
// Neil personally used for a decade) and don't pretend Am I Up is
// strictly superior. Trust > marketing. Readers who decide bettin.gs
// is right for them should still trust amiup.io enough to share or
// come back later.
//
// Structure: TL;DR table → where each wins → side-by-side feature
// table → decision tree → FAQ (with JSON-LD FAQ schema).

import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Am I Up vs bettin.gs — honest bet tracker comparison",
  description:
    "I used bettin.gs for a decade before building Am I Up. Honest side-by-side of both bet trackers: where each one wins, who should pick which, what's actually different.",
  openGraph: {
    title: "Am I Up vs bettin.gs — bet tracker comparison",
    description:
      "Honest side-by-side from a former bettin.gs user of 10+ years.",
    type: "article",
  },
};

// FAQ schema markup — Google + AI search engines render these as rich
// snippets. Each Q/A becomes a citable chunk for AI retrieval.
const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "Is Am I Up free?",
    a: "Yes, fully free with no credit card required. Every feature on the site is included in the free tier today. Paid tiers may come later for advanced features (auto-settlement, Pinnacle CLV auto-capture) but the core tracking and analytics will stay free.",
  },
  {
    q: "Can I import my existing bettin.gs history?",
    a: "Yes. Export your bets from bettin.gs as a CSV, then drop the file into Am I Up's import page. The AI will read the columns and map them onto our schema. Most users get their entire history in within 5 minutes.",
  },
  {
    q: "Does Am I Up support tipster following / a community?",
    a: "Not yet. bettin.gs has an established community with tipster leaderboards. Am I Up is focused on personal tracking first; community features are on the roadmap but not present today.",
  },
  {
    q: "Which sports does Am I Up support?",
    a: "Soccer, tennis, basketball, baseball, and horse racing are first-class right now (deepest market parsing, sport classification including NBA player props, MLB strikeout / total-base props, and horse racing markets like each-way / NR / Rule 4 / forecast / tricast plus famous race + jockey + trainer recognition, CLV against Pinnacle close). Other sports work but the AI parsing is less precise. NFL is next on the rollout, then NHL, MMA, cricket, golf, boxing, and esports.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Individual bets are never shown publicly. Your public profile (if you turn it on) shows aggregate stats only — lifetime P/L, equity curve, win rate, sample size. Strangers cannot see what you're betting on next.",
  },
  {
    q: "What about CLV tracking against the Pinnacle close?",
    a: "Both Am I Up and bettin.gs require you to enter the closing line manually for v1. Pinnacle auto-capture is on the Am I Up roadmap and is being scoped now. It will be the next major feature shipped.",
  },
];

export default function ComparePage() {
  // JSON-LD for FAQ — drops into <head>, gets parsed by Google for
  // rich snippets and by AI crawlers for retrieval citations.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd),
        }}
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
          <p className="compare-eyebrow">Bet tracker comparison</p>
          <h1 className="compare-title">
            Am I Up <span className="compare-vs">vs</span> bettin.gs
          </h1>
          <p className="compare-deck">
            An honest side-by-side from someone who used bettin.gs for
            10+ years before building Am I Up. Where each one wins, who
            should pick which, and what&rsquo;s genuinely different.
          </p>

          {/* TL;DR table — what most readers actually want */}
          <section className="compare-section">
            <h2 className="compare-h2">TL;DR</h2>
            <p>
              Both are bet trackers. bettin.gs is an established platform
              with a community and a decade of polish. Am I Up is brand
              new and built around one wedge: you stop typing bets by
              hand.
            </p>
            <div className="compare-table-wrap">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Am I Up</th>
                    <th>bettin.gs</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Data entry</td>
                    <td className="compare-win">
                      AI paste (text + screenshots)
                    </td>
                    <td>Manual typing</td>
                  </tr>
                  <tr>
                    <td>Analytics depth</td>
                    <td>
                      Equity, yield, ROC, CLV, max DD, breakdowns
                    </td>
                    <td>
                      Equity, yield, ROI, breakdowns
                    </td>
                  </tr>
                  <tr>
                    <td>Public profile</td>
                    <td className="compare-win">
                      Free, shareable URL with OG card
                    </td>
                    <td>Paid tier feature</td>
                  </tr>
                  <tr>
                    <td>Community / tipsters</td>
                    <td>Not yet</td>
                    <td className="compare-win">Established</td>
                  </tr>
                  <tr>
                    <td>Mobile app</td>
                    <td>Responsive web</td>
                    <td className="compare-win">Native iOS / Android</td>
                  </tr>
                  <tr>
                    <td>Price</td>
                    <td className="compare-win">Free, no card</td>
                    <td>Free tier + paid</td>
                  </tr>
                  <tr>
                    <td>Age / maturity</td>
                    <td>Brand new (June 2026)</td>
                    <td className="compare-win">10+ years</td>
                  </tr>
                  <tr>
                    <td>Sports parsed deeply</td>
                    <td>Soccer + tennis (expanding)</td>
                    <td className="compare-win">All major sports</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="compare-fine">
              &ldquo;Win&rdquo; shading just means that&rsquo;s where the
              advantage sits today. It doesn&rsquo;t make either product
              better overall &mdash; that depends on which features matter to
              you. See below.
            </p>
          </section>

          {/* Where Am I Up wins */}
          <section className="compare-section">
            <h2 className="compare-h2">Where Am I Up wins</h2>
            <ul className="compare-list">
              <li>
                <strong>You stop typing bets in.</strong> The single biggest
                friction point of every bet tracker is the data-entry tax.
                Am I Up&rsquo;s AI reads text, X posts, Telegram screenshots,
                bookmaker bet slips, even pictures from your phone. Drop
                anything in, it extracts every bet, you click once to
                commit. Across 8,800-plus bets the founder typed every
                single one into bettin.gs by hand &mdash; that&rsquo;s the
                exact wedge that motivated this product.
              </li>
              <li>
                <strong>Public profile is free.</strong> Every account gets a
                shareable <code>amiup.io/u/yourhandle</code> profile out of
                the box. Lifetime P/L, equity curve, sample size, KPI grid.
                Drop the link in your X bio. On bettin.gs the equivalent is
                a paid-tier feature.
              </li>
              <li>
                <strong>Closing-line value vs Pinnacle is treated as
                first-class.</strong> CLV is a core stat on every chart and
                every profile, not an afterthought. The product is being
                built around the assumption that punters care about the
                edge they earn against the closing line, not just the win
                rate.
              </li>
              <li>
                <strong>Editorial design.</strong> Six themes (Light, Dark,
                Terminal, Newspaper, Solar, Slate). Fraunces serif for
                headlines, JetBrains Mono for numbers. It looks like a
                Bloomberg terminal rather than a Saas marketing site.
                Subjective, but most users notice the difference.
              </li>
              <li>
                <strong>Screenshot input is real.</strong> Take a picture of
                your bet slip with your phone. Drop it into the paste box.
                Done. Most trackers don&rsquo;t accept image input at all;
                Am I Up does because Claude Haiku 4.5 handles vision
                natively.
              </li>
            </ul>
          </section>

          {/* Where bettin.gs wins */}
          <section className="compare-section">
            <h2 className="compare-h2">Where bettin.gs wins</h2>
            <ul className="compare-list">
              <li>
                <strong>Established community.</strong> bettin.gs has years
                of tipsters with verified track records, leaderboards, and
                a real community that talks about picks together. Am I Up
                doesn&rsquo;t have any of that yet.
              </li>
              <li>
                <strong>Native mobile apps.</strong> bettin.gs ships iOS and
                Android apps. Am I Up is responsive web only &mdash; works
                fine on phones, but it&rsquo;s not a native app.
              </li>
              <li>
                <strong>Coverage breadth.</strong> bettin.gs handles every
                major sport (horse racing, golf, NFL, NBA, cricket, darts,
                snooker) with mature parsing. Am I Up&rsquo;s deepest
                parsing is in soccer, tennis, basketball, baseball, and
                horse racing right now, with NFL up next. Other sports
                work but with less precision today.
              </li>
              <li>
                <strong>Decade of polish.</strong> A platform that&rsquo;s
                been running for 10+ years has handled every edge case
                you can think of. Am I Up is one day into its public life
                and will hit edge cases as users find them.
              </li>
            </ul>
          </section>

          {/* Decision tree */}
          <section className="compare-section">
            <h2 className="compare-h2">Who should pick which</h2>
            <div className="compare-decision">
              <div className="compare-decision-card">
                <div className="compare-decision-label">Pick Am I Up if</div>
                <ul>
                  <li>You bet 5-10+ times a week and hate the data entry</li>
                  <li>You bet mainly soccer or tennis</li>
                  <li>You want to share a public profile for free</li>
                  <li>You log via screenshots, X posts, or Telegram tips</li>
                  <li>You care about CLV as a primary stat, not vanity</li>
                  <li>
                    You&rsquo;re open to trying a fresh tool that still has
                    rough edges
                  </li>
                </ul>
              </div>
              <div className="compare-decision-card">
                <div className="compare-decision-label">Pick bettin.gs if</div>
                <ul>
                  <li>You want an established community + leaderboards</li>
                  <li>
                    You bet across many sports (horse racing, cricket, golf)
                    and need mature parsing across all of them
                  </li>
                  <li>You prefer a native mobile app over responsive web</li>
                  <li>You want a 10-year-stable platform, not a v1</li>
                  <li>
                    You don&rsquo;t mind manual data entry (or actually prefer
                    the discipline of it)
                  </li>
                </ul>
              </div>
            </div>
            <p className="compare-fine">
              Honest take from the Am I Up team: there&rsquo;s no shame in
              picking bettin.gs &mdash; it&rsquo;s a properly built tool we
              respect. We built Am I Up because we wanted the specific
              wedge of zero data entry. If that&rsquo;s not your friction
              point, the other tool is great too.
            </p>
          </section>

          {/* FAQ — note: questions also exist in the JSON-LD above for
              Google rich snippets. */}
          <section className="compare-section">
            <h2 className="compare-h2">Frequently asked questions</h2>
            <div className="compare-faq">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="compare-faq-item">
                  <h3 className="compare-faq-q">{item.q}</h3>
                  <p className="compare-faq-a">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="compare-cta">
            <div>
              <div className="compare-cta-title">
                Decided Am I Up sounds worth a look?
              </div>
              <div className="compare-cta-sub">
                Free, no credit card. Your data exportable any time. You can
                always go back to bettin.gs &mdash; nothing locked in.
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
            <Link href="/compare">All comparisons</Link>
            <Link href="/compare/bet-analytix">vs Bet Analytix</Link>
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
