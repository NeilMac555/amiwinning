// /compare/pikkit — head-to-head comparison page targeting the
// "Pikkit alternative", "Pikkit vs Am I Up" search intent. Second
// page in the /compare/* SEO series after /compare/bettin-gs.
//
// Pikkit is the most direct competitor to Am I Up in concept:
// both are bet trackers trying to eliminate the manual data entry
// problem. The difference is HOW. Pikkit syncs directly with US
// sportsbook accounts (DraftKings, FanDuel, BetMGM, Caesars,
// ESPN BET). Am I Up uses AI to extract bets from ANY source
// (text, screenshots, X posts, Telegram tips).
//
// That means the choice between them is roughly:
//   - US bettor using a major sportsbook → Pikkit auto-syncs
//   - UK/EU bettor, multi-source punter, tipster follower → Am I Up
//
// Tone matches /compare/bettin-gs: honest, acknowledge their
// strengths, help the reader decide based on their actual situation.

import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Am I Up vs Pikkit — honest bet tracker comparison",
  description:
    "Both eliminate manual bet entry, but in very different ways. Pikkit syncs your US sportsbook accounts directly. Am I Up uses AI to extract bets from any source. Honest comparison from a daily user.",
  openGraph: {
    title: "Am I Up vs Pikkit — bet tracker comparison",
    description:
      "Auto-sync vs AI paste. UK/EU vs US. Free vs paid tiers. Honest side-by-side.",
    type: "article",
  },
};

// FAQ schema markup — same pattern as /compare/bettin-gs. Each Q/A
// becomes a citable chunk for AI retrieval and a rich snippet on
// Google.
const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "What's the difference between Am I Up and Pikkit?",
    a: "Pikkit syncs directly with your US sportsbook accounts (DraftKings, FanDuel, BetMGM, Caesars, ESPN BET, Hard Rock) and pulls your bets automatically once you've connected them. Am I Up uses AI to extract bets from any source you paste in — text, screenshots, X posts, Telegram tips, bookmaker confirmation text, a picture from your phone. Different solutions to the same data-entry problem.",
  },
  {
    q: "Which is better if I'm a US bettor on DraftKings or FanDuel?",
    a: "Honestly, Pikkit. If you bet exclusively on a major US sportsbook that Pikkit supports, account sync is more convenient than pasting bets in — your bets just appear, no action needed. Am I Up is the better fit when you bet on multiple sources including UK/EU bookmakers, follow tipsters on X or Telegram, or don't want a third party logged into your sportsbook account.",
  },
  {
    q: "Which is better if I'm a UK or European bettor?",
    a: "Am I Up. Pikkit's auto-sync is built around US sportsbooks. UK/EU bookmakers like Bet365, Pinnacle, Smarkets, Betfair, William Hill, Paddy Power either aren't supported or have limited support. Am I Up doesn't care which bookmaker you used because it extracts bets from whatever text or image you paste in.",
  },
  {
    q: "Can I track bets from a tipster I follow?",
    a: "On Am I Up, yes. Paste their X post or Telegram message and the AI pulls the bet structure straight out. On Pikkit, only if you actually placed the bet yourself on a supported sportsbook — Pikkit can't track tips you're following or bets placed elsewhere.",
  },
  {
    q: "Do I have to give Am I Up my sportsbook login?",
    a: "No. Am I Up never connects to your bookmaker account. You paste in bet info; we never see your credentials, balance, or any account data. Pikkit requires you to connect your sportsbook account (which is part of why it can auto-sync). Some bettors prefer not to give a third party that access; others find it acceptable for the convenience.",
  },
  {
    q: "Is Am I Up free?",
    a: "Yes, fully free with no credit card. Every feature on the site is included today. Pikkit has a free tier with limitations and paid tiers ($10-25/month range depending on plan and timing) for advanced features.",
  },
  {
    q: "Does Pikkit have a public profile feature like Am I Up?",
    a: "Pikkit added social/sharing features in their paid tiers. Am I Up gives every user a free public profile at amiup.io/u/yourhandle showing lifetime P/L, equity curve, sample size, and KPI grid — included in the free tier.",
  },
];

