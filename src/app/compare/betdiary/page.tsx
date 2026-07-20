// /compare/betdiary — head-to-head comparison targeting the "bet diary
// alternative" and "betdiary vs" search intent.
//
// Bet Diary is a UK-focused sports bet tracker (betdiary.co.uk). It
// leans hard on horse racing coverage and has a long-standing UK
// audience. The wedge Am I Up brings against it is the same wedge it
// brings against bettin.gs and Pikkit: stop typing bets by hand.
//
// Tone matches /compare/bettin-gs and /compare/pikkit: honest, name
// the competitor's real strengths, don't fake superiority. Trust
// beats sales copy on comparison pages because the search intent is
// already deep-funnel.

import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Am I Up vs Bet Diary. Honest bet tracker comparison.",
  description:
    "Bet Diary is a UK-focused manual bet tracker with a long horse-racing lineage. Am I Up is AI-first and free. Honest side-by-side of both trackers so you can pick the right one.",
  openGraph: {
    title: "Am I Up vs Bet Diary. Bet tracker comparison.",
    description:
      "Honest side-by-side. Manual entry vs AI paste, CLV vs Pinnacle, public profile, price. Pick the one that fits.",
    type: "article",
  },
};

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "Is Am I Up free?",
    a: "Yes. Fully free with no credit card. Every feature on the site is included in the free tier: AI paste-and-parse, CLV vs Pinnacle, equity curve, public shareable profile, CSV export, unlimited books, unlimited bets. Paid tiers may come later for advanced features (bookmaker auto-capture, Pinnacle close automation) but the core tracker stays free.",
  },
  {
    q: "Can I import my existing Bet Diary history?",
    a: "Yes. Export your bets from Bet Diary as a CSV, then drop the file into Am I Up's import page. The AI reads the columns and maps them onto our schema. Most users get their entire history in within about five minutes, no manual re-entry.",
  },
  {
    q: "Does Am I Up handle horse racing as well as Bet Diary?",
    a: "It handles the core markets first-class: win, each-way, non-runner / Rule 4, forecast / tricast / exacta, ante-post, going state, race class. The sport classifier recognises famous races (Gold Cup, Grand National, Kentucky Derby, Royal Ascot), racecourses, horses, jockeys, and trainers. Bet Diary's edge here is its multi-year UK-racing focus and audience familiarity. If UK racing is 90 percent of your action, Bet Diary is worth a look; if it's part of a wider portfolio, Am I Up covers it well alongside soccer, tennis, basketball, and baseball.",
  },
  {
    q: "What about tracking CLV against Pinnacle?",
    a: "Am I Up treats closing-line value as a first-class metric. Every bet has a CLV field, every profile shows lifetime CLV alongside yield and win rate. You currently enter the Pinnacle close manually; auto-capture is in build. Bet Diary does not surface CLV as a first-class metric.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Individual bets are never shown publicly. Your public profile (if you turn it on) shows aggregate stats only: lifetime P/L, equity curve, KPI grid, sample size. Strangers cannot see what you are about to bet on next. Pending bets stay private by design.",
  },
  {
    q: "Can I take my data out if I stop using Am I Up?",
    a: "Yes. Full CSV export of every bet from Settings, any time, no cost. Your data is yours. If you migrate elsewhere, the export includes every field the app knows about, ready to re-import.",
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
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
          <nav className="learn-crumbs" aria-label="Breadcrumb">
            <Link href="/">Am I Up</Link>
            <span>›</span>
            <Link href="/compare">Compare</Link>
            <span>›</span>
            <span>Bet Diary</span>
          </nav>

          <p className="compare-eyebrow">Bet tracker comparison</p>
          <h1 className="compare-title">
            Am I Up <span className="compare-vs">vs</span> Bet Diary
          </h1>
          <p className="compare-deck">
            Honest side-by-side. Bet Diary is a UK-focused manual bet
            tracker with a long horse-racing lineage. Am I Up is AI-first,
            multi-sport, and free. Which one fits depends on what you
            actually bet on.
          </p>

          <section className="compare-section">
            <h2 className="compare-h2">TL;DR</h2>
            <p>
              Both are bet trackers. Bet Diary is a mature UK product
              built around manual entry and racing coverage. Am I Up is
              new and built around one wedge: the AI reads your bets so
              you never type them by hand.
            </p>
            <div className="compare-table-wrap">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Am I Up</th>
                    <th>Bet Diary</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Data entry</td>
                    <td className="compare-win">
                      AI paste (text + screenshots)
                    </td>
                    <td>Manual typing</td>
                  </tr>
                  <tr>
                    <td>Analytics depth</td>
                    <td className="compare-win">
                      Equity, yield, ROC, CLV, max DD, breakdowns
                    </td>
                    <td>P/L, win rate, ROI</td>
                  </tr>
                  <tr>
                    <td>CLV vs Pinnacle close</td>
                    <td className="compare-win">First-class metric</td>
                    <td>Not surfaced</td>
                  </tr>
                  <tr>
                    <td>Public profile</td>
                    <td className="compare-win">
                      Free, shareable URL with OG card
                    </td>
                    <td>No public profile</td>
                  </tr>
                  <tr>
                    <td>UK horse racing depth</td>
                    <td>Covered (each-way, NR, ante-post, R4)</td>
                    <td className="compare-win">
                      Deep UK racing focus, long lineage
                    </td>
                  </tr>
                  <tr>
                    <td>Age / maturity</td>
                    <td>New (2026)</td>
                    <td className="compare-win">
                      Established UK userbase
                    </td>
                  </tr>
                  <tr>
                    <td>Price</td>
                    <td className="compare-win">Free, no card</td>
                    <td>Free tier + paid</td>
                  </tr>
                  <tr>
                    <td>Export</td>
                    <td className="compare-win">Full CSV, one click</td>
                    <td>CSV export available</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="compare-fine">
              &ldquo;Win&rdquo; shading marks where the advantage sits
              today. It does not make either product better overall. That
              depends on which features matter to you. See below.
            </p>
          </section>

          <section className="compare-section">
            <h2 className="compare-h2">Where Am I Up wins</h2>
            <ul className="compare-list">
              <li>
                <strong>You stop typing bets in.</strong> The single
                biggest friction point of any bet tracker is the data-
                entry tax. Am I Up&rsquo;s AI reads text, X posts,
                Telegram screenshots, bookmaker bet slips, even pictures
                from your phone. Drop anything in, it extracts every bet,
                you commit in one click. Bet Diary is manual entry only.
              </li>
              <li>
                <strong>CLV vs Pinnacle is first-class.</strong> Closing
                line value is the truest available signal that a punter
                has a real edge. Am I Up puts it on every bet, every
                profile, every KPI card. Bet Diary&rsquo;s analytics
                stack tops out at P/L, win rate, and ROI, all of which
                are noisy in small samples.
              </li>
              <li>
                <strong>Public profile is free.</strong> Every account
                gets a shareable{" "}
                <code>amiup.io/u/yourhandle</code> profile. Lifetime P/L,
                equity curve, sample size, KPI grid. Drop the link in
                your X bio and have receipts. Bet Diary does not offer a
                shareable public profile.
              </li>
              <li>
                <strong>Multi-sport by default.</strong> Soccer, tennis,
                basketball, baseball, and horse racing are all first-
                class today with sport-specific market parsing (NBA
                player props, MLB strikeout / total-base props, horse
                racing forecast / tricast, and famous race + jockey +
                trainer recognition). Bet Diary&rsquo;s core focus is UK
                racing.
              </li>
              <li>
                <strong>Screenshot input is real.</strong> Take a picture
                of your bet slip. Drop it in. Done. Bet Diary requires
                you to transcribe the slip yourself.
              </li>
            </ul>
          </section>

          <section className="compare-section">
            <h2 className="compare-h2">Where Bet Diary wins</h2>
            <ul className="compare-list">
              <li>
                <strong>UK horse racing focus.</strong> Bet Diary has
                spent years serving a UK racing audience. If ninety
                percent of your action is UK racing and you like the
                comfort of a tool built specifically for that lane, Bet
                Diary is a reasonable pick.
              </li>
              <li>
                <strong>Established UK userbase.</strong> If community
                and long-tenure matter to you, Bet Diary has been
                running for years. Am I Up is 2026-vintage and still
                early.
              </li>
              <li>
                <strong>Familiarity.</strong> If you have been using Bet
                Diary for a long time and everything about it is muscle
                memory, moving to a new tool is a real switching cost.
                Am I Up&rsquo;s CSV import removes most of that friction
                but not all of it.
              </li>
            </ul>
          </section>

          <section className="compare-section">
            <h2 className="compare-h2">Who should pick which</h2>
            <div className="compare-decision">
              <div className="compare-decision-card">
                <div className="compare-decision-label">Pick Am I Up if</div>
                <ul>
                  <li>You bet 5-10+ times a week and hate the data entry</li>
                  <li>
                    You bet across multiple sports, not just racing
                  </li>
                  <li>
                    You want CLV vs Pinnacle as a headline metric, not
                    an afterthought
                  </li>
                  <li>You want a shareable public profile for free</li>
                  <li>You log via screenshots, X posts, or Telegram tips</li>
                  <li>
                    You are OK with a young tool that ships fixes fast
                  </li>
                </ul>
              </div>
              <div className="compare-decision-card">
                <div className="compare-decision-label">
                  Pick Bet Diary if
                </div>
                <ul>
                  <li>
                    Nearly all your action is UK horse racing and you
                    want a tool tuned for that
                  </li>
                  <li>
                    You prefer a long-established platform over a new
                    entrant
                  </li>
                  <li>
                    You are already comfortable with manual entry and it
                    is not a friction point for you
                  </li>
                  <li>
                    You do not care about CLV as a primary edge metric
                  </li>
                </ul>
              </div>
            </div>
            <p className="compare-fine">
              Honest take from the Am I Up team: if UK racing is your
              whole world and manual entry doesn&rsquo;t bother you,
              Bet Diary is fine. We built Am I Up because we wanted the
              specific wedge of zero data entry and CLV as a first-class
              metric. If those two hit, this is the better tool for you.
            </p>
          </section>

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

          <section className="compare-cta">
            <div>
              <div className="compare-cta-title">
                Decided Am I Up sounds worth a look?
              </div>
              <div className="compare-cta-sub">
                Free, no credit card. Your data exportable any time. You
                can always go back to Bet Diary. Nothing locked in.
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
            <Link href="/compare">All comparisons</Link>
            <Link href="/compare/bettin-gs">vs bettin.gs</Link>
            <Link href="/compare/pikkit">vs Pikkit</Link>
            <Link href="/learn">Glossary</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </footer>
        </main>
      </div>
    </>
  );
}
