// /learn/roc — Return on Capital. Fifth page in the glossary series,
// completes the ROI/ROC/Yield family alongside CLV and EV.
//
// SEO target: "what is ROC in betting" (low volume but zero
// competition), "return on capital sports betting", "ROC vs yield
// betting" — long-tail where a definitive definition page can rank
// quickly. Also cited from the ROI page as the resolution to the
// stake-vs-bankroll ambiguity.

import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "What is Return on Capital (ROC) in Sports Betting?",
  description:
    "ROC measures profit against the bankroll you actually deployed. The honest money-on-money number. Definition, formula, worked example. Free at Am I Up.",
  openGraph: {
    title: "What is Return on Capital (ROC) in Sports Betting?",
    description:
      "The bankroll-based return metric. Why serious bettors track ROC alongside yield.",
    type: "article",
  },
};

export default function RocPage() {
  const definedTermJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: "Return on Capital (ROC)",
    alternateName: ["ROC", "Return on Capital"],
    description:
      "Return on Capital in sports betting is total profit divided by the peak bankroll deployed, expressed as a percentage. Unlike yield (stake-based) it treats a betting operation like any other capital investment: how much money did the bankroll actually earn. Harder to compute than yield because bankroll size varies over time, but a more honest measure of how productively a bettor's money is working.",
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: `${BRAND.name} Sports Betting Glossary`,
      url: "https://amiup.io/learn",
    },
    url: "https://amiup.io/learn/roc",
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "What is Return on Capital (ROC) in Sports Betting?",
    description:
      "Definition, formula, worked example. Why ROC is the honest money-on-money return metric that yield hides.",
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
    mainEntityOfPage: "https://amiup.io/learn/roc",
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
            <span>ROC</span>
          </nav>

          <p className="learn-eyebrow">Betting analytics glossary</p>
          <h1 className="learn-title">
            What is Return on Capital{" "}
            <span className="learn-abbr">(ROC)</span>?
          </h1>
          <p className="learn-deck">
            ROC treats betting like any other capital investment: how
            much did the money you actually deployed earn you. Harder
            to compute than yield, more honest about whether the
            operation is worth your time.
          </p>

          <section className="learn-section">
            <h2 className="learn-h2">The short definition</h2>
            <p>
              Return on Capital (ROC) is total net profit divided by
              the bankroll you deployed, expressed as a percentage. If
              you set aside 100u to bet with and you finish the season
              up 27u, your ROC is 27%. Simple as that.
            </p>
            <p>
              This is the metric a finance-brained observer would
              actually care about. Not &ldquo;how many units did each
              stake earn on average&rdquo; (that&rsquo;s{" "}
              <Link href="/learn/yield">yield</Link>) but &ldquo;what
              was my percentage return on the pot I put at
              risk&rdquo;. The number you could compare against an
              index fund or a savings account without embarrassing
              yourself.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">The formula</h2>
            <div className="learn-formula">
              <code>ROC % = (Profit ÷ Bankroll Deployed) × 100</code>
            </div>
            <p>
              Profit is net (returns minus stakes). Bankroll deployed
              is the tricky bit. Three defensible ways to define it,
              in rising order of honesty:
            </p>
            <ul className="learn-list">
              <li>
                <strong>Starting bankroll:</strong> whatever pot you
                opened the tracking period with. Easy but flatters
                you if the bankroll grew mid-period.
              </li>
              <li>
                <strong>Peak bankroll:</strong> the highest running
                total during the period. This is the &ldquo;risk
                capital&rdquo; interpretation and is what most serious
                trackers use. It penalises leverage on a hot streak,
                which is the correct incentive.
              </li>
              <li>
                <strong>Time-weighted average bankroll:</strong> the
                textbook finance definition. Most accurate for
                comparing against traditional investments, but rarely
                worth the calculation effort for a hobbyist.
              </li>
            </ul>
            <p>
              {BRAND.name} uses the peak-drawdown-adjusted risk
              capital by default (the smallest bankroll you&rsquo;d
              have needed to survive your worst losing stretch) which
              is close to the peak-bankroll definition without
              rewarding lucky variance.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Worked example</h2>
            <p>
              Same bettor as the ROI page. 100u bankroll. 300 bets at
              1.5u average stake, so total stake = 450u. Net profit
              = 27u.
            </p>
            <ul className="learn-list">
              <li>Peak bankroll: 100u (assume no top-ups)</li>
              <li>ROC = 27 ÷ 100 = <strong>27%</strong></li>
            </ul>
            <p>
              Compare against{" "}
              <Link href="/learn/yield">yield</Link>, which comes out
              at 6% on the same season (27u profit ÷ 450u total
              stake). Same person, same trades, two very different
              headline numbers. The ROC-flavoured 27% is the number
              the bettor can defensibly compare against
              &ldquo;what if I&rsquo;d bought the S&amp;P 500 that
              year&rdquo;. The yield-flavoured 6% is the number a
              tipster shows off with.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Why serious bettors track ROC</h2>
            <ul className="learn-list">
              <li>
                <strong>Yield can hide bad staking.</strong> A
                cautious punter with 10u average stakes on a 10u
                bankroll is running dangerously overleveraged even if
                their yield is +5%. ROC surfaces this immediately by
                dividing profit against the actual bankroll they were
                risking, not the accumulated stake volume.
              </li>
              <li>
                <strong>ROC lets you compare against other asset
                classes.</strong> An index fund returned 10% this
                year. Was your betting operation actually worth the
                time it took? ROC is the number that answers that.
                Yield can&rsquo;t.
              </li>
              <li>
                <strong>ROC exposes churn.</strong> A bettor who
                turns their bankroll over 20 times a year with a 3%
                yield is generating a 60% ROC before variance. A
                bettor with the same yield turning over once a year
                is generating 3%. Same yield, wildly different
                capital efficiency. ROC catches this.
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Where ROC gets misleading</h2>
            <ul className="learn-list">
              <li>
                <strong>It rewards under-stated bankrolls.</strong> A
                tipster who reports a bankroll of 20u while regularly
                staking 5u per bet is claiming an ROC based on a
                bankroll they&rsquo;d bust every second bad month.
                Always check whether the claimed bankroll would
                actually have survived the drawdowns.
              </li>
              <li>
                <strong>Bankroll size is squishy.</strong> Deposits,
                withdrawals, promotional credit, and interest all
                shift the number. Some tools smooth this by using a
                risk-capital-adjusted denominator (the smallest
                bankroll you&rsquo;d have needed to weather your
                worst stretch), which is more honest but harder to
                explain in one line.
              </li>
              <li>
                <strong>Small samples still lie.</strong> ROC is a
                historical measure just like yield. A 40% ROC over
                50 bets tells you very little about whether the
                bettor has an edge. Look at{" "}
                <Link href="/learn/clv">CLV</Link> for the sharper
                signal.
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">
              ROC benchmarks (1000+ bet samples)
            </h2>
            <p>
              Very approximate. Depends on staking style, sport, and
              turnover rate. Meant as a sanity check, not a target.
            </p>
            <ul className="learn-list">
              <li>
                <strong>Negative:</strong> the honest answer for the
                majority of bettors, including many who report
                positive yields on small samples.
              </li>
              <li>
                <strong>0 &mdash; 10%:</strong> in the ballpark of
                what a savings account or index tracker returns.
                Worth asking whether the time investment is paying
                off.
              </li>
              <li>
                <strong>10 &mdash; 30%:</strong> genuinely
                outperforming most passive alternatives. Where a
                skilled hobbyist with real edge lands.
              </li>
              <li>
                <strong>30%+:</strong> professional territory. Also
                where you should start seriously questioning survival
                bias, stake-cap dodges, and whether the sample is big
                enough.
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
                the stake-based cousin. Higher throughput on the same
                bankroll drives ROC up while yield stays flat.
              </li>
              <li>
                <strong>
                  <Link href="/learn/roi">Return on Investment (ROI):</Link>
                </strong>{" "}
                often used as a synonym for either yield or ROC. Always
                check which denominator the source means.
              </li>
              <li>
                <strong>
                  <Link href="/learn/clv">Closing Line Value (CLV):</Link>
                </strong>{" "}
                the forward-looking signal of edge. If ROC is the
                answer to &ldquo;did I make money&rdquo;, CLV is the
                answer to &ldquo;am I making good decisions&rdquo;.
              </li>
              <li>
                <strong>
                  <Link href="/learn/expected-value">Expected Value (EV):</Link>
                </strong>{" "}
                the theoretical per-bet return underneath any
                profitable strategy.
              </li>
            </ul>
          </section>

          {/* CTA */}
          <section className="learn-cta">
            <div>
              <div className="learn-cta-title">
                See your ROC on the dashboard.
              </div>
              <div className="learn-cta-sub">
                {BRAND.name} reports ROC alongside yield with the
                risk-capital denominator surfaced explicitly, so you
                can see how much your money was working versus how
                much it was churning. Free, no credit card.
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
            <Link href="/learn/roi">What is ROI?</Link>
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
