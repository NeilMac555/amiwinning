// /learn/kelly-criterion — Kelly stake-sizing formula for sports betting.
//
// SEO target: "kelly criterion sports betting" (~4k/month), "kelly
// criterion formula" (~5k/month), "kelly criterion calculator" (~3k/month),
// "half kelly betting" (~800/month). One of the highest-volume math
// queries in the betting-education cluster.
//
// Format matches /learn/clv: TL;DR → definition → why it matters →
// formula → worked example → caveats → related terms → FAQ → CTA.
// All 4 schema types (BreadcrumbList, DefinedTerm, Article, FAQPage).

import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { buildBreadcrumbList } from "@/lib/breadcrumb-schema";

export const metadata: Metadata = {
  alternates: { canonical: "/learn/kelly-criterion" },
  title: "Kelly Criterion for Sports Betting. Formula, examples, half-Kelly.",
  description:
    "The Kelly criterion sizes each bet as a fraction of your bankroll based on your edge. Formula, worked example, why almost every sharp uses half-Kelly. Track your yield free on Am I Up.",
  openGraph: {
    title: "Kelly Criterion for Sports Betting",
    description:
      "The optimal-growth stake-sizing formula. Definition, formula, worked example, why sharps use half-Kelly.",
    type: "article",
  },
};

