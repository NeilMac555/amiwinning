// /compare/bet-analytix — head-to-head comparison targeting the "bet
// analytix alternative" and "bet analytix vs" search intent.
//
// Bet Analytix (bet-analytix.com) is a French-origin, App-Store-dominant
// bet tracker with iOS + Android native apps and a paid model that caps
// the free tier at 200 bets / 2 bankrolls and pushes $33/year premium.
// Their wedge is App Store distribution + community/follow feature;
// their weakness is manual entry, hard paywall, and no shareable
// public profile URL.
//
// AmIUp's wedge against them: AI paste from any source, unlimited
// everything free forever, one-URL public profile you can drop in
// your X bio. Their wedge over us: native apps we don't have yet.
// The tone matches /compare/bettin-gs, /compare/pikkit, and
// /compare/betdiary — honest, name their real strengths, don't fake
// superiority. Trust wins on comparison pages.

import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Am I Up vs Bet Analytix. Free bet tracker with AI paste.",
  description:
    "Bet Analytix caps you at 200 bets and 2 bankrolls unless you pay $33/year. Am I Up is unlimited and free forever, with AI paste from screenshots, X posts, and Telegram tips. Honest side-by-side comparison.",
  openGraph: {
    title: "Am I Up vs Bet Analytix. Bet tracker comparison.",
    description:
      "Free forever vs $33/year paywall. AI paste vs manual entry. Public profile vs in-app follow. Pick the one that fits.",
    type: "article",
  },
};

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "Is Am I Up really free forever?",
    a: "Yes. Unlimited bets, unlimited books, every feature, no credit card, no trial expiry. The core tracker stays free. Later we may add optional paid features (bookmaker auto-capture, Pinnacle close automation) but everything you see today stays free. Bet Analytix's free tier caps at 200 bets per bankroll and 2 bankrolls maximum — anything beyond that costs $33/year.",
  },
  {
    q: "Do I have to install an app?",
    a: "No. Am I Up runs in your browser, phone or desktop. Add it to your home screen from Safari or Chrome and it looks and feels like a native app: full-screen, icon on your home screen, works offline for reads. Bet Analytix has native iOS and Android apps in the App Store, which is a genuine convenience if you want the App Store install flow.",
  },
  {
    q: "Can I import my Bet Analytix history?",
    a: "If Bet Analytix lets you export your bets as CSV, yes — drop the CSV into Am I Up's import page and the AI reads the columns and maps them onto our schema. Most users get their entire history moved in about five minutes. No manual re-entry.",
  },
  {
    q: "What can Am I Up do that Bet Analytix cannot?",
    a: "Three big things. First, AI paste — you can drop a screenshot, an X post, a Telegram tip, or a bookmaker bet slip in and the AI extracts every bet automatically. Bet Analytix is 100% manual entry. Second, a public shareable profile URL at amiup.io/u/yourhandle that you can drop in your X bio as receipts of your edge. Bet Analytix's community feature is in-app follow only. Third, closing-line value (CLV) vs Pinnacle is a first-class metric on every bet, every profile, every KPI card.",
  },
  {
    q: "What does Bet Analytix do better?",
    a: "They have iOS and Android apps in the App Store, which we don't yet. If you searched 'bet tracker' on the App Store and found them, that's the channel Am I Up is currently absent from. They also support multiple languages (English + French at minimum), which we don't yet — Am I Up is English-only today.",
  },
  {
    q: "Why is Am I Up free if Bet Analytix charges?",
    a: "Different bet, not different value. We think the biggest lever right now is getting more punters tracking their real edge, not maximising per-user revenue from a small base. Later we may add optional paid features (Pinnacle close automation, priority support) but the core tracker — unlimited bets, all sports, CLV, public profile, CSV export — stays free forever.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Individual bets are never shown publicly. Your public profile (if you turn it on) shows aggregate stats only: lifetime P/L, equity curve, KPI grid, sample size. Strangers cannot see what you are about to bet on next. Pending bets stay private by design. Full CSV export from Settings any time, no cost. Your data is yours.",
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
            <span>Bet Analytix</span>
          </nav>

          <p className="compare-eyebrow">Bet tracker comparison</p>
          <h1 className="compare-title">
            Am I Up <span className="compare-vs">vs</span> Bet Analytix
          </h1>
          <p className="compare-deck">
            Bet Analytix has native iOS and Android apps and a $33/year
            paid plan that unlocks anything beyond 200 bets and 2 bankrolls.
            Am I Up is unlimited and free forever, runs in the browser,
            and pastes bets in from screenshots, X posts, and Telegram tips.
          </p>

          <section className="compare-section">
            <h2 className="compare-h2">TL;DR</h2>
            <p>
              Both are bet trackers. Bet Analytix is an established mobile
              app with a paywall that unlocks unlimited use. Am I Up is
              web-first, AI-first, and unlimited for free. The wedge that
              matters most: you stop typing every bet by hand.
            </p>
            <div className="compare-table-wrap">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Am I Up</th>
                    <th>Bet Analytix</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Data entry</td>
                    <td className="compare-win">
                      AI paste (text + screenshots)
                    </td>
                    <td>Manual typing, every field</td>
                  </tr>
                  <tr>
                    <td>Free tier limit</td>
                    <td className="compare-win">
                      Unlimited bets, unlimited books
                    </td>
                    <td>200 bets per bankroll, 2 bankrolls</td>
                  </tr>
                  <tr>
                    <td>Price for unlimited</td>
                    <td className="compare-win">Free</td>
                    <td>$33/year (12 mo) or $13/3 mo</td>
                  </tr>
                  <tr>
                    <td>CLV vs Pinnacle close</td>
                    <td>First-class metric</td>
                    <td>Shown (also first-class)</td>
                  </tr>
                  <tr>
                    <td>Public shareable profile URL</td>
                    <td className="compare-win">
                      Free, one URL, drop in X bio
                    </td>
                    <td>In-app follow only</td>
                  </tr>
                  <tr>
                    <td>Sign-up friction</td>
                    <td className="compare-win">
                      Magic link, one field
                    </td>
                    <td>Password + confirm + verify email</td>
                  </tr>
                  <tr>
                    <td>Native mobile app</td>
                    <td>Web + add to home screen</td>
                    <td className="compare-win">
                      Native iOS + Android
                    </td>
                  </tr>
                  <tr>
                    <td>Languages</td>
                    <td>English</td>
                    <td className="compare-win">
                      English + French
                    </td>
                  </tr>
                  <tr>
                    <td>Age / maturity</td>
                    <td>New (2026)</td>
                    <td className="compare-win">
                      Established, App-Store-dominant
                    </td>
                  </tr>
                  <tr>
                    <td>Export</td>
                    <td className="compare-win">Full CSV, one click</td>
                    <td>Depends on tier</td>
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
                <strong>Unlimited free tier.</strong> Bet Analytix caps
                the free plan at 200 bets per bankroll and 2 bankrolls
                total. Am I Up is unlimited bets, unlimited books,
                unlimited everything — free. A serious tracker fills 200
                bets in a few weeks, so their free tier is really a demo.
              </li>
              <li>
                <strong>You stop typing bets in.</strong> The single
                biggest friction point of any bet tracker is the data-
                entry tax. Am I Up&rsquo;s AI reads text, X posts,
                Telegram screenshots, bookmaker bet slips, even pictures
                from your phone. Drop anything in, it extracts every bet,
                you commit in one click. Bet Analytix is manual entry only.
              </li>
              <li>
                <strong>Public profile is one clickable URL.</strong>{" "}
                Every account gets a shareable{" "}
                <code>amiup.io/u/yourhandle</code> profile. Lifetime P/L,
                equity curve, sample size, KPI grid. Drop it in your X
                bio and prove your edge with receipts. Bet Analytix has
                an in-app follow feature, but no public URL to share
                outside the app.
              </li>
              <li>
                <strong>Zero-friction sign-up.</strong> One field, email,
                magic link, done. Bet Analytix asks for a pseudo,
                email, password, password confirmation, terms of use
                checkbox, then an email verification step — four fields
                and a verify before you can add a single bet.
              </li>
              <li>
                <strong>Screenshot input is real.</strong> Take a picture
                of your bet slip. Drop it in. Done. Bet Analytix requires
                you to transcribe the slip yourself, field by field.
              </li>
              <li>
                <strong>SEO / learn hub.</strong> Am I Up has a full
                glossary at <code>/learn</code> (CLV, yield, ROC, EV,
                ROI) and side-by-side comparisons with every major
                tracker. Google indexes it. Mobile-only apps don&rsquo;t
                rank for &ldquo;what is CLV in betting.&rdquo;
              </li>
            </ul>
          </section>

          <section className="compare-section">
            <h2 className="compare-h2">Where Bet Analytix wins</h2>
            <ul className="compare-list">
              <li>
                <strong>Native iOS and Android apps.</strong> Bet Analytix
                is discoverable in the App Store. If you searched
                &ldquo;bet tracker&rdquo; on your phone and found them,
                that&rsquo;s a real distribution advantage over Am I Up
                today. Am I Up is a progressive web app: you can add it
                to your home screen from Safari and get a native-like
                icon and full-screen mode, but no App Store install flow.
              </li>
              <li>
                <strong>Established userbase.</strong> They&rsquo;ve been
                running for years, dominant in the App Store, especially
                strong in French-speaking markets. Am I Up is
                2026-vintage and still early.
              </li>
              <li>
                <strong>Multi-language.</strong> Bet Analytix ships in
                English and French, likely more. Am I Up is English-only
                today.
              </li>
              <li>
                <strong>Community follow feed.</strong> Their &ldquo;
                Latest activities&rdquo; feed and follow system is more
                built-out than Am I Up&rsquo;s. Am I Up&rsquo;s public
                profile is a strong outbound share tool, but there is no
                in-app social layer yet.
              </li>
            </ul>
          </section>

          <section className="compare-section">
            <h2 className="compare-h2">Who should pick which</h2>
            <div className="compare-decision">
              <div className="compare-decision-card">
                <div className="compare-decision-label">Pick Am I Up if</div>
                <ul>
                  <li>
                    You bet 5-10+ times a week and hate the data entry
                  </li>
                  <li>
                    You don&rsquo;t want to be capped at 200 bets in
                    your free plan
                  </li>
                  <li>
                    You want to drop a public profile link in your X bio
                    or Telegram channel
                  </li>
                  <li>
                    You log via screenshots, X posts, or Telegram tips
                  </li>
                  <li>
                    You want CLV vs Pinnacle as a first-class metric
                  </li>
                  <li>
                    You are OK using a web app (or adding it to your
                    home screen)
                  </li>
                </ul>
              </div>
              <div className="compare-decision-card">
                <div className="compare-decision-label">
                  Pick Bet Analytix if
                </div>
                <ul>
                  <li>
                    You strongly prefer a native App Store install
                  </li>
                  <li>
                    You want the app in French (or a language other
                    than English)
                  </li>
                  <li>
                    In-app social feed matters more to you than a
                    shareable outbound profile URL
                  </li>
                  <li>
                    Manual bet entry is not a friction point for you
                  </li>
                  <li>
                    You are happy to pay $33/year for unlimited use
                  </li>
                </ul>
              </div>
            </div>
            <p className="compare-fine">
              Honest take from the Am I Up team: Bet Analytix is a solid
              product. Their App Store presence and multi-language reach
              are real advantages we don&rsquo;t match today. We built Am I
              Up because we wanted the specific wedge of zero data entry
              plus a shareable public profile plus no paywall on the core
              tracker. If those three hit, this is the better tool for
              you.
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
                Free, no credit card, no bet cap. Your data exportable
                any time. You can always go back to Bet Analytix. Nothing
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
            <Link href="/compare">All comparisons</Link>
            <Link href="/compare/bettin-gs">vs bettin.gs</Link>
            <Link href="/compare/pikkit">vs Pikkit</Link>
            <Link href="/compare/betdiary">vs Bet Diary</Link>
            <Link href="/learn">Glossary</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </footer>
        </main>
      </div>
    </>
  );
}
