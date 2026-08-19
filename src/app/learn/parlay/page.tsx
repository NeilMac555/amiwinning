// /learn/parlay — the parlay explainer.
//
// SEO target: highest-volume query in the education cluster we haven't
// covered. "What is a parlay in sports betting" ~15k/mo, "parlay
// meaning" ~5k/mo, "parlay odds" ~3k/mo, "same game parlay explained"
// ~2k/mo, "parlay calculator" ~8k/mo. Casual-bettor gateway query —
// Kelly and bankroll are power-user terms, parlay is the front door.
//
// Format matches the rest of the /learn cluster. Four schema types.

import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { buildBreadcrumbList } from "@/lib/breadcrumb-schema";
import { LearnAuthor } from "@/components/LearnAuthor";

export const metadata: Metadata = {
  alternates: { canonical: "/learn/parlay" },
  title: "What is a Parlay in Sports Betting? Odds, math, why they lose.",
  description:
    "A parlay combines multiple bets into one ticket where every leg must win. Higher payout, dramatically lower win probability. Formula, worked example, why sportsbooks push them, and how same game parlays work.",
  openGraph: {
    title: "What is a Parlay in Sports Betting?",
    description:
      "How parlays work, the math against you, same game parlays, teasers, round robins. Plain-English explainer.",
    type: "article",
  },
};

const LAST_UPDATED = "2026-08-17";

