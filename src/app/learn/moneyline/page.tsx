// /learn/moneyline — the moneyline explainer.
//
// SEO target: highest-volume single US gateway query in the education
// cluster we haven't covered. "What is a moneyline bet" ~40k/mo,
// "moneyline meaning" ~15k/mo, "how does moneyline work" ~8k/mo,
// "+150 meaning" ~5k/mo, "-110 meaning" ~4k/mo. First search every
// new US sportsbook user makes.
//
// Format matches the rest of /learn. Four schema types.

import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { buildBreadcrumbList } from "@/lib/breadcrumb-schema";
import { LearnAuthor } from "@/components/LearnAuthor";

const LAST_UPDATED = "2026-09-01";

export const metadata: Metadata = {
  alternates: { canonical: "/learn/moneyline" },
  title: "What is a Moneyline Bet? Odds, math, favorites vs underdogs.",
  description:
    "A moneyline bet picks the outright winner — no point spread, no total. Definition, how American odds work (+150 vs −110), how to calculate the payout, favorites vs underdogs, when to take one instead of a spread.",
  openGraph: {
    title: "What is a Moneyline Bet?",
    description:
      "Plain-English explainer. American odds, favorites vs underdogs, break-even math, when moneylines beat spreads.",
    type: "article",
  },
};

