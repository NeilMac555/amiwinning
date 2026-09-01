// /learn/point-spread — the point spread explainer.
//
// SEO target: "what is a point spread" ~25k/mo, "point spread meaning"
// ~10k/mo, "how does the spread work in betting" ~6k/mo, "cover the
// spread" ~5k/mo, "half point key numbers NFL" ~2k/mo. Second-highest
// US gateway query after moneyline.

import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { buildBreadcrumbList } from "@/lib/breadcrumb-schema";
import { LearnAuthor } from "@/components/LearnAuthor";

const LAST_UPDATED = "2026-09-01";

export const metadata: Metadata = {
  alternates: { canonical: "/learn/point-spread" },
  title: "What is a Point Spread? Cover, push, key numbers explained.",
  description:
    "A point spread balances a lopsided game by giving the underdog a head-start. Covering, pushing, the hook (.5), key numbers 3 and 7 in the NFL, why the spread is nearly always priced at −110. Plain-English explainer for US bettors.",
  openGraph: {
    title: "What is a Point Spread in Sports Betting?",
    description:
      "How covering works, key numbers, half-point hooks, why the spread is almost always −110.",
    type: "article",
  },
};

export default function PointSpreadPage() {
  const definedTermJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: "Point Spread",
    alternateName: ["Spread", "Handicap", "Line", "ATS (Against the Spread)"],
    description:
      "A point spread is a handicap the sportsbook applies to the favored team in a game. The favorite must win by MORE than the spread; the underdog can lose by less than the spread (or win outright) and still cash. The book prices both sides near −110 so the payout is roughly the same either way. Key numbers (3 and 7 in the NFL) matter because most game margins land on them.",
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: `${BRAND.name} Sports Betting Glossary`,
      url: "https://amiup.io/learn",
    },
    url: "https://amiup.io/learn/point-spread",
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "What is a Point Spread? Cover, push, key numbers explained.",
    description:
      "Covering the spread, pushes, the hook (.5), key numbers in the NFL and NBA, why point spreads sit at −110.",
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
    mainEntityOfPage: "https://amiup.io/learn/point-spread",
    datePublished: "2026-08-17",
    dateModified: LAST_UPDATED,
  };

  const faqItems: Array<{ q: string; a: string }> = [
    {
      q: "What is a point spread in sports betting?",
      a: "A point spread is a handicap the sportsbook applies to the favored team. The favorite must win by MORE than the spread to cover; the underdog can lose by less than the spread (or win outright) and still win the bet. It exists to make lopsided games interesting to bet on and to balance the pricing so both sides sit near −110.",
    },
    {
      q: "What does −3.5 mean on a point spread?",
      a: "−3.5 is the favorite giving 3.5 points. If you bet the favorite at −3.5, they must win by 4 or more for you to cover. The .5 is called a hook — it removes the possibility of a push (a tie against the spread) that would happen if the spread were a whole number the game actually landed on.",
    },
    {
      q: "What does +3.5 mean on a point spread?",
      a: "+3.5 is the underdog getting 3.5 points. If you bet the underdog at +3.5, they can lose by 3 or less (or win outright) and you cash. Same game as the favorite at −3.5, opposite side of the ticket.",
    },
    {
      q: "What is a push in point spread betting?",
      a: "A push happens when the final margin lands exactly on the spread. Chiefs −7 covers if they win by 8 or more, loses if they win by 6 or less, and pushes if they win by exactly 7. On a push you get your stake back — no profit, no loss. Sportsbooks use half-point hooks (−7.5 instead of −7) to eliminate push possibilities on juiced lines.",
    },
    {
      q: "Why is the point spread almost always −110?",
      a: "The book sets the spread number so both sides attract roughly equal action, then prices both sides at −110 to build in vig. At −110 each side, break-even is 52.4% — you need to win 52.4% of your spread bets to break even after vig. The 4.5% gap between fair (50%) and required (52.4%) is the house edge.",
    },
    {
      q: "What are the key numbers in NFL point spread betting?",
      a: "3 and 7 are the most common final margins in the NFL because of field-goal and touchdown scoring. Roughly 15% of NFL games are decided by exactly 3, ~9% by exactly 7. Buying a half-point around these numbers (moving −3 to −2.5, or +3 to +3.5) is worth more than the usual half-point premium. This is the math behind Wong teasers.",
    },
    {
      q: "Spread vs moneyline — which should I bet?",
      a: "Take the spread when you like a favorite but they need to win convincingly, or when you think an underdog will keep it close. Take the moneyline when you like a big underdog outright, when the spread is close to zero (pick'em), or in sports without natural point spreads (tennis, MMA, most soccer). Neither is universally better — they're two different questions about the same game.",
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
    { name: "Point Spread", url: "https://amiup.io/learn/point-spread" },
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
            <span>Point Spread</span>
          </nav>

          <p className="learn-eyebrow">Betting analytics glossary</p>
          <h1 className="learn-title">What is a point spread?</h1>
          <LearnAuthor lastUpdated={LAST_UPDATED} />
          <p className="learn-deck">
            The number that makes lopsided games interesting to bet on.
            The favorite has to win by MORE than the spread; the underdog
            can lose by less and still cash. The dominant bet type in the
            NFL and NBA, and the reason your ticket says &ldquo;Chiefs
            −7&rdquo; instead of just &ldquo;Chiefs.&rdquo;
          </p>

          <div className="learn-tldr">
            <p className="learn-tldr-label">TL;DR</p>
            <ul>
              <li>
                <strong>Handicap the favorite so both sides are ~50/50.</strong>{" "}
                Then price both at −110.
              </li>
              <li>
                <strong>Favorite (−) must win by MORE than the spread.</strong>{" "}
                Underdog (+) can lose by less (or win outright) and still
                cover.
              </li>
              <li>
                <strong>The hook (.5) prevents pushes.</strong> −3.5
                can&rsquo;t tie — the game ends up on either side.
                −3 (flat) can push if the winner wins by exactly 3.
              </li>
              <li>
                <strong>Key numbers in the NFL are 3 and 7.</strong>{" "}
                Because of field goals (3) and touchdowns (7), games
                disproportionately land on those margins. Buying a
                half-point around 3 or 7 is worth more than the
                sportsbook usually charges.
              </li>
              <li>
                <strong>Break-even at −110 is 52.4%.</strong> Same as
                moneyline — the standard vig.
              </li>
            </ul>
          </div>

          <section className="learn-section">
            <h2 className="learn-h2">The short definition</h2>
            <p>
              A point spread is a number the sportsbook adds to (or
              subtracts from) the final score of one team to level the
              betting. If the Chiefs are favored by 7 over the Broncos,
              the spread on the Chiefs is <strong>−7</strong>. The
              Chiefs must win by 8 or more for a bet on <em>Chiefs −7</em>
              to cash. The other side, <em>Broncos +7</em>, wins if the
              Broncos lose by 6 or less or win outright.
            </p>
            <p>
              Because the spread is chosen to balance the two sides,
              both are typically priced near −110 (i.e. bet $110 to win
              $100). This is the standard product on every US sportsbook
              app for NFL and NBA games — usually the first bet listed on
              any game screen.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Reading a spread</h2>
            <p>You&rsquo;ll see the spread written next to each team&rsquo;s name:</p>
            <div className="learn-formula">
              <code>
                Chiefs   −7.5 (−110)
                <br />
                Broncos  +7.5 (−110)
              </code>
            </div>
            <ul className="learn-list">
              <li>
                <strong>Chiefs −7.5</strong> = Chiefs are the favorite,
                giving 7.5 points. Chiefs must win by 8 or more.
              </li>
              <li>
                <strong>Broncos +7.5</strong> = Broncos are the underdog,
                getting 7.5 points. Broncos win the bet if they lose by 7
                or fewer, or if they win outright.
              </li>
              <li>
                <strong>(−110)</strong> next to each side = you bet $110
                to win $100. Standard vig-baked pricing.
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">The hook — half-points and no-push</h2>
            <p>
              A spread with a <strong>.5</strong> at the end (like −3.5
              or +7.5) is called a <strong>hook</strong>. Its purpose is
              to eliminate the possibility of a push — a tie against the
              spread that returns your stake.
            </p>
            <p>
              With <strong>−3</strong> (no hook), if the favorite wins by
              exactly 3, the bet pushes. With <strong>−3.5</strong>, the
              game must land on one side or the other. Sportsbooks use
              hooks aggressively around key numbers (3, 7 in NFL; 4, 5, 7
              in NBA) because those exact margins are common and would
              generate push-heavy books otherwise.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Key numbers in the NFL</h2>
            <p>
              NFL scoring is concentrated because of the two dominant
              scoring plays: field goal (3 points) and touchdown-plus-
              extra-point (7). About 15% of NFL games land on a margin of
              exactly 3, and about 9% on exactly 7. These are the &ldquo;
              key numbers.&rdquo;
            </p>
            <p>
              What this means for betting:
            </p>
            <ul className="learn-list">
              <li>
                <strong>Buying a half-point across a key number is
                especially valuable.</strong> Moving from −3 to −2.5, or
                from +3 to +3.5, is worth roughly 2-3% edge. Sportsbooks
                usually only charge 10-20¢ for it (i.e. price drops from
                −110 to −130 or so). When you can buy through a key
                number under fair market cost, take it.
              </li>
              <li>
                <strong>Teasers work best when they cross key numbers.</strong>{" "}
                A 6-point teaser that moves +2.5 through +3 to +8.5 (or
                −8.5 through −7 to −2.5) crosses both 3 and 7. This is
                the Wong teaser — one of the few teaser spots with a real
                positive-EV history.
              </li>
              <li>
                <strong>A −3 spread is much more valuable than a −3.5</strong>{" "}
                because you get the push equity on the 3-point win. Books
                know this and price them differently.
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Worked example</h2>
            <p>
              You take <strong>Chiefs −7 (−110)</strong> for $100 in a
              game against the Broncos.
            </p>
            <ul className="learn-list">
              <li>
                <strong>Chiefs win 30-20</strong> (by 10). You cover —
                won by more than 7. Payout: $100 stake + $90.91 profit =
                $190.91 returned.
              </li>
              <li>
                <strong>Chiefs win 27-20</strong> (by 7). Push — exact
                spread. Your $100 stake is returned. No profit, no loss.
              </li>
              <li>
                <strong>Chiefs win 24-20</strong> (by 4). You don&rsquo;t
                cover — Chiefs didn&rsquo;t win by more than 7. Lose your
                $100.
              </li>
              <li>
                <strong>Broncos win 21-17</strong>. You lose (Chiefs
                didn&rsquo;t win at all).
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Related terms</h2>
            <ul className="learn-list learn-list--related">
              <li>
                <strong><Link href="/learn/moneyline">Moneyline:</Link></strong>{" "}
                the &ldquo;who wins outright&rdquo; version of the same
                game. No spread. Different math, sometimes different
                right answer.
              </li>
              <li>
                <strong><Link href="/learn/over-under-betting">Over/under:</Link></strong>{" "}
                the third main bet on any game — total combined score
                over or under a number.
              </li>
              <li>
                <strong><Link href="/learn/parlay">Parlay:</Link></strong>{" "}
                combine multiple spreads (or spreads with moneylines /
                totals) into one ticket. Every leg must cover.
              </li>
              <li>
                <strong><Link href="/learn/expected-value">Expected Value (EV):</Link></strong>{" "}
                what tells you if a specific spread is a good number.
                Buying a half-point on a key number is essentially
                buying EV.
              </li>
              <li>
                <strong><Link href="/learn/clv">CLV (Closing Line Value):</Link></strong>{" "}
                the diagnostic for whether your spread reads are
                beating the market. Consistent positive CLV on spreads
                is the surest sign of real edge.
              </li>
              <li>
                <strong><Link href="/learn/devigging">Devigging:</Link></strong>{" "}
                since both sides of a spread are usually −110, devigging
                is straightforward — the fair line is close to whatever
                Pinnacle&rsquo;s no-vig midpoint says.
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
              <div className="learn-cta-title">Track every spread pick you take.</div>
              <div className="learn-cta-sub">
                Paste any bet slip from DraftKings, FanDuel, BetMGM, Caesars
                — {BRAND.name} logs the spread, price, stake, and result
                automatically. See your win rate against the spread over
                any period. Free, no credit card.
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