export default function KellyPage() {
  const definedTermJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: "Kelly Criterion",
    alternateName: ["Kelly Formula", "Kelly Staking", "Kelly Bet Sizing"],
    description:
      "The Kelly criterion is a mathematical formula that computes the optimal fraction of a bankroll to stake on a bet given the bet's expected edge and odds. Its output is the stake size that maximises long-run bankroll growth. In practice most sharp sports bettors use half-Kelly or quarter-Kelly to reduce variance and protect against edge overestimation.",
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: `${BRAND.name} Sports Betting Glossary`,
      url: "https://amiup.io/learn",
    },
    url: "https://amiup.io/learn/kelly-criterion",
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Kelly Criterion for Sports Betting. Formula, examples, half-Kelly.",
    description:
      "The optimal-growth stake-sizing formula. Definition, formula, worked example, why sharps use half-Kelly.",
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
    mainEntityOfPage: "https://amiup.io/learn/kelly-criterion",
  };

  const faqItems: Array<{ q: string; a: string }> = [
    {
      q: "What is the Kelly Criterion in sports betting?",
      a: "The Kelly criterion is a stake-sizing formula that tells you what fraction of your bankroll to bet given your estimated edge and the odds. Its output is the stake that maximises long-run bankroll growth. If you have no edge, Kelly says bet nothing; if you have a huge edge, Kelly says bet a lot; if you have a small edge, Kelly says bet a small fraction.",
    },
    {
      q: "What is the Kelly formula?",
      a: "In decimal odds the simplest form is: Kelly fraction = (odds × probability − 1) / (odds − 1). If you estimate a 55% chance on a 2.00 bet, that's (2.00 × 0.55 − 1) / (2.00 − 1) = 0.10, or 10% of bankroll. The classical b·p − q / b form uses fractional odds where b is the decimal odds minus one.",
    },
    {
      q: "Why do sharp bettors use half-Kelly?",
      a: "Two reasons. First, full Kelly is aggressive: it maximises the average growth rate but produces gut-wrenching drawdowns of 30%+ that are hard to sit through. Second, full Kelly only works if you know your edge exactly. Real bettors estimate edge with error, and overestimating your edge by even a little makes full Kelly bet too much. Half-Kelly (staking half the recommended amount) keeps most of the growth advantage while roughly quartering the variance.",
    },
    {
      q: "What happens if you bet more than Kelly?",
      a: "Long-run bankroll growth turns negative even when your edge is positive. Above roughly 2× Kelly the bankroll is expected to trend down, not up. This is the mathematical proof for why fixed-percentage staking above your edge is a losing strategy, no matter how sure you feel about the pick.",
    },
    {
      q: "Can you use Kelly with unknown probabilities?",
      a: "Not directly. Kelly needs a probability estimate as input, and if your estimate is wrong Kelly's output is wrong too. Sharp bettors usually derive probability from the closing odds of a market that takes serious money (Pinnacle, Betfair Exchange), then compare against the price they took. If your entry price implies 45% and Pinnacle's no-vig close implies 50%, your edge on that bet is roughly 5% and Kelly can size accordingly.",
    },
    {
      q: "How does Kelly compare to flat staking?",
      a: "Flat staking (same size on every bet) is simpler and lower-variance but leaves growth on the table when the edge is large. Kelly (or a fraction of Kelly) scales stakes with edge, so bigger edges get bigger bets. For a bettor with real edge over many bets, fractional Kelly compounds meaningfully faster than flat staking. For a bettor without real edge, both lose; Kelly just loses faster.",
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
    { name: "Kelly Criterion", url: "https://amiup.io/learn/kelly-criterion" },
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
            <span>Kelly Criterion</span>
          </nav>

          <p className="learn-eyebrow">Betting analytics glossary</p>
          <h1 className="learn-title">
            The Kelly Criterion for sports betting
          </h1>
          <p className="learn-deck">
            Kelly is the maths behind &ldquo;how much should I bet?&rdquo;. It
            sizes each stake as a fraction of your bankroll based on your
            edge on that bet. Most sharps use half of what full Kelly
            recommends, and there&rsquo;s a good reason for that.
          </p>

          <div className="learn-tldr">
            <p className="learn-tldr-label">TL;DR</p>
            <ul>
              <li>
                <strong>Kelly fraction = (odds × probability − 1) / (odds − 1)</strong>.
                Output is the % of bankroll to stake.
              </li>
              <li>
                <strong>No edge → Kelly says stake zero.</strong> Small edge →
                small stake. Big edge → big stake. Never bet without a
                probability estimate.
              </li>
              <li>
                <strong>Full Kelly maximises long-run growth</strong> but
                produces 30%+ drawdowns that most punters can&rsquo;t stomach.
              </li>
              <li>
                <strong>Half-Kelly is the practical default</strong>: keeps
                most of the growth advantage, roughly a quarter of the
                variance. Quarter-Kelly is even safer.
              </li>
              <li>
                <strong>Staking above 2× Kelly turns positive-edge betting
                into a losing strategy long-run.</strong> The maths is
                unforgiving.
              </li>
            </ul>
          </div>

          <section className="learn-section">
            <h2 className="learn-h2">The short definition</h2>
            <p>
              The Kelly criterion is a stake-sizing formula developed by
              John Kelly at Bell Labs in 1956. It takes two inputs — your
              estimated probability of winning and the odds on offer — and
              outputs the fraction of bankroll to stake that maximises
              long-run growth of the bankroll.
            </p>
            <p>
              For sports bettors, Kelly is the mathematical answer to
              &ldquo;how much should I bet on this?&rdquo;. It says: bet
              more when you have more edge, less when you have less, and
              nothing at all when you have none.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">The formula</h2>
            <p>
              For a decimal-odds bet, the Kelly stake as a fraction of
              bankroll is:
            </p>
            <div className="learn-formula">
              <code>
                Kelly % = (Odds × Win Probability &minus; 1) ÷ (Odds &minus; 1)
              </code>
            </div>
            <p>
              &ldquo;Win Probability&rdquo; here is <em>your</em> estimate of
              the true win chance, not the bookmaker&rsquo;s implied
              probability. If your estimate matches the bookmaker exactly,
              Kelly outputs zero (no edge). Positive Kelly = the market
              underprices your selection.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Worked example</h2>
            <p>
              Say you back Arsenal to beat Liverpool at odds of 2.20. Your
              honest estimate of Arsenal&rsquo;s win probability is 50%.
            </p>
            <div className="learn-formula">
              <code>
                Kelly % = (2.20 × 0.50 &minus; 1) ÷ (2.20 &minus; 1) = 0.10 ÷ 1.20 = 8.3 %
              </code>
            </div>
            <p>
              Full Kelly says stake 8.3% of your bankroll. On a £1,000
              bankroll that&rsquo;s £83.
            </p>
            <p>
              <strong>Half-Kelly cuts that to ~4.2%, or £42.</strong> This
              is where most experienced bettors sit. You lose about 25% of
              the theoretical growth rate but roughly a quarter of the
              variance, and you protect yourself against overestimating
              your edge — because your 50% estimate might actually be 47%,
              and full Kelly on a wrong estimate loses money fast.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Why almost no one uses full Kelly</h2>
            <p>
              Full Kelly is theoretically optimal — but only if your edge
              estimate is exactly right. In practice, two things go wrong:
            </p>
            <ul className="learn-list">
              <li>
                <strong>Estimation error.</strong> Real bettors don&rsquo;t
                know their edge exactly. You <em>think</em> Arsenal is
                50% but it might actually be 46%. Full Kelly on a
                4-percentage-point overestimate loses money long-run even
                though the maths of full Kelly says otherwise.
              </li>
              <li>
                <strong>Variance is brutal.</strong> Full Kelly produces
                drawdowns of 30–50% of bankroll routinely. Most punters
                tilt or quit before the strategy has time to work. Half-
                Kelly cuts that risk of ruin dramatically.
              </li>
            </ul>
            <p>
              Fractional Kelly (half, quarter, or even less) is what almost
              every sharp bettor with a real bankroll actually uses. The
              academic literature on Kelly explicitly recommends fractional
              Kelly for anyone whose edge estimate has non-zero error, which
              is everyone.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">The 2× Kelly cliff</h2>
            <p>
              A hard mathematical result: if you stake more than 2× the
              Kelly-recommended amount, your long-run bankroll growth turns
              negative <em>even if your edge is positive</em>. The variance
              overwhelms the edge and compounds you into the ground.
            </p>
            <p>
              This is why &ldquo;going big on my locks&rdquo; loses money
              for confident bettors who <em>do</em> have edge. Confidence
              isn&rsquo;t the same as edge; edge is what Kelly cares about;
              and Kelly punishes overbetting harder than it rewards
              correct sizing.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Related terms</h2>
            <ul className="learn-list learn-list--related">
              <li>
                <strong>
                  <Link href="/learn/bankroll-management">Bankroll management:</Link>
                </strong>{" "}
                the broader discipline of separating betting money from
                life money and sizing stakes consistently. Kelly is one
                specific staking method within bankroll management.
              </li>
              <li>
                <strong>
                  <Link href="/learn/expected-value">Expected Value (EV):</Link>
                </strong>{" "}
                the average profit per bet given the true probabilities.
                Kelly needs positive EV as input, otherwise it says stake
                zero.
              </li>
              <li>
                <strong>
                  <Link href="/learn/clv">CLV (Closing Line Value):</Link>
                </strong>{" "}
                the cleanest available measure of whether you have real
                edge. If you&rsquo;re not consistently beating the close,
                your Kelly stakes are probably built on estimation error.
              </li>
              <li>
                <strong>
                  <Link href="/learn/roc">ROC (Return on Capital):</Link>
                </strong>{" "}
                the honest bankroll-based return metric that respects
                stake-sizing decisions — the metric Kelly optimises.
              </li>
              <li>
                <strong>Risk of ruin:</strong> the probability of losing
                your entire bankroll. Kelly explicitly minimises this; full
                Kelly&rsquo;s risk of ruin is zero if edge is truly
                positive, but rises fast under estimation error.
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
                Kelly only works if you know your actual edge.
              </div>
              <div className="learn-cta-sub">
                Track your bets on {BRAND.name} and your yield, ROC, and
                CLV appear automatically. Real edge shows up in the numbers
                — then you can size correctly. Free, no credit card.
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