export default function MoneylinePage() {
  const definedTermJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: "Moneyline Bet",
    alternateName: ["Moneyline", "ML", "Match Odds", "Match Winner", "1X2"],
    description:
      "A moneyline bet is a wager on which side wins a game outright, with no point spread. Odds are typically expressed in American format: a positive number (+150) is the underdog and shows how much profit a $100 stake would return; a negative number (−140) is the favorite and shows how much you must stake to win $100. Moneylines are the simplest bet type on US sportsbooks and the building block for parlays.",
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: `${BRAND.name} Sports Betting Glossary`,
      url: "https://amiup.io/learn",
    },
    url: "https://amiup.io/learn/moneyline",
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "What is a Moneyline Bet? Odds, math, favorites vs underdogs.",
    description:
      "American odds explained, favorites vs underdogs, break-even math, when to take a moneyline instead of a spread.",
    author: {
      "@type": "Person",
      "@id": "https://amiup.io/author/neil-macdonald#person",
      name: "Neil Macdonald",
      url: "https://amiup.io/author/neil-macdonald",
    },
    publisher: {
      "@type": "Organization",
      name: BRAND.name,
      url: "https://amiup.io",
    },
    mainEntityOfPage: "https://amiup.io/learn/moneyline",
    datePublished: "2026-08-17",
    dateModified: LAST_UPDATED,
  };

  const faqItems: Array<{ q: string; a: string }> = [
    {
      q: "What is a moneyline bet in sports betting?",
      a: "A moneyline bet is a wager on which team or player wins a game outright — no point spread, no total, no props. If the team you back wins by any margin, you win. If they lose or the game ties (in a sport that allows ties), you lose.",
    },
    {
      q: "What does +150 mean on a moneyline?",
      a: "+150 is an American-odds price for an underdog. A $100 stake wins $150 profit if the pick hits ($250 total returned). In decimal odds that's 2.50. Positive numbers always mean underdog; the further above zero, the bigger the underdog.",
    },
    {
      q: "What does −110 mean on a moneyline?",
      a: "−110 is an American-odds price for a slight favorite. You have to stake $110 to win $100 profit ($210 total returned). In decimal odds that's 1.909. Negative numbers always mean favorite; the further below zero (more negative), the heavier the favorite.",
    },
    {
      q: "How do you calculate a moneyline payout?",
      a: "For positive American odds (+150), profit = stake × (odds / 100). $50 × (150 / 100) = $75 profit. For negative American odds (−140), profit = stake × (100 / abs(odds)). $50 × (100 / 140) = $35.71 profit. Or convert to decimal odds first: positive → (odds/100)+1; negative → (100/abs(odds))+1. Then profit = stake × (decimal − 1).",
    },
    {
      q: "Moneyline vs point spread — which is better?",
      a: "Depends on the game. Moneyline pays less on favorites (you need to stake more to win the same), but you don't have to worry about margin of victory. Spreads give you more balanced pricing but you need your team to cover, not just win. Moneylines are cleaner for big underdogs and pick'em matchups where the spread is close to zero anyway.",
    },
    {
      q: "What is the break-even win rate for a moneyline?",
      a: "Convert to decimal odds and divide 1 by the decimal. At −110 (1.909 decimal), break-even is 1 / 1.909 = 52.4% — you need to win 52.4% of your bets to break even after vig. At +150 (2.50), break-even is 1 / 2.50 = 40%. At −250 (1.40), break-even is 71.4%.",
    },
    {
      q: "Why do moneylines have vig if it's a straight winner bet?",
      a: "The book prices both sides slightly worse than fair to guarantee a margin. On a true 50/50 game, fair odds are +100 / +100 (2.00 decimal each). A book prices it −110 / −110 instead — that ~4.5% gap between fair and priced odds is the vig. You pay it whether you take the favorite or the underdog. It's why beating the moneyline long-term requires a real edge, not just picking winners.",
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
    { name: "Moneyline", url: "https://amiup.io/learn/moneyline" },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="learn-page">
        <header className="legal-topbar">
          <Link href="/" className="brand" style={{ textDecoration: "none" }}>
            <div className="brand-mark" aria-hidden="true"></div>
            <span>{BRAND.name}</span>
          </Link>
          <Link href="/sign-in" className="btn-primary" style={{ padding: "7px 16px", fontSize: 13, textDecoration: "none" }}>
            Track your bets free →
          </Link>
        </header>

        <main className="learn-main">
          <nav className="learn-crumbs" aria-label="Breadcrumb">
            <Link href="/">Am I Up</Link>
            <span>›</span>
            <Link href="/learn">Glossary</Link>
            <span>›</span>
            <span>Moneyline</span>
          </nav>

          <p className="learn-eyebrow">Betting analytics glossary</p>
          <h1 className="learn-title">What is a moneyline bet?</h1>
          <LearnAuthor lastUpdated={LAST_UPDATED} />
          <p className="learn-deck">
            The simplest bet in sports betting. Pick who wins, collect if
            they do. No margin of victory, no spread to cover, no total to
            beat. The first bet type every US sportsbook user places — and
            the building block for every parlay.
          </p>

          <div className="learn-tldr">
            <p className="learn-tldr-label">TL;DR</p>
            <ul>
              <li>
                <strong>Pick who wins outright.</strong> No spread, no
                total, no props.
              </li>
              <li>
                <strong>American odds:</strong> <strong>+150</strong> = underdog
                ($100 stake wins $150). <strong>−140</strong> = favorite (must
                stake $140 to win $100).
              </li>
              <li>
                <strong>Break-even at −110 is 52.4%.</strong> That&rsquo;s
                what the vig costs you.
              </li>
              <li>
                <strong>Cleanest bet type for big underdogs</strong> and
                pick&rsquo;em matchups where the spread barely applies.
              </li>
              <li>
                <strong>The building block for parlays</strong> — most
                parlay legs are moneylines.
              </li>
            </ul>
          </div>

          <section className="learn-section">
            <h2 className="learn-h2">The short definition</h2>
            <p>
              A moneyline bet picks the outright winner of a game. If your
              team wins by 1 or by 40, you win the bet. If they lose or the
              game ties (in a sport that allows ties, like soccer), you
              lose. That&rsquo;s it — no margin, no total, no covering a
              spread.
            </p>
            <p>
              Every US sportsbook lists moneyline as one of the first three
              options on any game screen, alongside the point spread and
              the over/under total. It&rsquo;s the entry-level bet and it
              stays useful all the way up to sharp betting because it
              removes one variable (margin) from the analysis.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Reading American odds</h2>
            <p>
              US sportsbooks price moneylines in American format. The sign
              tells you favorite or underdog; the number tells you the
              math.
            </p>
            <ul className="learn-list">
              <li>
                <strong>Positive (+) = underdog.</strong> The number is
                the profit on a $100 stake. <strong>+150</strong> means a
                $100 stake wins $150 (total returned $250). <strong>+400</strong>
                means a $100 stake wins $400 (total returned $500). Bigger
                positive = bigger underdog.
              </li>
              <li>
                <strong>Negative (−) = favorite.</strong> The number is
                the stake needed to win $100. <strong>−140</strong>{" "}
                means you have to stake $140 to win $100 (total returned
                $240). <strong>−300</strong> means you have to stake $300
                to win $100. Bigger negative = heavier favorite.
              </li>
              <li>
                A game priced <strong>−110 / −110</strong> (both sides at
                −110) is the closest thing to a coin-flip pricing —
                sportsbooks call this &ldquo;pick&rsquo;em.&rdquo;
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Payout math</h2>
            <p>Two formulas cover everything:</p>
            <div className="learn-formula">
              <code>
                Positive: profit = stake × (odds ÷ 100)
                <br />
                Negative: profit = stake × (100 ÷ |odds|)
              </code>
            </div>
            <p>
              Or convert to decimal odds and use one formula. Positive
              American: decimal = (odds ÷ 100) + 1. Negative American:
              decimal = (100 ÷ |odds|) + 1. Then profit = stake × (decimal − 1).
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Worked example</h2>
            <p>
              You take the Chiefs on the moneyline at <strong>−165</strong>{" "}
              (a moderate favorite). Stake: $100.
            </p>
            <div className="learn-formula">
              <code>Profit = 100 × (100 ÷ 165) = $60.61</code>
            </div>
            <p>If the Chiefs win by any margin, you get back $160.61 (your $100 stake + $60.61 profit).</p>
            <p>
              Same game, other side: opponent at <strong>+140</strong>.
              Stake $100.
            </p>
            <div className="learn-formula">
              <code>Profit = 100 × (140 ÷ 100) = $140</code>
            </div>
            <p>If the opponent wins, you get back $240 ($100 stake + $140 profit).</p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Break-even win rate</h2>
            <p>
              To know if a moneyline is a good bet you need to know how
              often it must hit just to break even. Convert to decimal
              odds and divide 1 by the decimal:
            </p>
            <ul className="learn-list">
              <li><strong>−110</strong> (1.909 decimal) → break-even <strong>52.4%</strong></li>
              <li><strong>−140</strong> (1.714 decimal) → break-even <strong>58.3%</strong></li>
              <li><strong>−200</strong> (1.500 decimal) → break-even <strong>66.7%</strong></li>
              <li><strong>+100</strong> (2.000 decimal) → break-even <strong>50.0%</strong></li>
              <li><strong>+150</strong> (2.500 decimal) → break-even <strong>40.0%</strong></li>
              <li><strong>+300</strong> (4.000 decimal) → break-even <strong>25.0%</strong></li>
            </ul>
            <p>
              The gap between what the book prices and what fair pricing
              would be is the <strong>vig</strong> — usually ~4-5% on
              standard moneylines. See{" "}
              <Link href="/learn/devigging">devigging</Link> for how to
              strip vig out of a sharp market&rsquo;s price to get a
              cleaner true-probability estimate.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">When to take a moneyline over a spread</h2>
            <ul className="learn-list">
              <li>
                <strong>Big underdog</strong> — a +350 moneyline pays 3.5×
                stake, while covering a +10 spread pays roughly the same
                as coverage requires losing by fewer than 10. The pure
                upset play is usually cleaner on the moneyline.
              </li>
              <li>
                <strong>Pick&rsquo;em game</strong> — when the spread is
                −1 or +1, the moneyline and spread are essentially the
                same bet. Take whichever price is better after devig.
              </li>
              <li>
                <strong>Sports without a natural spread</strong> — tennis,
                boxing, MMA, and most soccer betting outside 1X2 lean on
                moneylines because the games don&rsquo;t have a
                margin-of-victory scoreboard to spread against.
              </li>
              <li>
                <strong>When you have a strong &ldquo;team X wins&rdquo;
                read but no confidence in the margin.</strong> The
                moneyline pays you for the read you actually have.
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Related terms</h2>
            <ul className="learn-list learn-list--related">
              <li>
                <strong><Link href="/learn/point-spread">Point spread:</Link></strong>{" "}
                the other main way to bet a game. Levels the field by
                giving one side a head-start (or a handicap) so both prices
                sit near −110.
              </li>
              <li>
                <strong><Link href="/learn/over-under-betting">Over/under (totals):</Link></strong>{" "}
                the third main bet on any game — combined score of both
                teams over or under a number.
              </li>
              <li>
                <strong><Link href="/learn/parlay">Parlay:</Link></strong>{" "}
                combine multiple moneylines (or spreads / totals) into one
                ticket for a bigger payout. Every leg must win.
              </li>
              <li>
                <strong><Link href="/learn/devigging">Devigging:</Link></strong>{" "}
                stripping the vig out of a moneyline pair to see the
                market&rsquo;s true implied probability. Required for
                +EV analysis.
              </li>
              <li>
                <strong><Link href="/learn/expected-value">Expected Value (EV):</Link></strong>{" "}
                the metric that tells you if a moneyline price is
                actually good compared to true odds.
              </li>
              <li>
                <strong><Link href="/learn/clv">CLV (Closing Line Value):</Link></strong>{" "}
                the diagnostic for whether your moneyline picks are
                actually beating the market — measured against the
                closing moneyline at a sharp book.
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Frequently asked questions</h2>
            {faqItems.map((item, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px", color: "var(--text)" }}>{item.q}</h3>
                <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.55 }}>{item.a}</p>
              </div>
            ))}
          </section>

          <section className="learn-cta">
            <div>
              <div className="learn-cta-title">Track every moneyline you place.</div>
              <div className="learn-cta-sub">
                Paste any bet slip from DraftKings, FanDuel, BetMGM, Caesars
                — {BRAND.name} logs it automatically with the right odds,
                stake, and result. Free, no credit card.
              </div>
            </div>
            <Link href="/sign-in" className="btn-primary" style={{ padding: "12px 22px", fontSize: 15, textDecoration: "none" }}>
              Start tracking &rarr;
            </Link>
          </section>

          <footer className="learn-foot">
            <Link href="/">Back to {BRAND.name}</Link>
            <Link href="/learn">Glossary</Link>
            <Link href="/sample">Sample profile</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </footer>
        </main>
      </div>
    </>
  );
}
