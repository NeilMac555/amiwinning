// /learn/positive-ev-betting — the strategy underneath every profitable
// sports bettor.
//
// SEO target: "positive ev betting" (~4k/mo), "positive ev sports betting"
// (~3k/mo), "how to find positive ev bets" (~1.5k/mo), "+ev betting"
// (~1k/mo). Overlaps with /learn/expected-value but this page is
// strategy-oriented (what you do) whereas EV is definition-oriented
// (what the number is).
//
// Format matches /learn/clv. All 4 schema types.

import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { buildBreadcrumbList } from "@/lib/breadcrumb-schema";

export const metadata: Metadata = {
  alternates: { canonical: "/learn/positive-ev-betting" },
  title: "Positive EV Betting. How to find +EV bets and actually track them.",
  description:
    "Positive EV betting is the strategy underneath every profitable sports bettor. What +EV means, how to find +EV bets, why sharp bookmakers matter, and how to prove your edge is real. Track your bets free on Am I Up.",
  openGraph: {
    title: "Positive EV Betting",
    description:
      "How to find +EV bets, why sharp bookmakers are the reference, and how to prove your edge is real.",
    type: "article",
  },
};

export default function PositiveEvPage() {
  const definedTermJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: "Positive EV Betting",
    alternateName: ["+EV Betting", "Positive Expected Value Betting", "Value Betting"],
    description:
      "Positive EV betting is a sports betting strategy of placing only bets where the estimated true probability of winning implies better odds than the price on offer. Over enough bets, positive EV compounds into real profit. It requires a reliable source of true probability estimates, usually derived from sharp-market prices at bookmakers like Pinnacle or Betfair Exchange.",
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: `${BRAND.name} Sports Betting Glossary`,
      url: "https://amiup.io/learn",
    },
    url: "https://amiup.io/learn/positive-ev-betting",
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Positive EV Betting. How to find +EV bets and actually track them.",
    description:
      "The strategy underneath every profitable bettor. How to find +EV bets, why sharp books matter, how to prove your edge.",
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
    mainEntityOfPage: "https://amiup.io/learn/positive-ev-betting",
  };

  const faqItems: Array<{ q: string; a: string }> = [
    {
      q: "What is positive EV betting?",
      a: "Positive EV betting is a sports betting strategy of only placing bets where your estimated true probability of winning implies better odds than the price on offer. If a sharp market implies 55% and your bookmaker offers 2.00 (implied 50%), you have positive EV on that bet. Repeated across many bets, positive EV compounds into real profit — it is the mathematical foundation of every profitable sports bettor.",
    },
    {
      q: "How do you find positive EV bets?",
      a: "Two common methods. First, compare your bookmaker's odds against a sharp reference like Pinnacle or Betfair Exchange (after removing the bookmaker's margin, called devigging). If the sharp implies 55% and your book gives 2.00, that's a +EV bet. Second, build your own probability model in a market you understand deeply and hunt for bookmaker prices that disagree with your model in your favour.",
    },
    {
      q: "Why do sharp bookmakers matter for EV betting?",
      a: "Sharp bookmakers like Pinnacle and Betfair Exchange accept large stakes from serious bettors and adjust their prices based on where the money goes. Their closing lines are the tightest available estimate of true probability because they aggregate the information of everyone with real money to risk. Recreational bookmakers, by contrast, price for the recreational market and can be systematically wrong for weeks at a time. Positive EV strategies rely on sharp reference prices; they do not work using soft-book prices as the reference.",
    },
    {
      q: "How much positive EV can you realistically find?",
      a: "For most bettors with soft-book access, +1% to +3% EV per bet is the realistic ceiling on liquid markets. Getting to +4-5% requires either less liquid markets, faster line movement, or genuine modeling edge. Above +5% EV per bet you are usually either exploiting a temporary glitch or overestimating your edge. Sustainable long-run edge above +3% at scale in mainstream markets is rare.",
    },
    {
      q: "Do positive EV bettors always win?",
      a: "Long-run yes, short-run no. A +3% EV bettor is expected to be profitable across thousands of bets. Across a few hundred, variance can make them look like a losing bettor. This is why bankroll management matters as much as edge selection — you need to survive drawdown long enough for the positive EV to compound into real profit.",
    },
    {
      q: "What ruins a positive EV strategy?",
      a: "Two main killers. First, account limits: soft books limit or close winning accounts, so the +EV you can access shrinks over time. Second, bad probability estimates: if your reference is not truly sharp, your estimated +EV is systematically wrong and you can bet yourself into a hole while thinking you have edge. Consistent negative CLV (Closing Line Value) is the warning sign that your probability estimates are off.",
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
    { name: "Positive EV Betting", url: "https://amiup.io/learn/positive-ev-betting" },
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
            <span>Positive EV Betting</span>
          </nav>

          <p className="learn-eyebrow">Betting analytics glossary</p>
          <h1 className="learn-title">
            Positive EV betting, in plain English
          </h1>
          <p className="learn-deck">
            Every profitable sports bettor is a positive-EV bettor whether
            they use that language or not. The strategy is simple to
            state, hard to execute, and cleanly separates people who
            eventually win from people who eventually lose.
          </p>

          <div className="learn-tldr">
            <p className="learn-tldr-label">TL;DR</p>
            <ul>
              <li>
                <strong>Positive EV = the odds you took are longer than
                the true probability implies.</strong> A bet that pays 2.00
                on a real 55% chance is +EV; the same bet on a real 45%
                chance is −EV.
              </li>
              <li>
                <strong>Find +EV by comparing to a sharp reference</strong>
                {" "}
                (Pinnacle, Betfair Exchange no-vig) or by building your own
                model. Never against a soft bookmaker.
              </li>
              <li>
                <strong>Realistic edge is +1-3%</strong> per bet in liquid
                markets. Anything higher usually means a small sample or
                overestimated probability.
              </li>
              <li>
                <strong>Positive EV plays out over thousands of bets</strong>,
                not tens. Bankroll management is what keeps you in the
                game long enough for it to compound.
              </li>
              <li>
                <strong>CLV is the truest test</strong> of whether your
                +EV estimate is real. Consistent positive CLV = your
                probability estimates are working; consistent negative
                CLV = they are not.
              </li>
            </ul>
          </div>

          <section className="learn-section">
            <h2 className="learn-h2">The short definition</h2>
            <p>
              Positive EV (positive expected value) betting is the practice
              of only placing bets where your estimate of the true win
              probability implies better odds than the price on offer.
              Every bet has an expected value: the average profit or loss
              per bet if the same situation happened infinite times.
              Positive-EV bets have a positive expected value; negative-EV
              bets have a negative one.
            </p>
            <p>
              The insight is small and powerful: if you consistently place
              bets with positive expected value, the maths says you profit
              long-run. Everything else in serious sports betting — bankroll
              management, staking, CLV tracking — is machinery in service
              of this one thing.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">How to find positive EV bets</h2>
            <p>
              Two common approaches. Both come down to needing a reference
              probability more accurate than the bookmaker offering you the
              price.
            </p>
            <ul className="learn-list">
              <li>
                <strong>Sharp-book arbitrage-style.</strong> Take the
                closing (or near-closing) odds at Pinnacle or Betfair
                Exchange, remove the bookmaker&rsquo;s margin (called{" "}
                <em>devigging</em>) to get a &ldquo;true&rdquo; implied
                probability, then compare against the price your soft
                bookmaker is offering. Any positive gap in your favour is
                a positive-EV bet. Most retail +EV betting tools work this
                way.
              </li>
              <li>
                <strong>Modeling.</strong> Build your own probability
                model in a market you understand deeply — a specific
                league, a specific market type, a specific player prop.
                Compare your model&rsquo;s output to the bookmaker&rsquo;s
                price. Where the model disagrees in your favour by a
                material margin, you have a +EV bet. Modeling scales
                worse than sharp-book comparison but the ceiling is
                higher.
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Why sharp books are the reference</h2>
            <p>
              Sharp bookmakers — mainly Pinnacle and Betfair Exchange —
              accept large stakes from serious bettors and adjust their
              prices in real time based on where the money goes. Their
              closing lines are the tightest available estimate of true
              probability because they aggregate the information of
              everyone with real money to risk on that outcome.
            </p>
            <p>
              Soft bookmakers price for the recreational market. They can
              be systematically wrong for weeks in specific niches without
              being punished, because the money coming through their doors
              is not sharp enough to force adjustment. This is exactly why
              +EV strategies can extract value from them.
            </p>
            <p>
              The consequence: <strong>you cannot do +EV betting using
              soft-book prices as the reference.</strong> If both sides of
              your comparison are recreational bookmakers, you are just
              comparing two flavours of noise. The reference has to come
              from a market that takes real money.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Worked example</h2>
            <p>
              Pinnacle&rsquo;s closing line on Arsenal to beat Liverpool
              is 2.10 (bookmaker margin already ~2.5%). Devigged, this
              implies a true probability of about 48%.
            </p>
            <p>
              Your soft bookmaker still has Arsenal at 2.20, which implies
              45.5%. Your EV on backing Arsenal at 2.20:
            </p>
            <div className="learn-formula">
              <code>
                EV = (0.48 × 1.20) &minus; (0.52 × 1.00) = 0.576 &minus; 0.52 = +0.056
              </code>
            </div>
            <p>
              A +5.6% EV bet — you expect to make 5.6p of profit for every
              £1 staked in situations like this on average. Repeated across
              hundreds of similar bets, positive EV of that size is
              professional-grade.
            </p>
            <p>
              Whether Arsenal actually wins is irrelevant to whether the
              bet was +EV. EV describes the quality of the decision, not
              the result.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">The two main killers of a +EV strategy</h2>
            <ul className="learn-list">
              <li>
                <strong>Account limits.</strong> Soft bookmakers limit or
                close winning accounts. As you win, your access to the
                +EV market shrinks. Serious +EV bettors treat account
                turnover as a cost of doing business, spreading action
                across many books and staying below the radar per book.
                Books that don&rsquo;t limit (Pinnacle, exchanges) don&rsquo;t
                offer the +EV in the first place because their prices are
                already the reference.
              </li>
              <li>
                <strong>Bad probability estimates.</strong> If your
                reference is not truly sharp — if you&rsquo;re using a
                stale line, a market with low liquidity, or a devig
                method that is inaccurate — your estimated EV is
                systematically wrong. You bet what looks like +5% EV and
                you&rsquo;re actually at &minus;2%. Consistent negative
                CLV over a large sample is the diagnostic that catches
                this: if you&rsquo;re taking bets you think are +EV but
                the sharp market disagrees, your inputs are wrong.
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
                the number itself, defined and formulated with a worked
                example. This page is the strategy; the EV page is the
                metric.
              </li>
              <li>
                <strong>
                  <Link href="/learn/clv">Closing Line Value (CLV):</Link>
                </strong>{" "}
                the diagnostic that catches whether your +EV estimates are
                real or wishful. Sustained positive CLV validates the
                strategy; sustained negative CLV kills it.
              </li>
              <li>
                <strong>
                  <Link href="/learn/kelly-criterion">Kelly Criterion:</Link>
                </strong>{" "}
                the stake-sizing formula that turns positive-EV bets into
                optimal bankroll growth. Half-Kelly is the sane default.
              </li>
              <li>
                <strong>
                  <Link href="/learn/bankroll-management">Bankroll management:</Link>
                </strong>{" "}
                the discipline that keeps you solvent long enough for
                +EV to compound. +EV without bankroll management still
                blows up on variance.
              </li>
              <li>
                <strong>Devig:</strong> the process of stripping the
                bookmaker&rsquo;s margin from a price to estimate the
                true implied probability. Required for accurate +EV
                calculation against a sharp reference.
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
                Positive EV shows up in your CLV, not your win rate.
              </div>
              <div className="learn-cta-sub">
                Log your bets on {BRAND.name} and CLV vs Pinnacle appears
                on your dashboard automatically. Positive CLV = your +EV
                estimates are real. Free, no credit card.
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
