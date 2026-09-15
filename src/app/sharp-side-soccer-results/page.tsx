import type { Metadata } from "next";
import Link from "next/link";
import { buildBreadcrumbList } from "@/lib/breadcrumb-schema";

const title = "Sharp Side Soccer: Neil Mac’s Betting Record & Will White";
const description = "Explore Neil Mac’s personal betting record, profit/loss and CLV on Am I Up, and meet the Sharp Side Soccer partnership with professional bettor Will White.";
const url = "https://amiup.io/sharp-side-soccer-results";

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: "/sharp-side-soccer-results" },
  openGraph: { title, description, url, type: "article", publishedTime: "2026-09-15", modifiedTime: "2026-09-15", authors: ["https://amiup.io/author/neil-macdonald"] },
  twitter: { card: "summary_large_image", title, description },
};

export default function SharpSideSoccerResults() {
  const article = {
    "@context": "https://schema.org", "@type": "Article",
    headline: title, description, mainEntityOfPage: url,
    datePublished: "2026-09-15", dateModified: "2026-09-15",
    author: { "@type": "Person", "@id": "https://amiup.io/author/neil-macdonald#person", name: "Neil Macdonald", url: "https://amiup.io/author/neil-macdonald" },
    publisher: { "@type": "Organization", name: "Am I Up", url: "https://amiup.io" },
    about: [{ "@type": "Person", name: "Neil Macdonald", alternateName: "Neil Mac" }, { "@type": "Person", name: "Will White" }, { "@type": "Organization", name: "Sharp Side Soccer" }],
  };
  const breadcrumb = buildBreadcrumbList([{ name: "Am I Up", url: "https://amiup.io" }, { name: "Sharp Side Soccer results", url }]);
  return (
    <div className="learn-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <header className="legal-topbar"><Link href="/" className="brand">Am I Up</Link><Link href="/sign-in" className="btn-primary">Start tracking free →</Link></header>
      <main className="learn-main">
        <nav className="learn-crumbs" aria-label="Breadcrumb"><Link href="/">Am I Up</Link><span>›</span><span>Sharp Side Soccer results</span></nav>
        <article>
          <p className="learn-eyebrow">The people behind the record</p>
          <h1 className="learn-title">Sharp Side Soccer: Neil Mac’s betting record &amp; partnership with Will White</h1>
          <p className="learn-deck">Sharp Side Soccer brings together professional bettors Neil Mac and Will White, who joined forces on 11 August 2026. Here is where to explore Neil’s personal betting record and understand the figures behind it.</p>
          <p>By <Link href="/author/neil-macdonald">Neil Macdonald (Neil Mac)</Link> · <time dateTime="2026-09-15">15 September 2026</time></p>

          <section className="learn-section">
            <h2 className="learn-h2">Neil Mac’s betting record and profit/loss</h2>
            <p>My personal book is the record I want people to be able to inspect. It brings the bets together in one place, with cumulative profit and loss, yield, closing line value and the changes in performance along the way.</p>
            <p><strong>This is my personal record, including bets made before the Sharp Side Soccer partnership.</strong> It is not a combined lifetime record for me and Will.</p>
            <p><Link href="/neilmac555" className="btn-primary">View Neil Mac’s public betting record →</Link></p>
            <p>Open the public profile for the latest recorded profit/loss, the equity curve and individual bets. Look at the period and book shown on the profile when comparing results.</p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Neil Mac and Will White: Sharp Side Soccer</h2>
            <p>Will White and I are professional bettors, now working together through Sharp Side Soccer. My public record gives readers a way to explore my betting background alongside that partnership.</p>
            <p>For anyone getting to know the people behind Sharp Side Soccer, the individual bets and the full performance curve provide more context than a headline total alone. You can follow the record over time and see both the profitable periods and the drawdowns.</p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">How to read the results</h2>
            <p>A headline profit is only one part of a betting record. These are the measures to read alongside it:</p>
            <ul>
              <li><strong>Profit/loss:</strong> the net result of the recorded bets, rather than total payouts. Figures shown in units depend on the staking convention used in the book.</li>
              <li><strong>Yield:</strong> profit divided by the amount staked. Read it together with the number of bets and time period. <Link href="/learn/yield">See how betting yield is calculated.</Link></li>
              <li><strong>Closing line value (CLV):</strong> a comparison between the odds taken and the recorded closing odds. Am I Up calculates it where closing odds are supplied; it does not automatically fetch them. <Link href="/learn/clv">Read the CLV explanation.</Link></li>
              <li><strong>Drawdown and the equity curve:</strong> the setbacks as well as the gains. A full curve provides more context than a screenshot of a winning run.</li>
            </ul>
            <p>The profile reflects the bets recorded in Am I Up. It is not an independent audit of bookmaker accounts, and past results do not guarantee future returns.</p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Why I built a free bet tracker</h2>
            <p>I have been fortunate enough to make a good living from professional gambling, my newsletter and other ventures. Am I Up is my way of giving something back to the community that has given me so much.</p>
            <p>Keeping a usable record should be straightforward. You can paste bookmaker text, Telegram tips or social posts, upload a bet-slip screenshot, or import a CSV or Excel spreadsheet. Text and screenshot parsing logs the extracted bets automatically, so check the saved details; Undo is available for 30 seconds.</p>
            <p>Tracking, performance reports and CSV exports are free. Daily AI limits apply, and manual entry remains available. Public sharing is optional.</p>
            <p><Link href="/learn/import-bet-screenshots">See how a message or screenshot becomes a recorded bet →</Link></p>
          </section>

          <section className="learn-section">
            <h2 className="learn-h2">Explore the record, or start your own</h2>
            <p><Link href="/neilmac555">Open Neil Mac’s public profile</Link> to inspect his recorded results. To organise your own bets, try <Link href="/">Am I Up’s free bet tracker</Link> or <Link href="/sample">explore the sample profile</Link> before signing up.</p>
            <p>Disclosure: I am the founder of Am I Up and a member of the Sharp Side Soccer partnership described here.</p>
          </section>
        </article>
      </main>
    </div>
  );
}
