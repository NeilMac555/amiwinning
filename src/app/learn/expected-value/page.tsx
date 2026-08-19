// /learn/expected-value — Day 3 of the betting-analytics glossary.
//
// SEO targets: "what is expected value in sports betting" (~2k/mo),
// "expected value betting formula" (~1.2k/mo), "EV in sports betting"
// (~1.5k/mo), "positive EV betting" (~1k/mo). Highest combined
// volume of any glossary entry, hence the priority slot on Day 3.
//
// Wedge: EV is the mathematical bedrock that CLV and yield are
// estimating. Most bettors talk around it without ever calculating
// one. The page makes the formula concrete and shows how every
// other analytics metric in betting connects back to it.

import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { buildBreadcrumbList } from "@/lib/breadcrumb-schema";
import { LearnAuthor } from "@/components/LearnAuthor";

const LAST_UPDATED = "2026-08-17";

export const metadata: Metadata = {
  alternates: { canonical: "/learn/expected-value" },
  title: "What is Expected Value (EV) in Sports Betting?",
  description:
    "Expected value is the mathematical foundation of every winning bet. Definition, formula, worked example, how to find positive-EV bets, why +EV is the only thing that matters long-term.",
  openGraph: {
    title: "What is Expected Value (EV) in Sports Betting?",
    description:
      "The mathematical bedrock of winning betting. Formula, worked example, how to find +EV, how it connects to CLV.",
    type: "article",
  },
};

