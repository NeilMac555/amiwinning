// /learn/yield — Day 2 of the betting-analytics glossary series.
//
// SEO targets: "what is yield in betting" (~500/mo), "what is a good
// yield betting" (~400/mo), "yield vs ROI betting", "betting yield
// calculator" (calculator-adjacent intent).
//
// Yield is the industry-standard headline metric for tipsters because
// it's stake-normalised, intuitive, and easy to compare across
// bettors. It's also vulnerable to small-sample noise and outright
// gaming — that honest tension is the wedge for the page.

import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { buildBreadcrumbList } from "@/lib/breadcrumb-schema";
import { LearnAuthor } from "@/components/LearnAuthor";

const LAST_UPDATED = "2026-08-17";

export const metadata: Metadata = {
  alternates: { canonical: "/learn/yield" },
  title: "What is Yield in Sports Betting?",
  description:
    "Yield is the headline metric for tipsters: profit divided by total stake. Definition, formula, worked example, what counts as a good yield, why it's not the whole story.",
  openGraph: {
    title: "What is Yield in Sports Betting?",
    description:
      "The industry headline metric. Definition, formula, worked example, what's a good yield, and where yield falls short.",
    type: "article",
  },
};

export default function YieldPage() {
  const definedTermJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: "Yield (sports betting)",
    alternateName: ["Betting Yield", "Yield Percentage"],
    description:
      "Yield in sports betting is total profit divided by total stake, expressed as a percentage. It's the most widely used headline metric for measuring a bettor or tipster's edge per unit staked, normalising performance across different stake sizes.",
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: `${BRAND.name} Sports Betting Glossary`,
      url: "https://amiup.io/learn",
    },
    url: "https://amiup.io/learn/yield",
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "What is Yield in Sports Betting?",
    description:
      "Definition, formula, worked example, what's a good yield, and the honest limits of yield as a metric.",
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
    mainEntityOfPage: "https://amiup.io/learn/yield",
  };

  const faqItems: Array<{ q: string; a: string }> = [
    {
      q: "What is yield in sports betting?",
      a: "Yield is total net profit divided by total stake, expressed as a percentage. It's the industry-standard headline metric because it normalises performance across bettors with different stake sizes. A +5% yield means you made 5 units of profit for every 100 units you staked.",
    },
    {
      q: "How do you calculate betting yield?",
      a: "Yield % = (Profit / Total Stake) × 100. Profit is net: total returns minus total stake. Example: 100 bets at 1 unit each (100u total staked), net profit 6u. Yield = 6 / 100 × 100 = +6%. That would be professional-tipster territory in most sports.",
    },
    {
      q: "What is a good yield in sports betting?",
      a: "Assuming a large sample (1,000+ bets), 2-5% is a genuine sustainable edge in mainstream markets, 5-10% is excellent (top-tier tipsters and sharps), and 10%+ is exceptional and rare. Under 100 bets, yield is mostly variance and any number should be discounted heavily.",
    },
    {
      q: "Yield vs ROI in betting — what is the difference?",
      a: "Yield is always profit divided by total stake. ROI in betting is used loosely: sometimes it means yield (stake-based), sometimes it means ROC (bankroll-based). Always check which definition a source is using — the two can differ by an order of magnitude for the same bettor.",
    },
    {
      q: "Why is yield not enough on its own?",
      a: "Yield is a lagging indicator. It describes what happened, not whether the edge is real going forward. A small-sample yield can be pure variance. Pair yield with CLV (Closing Line Value) for a forward-looking signal, and pair it with ROC to see how productively your bankroll is actually working, not just how well each stake performed.",
    },
    {
      q: "Can tipsters game yield?",
      a: "Yes. By varying stake size based on confidence, a tipster can disproportionately credit wins and discount losses. Some platforms let tipsters retroactively adjust stakes after a result. Fixed-stake records (1u every bet) are the credible ones. Anything with variable stakes should be inspected before you trust the headline yield.",
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
    { name: "Yield", url: "https://amiup.io/learn/yield" },
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
            <span>Yield</span>
          </nav>

          <p className="learn-eyebrow">Betting analytics glossary</p>
          <h1 className="learn-title">What is Yield in Sports Betting?</h1>
          <LearnAuthor lastUpdated={LAST_UPDATED} />
          <p className="learn-deck">
            Yield is the industry-standard headline metric: how much
            profit you make per unit staked. Tipsters quote it, trackers
            display it, sharps argue about it. Worth understanding both
            what it measures and where it falls short.
          </p>

          <div className="learn-tldr">
            <p className="learn-tldr-label">TL;DR</p>
            <ul>
              <li>
                <strong>Yield = total profit ÷ total staked</strong>,
                expressed as a percentage. Answers the question &ldquo;how
                much do you make per unit risked?&rdquo;
              </li>
              <li>
                <strong>3–5% yield over a large sample is a genuine long-term
                edge</strong> in mainstream markets. Anything above 8%
                sustained is elite; anything below 0% is losing.
              </li>
              <li>
                <strong>Yield is a lagging indicator</strong> — it tells you
                what happened, not whether you&rsquo;ll keep doing it. High
                yield in a small sample is often variance.
              </li>
              <li>
                <strong>Pair with CLV</strong>: yield tells you what your
                edge was worth in results, CLV tells you if the edge is real.
              </li>
            </ul>
          </div>

          <section className="learn-section">
            <h2 className="learn-h2">The short definition</h2>
            <p>
              Yield is the percentage return on each unit you stake.
              Expressed mathematically, it&rsquo;s total net profit
              divided by total stake, multiplied by 100 to give a
              percentage.
            </p>
            <p>
              The headline appeal of yield is that it normalises
              performance across bettors with different stake sizes. A
              bettor staking 50u a week and a bettor staking 0.5u a week
              can still be compared fairly on yield even though their
              absolute profit numbers will look wildly different.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">The formula</h2>
            <div className="learn-formula">
              <code>Yield % = (Profit ÷ Total Stake) × 100</code>
            </div>
            <p>
              Profit here is net &mdash; total returns minus total
              stake. Total stake is the sum of every individual stake
              you put down across the period being measured.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Worked example</h2>
            <p>
              You placed 100 bets at 1u each. Total stake: 100u.
              Average odds: 2.00. You won 53 and lost 47.
            </p>
            <ul className="learn-list">
              <li>
                Returns from wins: 53 × 2.00 = 106u
              </li>
              <li>
                Total stake: 100u
              </li>
              <li>
                Net profit: 106 &minus; 100 = 6u
              </li>
            </ul>
            <div className="learn-formula">
              <code>Yield = (6 ÷ 100) × 100 = +6 %</code>
            </div>
            <p>
              You made 6 units of profit per 100 units staked. That
              would put you in &ldquo;professional-grade tipster&rdquo;
              territory in most sports.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">What counts as a good yield?</h2>
            <p>
              Rough industry benchmarks, assuming the sample is large
              enough to be meaningful (1,000+ bets):
            </p>
            <ul className="learn-list">
              <li>
                <strong>Negative yield:</strong> losing money. The
                vast majority of bettors live here.
              </li>
              <li>
                <strong>0 &mdash; 2%:</strong> breaking even or barely
                profitable after accounting for the bookmaker&rsquo;s
                margin. Many recreational bettors with skill cluster
                here.
              </li>
              <li>
                <strong>2 &mdash; 5%:</strong> a genuine, sustainable
                edge. Most professional tipsters in mainstream sports.
              </li>
              <li>
                <strong>5 &mdash; 10%:</strong> excellent. Top-tier
                tipsters and seasoned sharps usually land here.
              </li>
              <li>
                <strong>10%+:</strong> exceptional. Sustainable
                double-digit yield over thousands of bets in major
                sports markets is rare. Usually indicates either a
                small sample, a niche edge, or both.
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Where yield falls short</h2>
            <p>
              Yield is intuitive and easy to compute, which is also
              why it&rsquo;s gameable. Things to know:
            </p>
            <ul className="learn-list">
              <li>
                <strong>It says nothing about bankroll size.</strong> A
                5% yield from 0.1u stakes is barely worth your phone
                charger. A 5% yield from 5u stakes is a living. Yield
                is per-unit-staked, not per-unit-of-life.
              </li>
              <li>
                <strong>Small samples are extremely noisy.</strong> Over
                100 bets, a &ldquo;true&rdquo; 3% yield bettor will
                regularly show 8% yield or &minus;2% yield purely from
                variance. 1,000 bets is the minimum sample for yield to
                be a credible signal; 5,000+ is where confidence
                hardens.
              </li>
              <li>
                <strong>Tipsters can game yield.</strong> By varying
                stake size based on confidence, a tipster can
                disproportionately credit their wins and discount their
                losses. Some platforms let tipsters retroactively
                adjust stakes after a result. Always check whether the
                stake-size policy is fixed.
              </li>
              <li>
                <strong>Yield doesn&rsquo;t prove you have an edge in
                the future.</strong> It&rsquo;s a historical
                description. Closing line value (CLV) is the cleaner
                forward-looking signal because it measures whether you
                made a good decision independent of whether the bet
                won.
              </li>
              <li>
                <strong>Some books limit winning accounts.</strong> Real
                yield in the wild is dragged down by stake caps. The
                yield you achieved was at the stake you were allowed,
                not the stake you wanted.
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Yield vs ROI vs ROC</h2>
            <p>
              These three are often confused. The honest summary:
            </p>
            <ul className="learn-list">
              <li>
                <strong>Yield:</strong> profit divided by total stake.
                Per-unit-staked measure.
              </li>
              <li>
                <strong>ROI (Return on Investment):</strong> in
                finance, profit divided by capital invested. In
                betting, &ldquo;ROI&rdquo; is sometimes used as a
                synonym for yield (stake-based) and sometimes for ROC
                (bankroll-based). Always check which the source
                means.
              </li>
              <li>
                <strong>ROC (Return on Capital):</strong> profit
                divided by the bankroll deployed. Better as a measure
                of how productively your money is working but harder
                to compute because bankroll size varies over time.
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
                forward-looking signal of edge. Doesn&rsquo;t need a
                massive sample to be informative.
              </li>
              <li>
                <strong>
                  <Link href="/learn/roc">Return on Capital (ROC):</Link>
                </strong>{" "}
                the bankroll-based counterpart to yield. Tells you how
                productively your money is working, not just each stake.
              </li>
              <li>
                <strong>
                  <Link href="/learn/roi">ROI:</Link>
                </strong>{" "}
                the yield-vs-ROC ambiguity spelled out in one place.
              </li>
              <li>
                <strong>
                  <Link href="/learn/kelly-criterion">Kelly Criterion:</Link>
                </strong>{" "}
                the stake-sizing formula that turns yield into a
                bankroll growth curve.
              </li>
              <li>
                <strong>
                  <Link href="/learn/bankroll-management">Bankroll management:</Link>
                </strong>{" "}
                yield is per-unit-staked; bankroll management makes
                &ldquo;unit&rdquo; mean something.
              </li>
              <li>
                <strong>
                  <Link href="/learn/positive-ev-betting">Positive EV betting:</Link>
                </strong>{" "}
                the strategy that generates real yield. Yield without
                +EV selection is either luck or short-run variance.
              </li>
              <li>
                <strong>Win rate:</strong> the percentage of bets you
                won. Noisier than yield because it ignores odds.
              </li>
              <li>
                <strong>Average odds:</strong> the mean odds of your
                bets. Tells you the break-even win rate you need.
              </li>
              <li>
                <strong>Variance:</strong> the natural fluctuation in
                results. Why small-sample yield is dangerous to read
                literally.
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
                Tracking yield manually means typing every bet.
              </div>
              <div className="learn-cta-sub">
                Log your bets on {BRAND.name} and yield appears
                automatically, alongside CLV, ROC, win rate, max
                drawdown, and breakdowns by sport and market. Free,
                no credit card.
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
