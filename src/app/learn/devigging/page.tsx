// /learn/devigging — the process of stripping bookmaker margin out of odds
// to get an implied true probability.
//
// SEO target: "devigging" (~2k/mo), "how to devig odds" (~1.5k/mo),
// "no-vig calculator" (~800/mo), "vig in sports betting" (~2.5k/mo).
// Sits between /learn/expected-value and /learn/positive-ev-betting in
// the topical cluster — necessary technique for both.

import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { buildBreadcrumbList } from "@/lib/breadcrumb-schema";

export const metadata: Metadata = {
  alternates: { canonical: "/learn/devigging" },
  title: "Devigging Odds. How to strip vig for true implied probability.",
  description:
    "Devigging removes the bookmaker's margin from odds so you can compare a price against its no-vig true probability. Definition, formula, worked example, why every sharp bettor devigs before deciding a bet is +EV.",
  openGraph: {
    title: "Devigging Odds Explained",
    description:
      "How to strip bookmaker vig, get a no-vig implied probability, and use it for accurate +EV betting decisions.",
    type: "article",
  },
};

export default function DeviggingPage() {
  const definedTermJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: "Devigging (Sports Betting)",
    alternateName: ["Devig", "No-Vig Odds", "Vig Removal", "Overround Removal"],
    description:
      "Devigging is the process of removing the bookmaker's built-in margin (the vig, juice, or overround) from a set of odds to estimate the true implied probability of each outcome. Sharp bettors devig sharp-market prices to derive a reference probability, then compare their soft-book price against it to spot positive EV opportunities.",
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: `${BRAND.name} Sports Betting Glossary`,
      url: "https://amiup.io/learn",
    },
    url: "https://amiup.io/learn/devigging",
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Devigging Odds. How to strip vig for true implied probability.",
    description:
      "How to strip bookmaker vig from odds, calculate no-vig implied probability, and use it for accurate +EV betting decisions.",
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
    mainEntityOfPage: "https://amiup.io/learn/devigging",
  };

  const faqItems: Array<{ q: string; a: string }> = [
    {
      q: "What is devigging in sports betting?",
      a: "Devigging is the process of stripping the bookmaker's built-in margin (called vig, juice, or overround) out of a set of odds to estimate the true implied probability of each outcome. It matters because bookmaker prices always include a profit margin that inflates the implied probabilities above 100%. Removing that margin gives you a cleaner estimate of the market's view of true odds.",
    },
    {
      q: "What is vig (juice, overround) in sports betting?",
      a: "Vig, juice, and overround are the same thing: the bookmaker's margin baked into the odds. On a two-way market where each side is priced at 1.91, the implied probabilities sum to 104.7% — that extra 4.7% is the vig. It's the bookmaker's expected long-run profit per unit of stake. Sharp books like Pinnacle run at roughly 2-3% overround; soft recreational books often run 5-10% or more.",
    },
    {
      q: "How do you devig two-way odds?",
      a: "The simplest method (multiplicative devig): compute implied probability for each side (1/odds), sum them (this is >100% because of vig), then divide each side's implied probability by the sum. Example: two sides at 1.91 each imply 52.4% each, summing to 104.7%. Devig: 52.4 / 104.7 = 50%. Each side's no-vig implied probability is 50%.",
    },
    {
      q: "How do you devig three-way odds (like soccer 1X2)?",
      a: "Same principle: compute implied probability for each of the three outcomes (1 / odds), sum them (again >100% due to vig), then divide each by the sum. Example: home 2.10, draw 3.40, away 3.60. Implied: 47.6% + 29.4% + 27.8% = 104.8%. Devig home: 47.6 / 104.8 = 45.4%. Do the same for draw and away and the three no-vig probabilities sum to exactly 100%.",
    },
    {
      q: "Why do sharp bettors devig?",
      a: "Because the whole point of positive EV betting is comparing your bookmaker's price to a true reference probability. The raw sharp-market price is not the true probability — it includes vig. To get an honest reference, you have to strip the vig out. Skipping this step systematically overstates the sharp market's implied probability, which makes you think bets are +EV when they are not.",
    },
    {
      q: "What is the best devig method?",
      a: "Two main methods. Multiplicative (proportional): divide each implied probability by the sum. Simple, works well for balanced markets. Power (Shin, logistic): accounts for the fact that vig is often not distributed proportionally — bookmakers pad the favourite less and the longshot more. Power methods are more accurate on markets with a heavy favourite or a longshot, but the difference is usually small (<1 percentage point) on liquid balanced markets. For most bettors, multiplicative is a good default.",
    },
  ];
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: BRAND.name, url: "https://amiup.io" },
    { name: "Learn", url: "https://amiup.io/learn" },
    { name: "Devigging", url: "https://amiup.io/learn/devigging" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
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
            <Link href="/learn">Glossary</Link>
            <span>›</span>
            <span>Devigging</span>
          </nav>

          <p className="learn-eyebrow">Betting analytics glossary</p>
          <h1 className="learn-title">
            Devigging odds, explained cleanly
          </h1>
          <p className="learn-deck">
            Devigging strips the bookmaker&rsquo;s margin out of a set of
            odds to reveal the underlying implied probability. It&rsquo;s
            the small, unglamorous step that separates real{" "}
            <Link href="/learn/positive-ev-betting">positive-EV
            analysis</Link> from wishful thinking.
          </p>

          <div className="learn-tldr">
            <p className="learn-tldr-label">TL;DR</p>
            <ul>
              <li>
                <strong>Bookmaker odds always include a margin</strong>{" "}
                (vig, juice, or overround). The implied probabilities on
                a market sum to more than 100%; the excess is the vig.
              </li>
              <li>
                <strong>Devig by dividing each implied probability by
                the sum.</strong> Two sides both at 1.91 sum to 104.7%
                implied; divide each by 1.047 to get a clean 50% each.
              </li>
              <li>
                <strong>Sharp-market devigged prices are the reference
                for +EV work.</strong> Skipping the devig step systematically
                overstates the sharp market&rsquo;s implied probability.
              </li>
              <li>
                <strong>Multiplicative devig is fine for most cases.</strong>
                {" "}
                Power methods (Shin, logistic) matter more when the market
                is heavily lopsided but the difference is usually under
                1 percentage point on liquid balanced markets.
              </li>
            </ul>
          </div>

          <section className="learn-section">
            <h2 className="learn-h2">Vig, juice, overround — same thing</h2>
            <p>
              Bookmakers make money by pricing their odds so the implied
              probabilities sum to more than 100%. On a coin-flip market
              (two outcomes at 50/50 true probability), a &ldquo;fair&rdquo;
              price would be 2.00 on each side (each implying 50%). A
              bookmaker instead offers 1.91 on each, which implies 52.4%
              per side. Sum: 104.7%. The 4.7% overage is the vig —
              the bookmaker&rsquo;s expected long-run profit per unit
              staked, assuming their prices are correct.
            </p>
            <p>
              Vig is why you can&rsquo;t just take raw bookmaker odds as
              true probability. Sharp books like Pinnacle run ~2-3% vig on
              major markets. Soft books often run 5-10%+, sometimes far
              more on obscure props.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">The formula (multiplicative devig)</h2>
            <p>
              For any set of mutually exclusive outcomes:
            </p>
            <div className="learn-formula">
              <code>
                No-vig prob(i) = (1 / odds(i)) ÷ Σ(1 / odds(j))
              </code>
            </div>
            <p>
              In words: compute each outcome&rsquo;s implied probability
              (1 / decimal odds), sum them across all outcomes, then divide
              each outcome&rsquo;s implied probability by the sum. The
              resulting probabilities sum to exactly 100%.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Worked example: two-way market</h2>
            <p>
              Match odds on a tennis match, Pinnacle: Player A 1.91,
              Player B 1.91.
            </p>
            <ul className="learn-list">
              <li>Implied A: 1 / 1.91 = 0.524 (52.4%)</li>
              <li>Implied B: 1 / 1.91 = 0.524 (52.4%)</li>
              <li>Sum: 1.047 (104.7%) — vig is 4.7%</li>
              <li>No-vig A: 0.524 / 1.047 = 0.500 (50.0%)</li>
              <li>No-vig B: 0.524 / 1.047 = 0.500 (50.0%)</li>
            </ul>
            <p>
              The devigged probabilities give a clean, sums-to-100%
              estimate of the market&rsquo;s view of true odds. That&rsquo;s
              what you compare your soft-book price against for +EV
              analysis.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Worked example: three-way market (soccer 1X2)</h2>
            <p>
              Premier League match, Pinnacle: Home 2.10, Draw 3.40, Away 3.60.
            </p>
            <ul className="learn-list">
              <li>Implied Home: 1 / 2.10 = 0.476 (47.6%)</li>
              <li>Implied Draw: 1 / 3.40 = 0.294 (29.4%)</li>
              <li>Implied Away: 1 / 3.60 = 0.278 (27.8%)</li>
              <li>Sum: 1.048 (104.8%) — vig is 4.8%</li>
              <li>No-vig Home: 0.476 / 1.048 = 0.454 (45.4%)</li>
              <li>No-vig Draw: 0.294 / 1.048 = 0.281 (28.1%)</li>
              <li>No-vig Away: 0.278 / 1.048 = 0.265 (26.5%)</li>
            </ul>
            <p>
              These three sum to exactly 100%. Now say your soft
              bookmaker has the Home at 2.30 (43.5% implied). Sharp
              devigged says 45.4%; you&rsquo;re getting 43.5%. Positive
              gap in your favour of 1.9 percentage points — that&rsquo;s
              a +EV bet worth taking, sized appropriately.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Multiplicative vs power devig</h2>
            <p>
              Multiplicative devig (above) assumes the bookmaker distributes
              their vig proportionally across outcomes. In practice, this
              is not quite true — bookmakers often pad the longshot side
              more heavily than the favourite. Power methods (Shin, logistic)
              try to correct for this by weighting the devig based on the
              structure of the odds.
            </p>
            <p>
              The practical difference on liquid balanced markets is
              usually under 1 percentage point. On heavily lopsided
              markets (big favourite / big longshot), the difference can
              be larger. For most retail +EV workflows, multiplicative is
              perfectly serviceable and much easier to compute by hand.
              Serious sharp operations use power methods, especially on
              props and futures.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Where devigging fits in the workflow</h2>
            <p>
              The full sharp-book +EV loop:
            </p>
            <ol className="learn-list">
              <li>
                <strong>Pick a sharp-market reference</strong> — Pinnacle,
                Betfair Exchange, or Circa depending on jurisdiction and
                market.
              </li>
              <li>
                <strong>Devig the sharp price</strong> to get the no-vig
                implied probability. This is the &ldquo;true&rdquo; probability
                for the purposes of your EV calculation.
              </li>
              <li>
                <strong>Compare against your soft-book price.</strong> If
                the soft book implies a lower probability than the sharp
                devig implies, and by a material amount, you have a +EV
                bet.
              </li>
              <li>
                <strong>Size according to Kelly</strong> (usually half or
                quarter Kelly) given your edge and bankroll.
              </li>
              <li>
                <strong>Track CLV</strong> after the fact. If your entry
                prices consistently beat the closing line, your +EV
                estimates are working.
              </li>
            </ol>
            <p>
              Skip the devig step and every downstream number is wrong.
              That&rsquo;s why every serious +EV tool devigs by default.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Related terms</h2>
            <ul className="learn-list learn-list--related">
              <li>
                <strong>
                  <Link href="/learn/positive-ev-betting">Positive EV betting:</Link>
                </strong>{" "}
                the strategy devigging enables. +EV analysis without a
                devig step is systematically biased.
              </li>
              <li>
                <strong>
                  <Link href="/learn/expected-value">Expected Value (EV):</Link>
                </strong>{" "}
                the metric you compute using devigged probabilities as
                the reference.
              </li>
              <li>
                <strong>
                  <Link href="/learn/clv">Closing Line Value (CLV):</Link>
                </strong>{" "}
                CLV is usually calculated against the devigged closing
                line, not the raw closing line. Otherwise vig makes every
                bet look worse than it was.
              </li>
              <li>
                <strong>
                  <Link href="/learn/kelly-criterion">Kelly Criterion:</Link>
                </strong>{" "}
                once you&rsquo;ve devigged and confirmed a +EV bet, Kelly
                tells you how much to stake.
              </li>
              <li>
                <strong>
                  <Link href="/learn/bankroll-management">Bankroll management:</Link>
                </strong>{" "}
                devigging tells you which bets to take; bankroll
                management keeps you solvent while the +EV compounds.
              </li>
            </ul>
          </section>

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

          <section className="learn-cta">
            <div>
              <div className="learn-cta-title">
                Devigged CLV shows on your dashboard automatically.
              </div>
              <div className="learn-cta-sub">
                Log your bets on {BRAND.name} and CLV is calculated
                against the devigged Pinnacle close — the only honest
                reference. Free, no credit card.
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
            <Link href="/learn">Glossary</Link>
            <Link href="/u/sample">Sample profile</Link>
            <Link href="/compare/bettin-gs">vs bettin.gs</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </footer>
        </main>
      </div>
    </>
  );
}
