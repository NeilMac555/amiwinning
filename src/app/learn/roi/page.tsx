// /learn/roi — Return on Investment. Fills the ROI/ROC gap in the
// glossary alongside CLV, Yield, and EV.
//
// SEO target: "what is ROI in betting" + "ROI vs yield betting" +
// "sports betting ROI" — a cluster where every existing page conflates
// ROI with yield. This page's angle is to be pedantic on the distinction
// and cite ROC as the more honest cousin.
//
// Format matches the rest of the /learn/* series: definition, formula,
// worked example, benchmarks, where it falls short, related terms,
// CTA. Twin schemas (DefinedTerm + Article).

import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { buildBreadcrumbList } from "@/lib/breadcrumb-schema";
import { LearnAuthor } from "@/components/LearnAuthor";

const LAST_UPDATED = "2026-08-17";

export const metadata: Metadata = {
  alternates: { canonical: "/learn/roi" },
  title: "What is ROI in Sports Betting?",
  description:
    "ROI in betting: definition, formula, worked example, and the important difference between ROI, yield, and ROC. Free bet tracker at Am I Up.",
  openGraph: {
    title: "What is ROI in Sports Betting?",
    description:
      "ROI in sports betting explained. The clean definition, worked example, and why ROI, yield, and ROC are not the same number.",
    type: "article",
  },
};