export default function ParlayPage() {
  const definedTermJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: "Parlay",
    alternateName: [
      "Accumulator",
      "Acca",
      "Multi-bet",
      "Same Game Parlay",
      "SGP",
      "Bet Builder",
    ],
    description:
      "A parlay is a single bet that combines two or more selections into one ticket. Every leg must win for the parlay to pay out. If one leg loses, the entire parlay loses. The combined odds are the product of the individual leg odds, which produces a much higher payout than the equivalent stakes placed as separate bets — but also a much lower probability of winning.",
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: `${BRAND.name} Sports Betting Glossary`,
      url: "https://amiup.io/learn",
    },
    url: "https://amiup.io/learn/parlay",
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "What is a Parlay in Sports Betting? Odds, math, why they lose.",
    description:
      "How parlays work, the math against you, same game parlays, teasers, round robins.",
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
    mainEntityOfPage: "https://amiup.io/learn/parlay",
    datePublished: "2026-08-17",
    dateModified: LAST_UPDATED,
  };

  const faqItems: Array<{ q: string; a: string }> = [
    {
      q: "What is a parlay in sports betting?",
      a: "A parlay is a single bet that combines two or more selections into one ticket. Every leg must win for the parlay to pay out. If one leg loses, the whole parlay loses. Combined odds are the product of the individual leg odds, so a 4-leg parlay of −110 favourites pays around +1228 (13.28 to 1) instead of the small individual returns you'd get placing four separate bets.",
    },
    {
      q: "How are parlay odds calculated?",
      a: "In decimal odds, multiply the odds of each leg together. Three legs at 2.00 each: 2.00 × 2.00 × 2.00 = 8.00 (or +700 in American). In American odds you convert each to decimal, multiply, then convert back. The key point: your effective true probability is roughly the product of each leg's true probability — which means adding legs shrinks your win chance geometrically while only growing the payout linearly enough to look attractive.",
    },
    {
      q: "What is a same game parlay (SGP)?",
      a: "A same game parlay combines multiple picks from the SAME game — e.g. Lakers moneyline + LeBron over 25.5 points + Over 224.5. Regular parlays combine picks from DIFFERENT games. SGPs are a newer product (post-2018) that all major US sportsbooks push heavily because the individual legs are correlated (LeBron scoring more makes a Lakers win more likely), which the book prices as if they were independent — creating an even bigger edge for the house than a straight parlay.",
    },
    {
      q: "Why do sportsbooks love parlays?",
      a: "The bookmaker's built-in margin (vig) compounds across legs. On a 4-leg parlay of −110 favourites, the theoretical fair payout is +1500 but the book pays around +1228 — a house edge of roughly 22% compared to the ~4.5% on a single −110 bet. Add more legs and it gets worse. This is why every sportsbook homepage pushes 6-leg SGP promos: they're the highest-margin product on the menu.",
    },
    {
      q: "Are parlays ever a good bet?",
      a: "Very rarely. In principle if every individual leg is +EV (better than the true probability implies), the parlay is +EV too. But this is extremely rare in practice because parlays compound both edge AND vig — and vig usually wins. Correlated parlays (like SGPs) can sometimes be exploitable when the book mis-prices the correlation, but this is niche and books close those angles fast. For 99% of bettors, parlays are entertainment, not investment.",
    },
    {
      q: "What is a teaser?",
      a: "A teaser is a parlay where you get to move the point spread in your favour on every leg — for example, adding 6 points to every NFL side. In exchange the payout is much lower than a standard parlay of the same legs. Teasers can be +EV in specific spots (Wong teasers around key numbers like 3 and 7 in the NFL), but the general form pushed by sportsbook apps is negative EV like a standard parlay.",
    },
    {
      q: "What is a round robin?",
      a: "A round robin is a bundle of smaller parlays that covers every combination of your selections. A 3-team round robin (Team A, Team B, Team C) buys you three 2-leg parlays: A+B, A+C, B+C. You still lose money if enough legs miss, but you don't need ALL of them to hit — a nice feature at the cost of higher total stake. Same-underlying-vig math applies.",
    },
    {
      q: "How does a parlay show up in a bet tracker?",
      a: "A parlay should be logged as ONE bet — one row, market='parlay', selection summarising the legs (e.g. '3-leg SGP: Lakers ML + LeBron o25.5 + Over 224.5'), odds equal to the combined price, stake equal to the total staked. A single status (won/lost) covers the whole ticket. Splitting a parlay into separate single-bet rows corrupts your yield and win rate for both categories.",
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
    { name: "Parlay", url: "https://amiup.io/learn/parlay" },
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
            <span>Parlay</span>
          </nav>

          <p className="learn-eyebrow">Betting analytics glossary</p>
          <h1 className="learn-title">
            What is a parlay in sports betting?
          </h1>
          <LearnAuthor lastUpdated={LAST_UPDATED} />
          <p className="learn-deck">
            The most popular product on every US sportsbook app, and the one
            with the biggest edge for the house. Understanding the math
            behind parlays is the difference between betting for entertainment
            and betting to win.
          </p>

          <div className="learn-tldr">
            <p className="learn-tldr-label">TL;DR</p>
            <ul>
              <li>
                <strong>A parlay combines 2+ picks into one ticket.</strong>
                {" "}Every leg must win. One losing leg = the whole ticket
                loses.
              </li>
              <li>
                <strong>Combined odds = product of the leg odds</strong>{" "}
                in decimal. 3 × 2.00 legs = 8.00 combined (+700 American).
              </li>
              <li>
                <strong>Same game parlay (SGP)</strong> = multiple picks
                from ONE game. The book prices the legs as if independent,
                but they're correlated — bigger house edge.
              </li>
              <li>
                <strong>House edge compounds per leg.</strong> A 4-leg
                parlay of −110 favourites carries a ~22% house edge vs
                ~4.5% on a single −110 bet.
              </li>
              <li>
                <strong>Log parlays as ONE bet</strong> in your tracker —
                one row, combined price, single status. Splitting them
                into separate legs corrupts your yield and win rate.
              </li>
            </ul>
          </div>

          <section className="learn-section">
            <h2 className="learn-h2">The short definition</h2>
            <p>
              A parlay is a single bet that combines two or more separate
              selections into one ticket. All of them have to win. If any
              one leg loses, the entire parlay loses and you get nothing
              back — even if the other four legs hit.
            </p>
            <p>
              The appeal is obvious: you can turn a $10 stake into a
              $1,000 payout with the right 5 picks. The catch is equally
              obvious once you look at the math — your probability of
              cashing shrinks much faster than the payout grows.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">The formula</h2>
            <p>
              In decimal odds, parlay odds are just the product of each
              leg&rsquo;s decimal odds:
            </p>
            <div className="learn-formula">
              <code>
                Parlay Odds = Leg 1 × Leg 2 × … × Leg N
              </code>
            </div>
            <p>
              American odds require conversion to decimal first. A −110
              price is 1.909 in decimal; +200 is 3.00; +150 is 2.50.
              Multiply the decimals, convert back if needed.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Worked example — 4-leg NFL parlay</h2>
            <p>
              You take four NFL sides, all at −110 (the standard vig-baked
              price):
            </p>
            <ul className="learn-list">
              <li>Chiefs −3.5 · −110 · decimal 1.909</li>
              <li>Bills ML · −110 · decimal 1.909</li>
              <li>49ers −7 · −110 · decimal 1.909</li>
              <li>Ravens over 44.5 · −110 · decimal 1.909</li>
            </ul>
            <div className="learn-formula">
              <code>
                1.909 × 1.909 × 1.909 × 1.909 = 13.28
              </code>
            </div>
            <p>
              Combined odds are 13.28 in decimal, or roughly <strong>+1228
              in American</strong>. A $10 stake pays $122.80 profit if
              every leg hits.
            </p>
            <p>
              <strong>The catch:</strong> if each leg is a true 50/50 (which
              −110 implies before vig), your probability of hitting all four
              is 0.5<sup>4</sup> = 6.25%. Fair odds on a 6.25% chance are
              +1500 (16.00 decimal). The book pays you +1228. That gap —
              +1500 fair vs +1228 actual — is a <strong>~22% house edge
              baked into this specific parlay</strong>. A single −110 bet
              has ~4.5% house edge. Four legs multiplies it.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Same game parlays (SGPs)</h2>
            <p>
              A same game parlay combines multiple picks from the SAME
              game. For example: Lakers ML + LeBron over 25.5 points +
              Lakers-Warriors over 224.5. A newer product (rolled out
              across US sportsbooks post-2018) and now the biggest promo
              category on every major book.
            </p>
            <p>
              The math is even worse for the bettor than a standard parlay.
              The legs are <em>correlated</em> — if LeBron scores more,
              the Lakers are more likely to win, and the total is more
              likely to go over. But the sportsbook prices each leg as if
              it were independent, then applies parlay math. The result is
              a house edge that can exceed <strong>30-40%</strong> on
              popular SGP combos.
            </p>
            <p>
              Every sportsbook homepage in the US pushes 6-leg SGPs with
              boosted odds because it&rsquo;s their highest-margin
              product. When a book &ldquo;boosts&rdquo; a +2500 SGP to
              +3000, the true fair price was probably +5000 — the boost
              looks generous but still favours the house heavily.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Related products</h2>
            <ul className="learn-list">
              <li>
                <strong>Teaser:</strong> a parlay where you move the point
                spread in your favour on every leg (typically 6, 6.5, or
                7 points in NFL / 4-5 in NBA) in exchange for a lower
                combined payout. Almost always negative EV outside a few
                specific &ldquo;Wong teaser&rdquo; spots around key
                numbers (3, 7 in NFL).
              </li>
              <li>
                <strong>Round Robin:</strong> a bundle of smaller parlays
                covering every combination of your picks. A 4-team round
                robin of 2-leg parlays gives you 6 tickets (every pair).
                You don&rsquo;t need all legs to hit — but the total stake
                is higher and the underlying vig math is identical.
              </li>
              <li>
                <strong>Progressive Parlay (PP):</strong> a parlay that
                still pays out (at reduced odds) even if 1 or 2 legs miss.
                Marketing spin on what is functionally a lower-vol form of
                round-robin. Also negative EV.
              </li>
              <li>
                <strong>Accumulator / Acca:</strong> UK/EU terminology for
                a parlay. Same product, different name.
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Are parlays ever a good bet?</h2>
            <p>
              Rarely. In principle, if every leg is <em>positive expected
              value</em> against the true probability, the parlay is +EV
              too. But this is uncommon in practice for three reasons:
            </p>
            <ul className="learn-list">
              <li>
                Parlays compound both edge AND vig. Vig usually wins.
              </li>
              <li>
                Retail bettors don&rsquo;t typically identify multiple
                genuine +EV legs at once. Most parlays combine coin flips
                with a small negative edge on each.
              </li>
              <li>
                Sportsbooks close obvious correlated-SGP angles quickly.
                The rare +EV SGP is a fleeting product bug, not a
                repeatable strategy.
              </li>
            </ul>
            <p>
              The honest framing: parlays are entertainment products with
              lottery-style payouts. Betting them for fun is fine.
              Building a strategy around them at scale loses money over
              any meaningful sample.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Related terms</h2>
            <ul className="learn-list learn-list--related">
              <li>
                <strong>
                  <Link href="/learn/expected-value">Expected Value (EV):</Link>
                </strong>{" "}
                the average per-bet profit given the true probabilities.
                Parlay EV = the product of the individual EVs, which is
                usually more negative than each single leg&rsquo;s EV.
              </li>
              <li>
                <strong>
                  <Link href="/learn/devigging">Devigging:</Link>
                </strong>{" "}
                the technique for stripping bookmaker margin out of odds.
                Applied to parlays it shows just how much house edge is
                baked into every extra leg.
              </li>
              <li>
                <strong>
                  <Link href="/learn/positive-ev-betting">Positive EV betting:</Link>
                </strong>{" "}
                the strategy of only placing +EV bets. Almost never
                includes standard parlays; sometimes includes a specific
                correlated SGP.
              </li>
              <li>
                <strong>
                  <Link href="/learn/kelly-criterion">Kelly Criterion:</Link>
                </strong>{" "}
                the stake-sizing formula. Recommends near-zero stake on
                parlays because their positive-EV ceiling is so rarely
                cleared.
              </li>
              <li>
                <strong>
                  <Link href="/learn/bankroll-management">Bankroll management:</Link>
                </strong>{" "}
                parlays are a bankroll-blowup risk if sized like straight
                bets — the low win rate produces long losing streaks even
                when you have edge.
              </li>
              <li>
                <strong>
                  <Link href="/learn/yield">Yield</Link>
                </strong>{" "}
                and{" "}
                <strong>
                  <Link href="/learn/clv">CLV:</Link>
                </strong>{" "}
                the metrics you use to check whether your parlays are
                actually beating the closing line. If yield on your parlay
                book is negative over 200+ tickets, they&rsquo;re losing
                you money regardless of how many hits you remember.
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
                Log your parlays as one ticket, not separate legs.
              </div>
              <div className="learn-cta-sub">
                {BRAND.name} recognises parlays (including SGPs and bet
                builders from DraftKings, FanDuel, BetMGM) and logs each
                as one bet with the combined odds — so your yield and win
                rate stay accurate. Free, no credit card.
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
