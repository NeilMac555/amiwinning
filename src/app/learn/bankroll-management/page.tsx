// /learn/bankroll-management — the discipline of separating betting money
// from life money and sizing stakes consistently.
//
// SEO target: "bankroll management sports betting" (~8k/month), "sports
// betting bankroll" (~5k/month), "how to manage betting bankroll"
// (~2k/month), "unit staking betting" (~800/month). Highest-volume
// betting-education query in the top-of-funnel education space.
//
// Format mirrors /learn/clv and /learn/kelly-criterion. All 4 schema types.

import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { buildBreadcrumbList } from "@/lib/breadcrumb-schema";

export const metadata: Metadata = {
  alternates: { canonical: "/learn/bankroll-management" },
  title: "Bankroll Management for Sports Betting. Units, staking, drawdown.",
  description:
    "How to size a betting bankroll, pick a unit, choose flat vs percentage staking, and survive drawdown. Practical rules for punters who want to bet like an investor, not a gambler.",
  openGraph: {
    title: "Bankroll Management for Sports Betting",
    description:
      "How to size a bankroll, pick a unit, choose flat vs percentage staking, and survive drawdown.",
    type: "article",
  },
};

export default function BankrollPage() {
  const definedTermJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: "Bankroll Management",
    alternateName: ["Bankroll", "Unit Staking", "Betting Bankroll"],
    description:
      "Bankroll management is the discipline of ring-fencing a sum of money dedicated to sports betting (the bankroll), sizing each bet as a small consistent fraction of that bankroll (the unit), and treating wins and losses as bankroll changes rather than income or debt. Its purpose is to survive drawdown and let long-run edge compound.",
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: `${BRAND.name} Sports Betting Glossary`,
      url: "https://amiup.io/learn",
    },
    url: "https://amiup.io/learn/bankroll-management",
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Bankroll Management for Sports Betting. Units, staking, drawdown.",
    description:
      "How to size a bankroll, pick a unit, choose flat vs percentage staking, and survive drawdown.",
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
    mainEntityOfPage: "https://amiup.io/learn/bankroll-management",
  };

  const faqItems: Array<{ q: string; a: string }> = [
    {
      q: "What is bankroll management in sports betting?",
      a: "Bankroll management is the discipline of setting aside a specific sum of money for betting (the bankroll), staking each bet as a small consistent fraction of that bankroll (the unit), and treating wins and losses as bankroll changes rather than income to withdraw or debt to chase. The goal is to survive drawdown long enough for edge to compound.",
    },
    {
      q: "How much should my betting bankroll be?",
      a: "Only money you can afford to lose entirely. A sensible rule is no more than 1-5% of net worth, or an amount that would not change your life if it went to zero. Never a bankroll funded by credit, savings you need, or bill money. Bankroll size should be a decision made cold and once, not adjusted after a losing week.",
    },
    {
      q: "What is a betting unit?",
      a: "A unit is a fixed fraction of your bankroll — usually 1% — that represents the standard stake size. If your bankroll is £2,000 and 1 unit is 1%, your standard stake is £20. Talking in units instead of currency lets you compare tipster records, keeps stakes proportional as bankroll changes, and enforces the discipline of consistent staking.",
    },
    {
      q: "Flat staking or percentage staking — which is better?",
      a: "Flat staking (same amount on every bet, e.g. always £20) is simpler and lower-variance. Percentage staking (same percentage of current bankroll, e.g. always 1%) compounds gains and cushions losses because stakes shrink when the bankroll shrinks. For most bettors, flat staking recalculated to a fresh unit every month or quarter is a good middle ground: you get most of the compounding advantage without recalculating a stake every time your balance changes.",
    },
    {
      q: "How should I handle a losing streak?",
      a: "Stake the same unit size. The single most common way punters blow up is chasing losses — doubling stakes to recover a bad week. If your bankroll is intact and your edge is intact, variance says the streak ends. If your bankroll is halved by chasing, no future edge is large enough to recover. Bankroll management exists specifically to prevent this reaction.",
    },
    {
      q: "How large a drawdown should I expect?",
      a: "Even a genuine 5% ROI bettor at 1% stakes should expect drawdowns of 15-25% of bankroll every year or two, and 30%+ drawdowns occasionally. A bettor with less edge or larger stakes will see deeper ones. Building your bankroll and unit size around this expectation — rather than being surprised by it — is what separates people who last from people who quit angry.",
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
    { name: "Bankroll Management", url: "https://amiup.io/learn/bankroll-management" },
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
            <span>Bankroll Management</span>
          </nav>

          <p className="learn-eyebrow">Betting analytics glossary</p>
          <h1 className="learn-title">
            Bankroll management for sports betting
          </h1>
          <p className="learn-deck">
            Bankroll management is the difference between betting like an
            investor and betting like a gambler. The rules are simple, the
            discipline is hard, and it&rsquo;s the single biggest predictor
            of who&rsquo;s still betting in five years.
          </p>

          <div className="learn-tldr">
            <p className="learn-tldr-label">TL;DR</p>
            <ul>
              <li>
                <strong>Ring-fence a bankroll</strong> — a specific sum you
                can lose entirely without it changing your life. Never
                credit, never bill money, never savings.
              </li>
              <li>
                <strong>Pick a unit</strong> — usually 1% of bankroll — and
                make it your standard stake. Speak in units, not currency.
              </li>
              <li>
                <strong>Flat-stake by default.</strong> Percentage staking
                compounds better but is more complex; flat with periodic
                unit recalculation captures most of the benefit.
              </li>
              <li>
                <strong>Never chase losses.</strong> A losing streak with
                intact bankroll is recoverable; a halved bankroll from
                chasing is not.
              </li>
              <li>
                <strong>Expect 20%+ drawdowns even with edge.</strong>{" "}
                Bankroll size and unit size should be built around this
                expectation, not around your best runs.
              </li>
            </ul>
          </div>

          <section className="learn-section">
            <h2 className="learn-h2">The short definition</h2>
            <p>
              Bankroll management is the discipline of setting aside a
              specific sum of money for betting (your bankroll), staking
              each bet as a small consistent fraction of that bankroll
              (your unit), and treating wins and losses as bankroll changes
              rather than income to withdraw or debt to chase.
            </p>
            <p>
              The goal isn&rsquo;t to maximise short-run profit. It&rsquo;s
              to survive drawdown long enough for edge to compound. Almost
              every punter who blows up does it not because they had no
              edge, but because they had bad bankroll management on top of
              real edge.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">How much should the bankroll be?</h2>
            <p>
              Only money you can afford to lose <em>entirely</em>. Not most
              of; not some of; all of. A useful test: if the bankroll went
              to zero tomorrow, would your life meaningfully change? If
              yes, the bankroll is too big for you. Cut it.
            </p>
            <p>
              A sensible ceiling for most non-professional bettors is
              1-5% of net worth. The exact number matters less than the
              principle: bankroll is speculation capital, not living
              capital, and it&rsquo;s decided cold, once, before the first
              bet — not adjusted after a losing weekend.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Units, and why they matter</h2>
            <p>
              A <strong>unit</strong> is a fixed fraction of bankroll,
              usually 1%. On a £2,000 bankroll, 1 unit = £20. Every bet is
              expressed in units, not pounds.
            </p>
            <div className="learn-formula">
              <code>1 unit = 1% of current bankroll</code>
            </div>
            <p>
              Three reasons to speak in units:
            </p>
            <ul className="learn-list">
              <li>
                <strong>Comparability.</strong> A tipster claiming +200u
                over a year is meaningful. A tipster claiming +£4,000 is
                unfalsifiable (on what bankroll? at what stake?).
              </li>
              <li>
                <strong>Consistency.</strong> Units enforce standard stake
                sizing. You&rsquo;re not deciding stake per bet based on
                gut feel about how much you like the pick.
              </li>
              <li>
                <strong>Compounding.</strong> If unit is recalculated
                periodically (say, monthly at 1% of new balance), stakes
                grow with a winning bankroll and shrink with a losing one
                — an automatic risk control.
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Flat vs percentage staking</h2>
            <p>
              Two schools:
            </p>
            <ul className="learn-list">
              <li>
                <strong>Flat staking:</strong> same amount on every bet.
                Simpler mentally, lower variance, easy to track. The stake
                stays the same whether you&rsquo;re up or down, so bankroll
                grows arithmetically not geometrically.
              </li>
              <li>
                <strong>Percentage staking:</strong> same percentage of
                current bankroll on every bet (e.g. always 1%). Stake
                shrinks with a losing bankroll (protective) and grows with
                a winning one (compounding). More complex to track but
                mathematically superior for a bettor with real edge.
              </li>
            </ul>
            <p>
              For most bettors, the pragmatic middle ground is <strong>
              flat staking with periodic unit recalculation</strong>: pick
              a unit at the start of a month, use it consistently, then
              recalculate the unit at 1% of the fresh bankroll at the
              start of the next month. You get most of the compounding
              upside without recalculating a stake per bet.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">The chasing trap</h2>
            <p>
              The single most common way real bettors blow up: they double
              stakes to recover a losing week. It feels reasonable in the
              moment. The maths says otherwise.
            </p>
            <p>
              If your bankroll takes a 20% hit at 1u stakes, you need +25%
              at the same stakes to recover. If instead you double to 2u
              chasing, one bad run pushes you into a hole where the
              recovery becomes mathematically implausible. Chasing
              inverts the discipline: you take the biggest bets when
              variance has proved you&rsquo;re running badly, not when
              anything about your edge has changed.
            </p>
            <p>
              The correct response to a losing streak is the same as the
              response to a winning streak: <strong>next bet is 1u.</strong>
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Expect drawdown even with edge</h2>
            <p>
              A genuine 5% ROI bettor at 1u stakes should expect drawdowns
              of 15-25% of bankroll every year or two, and 30%+ drawdowns
              periodically. This is not a symptom of losing edge. It&rsquo;s
              the standard variance of positive-EV betting over realistic
              sample sizes.
            </p>
            <p>
              Bankroll and unit size should be built around this
              expectation, not around your best months. A 100u bankroll at
              1u stakes gives room to breathe. A 25u bankroll at 1u stakes
              blows up on a normal cold streak.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Related terms</h2>
            <ul className="learn-list learn-list--related">
              <li>
                <strong>
                  <Link href="/learn/kelly-criterion">Kelly Criterion:</Link>
                </strong>{" "}
                the mathematical formula for optimal stake sizing given a
                known edge. Fractional Kelly (half or quarter) is the
                sharpest variant of percentage staking.
              </li>
              <li>
                <strong>
                  <Link href="/learn/roc">ROC (Return on Capital):</Link>
                </strong>{" "}
                the honest bankroll-based return metric. Yield doesn&rsquo;t
                see bankroll; ROC does.
              </li>
              <li>
                <strong>
                  <Link href="/learn/yield">Yield:</Link>
                </strong>{" "}
                profit divided by total stake — the tipster-industry
                headline metric. Independent of bankroll, so bankroll
                management is orthogonal to yield.
              </li>
              <li>
                <strong>
                  <Link href="/learn/clv">CLV (Closing Line Value):</Link>
                </strong>{" "}
                the cleanest available proof that you have real edge. If
                CLV is negative, no amount of clever bankroll management
                saves you.
              </li>
              <li>
                <strong>Drawdown:</strong> the peak-to-trough drop in
                bankroll over a run of bets. Bankroll management&rsquo;s
                explicit purpose is to survive drawdown; measuring maximum
                drawdown is how you check the strategy is working.
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
                Bankroll management is easier when your bets are logged.
              </div>
              <div className="learn-cta-sub">
                Track every bet on {BRAND.name} and your unit-based P/L,
                yield, ROC, and drawdown appear on your dashboard
                automatically. Paste any tip or screenshot, we do the
                rest. Free, no credit card.
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