export default function RoiPage() {
  const definedTermJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: "Return on Investment (ROI)",
    alternateName: ["ROI", "Return on Investment"],
    description:
      "Return on Investment in sports betting is total profit divided by the capital invested, expressed as a percentage. Distinct from yield (profit divided by total stake) and ROC (profit divided by bankroll deployed). Precision on which of these three a tipster or tracker actually reports is essential; the numbers can differ by an order of magnitude.",
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: `${BRAND.name} Sports Betting Glossary`,
      url: "https://amiup.io/learn",
    },
    url: "https://amiup.io/learn/roi",
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "What is ROI in Sports Betting?",
    description:
      "ROI in sports betting: definition, formula, worked example, and how ROI differs from yield and ROC.",
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
    mainEntityOfPage: "https://amiup.io/learn/roi",
  };

  const faqItems: Array<{ q: string; a: string }> = [
    {
      q: "What is ROI in sports betting?",
      a: "ROI (Return on Investment) is a return metric borrowed from finance. In betting, ROI is used loosely: sometimes it means yield (profit / total stake), sometimes it means ROC (profit / bankroll deployed). The two give very different numbers for the same bettor. Always check which denominator a source is using before comparing across bettors or tipsters.",
    },
    {
      q: "How is ROI calculated in sports betting?",
      a: "The most common calculation is ROI = (Net Profit / Total Stake) × 100, which is the same as yield. Example: 100 bets at 1u each, +6u profit, ROI = 6%. The bankroll-based calculation (ROI = Net Profit / Bankroll Deployed) is the same as ROC and usually gives a much larger number because bankroll is smaller than cumulative stake.",
    },
    {
      q: "What is a good ROI in sports betting?",
      a: "As yield (stake-based ROI): 2-5% is a genuine edge over a large sample; 5-10% is excellent; 10%+ is exceptional and rare. As ROC (bankroll-based ROI): 10-30% annually is genuinely outperforming most passive alternatives; 30%+ is professional territory. The gap between the two is why you must know which definition the source is using.",
    },
    {
      q: "ROI vs yield — are they the same in betting?",
      a: "In many contexts yes — many tipsters and platforms use ROI as a direct synonym for yield (profit / total stake). But some sources use ROI to mean bankroll-based return (ROC). Without a clarifying definition the ambiguity is real. When in doubt, ask which denominator is used, or default to reporting both yield and ROC separately.",
    },
    {
      q: "Why does the ROI definition matter so much?",
      a: "A bettor with 1u stakes on a 10u bankroll who ends the year +2u has 20% ROC but only 0.4% yield (10 bets? 100 bets? 1,000?). Two different tipsters both claiming +20% ROI could mean +20% yield (very high, elite) or +20% ROC (unremarkable). The gap between the two is often an order of magnitude, so quoting one without labelling it is close to meaningless.",
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
    { name: "ROI", url: "https://amiup.io/learn/roi" },
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
            <span>ROI</span>
          </nav>

          <p className="learn-eyebrow">Betting analytics glossary</p>
          <h1 className="learn-title">What is ROI in Sports Betting?</h1>
          <LearnAuthor lastUpdated={LAST_UPDATED} />
          <p className="learn-deck">
            ROI is the finance-world return metric everyone borrows into
            betting, then everyone uses to mean something slightly
            different. The clean definition, and the two other numbers
            it&rsquo;s constantly confused with, in one page.
          </p>

          <div className="learn-tldr">
            <p className="learn-tldr-label">TL;DR</p>
            <ul>
              <li>
                <strong>ROI (return on investment) = total profit ÷ total
                staked</strong>, expressed as a percentage.
              </li>
              <li>
                <strong>In sports betting, ROI is mathematically identical
                to Yield</strong> — same formula, same numbers, different
                naming convention. Pikkit and most US trackers say ROI;
                bettin.gs and most EU trackers say Yield.
              </li>
              <li>
                <strong>Do not confuse ROI with ROC (return on capital)</strong>
                {" "}
                — ROC divides by starting bankroll, not by stake. Both
                matter, but they measure different things.
              </li>
              <li>
                <strong>A sustained ROI of 3–5% over 500+ bets</strong> is
                a genuine long-term edge; sustained negative ROI is losing
                to the vig.
              </li>
            </ul>
          </div>

          <section className="learn-section">
            <h2 className="learn-h2">The short definition</h2>
            <p>
              Return on Investment (ROI) is total net profit divided by
              the capital you invested, expressed as a percentage. In
              plain finance terms: how much did the money you put to
              work actually earn you.
            </p>
            <p>
              Where this gets muddy in betting is the word
              &ldquo;invested&rdquo;. Two schools of thought coexist:
              some sites use ROI to mean profit divided by total stake
              (which is really{" "}
              <Link href="/learn/yield">yield</Link>), others reserve
              ROI for profit divided by bankroll deployed (which is
              closer to <Link href="/learn/roc">ROC</Link>). Neither
              usage is objectively wrong. Both are common. The important
              habit is to check what a source means before comparing
              two ROI figures.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">The formula</h2>
            <div className="learn-formula">
              <code>ROI % = (Profit ÷ Capital Invested) × 100</code>
            </div>
            <p>
              Profit is net (returns minus stakes). Capital invested is
              whichever denominator the source uses:
            </p>
            <ul className="learn-list">
              <li>
                <strong>Stake-based ROI:</strong> denominator = sum of
                every stake ever placed. Numerically identical to yield.
              </li>
              <li>
                <strong>Bankroll-based ROI:</strong> denominator = the
                amount of money you actually deployed as a bankroll (the
                pot you were staking from). Numerically identical to
                ROC.
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Worked example</h2>
            <p>
              You start with a 100u bankroll. Over a season you place
              300 bets at an average stake of 1.5u each, so total stake
              = 450u. Net profit = 27u.
            </p>
            <ul className="learn-list">
              <li>
                Stake-based ROI (a.k.a. yield): 27 ÷ 450 = 6.0%
              </li>
              <li>
                Bankroll-based ROI (a.k.a. ROC): 27 ÷ 100 = 27%
              </li>
            </ul>
            <p>
              Same 27u profit. Same season. Two headline numbers that
              differ by 4.5x depending on which denominator the writer
              picked. Both are &ldquo;correct&rdquo; ROIs. Neither is
              lying. This is why the distinction matters when comparing
              tipsters.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Which denominator should you use?</h2>
            <p>
              Depends on the question you&rsquo;re trying to answer.
            </p>
            <ul className="learn-list">
              <li>
                <strong>&ldquo;How good is my staking system per
                bet?&rdquo;</strong> Stake-based. Removes bankroll size
                from the picture and lets you compare bettors with
                wildly different bankroll scales.
              </li>
              <li>
                <strong>&ldquo;How productively is my money
                working?&rdquo;</strong> Bankroll-based. Answers the
                actual finance question about return on capital
                deployed, which is what a professional would care
                about if they were choosing between putting money
                into betting versus somewhere else.
              </li>
              <li>
                <strong>&ldquo;How confident should I be in my
                edge?&rdquo;</strong> Neither of these on its own.
                Look at{" "}
                <Link href="/learn/clv">Closing Line Value (CLV)</Link>
                . Yield-flavoured ROI takes thousands of bets to
                become statistically meaningful; CLV gives signal in
                dozens.
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Where ROI gets dishonest</h2>
            <p>
              Two common patterns to be sceptical of:
            </p>
            <ul className="learn-list">
              <li>
                <strong>Silent switching of the denominator.</strong>{" "}
                A tipster reports 27% &ldquo;ROI&rdquo; on a landing
                page and it turns out they meant bankroll-based, but
                you assumed stake-based when you compared them against
                someone quoting 6% yield. The two are the same bettor.
                Always verify.
              </li>
              <li>
                <strong>Variable stake sizes with a
                bankroll-based ROI headline.</strong> A tipster who
                stakes bigger on the confident picks can push their
                bankroll-based ROI up sharply while their per-bet
                edge (yield) is mediocre. Sometimes this is legitimate
                Kelly staking; sometimes it&rsquo;s cherry-picking
                loud winners with big stakes and quiet losers with
                small ones.
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">
              The three numbers, side by side
            </h2>
            <ul className="learn-list">
              <li>
                <strong>
                  <Link href="/learn/yield">Yield:</Link>
                </strong>{" "}
                profit ÷ total stake. Per-bet-normalised. The tipster
                industry&rsquo;s default.
              </li>
              <li>
                <strong>ROI (stake-based):</strong> mathematically
                identical to yield. Common on European sites.
              </li>
              <li>
                <strong>ROI (bankroll-based):</strong> mathematically
                identical to ROC. Common on US sites and in
                finance-flavoured writeups.
              </li>
              <li>
                <strong>
                  <Link href="/learn/roc">ROC:</Link>
                </strong>{" "}
                profit ÷ bankroll deployed. The true money-on-money
                return.
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Related terms</h2>
            <ul className="learn-list learn-list--related">
              <li>
                <strong>
                  <Link href="/learn/yield">Yield:</Link>
                </strong>{" "}
                the stake-based cousin. If somebody says
                &ldquo;ROI&rdquo; and they mean stake-based, this is
                what they mean.
              </li>
              <li>
                <strong>
                  <Link href="/learn/roc">Return on Capital (ROC):</Link>
                </strong>{" "}
                the bankroll-based cousin. If somebody says
                &ldquo;ROI&rdquo; and they mean bankroll-based, this
                is what they mean.
              </li>
              <li>
                <strong>
                  <Link href="/learn/clv">Closing Line Value (CLV):</Link>
                </strong>{" "}
                the forward-looking signal of edge. Doesn&rsquo;t need
                thousands of bets to be informative.
              </li>
              <li>
                <strong>
                  <Link href="/learn/expected-value">Expected Value (EV):</Link>
                </strong>{" "}
                the theoretical per-bet return underneath any
                profitable strategy.
              </li>
              <li>
                <strong>
                  <Link href="/learn/kelly-criterion">Kelly Criterion:</Link>
                </strong>{" "}
                the stake-sizing rule that turns positive-return bets
                into optimal bankroll growth. Kelly optimises ROC, not
                yield.
              </li>
              <li>
                <strong>
                  <Link href="/learn/bankroll-management">Bankroll management:</Link>
                </strong>{" "}
                context that makes any &ldquo;ROI&rdquo; number mean
                something.
              </li>
              <li>
                <strong>
                  <Link href="/learn/positive-ev-betting">Positive EV betting:</Link>
                </strong>{" "}
                the strategy behind any sustained ROI. Without +EV
                selection, ROI (of either flavour) trends negative.
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

          {/* CTA */}
          <section className="learn-cta">
            <div>
              <div className="learn-cta-title">
                See both ROIs on your own dashboard.
              </div>
              <div className="learn-cta-sub">
                {BRAND.name} shows stake-based yield and
                bankroll-based ROC side by side, so you always know
                which one a headline is talking about. Free, no credit
                card.
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
            <Link href="/learn/expected-value">What is EV?</Link>
            <Link href="/learn/roc">What is ROC?</Link>
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
