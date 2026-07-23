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

  // FAQPage schema — Google renders these as expandable Q&A blocks
  // directly in SERPs (the "People Also Ask" style boxes). Grabs
  // more visual real estate for the same rank, which lifts CTR
  // materially. Answers here are compressed versions of what the
  // page body explains in full; each Q is a real "People Also Ask"
  // for the CLV keyword cluster.
  const faqItems: Array<{ q: string; a: string }> = [
    {
      q: "What is CLV in sports betting?",
      a: "CLV (Closing Line Value) is the difference between the odds you took on a bet and the closing odds at a sharp bookmaker like Pinnacle on the same selection. Positive CLV means you got a better price than the market eventually settled on. It is the single best statistical signal that a bettor has a genuine edge.",
    },
    {
      q: "How do you calculate CLV?",
      a: "The standard formula in decimal odds is: CLV % = (Your Odds / Closing Odds - 1) * 100. If you took 2.20 and the closing line moved to 2.10, your CLV is (2.20 / 2.10 - 1) * 100 = +4.76%. Positive means you beat the close; negative means the close was shorter than your price.",
    },
    {
      q: "Is positive CLV always profitable?",
      a: "Long-run yes, short-run no. CLV proves you made better decisions than the market on average. Variance still rules the short run: a +3% CLV bettor can lose money for a hundred bets in a row and still have a genuine edge. Sample size matters. Over a thousand bets a positive-CLV bettor is expected to be profitable; over ten, the noise dominates.",
    },
    {
      q: "Why does CLV matter more than win rate?",
      a: "Win rate is noisy. A 55% bettor can run cold for 200 bets in a row and look like a 48% bettor. CLV gives you signal in dozens of bets, not thousands. If you consistently beat the closing line by 2-3%, the math says you will be profitable long-run even when short-run win rate runs cold. Sharp bettors track CLV because it is the cleanest available measure of whether the next bet was a good decision.",
    },
    {
      q: "What is a good CLV number?",
      a: "Over a sample of a hundred plus bets, positive CLV of any amount is a good signal. +1 to +2% average CLV is what a break-even punter with soft-book access can achieve. +2 to +4% is professional-grade edge in mainstream sports. +5% and above is exceptional and rarely sustainable at scale in liquid markets.",
    },
    {
      q: "Do I need Pinnacle to track CLV?",
      a: "Pinnacle is the standard because it takes serious sharp money and its closing line is the tightest available estimate of true odds. If Pinnacle is not available in your jurisdiction, you can substitute Betfair Exchange or Smarkets. The important thing is the closing price comes from a market that takes real money, not a recreational sportsbook.",
    },
  ];
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
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
          __html: JSON.stringify(definedTermJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd),
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

          <div className="learn-tldr">
            <p className="learn-tldr-label">TL;DR</p>
            <ul>
              <li>
                <strong>CLV = your odds vs the closing odds</strong> at a
                sharp bookmaker (usually Pinnacle) on the same selection,
                expressed as a percentage.
              </li>
              <li>
                <strong>Positive CLV means you beat the closing line</strong>
                {" "}
                — the strongest available signal that a bettor has a real
                edge, not just variance.
              </li>
              <li>
                <strong>Trustworthy after ~100 bets</strong>, not the
                ~1,000 you need before win rate stops lying to you.
              </li>
              <li>
                <strong>Sustained positive CLV beats the market long-term</strong>;
                sustained negative CLV loses to the market long-term.
                Nothing else predicts profitability as cleanly.
              </li>
            </ul>
          </div>

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
                <strong>
                  <Link href="/learn/roi">ROI:</Link>
                </strong>{" "}
                return on investment. In betting sometimes means yield,
                sometimes means ROC. The stake-vs-bankroll ambiguity
                spelled out.
              </li>
              <li>
                <strong>
                  <Link href="/learn/roc">ROC:</Link>
                </strong>{" "}
                return on capital. The honest money-on-money return the
                bankroll actually earned, versus yield&rsquo;s per-stake
                measure.
              </li>
            </ul>
          </section>

          {/* Frequently asked questions. Content mirrors the FAQPage
              JSON-LD in <head> so Google's rich-snippet requirements
              (question and answer both visible on page) are satisfied.
              Each entry is a real "People Also Ask" for the CLV
              keyword cluster: presence here is worth more SERP real
              estate than the ranking position alone. */}
          <section className="learn-section">
            <h2 className="learn-h2">Frequently asked questions</h2>
            {faqItems.map((item, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    margin: "0 0 6px",
                    color: "var(--text)",
                  }}
                >
                  {item.q}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13.5,
                    color: "var(--text-muted)",
                    lineHeight: 1.55,
                  }}
                >
                  {item.a}
                </p>
              </div>
            ))}
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
                Pinnacle close. Free, no credit card. Soccer, tennis,
                basketball, baseball, and horse racing are first-class
                today; other sports work too.
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