export default function ExpectedValuePage() {
  const definedTermJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: "Expected Value (EV)",
    alternateName: ["EV", "Expected Value betting", "EV in sports betting"],
    description:
      "Expected Value in sports betting is the average amount a bettor would win (or lose) per unit staked if the same bet were placed infinite times. Positive expected value (+EV) bets are the mathematical definition of a winning bet; the entire discipline of sharp betting is about finding them.",
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: `${BRAND.name} Sports Betting Glossary`,
      url: "https://amiup.io/learn",
    },
    url: "https://amiup.io/learn/expected-value",
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "What is Expected Value (EV) in Sports Betting?",
    description:
      "The mathematical bedrock of winning betting. Definition, formula, worked example, how to find positive-EV bets, how EV connects to CLV.",
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
    mainEntityOfPage: "https://amiup.io/learn/expected-value",
  };

  const faqItems: Array<{ q: string; a: string }> = [
    {
      q: "What is expected value (EV) in sports betting?",
      a: "Expected value is the average profit or loss per bet you should expect if the exact same situation happened an infinite number of times. It is calculated as (win probability × win amount) minus (loss probability × loss amount). Positive EV means the bet is profitable on average; negative EV means it loses money on average.",
    },
    {
      q: "How do you calculate EV for a bet?",
      a: "EV = (win probability × win amount) − (loss probability × stake). Example: bet 1u at 2.20 odds on Arsenal, estimating a 50% win chance. Win amount is 1.20u profit if it wins; loss amount is 1u if it loses. EV = (0.50 × 1.20) − (0.50 × 1.00) = 0.60 − 0.50 = +0.10u per bet. That is a +10% EV bet.",
    },
    {
      q: "What is positive EV betting?",
      a: "Positive EV betting means only placing bets where your estimated true probability implies better odds than the price on offer. Over enough bets, positive EV compounds into real profit. The catch: you need a reliable source of true probability estimates, usually derived from sharp-market prices (Pinnacle, Betfair Exchange no-vig lines).",
    },
    {
      q: "Is CLV the same as EV?",
      a: "Related but not the same. EV is measured against your own estimate of true probability. CLV (Closing Line Value) is measured against the closing odds at a sharp bookmaker, which is the market's best estimate of true probability at kickoff. Consistently beating the closing line usually implies positive EV, but only if the closing line is truly sharp on that market.",
    },
    {
      q: "How do you find positive EV bets?",
      a: "Two common methods. First: compare your bookmaker's odds against a sharp reference (Pinnacle or Betfair Exchange no-vig). If the sharp implies 55% and your bookmaker gives you 2.00 (implied 50%), you have a positive-EV bet on that price. Second: build your own probability model in a market you know deeply, then hunt for bookmaker prices that disagree in your favour. Both methods depend on the reference being accurate — a wrong probability estimate turns positive-EV theory into negative-EV reality.",
    },
    {
      q: "Can I be profitable long-term without tracking EV?",
      a: "Extremely unlikely. Every professional bettor's edge reduces to consistently taking positive-EV bets. You can win short-term without tracking EV — variance rewards a lot of losing strategies for a while — but you cannot maintain profit across thousands of bets without something that at least approximates positive-EV selection.",
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
    { name: "Expected Value", url: "https://amiup.io/learn/expected-value" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />
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
            <span>Expected Value</span>
          </nav>

          <p className="learn-eyebrow">Betting analytics glossary</p>
          <h1 className="learn-title">
            What is Expected Value <span className="learn-abbr">(EV)</span>?
          </h1>
          <LearnAuthor lastUpdated={LAST_UPDATED} />
          <p className="learn-deck">
            Expected Value is the mathematical bedrock of every winning
            bet. CLV estimates it. Yield is its historical residue.
            Every sharp punter chases it. Most casual punters have
            never calculated one.
          </p>

          <div className="learn-tldr">
            <p className="learn-tldr-label">TL;DR</p>
            <ul>
              <li>
                <strong>Expected value (EV) is the average profit or loss
                per bet</strong> if you could place the same wager an
                infinite number of times.
              </li>
              <li>
                <strong>Formula:</strong> EV = (probability of winning × amount
                won) − (probability of losing × amount staked).
              </li>
              <li>
                <strong>Positive-EV bets make money long-term; negative-EV
                bets lose money</strong> — regardless of what happened on
                any single bet.
              </li>
              <li>
                <strong>Long-term profitable betting is nothing more than
                repeatedly finding and placing positive-EV bets.</strong>
                {" "}
                CLV is the field-tested way to know if your bets were
                actually +EV.
              </li>
            </ul>
          </div>

          <section className="learn-section">
            <h2 className="learn-h2">The short definition</h2>
            <p>
              The expected value of a bet is the average amount you
              would win or lose if the same bet were placed an infinite
              number of times. It&rsquo;s a weighted average of the
              outcomes: probability of each outcome multiplied by the
              money you win or lose if that outcome happens.
            </p>
            <p>
              A positive-EV bet (+EV) is one where, on average across
              infinite repetitions, you make money. A negative-EV bet
              (&minus;EV) is one where you lose money on average. The
              entire game of sharp sports betting is about reliably
              identifying +EV bets and avoiding &minus;EV ones.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">The formula</h2>
            <p>
              In decimal odds, expected value per unit staked is:
            </p>
            <div className="learn-formula">
              <code>
                EV per unit = (P_true × Odds) &minus; 1
              </code>
            </div>
            <p>
              Where <code>P_true</code> is your honest estimate of the
              true probability of the bet winning, and <code>Odds</code>{" "}
              is the decimal odds you&rsquo;re getting.
            </p>
            <p>
              If the result is positive, the bet has positive expected
              value. If it&rsquo;s negative, the bookmaker has positive
              expected value and you have negative.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Worked example</h2>
            <p>
              Pinnacle&rsquo;s no-vig closing odds on Arsenal to beat
              Liverpool are 2.00 &mdash; meaning the sharp market
              estimates Arsenal&rsquo;s true probability of winning at
              50%. You took 2.20 with your bookmaker earlier in the day.
              EV per unit:
            </p>
            <div className="learn-formula">
              <code>EV = (0.50 × 2.20) &minus; 1 = +0.10</code>
            </div>
            <p>
              That&rsquo;s +10% expected value. On a 1u stake, you
              expect to win an average of 0.10u per bet if you found a
              hundred similar opportunities.
            </p>
            <p>
              The flip side: if you take 1.85 on the same selection,
              EV is (0.50 × 1.85) &minus; 1 = &minus;0.075, or
              &minus;7.5%. You expect to lose 0.075u per bet on average.
              The bet might still win &mdash; variance &mdash; but the
              maths says you&rsquo;re losing money long-term.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Why positive EV is the only thing
              that matters long-term</h2>
            <p>
              The Law of Large Numbers says that as your sample of bets
              grows, your average return converges to its expected
              value. Over 10 bets the gap between your actual results
              and your EV can be huge. Over 10,000 bets it&rsquo;s
              microscopic. This is why the casino, on the other side of
              every gambler&rsquo;s &ldquo;hot streak&rdquo;, always
              wins in the end.
            </p>
            <p>
              For you, the conclusion is the same: as long as your
              average bet is positive EV, you will eventually be
              profitable. The size of the EV and the speed of bet
              volume control how quickly. A 2% EV bettor with 1,000
              bets a year compounds slowly. A 5% EV bettor with the
              same volume compounds noticeably faster. A bettor on
              negative EV grinds toward bust no matter how lucky a
              given month.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">How EV connects to CLV</h2>
            <p>
              You can&rsquo;t observe true probability directly. The
              best practical estimate available to a punter is the
              no-vig closing line at a sharp bookmaker (Pinnacle in
              most markets), because that price reflects every piece
              of information the sharp money cared about by kickoff.
            </p>
            <p>
              If you consistently beat that closing line &mdash; that
              is, if your{" "}
              <Link href="/learn/clv">closing line value (CLV)</Link>{" "}
              is positive on average &mdash; then by transitivity
              you&rsquo;re betting at positive EV against the most
              efficient available estimate of true probability.
              That&rsquo;s the chain of reasoning behind why sharps
              fixate on CLV as a forward-looking edge signal.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">How to find +EV bets</h2>
            <ul className="learn-list">
              <li>
                <strong>Devig a sharp closing line.</strong> Strip the
                bookmaker margin out of Pinnacle&rsquo;s closing odds
                to get a no-vig estimate of true probability. Compare
                your bookmaker&rsquo;s price to it.
              </li>
              <li>
                <strong>Bet early and shop multiple books.</strong>{" "}
                The biggest +EV opportunities are usually in the
                first hour after lines open, before sharp money has
                tightened the price.
              </li>
              <li>
                <strong>Follow line movement.</strong> If your price
                steamed (shortened) after you bet, you almost
                certainly took +EV. If it drifted (lengthened), you
                may have taken &minus;EV.
              </li>
              <li>
                <strong>Find soft books.</strong> Recreational
                sportsbooks that don&rsquo;t move on sharp money
                regularly post +EV prices compared to sharp markets.
                Many limit winning accounts though.
              </li>
              <li>
                <strong>Specialise.</strong> Knowing a niche league
                or market better than the market does is the
                old-fashioned route to +EV. Slow, but durable.
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Why most bettors are &minus;EV by default</h2>
            <p>
              Bookmakers build a margin (the &ldquo;vig&rdquo; or
              &ldquo;juice&rdquo;) into every price. On a coin-flip
              market the fair odds are 2.00 / 2.00. A typical
              recreational sportsbook offers 1.91 / 1.91, pocketing a
              ~4.5% margin no matter who wins.
            </p>
            <p>
              To overcome that margin, you need to be making decisions
              that are better than the bookmaker by at least that
              amount on average. The vast majority of bettors
              aren&rsquo;t. They lose at roughly the rate of the vig:
              a couple of percent per bet, compounding over hundreds
              of bets per year into a meaningful loss.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Common EV mistakes</h2>
            <ul className="learn-list">
              <li>
                <strong>Confusing EV with results.</strong> A losing
                bet can be +EV; a winning bet can be &minus;EV. The
                decision and the outcome are separate things.
                Sharps judge themselves by the decisions, not the
                outcomes.
              </li>
              <li>
                <strong>Using vig-inclusive odds as a true probability
                proxy.</strong> Pinnacle&rsquo;s raw price still
                contains the margin. Devig before comparing.
              </li>
              <li>
                <strong>Trusting your own probability estimate without
                a sample.</strong> Most casual bettors think they have
                +EV until tracking proves they don&rsquo;t. The honest
                way to know is to track CLV over a few hundred bets.
              </li>
              <li>
                <strong>Assuming small sample results validate
                EV.</strong> A 10-bet hot streak proves nothing about
                whether your underlying decisions are +EV. Variance
                rules the small numbers.
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Related terms</h2>
            <ul className="learn-list learn-list--related">
              <li>
                <strong>
                  <Link href="/learn/clv">Closing Line Value (CLV):</Link>
                </strong>{" "}
                practical estimator of EV. Consistently positive CLV
                implies positive EV against the sharpest available
                estimate of true probability.
              </li>
              <li>
                <strong>
                  <Link href="/learn/yield">Yield:</Link>
                </strong>{" "}
                historical realisation of EV. Over a large enough
                sample yield converges to EV; over a small sample they
                can disagree wildly.
              </li>
              <li>
                <strong>Variance:</strong> the noise around EV. Why
                short-run results don&rsquo;t prove edge.
              </li>
              <li>
                <strong>
                  <Link href="/learn/positive-ev-betting">Positive EV betting:</Link>
                </strong>{" "}
                the strategy underneath every profitable bettor. EV is
                the metric; positive EV betting is what you do with it.
              </li>
              <li>
                <strong>
                  <Link href="/learn/devigging">Devigging:</Link>
                </strong>{" "}
                the technique of stripping bookmaker margin out of a
                price to estimate true probability. Required for honest
                EV calculation against a sharp reference.
              </li>
              <li>
                <strong>
                  <Link href="/learn/parlay">Parlay:</Link>
                </strong>{" "}
                multi-leg bets where EV compounds — usually in the wrong
                direction because vig compounds too. The math of why
                parlays almost always lose.
              </li>
              <li>
                <strong>
                  <Link href="/learn/kelly-criterion">Kelly Criterion:</Link>
                </strong>{" "}
                formula for how much to stake given a known EV and
                bankroll. Optimises long-run bankroll growth.
              </li>
              <li>
                <strong>
                  <Link href="/learn/bankroll-management">Bankroll management:</Link>
                </strong>{" "}
                the discipline that turns positive-EV theory into
                sustained profit. EV without bankroll management still
                blows up on variance.
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
                The fastest way to know if you&rsquo;re +EV.
              </div>
              <div className="learn-cta-sub">
                Log your bets on {BRAND.name} with the Pinnacle close
                captured on each one. Your CLV is shown automatically
                on every chart and profile &mdash; the cleanest
                forward-looking measure of your edge. Free, no card.
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
            <Link href="/learn/clv">What is CLV?</Link>
            <Link href="/learn/yield">What is Yield?</Link>
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
