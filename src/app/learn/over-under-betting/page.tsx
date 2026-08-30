// /learn/over-under-betting — the totals explainer.
//
// SEO target: "what is over under in betting" ~15k/mo, "over under
// meaning betting" ~8k/mo, "how does over under work" ~6k/mo, "totals
// betting explained" ~4k/mo. Third of the three main game bets — the
// full US casual-bettor onboarding trio (moneyline / spread / total).

import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { buildBreadcrumbList } from "@/lib/breadcrumb-schema";
import { LearnAuthor } from "@/components/LearnAuthor";

const LAST_UPDATED = "2026-08-17";

export const metadata: Metadata = {
  alternates: { canonical: "/learn/over-under-betting" },
  title: "What is Over/Under Betting? Totals, pushes, and how the math works.",
  description:
    "Over/under (or totals) betting predicts whether the combined score of both teams goes above or below a number set by the sportsbook. Sport-by-sport units (points, goals, runs, games), pushes, first-half and team totals. Plain-English explainer.",
  openGraph: {
    title: "What is Over/Under (Totals) Betting?",
    description:
      "How totals work in every sport, when to bet the over vs the under, and why the line moves.",
    type: "article",
  },
};

export default function OverUnderPage() {
  const definedTermJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: "Over/Under (Totals) Betting",
    alternateName: ["Over/Under", "O/U", "Totals", "Total Points", "Total Goals", "Match Total"],
    description:
      "Over/under betting is a wager on whether the combined final score of both teams will be higher (over) or lower (under) than a number set by the sportsbook. The unit depends on the sport: points in football/basketball, goals in soccer/hockey, runs in baseball, games in tennis. Both sides are usually priced near −110, similar to point spreads.",
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: `${BRAND.name} Sports Betting Glossary`,
      url: "https://amiup.io/learn",
    },
    url: "https://amiup.io/learn/over-under-betting",
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "What is Over/Under Betting? Totals, pushes, and how the math works.",
    description:
      "How totals work in every sport, when to bet over vs under, first-half and team totals, why the line moves.",
    author: {
      "@type": "Person",
      name: "Neil Macdonald",
      url: "https://amiup.io/neilmac555",
    },
    publisher: {
      "@type": "Organization",
      name: BRAND.name,
      url: "https://amiup.io",
    },
    mainEntityOfPage: "https://amiup.io/learn/over-under-betting",
    datePublished: "2026-08-17",
    dateModified: LAST_UPDATED,
  };

  const faqItems: Array<{ q: string; a: string }> = [
    {
      q: "What does over/under mean in sports betting?",
      a: "Over/under (also called the total) is a bet on whether the combined final score of both teams will go above or below a number set by the sportsbook. The winner of the game is irrelevant — only the total score matters. If the number is 47.5 in an NFL game and the final combined score is 48 or more, the OVER wins; 47 or fewer and the UNDER wins.",
    },
    {
      q: "What does 'over 224.5' mean?",
      a: "In basketball, 224.5 is the total combined points the sportsbook set for both teams. Bet the over and you win if the two teams combine for 225 or more. Bet the under and you win if they combine for 224 or fewer. The .5 (a hook, same as with point spreads) eliminates the possibility of a push on that exact number.",
    },
    {
      q: "How is the total different in each sport?",
      a: "The unit changes with the sport but the concept is identical. NFL: total points (typical range 38-55). NBA: total points (typical range 210-240). MLB: total runs (typical 7-11). NHL: total goals (typical 5-7). Soccer: total goals (typical 2.0-3.5). Tennis: total games (typical 20-28). Same bet, different units.",
    },
    {
      q: "What happens if the final total lands exactly on the number?",
      a: "Push. Same as with point spreads — if the total is 47 and the game ends 24-23 (total 47 exactly), the bet is refunded. No profit, no loss. Half-point hooks (47.5, 224.5) are used specifically to prevent pushes on integer totals that games actually land on.",
    },
    {
      q: "Why does the over/under line move?",
      a: "The book sets an opening line based on its models and market. As bettors take one side more than the other, the book moves the number (not the price) to balance the action. Lots of over bets on 47.5 might push the line to 48. Weather (rain in the NFL, wind in MLB) and key player injuries also move the line — a starting QB out or a top scorer benched can shift a total by 3+ points.",
    },
    {
      q: "What is a team total?",
      a: "A team total is the same idea but for ONE team's score instead of the combined score. Instead of 'Chiefs vs Broncos over/under 47.5', it'd be 'Chiefs over/under 27.5'. Common in football, basketball, and MLB. A team total under is often a cleaner bet than a game total under when you think one specific team will struggle to score.",
    },
    {
      q: "First-half totals vs game totals?",
      a: "First-half (1H) totals are exactly what they sound like — the combined score at halftime. Usually roughly 45-55% of the full-game total. First-half unders can be sharp when you expect a slow start (opening drives, defensive game script) even if the full game plays over. First-half markets often have wider vig than full-game markets, so devig carefully.",
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
    { name: "Over/Under Betting", url: "https://amiup.io/learn/over-under-betting" },
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
            <span>Over/Under Betting</span>
          </nav>

          <p className="learn-eyebrow">Betting analytics glossary</p>
          <h1 className="learn-title">What is over/under (totals) betting?</h1>
          <LearnAuthor lastUpdated={LAST_UPDATED} />
          <p className="learn-deck">
            Neither team has to win. You&rsquo;re betting on whether the
            combined score goes above or below a number the sportsbook
            set. Same concept in every sport — only the unit changes.
            Points, goals, runs, games — one bet type, four flavours.
          </p>

          <div className="learn-tldr">
            <p className="learn-tldr-label">TL;DR</p>
            <ul>
              <li>
                <strong>Bet whether combined score is over or under a
                number.</strong> The winner of the game doesn&rsquo;t
                matter.
              </li>
              <li>
                <strong>Unit changes with the sport.</strong> NFL points,
                NBA points, MLB runs, NHL goals, soccer goals, tennis
                games. Same bet.
              </li>
              <li>
                <strong>Both sides usually −110</strong>, same vig
                structure as point spreads. Break-even 52.4%.
              </li>
              <li>
                <strong>Half-point hooks prevent pushes.</strong> A total
                of 47.5 can&rsquo;t tie; a total of 47 refunds if the
                game lands there exactly.
              </li>
              <li>
                <strong>Team totals</strong> = the same bet on one
                team&rsquo;s score. <strong>First-half totals</strong> =
                same bet on the halftime combined score.
              </li>
            </ul>
          </div>

          <section className="learn-section">
            <h2 className="learn-h2">The short definition</h2>
            <p>
              An over/under bet — often called just a <strong>total</strong>
              {" "} — is a wager on whether the combined final score of both
              teams will be higher (OVER) or lower (UNDER) than a number
              the sportsbook posts. The winner of the game is irrelevant.
              A 47-point NFL game where the favorite wins by 30 is the
              same result as a 47-point game where the underdog wins by 3
              — only the total matters.
            </p>
            <p>
              Sportsbooks list the total on every game screen right
              alongside the moneyline and spread. It&rsquo;s the third
              leg of the standard game-day triple every US sportsbook
              app puts front and centre.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Reading a total</h2>
            <p>Standard layout on any US sportsbook:</p>
            <div className="learn-formula">
              <code>
                Over  47.5  (−110)
                <br />
                Under 47.5  (−110)
              </code>
            </div>
            <ul className="learn-list">
              <li>
                <strong>47.5</strong> is the number. Combined score of
                both teams must go over or under it.
              </li>
              <li>
                <strong>Over 47.5</strong> = wins if combined score is
                48 or more.
              </li>
              <li>
                <strong>Under 47.5</strong> = wins if combined score is
                47 or fewer.
              </li>
              <li>
                <strong>(−110)</strong> each side = bet $110 to win $100.
                Standard vig.
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Unit varies by sport, math doesn&rsquo;t</h2>
            <p>The exact same bet type in every sport, but the unit and typical range change:</p>
            <ul className="learn-list">
              <li>
                <strong>NFL:</strong> total points. Typical totals 38-55.
                A defensive slugfest might come in at 37; a shootout at 55+.
              </li>
              <li>
                <strong>NBA:</strong> total points. Typical totals 210-240.
                Pace and 3-point volume drive the number.
              </li>
              <li>
                <strong>MLB:</strong> total runs. Typical totals 7-11.
                Starting pitcher matchup drives the number more than
                anything else.
              </li>
              <li>
                <strong>NHL:</strong> total goals. Typical totals 5.5-6.5.
                A tight range because hockey scoring is low-variance.
              </li>
              <li>
                <strong>Soccer:</strong> total goals. Typical totals
                2.0-3.5. Over 2.5 is the most-bet market in world soccer.
              </li>
              <li>
                <strong>Tennis:</strong> total games (across the whole
                match). Typical totals 20-28 depending on best-of-3 vs
                best-of-5 and player styles.
              </li>
              <li>
                <strong>Boxing/MMA:</strong> total rounds, usually as
                over/under N.5 (e.g. Over 4.5 rounds).
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Worked example</h2>
            <p>
              You take the <strong>Over 47.5 (−110)</strong> in an
              NFL game for $100. Final score: Chiefs 27, Broncos 21.
              Combined total: 48.
            </p>
            <p>
              48 &gt; 47.5. Over wins. You get back your $100 stake +
              $90.91 profit = $190.91.
            </p>
            <p>
              Same bet, different final. Final score: Chiefs 24, Broncos
              20. Combined total: 44.
            </p>
            <p>
              44 &lt; 47.5. Over loses. You lose the $100.
            </p>
            <p>
              Note: it wouldn&rsquo;t matter which team won either game.
              The bet only cares about the sum.
            </p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Why the total moves</h2>
            <p>
              The opening total comes from the book&rsquo;s pricing
              model. It moves as money flows in or as game conditions
              change:
            </p>
            <ul className="learn-list">
              <li>
                <strong>Action balance.</strong> If bettors pound the
                over, the book raises the number to attract under money.
                Lots of overs at 47.5 → line goes to 48.
              </li>
              <li>
                <strong>Weather (NFL, MLB).</strong> Wind above 15 mph in
                the NFL tends to push totals down 2-3 points. Rain, same
                direction. Wind blowing out at Wrigley in a Cubs game
                nudges the MLB total up.
              </li>
              <li>
                <strong>Injuries.</strong> A star QB, top scorer, or ace
                starting pitcher out of the game can move a total by
                several points. Late injury news is where a lot of
                sharp total money lives.
              </li>
              <li>
                <strong>Rule / roster context.</strong> A team&rsquo;s
                backup QB, an NBA back-to-back with rest management, a
                bullpen game in MLB — all move the projected total
                measurably.
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Team totals and first-half totals</h2>
            <p>Two common variants:</p>
            <ul className="learn-list">
              <li>
                <strong>Team total</strong> = same bet on ONE team&rsquo;s
                score. &ldquo;Chiefs team total over 27.5&rdquo; wins if
                Chiefs score 28 or more, regardless of what Broncos
                score. Cleaner than a game total when you have a strong
                view on one specific team.
              </li>
              <li>
                <strong>First-half total</strong> = combined score at
                halftime instead of full game. Usually ~45-55% of the
                full-game total. First-half unders can be sharp when
                you expect a slow start (weather, defensive matchup,
                starting-QB rust) even if the full game plays over.
              </li>
              <li>
                <strong>Quarter totals (NFL, NBA)</strong> and{" "}
                <strong>period totals (NHL)</strong> — same idea at
                finer time slices. Higher vig, thinner markets.
              </li>
            </ul>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Related terms</h2>
            <ul className="learn-list learn-list--related">
              <li>
                <strong><Link href="/learn/moneyline">Moneyline:</Link></strong>{" "}
                the &ldquo;who wins outright&rdquo; version. Different
                bet on the same game.
              </li>
              <li>
                <strong><Link href="/learn/point-spread">Point spread:</Link></strong>{" "}
                the margin-based bet. Together with moneyline and total,
                completes the trio of main game bets on every US sportsbook.
              </li>
              <li>
                <strong><Link href="/learn/parlay">Parlay:</Link></strong>{" "}
                combine multiple totals (or totals with moneylines /
                spreads) into one ticket. Same-game parlays lean heavily
                on total-plus-moneyline combos.
              </li>
              <li>
                <strong><Link href="/learn/expected-value">Expected Value (EV):</Link></strong>{" "}
                the metric for whether a specific total price is
                actually good compared to a sharp market&rsquo;s
                estimate.
              </li>
              <li>
                <strong><Link href="/learn/clv">CLV (Closing Line Value):</Link></strong>{" "}
                the diagnostic that catches whether your total reads
                are beating the closing number at a sharp book.
              </li>
              <li>
                <strong><Link href="/learn/devigging">Devigging:</Link></strong>{" "}
                totals are usually priced −110 / −110 like spreads, so
                devig is symmetric and straightforward — the fair line
                sits close to the market midpoint.
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
              <div className="learn-cta-title">Track every total you bet.</div>
              <div className="learn-cta-sub">
                Paste any bet slip from DraftKings, FanDuel, BetMGM,
                Caesars — {BRAND.name} logs the total, price, stake, and
                result. See your over/under record across NFL, NBA, MLB,
                NHL, soccer, tennis, all in one place. Free, no credit
                card.
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