export default function ComparePage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd),
        }}
      />

      <div className="compare-page">
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
            Try Am I Up free →
          </Link>
        </header>

        <main className="compare-main">
          <p className="compare-eyebrow">Bet tracker comparison</p>
          <h1 className="compare-title">
            Am I Up <span className="compare-vs">vs</span> Pikkit
          </h1>
          <p className="compare-deck">
            Both products solve the same problem (manual bet entry is
            tedious) in very different ways. Pikkit syncs your US
            sportsbook account directly. Am I Up uses AI to extract bets
            from any source you paste in. Honest side-by-side so you can
            pick the right one for how you actually bet.
          </p>

          {/* TL;DR table */}
          <section className="compare-section">
            <h2 className="compare-h2">TL;DR</h2>
            <p>
              Same problem, different solutions. If you bet only on US
              sportsbooks that Pikkit supports, Pikkit&rsquo;s auto-sync
              is the most convenient option on the market. If you bet on
              UK/EU bookmakers, follow tipsters, or use multiple sources,
              Am I Up&rsquo;s AI paste flow handles all of it.
            </p>
            <div className="compare-table-wrap">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Am I Up</th>
                    <th>Pikkit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>How bets get in</td>
                    <td className="compare-win">
                      AI paste (text, screenshots, any source)
                    </td>
                    <td className="compare-win">
                      Sportsbook account sync (US)
                    </td>
                  </tr>
                  <tr>
                    <td>Bookmakers supported</td>
                    <td className="compare-win">
                      Any source you can paste
                    </td>
                    <td>Major US sportsbooks (DK, FanDuel, etc.)</td>
                  </tr>
                  <tr>
                    <td>UK / EU bookmakers</td>
                    <td className="compare-win">Works for all</td>
                    <td>Limited / unsupported</td>
                  </tr>
                  <tr>
                    <td>Tipster / 3rd-party bet tracking</td>
                    <td className="compare-win">
                      Paste X posts, Telegram tips
                    </td>
                    <td>Only your own placed bets</td>
                  </tr>
                  <tr>
                    <td>Needs sportsbook credentials</td>
                    <td className="compare-win">No</td>
                    <td>Yes (for sync to work)</td>
                  </tr>
                  <tr>
                    <td>Price</td>
                    <td className="compare-win">Free, no card</td>
                    <td>Free tier + paid plans</td>
                  </tr>
                  <tr>
                    <td>Public profile</td>
                    <td className="compare-win">Free with shareable URL</td>
                    <td>Paid tier feature</td>
                  </tr>
                  <tr>
                    <td>Native mobile app</td>
                    <td>Responsive web</td>
                    <td className="compare-win">iOS + Android</td>
                  </tr>
                  <tr>
                    <td>Maturity</td>
                    <td>New (June 2026)</td>
                    <td className="compare-win">Established</td>
                  </tr>
                  <tr>
                    <td>CLV vs Pinnacle close</td>
                    <td className="compare-win">First-class metric</td>
                    <td>Available, less prominent</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="compare-fine">
              Both columns have winning rows. That&rsquo;s the point.
              Neither product is strictly better, they&rsquo;re aimed at
              different bettors.
            </p>
          </section>

          {/* Where Am I Up wins */}
          <section className="compare-section">
            <h2 className="compare-h2">Where Am I Up wins</h2>
            <ul className="compare-list">
              <li>
                <strong>You bet on any bookmaker, not just US sportsbooks.</strong>{" "}
                Am I Up extracts bets from text or images, so it&rsquo;s
                bookmaker-agnostic. Bet365, Pinnacle, Smarkets, Betfair,
                William Hill, Paddy Power, exchanges, local bookies, paper
                slips — all fine. Pikkit&rsquo;s auto-sync is built for
                major US sportsbooks; outside that list you&rsquo;re back
                to manual entry anyway.
              </li>
              <li>
                <strong>You track bets you didn&rsquo;t place yourself.</strong>{" "}
                Following a tipster on X or Telegram? Paste their post.
                Reviewing someone else&rsquo;s picks before deciding
                whether to fade them? Paste them in. Pikkit can only track
                what came from your synced sportsbook account.
              </li>
              <li>
                <strong>You don&rsquo;t want a third party logged into
                your sportsbook account.</strong> Pikkit needs your
                bookmaker credentials to sync. Some bettors are fine with
                that; some aren&rsquo;t. Am I Up never connects to your
                sportsbook — you paste, we extract, that&rsquo;s the only
                surface area.
              </li>
              <li>
                <strong>You want a free public profile.</strong> Every Am
                I Up account gets <code>amiup.io/u/yourhandle</code> in
                the free tier — lifetime P/L, equity curve, KPI grid,
                shareable URL. Pikkit&rsquo;s comparable social features
                are paid.
              </li>
              <li>
                <strong>You care about CLV against Pinnacle as a core
                metric.</strong> Am I Up treats closing-line value vs the
                Pinnacle close as a first-class stat on every chart and
                profile. Pikkit supports CLV but it&rsquo;s less central
                to their product design.
              </li>
            </ul>
          </section>

          {/* Where Pikkit wins */}
          <section className="compare-section">
            <h2 className="compare-h2">Where Pikkit wins</h2>
            <ul className="compare-list">
              <li>
                <strong>Auto-sync is more convenient than paste.</strong>{" "}
                If you bet exclusively on a US sportsbook Pikkit
                supports, your bets just appear in the tracker
                automatically — no action needed from you, ever. Am I Up
                still needs you to paste or upload something. For pure
                set-and-forget tracking on a supported sportsbook,
                Pikkit wins.
              </li>
              <li>
                <strong>Native mobile apps.</strong> Pikkit ships iOS and
                Android. Am I Up is responsive web — works fine on
                phones, but it&rsquo;s not a native app.
              </li>
              <li>
                <strong>Established product.</strong> Pikkit has been
                live for years, with funded company behind it. Am I Up
                launched in June 2026. If you want the polish of a
                mature product over the freshness of a v1, Pikkit is
                the safer pick.
              </li>
              <li>
                <strong>Settled-bet accuracy.</strong> Because Pikkit
                pulls directly from the sportsbook, it knows exactly when
                a bet settles and the outcome — no manual marking
                required. Am I Up requires you to mark wins/losses
                yourself for now (auto-settlement is on the roadmap).
              </li>
            </ul>
          </section>

          {/* Decision tree */}
          <section className="compare-section">
            <h2 className="compare-h2">Who should pick which</h2>
            <div className="compare-decision">
              <div className="compare-decision-card">
                <div className="compare-decision-label">Pick Am I Up if</div>
                <ul>
                  <li>You bet outside the US (UK, EU, anywhere)</li>
                  <li>
                    You use multiple bookmakers or non-major books
                  </li>
                  <li>
                    You follow tipsters and want to track their picks
                  </li>
                  <li>
                    You don&rsquo;t want to give a third party your
                    sportsbook login
                  </li>
                  <li>You want a free public profile in your X bio</li>
                  <li>You care about CLV as a primary metric</li>
                  <li>You prefer free over paid tiers</li>
                </ul>
              </div>
              <div className="compare-decision-card">
                <div className="compare-decision-label">Pick Pikkit if</div>
                <ul>
                  <li>
                    You&rsquo;re a US bettor on DraftKings, FanDuel,
                    BetMGM, Caesars, ESPN BET, or similar
                  </li>
                  <li>You bet exclusively on one or two sportsbooks</li>
                  <li>
                    You want true set-and-forget tracking (no paste
                    needed)
                  </li>
                  <li>
                    You prefer a native iOS / Android app over web
                  </li>
                  <li>
                    You want the polish of an established product over
                    a brand-new one
                  </li>
                  <li>
                    You don&rsquo;t mind a third party connecting to
                    your sportsbook account
                  </li>
                </ul>
              </div>
            </div>
            <p className="compare-fine">
              Honest take: Pikkit is a properly built tool aimed at a
              specific bettor (US, major sportsbook user) and they
              execute on that wedge really well. Am I Up takes the same
              data-entry problem and solves it for everyone else. If you
              fit Pikkit&rsquo;s profile cleanly, go with them. If you
              don&rsquo;t, Am I Up is the better fit.
            </p>
          </section>

          {/* FAQ */}
          <section className="compare-section">
            <h2 className="compare-h2">Frequently asked questions</h2>
            <div className="compare-faq">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="compare-faq-item">
                  <h3 className="compare-faq-q">{item.q}</h3>
                  <p className="compare-faq-a">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="compare-cta">
            <div>
              <div className="compare-cta-title">
                Decided Am I Up sounds worth a look?
              </div>
              <div className="compare-cta-sub">
                Free, no credit card. Your data exportable any time. You
                can always go back to Pikkit (or run both) &mdash; nothing
                locked in.
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

          <footer className="compare-foot">
            <Link href="/">Back to Am I Up</Link>
            <Link href="/u/sample">See a sample profile</Link>
            <Link href="/compare/bettin-gs">vs bettin.gs</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </footer>
        </main>
      </div>
    </>
  );
}
