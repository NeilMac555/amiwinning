// /learn/clv — first page in the betting analytics glossary.
//
// SEO target: "what is CLV in betting" (~1k/month), "closing line
// value sports betting" (~1.5k/month), and adjacent queries that the
// established trackers don't bother to write definition pages for.
//
// Format: definition → why it matters → formula → worked example →
// related terms → CTA. Roughly 600 words, structured for both human
// readability and AI retrieval. DefinedTerm schema markup tells
// search engines + AI engines this is an authoritative definition
// page they can cite.

import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "What is Closing Line Value (CLV) in Sports Betting?",
  description:
    "CLV measures whether you beat the sharp closing odds. Definition, formula, worked example, why it matters more than win rate. Track yours free on Am I Up.",
  openGraph: {
    title: "What is Closing Line Value (CLV) in Sports Betting?",
    description:
      "Definition, formula, worked example. Why CLV is the truest signal of skill in sports betting.",
    type: "article",
  },
};

export default function ClvPage() {
  // DefinedTerm JSON-LD — the most semantically correct schema for a
  // glossary entry. Google + AI engines parse this directly when
  // retrieving definitions for "what is X" queries.
  const definedTermJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: "Closing Line Value (CLV)",
    alternateName: ["CLV", "Closing Line Value"],
    description:
      "Closing line value measures the difference between the odds a bettor took and the closing odds at a sharp bookmaker on the same selection. Positive CLV (beating the close) is the strongest available statistical signal that a bettor has a genuine edge.",
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: `${BRAND.name} Sports Betting Glossary`,
      url: "https://amiup.io/learn",
    },
    url: "https://amiup.io/learn/clv",
  };

  // Article schema too — adds another layer of structured data the
  // engines weight differently. The two schemas coexist fine.
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "What is Closing Line Value (CLV) in Sports Betting?",
    description:
      "Definition, formula, worked example. Why CLV is the truest available signal of edge in sports betting.",
    author: {
      "@type": "Person",
      name: "Neil Macdonald",
      url: "https://amiup.io/u/neilmac555",
    },
    publisher: {
      "@type": "Organization",
      name: BRAND.name,
      url: "https://amiup.io",
    },
    mainEntityOfPage: "https://amiup.io/learn/clv",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(definedTermJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd),
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
            <span>›</span>
            <span>CLV</span>
          </nav>

          <p className="learn-eyebrow">Betting analytics glossary</p>
          <h1 className="learn-title">
            What is Closing Line Value <span className="learn-abbr">(CLV)</span>?
          </h1>
          <p className="learn-deck">
            CLV measures whether you beat the sharp closing odds. It&rsquo;s
            the single best statistical signal that a sports bettor has a
            real edge, and it works on far fewer bets than win rate does.
          </p>

          <section className="learn-section">
            <h2 className="learn-h2">The short definition</h2>
            <p>
              Closing Line Value (CLV) is the difference between the odds
              you took on a bet and the final, closing odds on the same
              selection at a sharp bookmaker (almost always Pinnacle).
              Positive CLV means you got a better price than the market
              eventually settled on. Negative CLV means the market closed
              shorter than your price.
            </p>
            <p>
              The closing line is treated as the most accurate available
              estimate of true odds because it reflects every piece of
              information the market knows at kickoff, including hours of
              sharp money pushing the line into its tightest shape.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Why CLV matters more than win rate</h2>
            <p>
              Win rate is noisy. A 55% bettor can run cold for 200 bets in
              a row and look like a 48% bettor. A 50% bettor can run hot
              for 100 bets and look profitable. You need a sample of
              thousands of bets before win rate gives you statistical
              confidence about your edge.
            </p>
            <p>
              CLV gives you signal in dozens. If you&rsquo;re consistently
              beating the close by 2-3%, the maths says you&rsquo;ll be
              profitable long-run even when short-run win rate runs cold.
              Sharp bettors track CLV religiously because it&rsquo;s the
              cleanest available measure of whether the next bet was a
              good decision, independent of whether it won.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">The formula</h2>
            <p>
              CLV is usually expressed as a percentage. The standard
              formula in decimal odds:
            </p>
            <div className="learn-formula">
              <code>
                CLV % = (Your Odds ÷ Closing Odds &minus; 1) × 100
              </code>
            </div>
            <p>
              Positive number means you beat the close. Negative means the
              close was shorter than what you took.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Worked example</h2>
            <p>
              Say you back Arsenal to beat Liverpool at 2.20 with your
              bookmaker on the morning of the match. By kickoff,
              Pinnacle&rsquo;s closing line on Arsenal has shortened to
              2.10 (more money came in on Arsenal). Your CLV:
            </p>
            <div className="learn-formula">
              <code>(2.20 ÷ 2.10 &minus; 1) × 100 = +4.76 %</code>
            </div>
            <p>
              That&rsquo;s a strong single-bet CLV. Whether Arsenal
              actually wins is irrelevant to the CLV calculation &mdash;
              you got a better price than the sharp market thought the
              selection was worth.
            </p>
            <p>
              Over a hundred bets averaging +3% CLV, you almost certainly
              have an edge even if your short-run win rate is unimpressive.
              Over a hundred bets averaging &minus;3% CLV, you are losing
              money to the market regardless of how hot your recent record
              looks.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">A few important caveats</h2>
            <ul className="learn-list">
              <li>
                <strong>Pinnacle isn&rsquo;t always available.</strong> In
                some jurisdictions Pinnacle doesn&rsquo;t take action. You
                can substitute another sharp source (Betfair Exchange,
                Smarkets) but the closing price has to be from a market
                that takes serious money, not a recreational sportsbook.
              </li>
              <li>
                <strong>Use no-vig closing odds for the most accurate
                calculation.</strong> Pinnacle&rsquo;s overround
                (bookmaker margin) is usually 2-3%; stripping that out
                gives a cleaner CLV signal. Most tracking tools handle
                this for you.
              </li>
              <li>
                <strong>CLV doesn&rsquo;t prove you&rsquo;re profitable
                this season.</strong> It proves you make better decisions
                than the market on average. Variance still rules the
                short run.
              </li>
              <li>
                <strong>Sample size still matters.</strong> 10 bets of
                positive CLV is encouraging but not conclusive. 100+ bets
                is when the signal hardens.
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Related terms</h2>
            <ul className="learn-list learn-list--related">
              <li>
                <strong>
                  <Link href="/learn/expected-value">Expected Value (EV):</Link>
                </strong>{" "}
                the average win you should make per bet if the same
                situation happened infinite times. Closely related to CLV;
                positive CLV implies positive EV against the closing line.
              </li>
              <li>
                <strong>
                  <Link href="/learn/yield">Yield:</Link>
                </strong>{" "}
                total profit divided by total stake, expressed as a
                percentage. Win-rate-and-odds based, noisier than CLV in
                small samples.
              </li>
              <li>
                <strong>Devig:</strong> the process of stripping the
                bookmaker&rsquo;s margin out of the implied probability
                of a price, used to derive &ldquo;true&rdquo; odds for
                CLV calculation.
              </li>
              <li>
                <strong>ROI / ROC:</strong> return on investment / return
                on capital. Standard accounting-style measures of how
                much money the betting bank has produced.
              </li>
            </ul>
          </section>

          {/* CTA */}
          <section className="learn-cta">
            <div>
              <div className="learn-cta-title">
                Tracking CLV manually is painful.
              </div>
              <div className="learn-cta-sub">
                Log your bets on {BRAND.name} and CLV appears on your
                dashboard automatically once you&rsquo;ve captured the
                Pinnacle close. Free, no credit card. Soccer and tennis
                are first-class today; other sports work too.
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
            <Link href="/compare/bettin-gs">vs bettin.gs</Link>
            <Link href="/compare/pikkit">vs Pikkit</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </footer>
        </main>
      </div>
    </>
  );
}
