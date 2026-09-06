import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { buildBreadcrumbList } from "@/lib/breadcrumb-schema";

const title = "Log Bets from Telegram, Social Posts and Screenshots";
const description = "Paste Telegram tips, social media posts or bookmaker text, or upload a screenshot. Am I Up reads the betting details and logs them in your free bet tracker.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/learn/import-bet-screenshots" },
  openGraph: { title, description, type: "article" },
};

const fields = [
  ["Event", "England vs Mexico"],
  ["Selection", "England"],
  ["Market", "Match winner (3 way / 1X2)"],
  ["Decimal odds", "2.49"],
  ["Stake on the slip", "€1,000.00"],
  ["Result", "Won"],
];

export default function ScreenshotGuide() {
  const breadcrumb = buildBreadcrumbList([
    { name: "Am I Up", url: "https://amiup.io" },
    { name: "Learn", url: "https://amiup.io/learn" },
    { name: "Importing bets", url: "https://amiup.io/learn/import-bet-screenshots" },
  ]);
  return (
    <div className="compare-page import-guide">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <header className="legal-topbar">
        <Link href="/" className="brand" style={{ textDecoration: "none" }}>Am I Up</Link>
        <Link href="/sign-in" className="btn-primary" style={{ padding: "8px 16px", textDecoration: "none" }}>Start tracking free →</Link>
      </header>
      <main className="compare-main">
        <nav className="learn-crumbs" aria-label="Breadcrumb"><Link href="/">Am I Up</Link><span>›</span><Link href="/learn">Learn</Link><span>›</span><span>Importing bets</span></nav>
        <p className="compare-eyebrow">Telegram. Social posts. Bet slips.</p>
        <h1 className="compare-title">Copy. Paste. Bets logged.</h1>
        <p className="compare-deck">Paste a Telegram tip, social post or bookmaker text into your <Link href="/">free bet tracker</Link>. Or upload a screenshot. AI reads the details and logs your bets.</p>

        <section className="import-message-demo" aria-label="Illustrated message to betting record">
          <div className="import-message-source">
            <p className="compare-eyebrow">01 / Copy the message</p>
            <blockquote>England vs Mexico<br /><strong>England to win @ 2.49</strong><br />2u · Settled: won</blockquote>
            <span className="import-demo-note">Example chat message</span>
          </div>
          <div className="import-message-result">
            <p className="compare-eyebrow">02 / Capture the details</p>
            <h2>England vs Mexico</h2>
            <p>England · Match winner</p>
            <dl><div><dt>Odds</dt><dd>2.49</dd></div><div><dt>Stake</dt><dd>2u</dd></div><div><dt>Result</dt><dd>Won</dd></div><div><dt>Profit</dt><dd>+2.98u</dd></div></dl>
          </div>
        </section>
        <p className="compare-fine">Illustrated example, not a live parse. Paste the message itself, including the date and stake, rather than just a link.</p>
        <section className="compare-section"><h2 className="compare-h2">The same idea, with a screenshot</h2><p>Here is a supplied bet slip and the details it contains.</p></section>
        <section className="slip-guide-example" aria-labelledby="example-title">
          <figure className="slip-guide-source">
            <Image src="/guides/england-mexico-bet-slip.png" width={363} height={287} alt="Won England vs Mexico slip: England at 2.49, risk €1,000, to win €1,490, payout €2,490." sizes="(max-width: 640px) 90vw, 363px" />
            <figcaption>Example supplied by the founder. A single winning bet is not evidence of long-term performance.</figcaption>
          </figure>
          <div>
            <p className="compare-eyebrow">The details to check</p>
            <h2 id="example-title" className="compare-h2">One slip, one record</h2>
            <dl className="slip-guide-fields">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          </div>
        </section>
        <p className="compare-fine">Illustrated walkthrough: the fields above were read from the supplied screenshot. This is not a live parser result or a saved account record.</p>

        <section className="compare-section">
          <h2 className="compare-h2">How to log bets from text or screenshots</h2>
          <ol className="slip-guide-steps">
            <li><h3>Paste your text or attach a screenshot</h3><p>Sign in and select the book where the bet belongs. Paste the copied message directly into the box. For an image, choose <strong>Attach screenshot</strong>, paste an image from your clipboard or drop it onto the box. Check that the right thumbnail appears.</p></li>
            <li><h3>Add context, then parse</h3><p>If a date is unclear or you track stakes in units, add a short explanation alongside the image. Choose <strong>Parse bets</strong>. Am I Up uses Claude Haiku to read your text or image and automatically logs the extracted bets.</p></li>
            <li><h3>Check the saved bet</h3><p>Compare the event, selection, odds, stake, date and result with the original. The success message offers <strong>Undo for 30 seconds</strong>. You can also edit a saved bet. AI can misread a slip, so check the details before relying on your totals.</p></li>
          </ol>
        </section>
        <section className="compare-section" aria-labelledby="import-details"><h2 className="compare-h2" id="import-details">A few useful details</h2>
        <details className="import-guide-detail">
          <summary>Payout is not profit</summary>
          <p>This slip shows a €1,000 stake at decimal odds of 2.49. Its €2,490 payout includes the original stake. The profit is €1,490.</p>
          <div className="slip-guide-maths"><span>€1,000 × 2.49 = €2,490 returned</span><strong>€2,490 − €1,000 = €1,490 profit</strong></div>
          <p>Check the stake convention in your book. If you use units, a €1,000 cash stake is not automatically 1,000 units. For example, at €100 per unit this would be 10 units staked and 14.9 units profit. Supply that context and verify the saved amount.</p>
        </details>
        <details className="import-guide-detail">
          <summary>Two details this screenshot cannot settle</summary>
          <ul className="compare-list">
            <li><strong>The kickoff date and timezone.</strong> “7/6 1:00 AM” depends on the bookmaker’s date format and timezone. The separate “Placed Jul 05, 2026” timestamp is the placement time. Confirm the event date rather than treating those as interchangeable.</li>
            <li><strong>The bookmaker.</strong> No bookmaker name is visible. Add it as context if you want it in your record; the slip’s colours are not enough to identify it reliably.</li>
          </ul>
        </details>
        <details className="import-guide-detail">
          <summary>What screenshots can I upload?</summary>
          <p>The account parser accepts PNG, JPEG, WebP and GIF files, up to four images per request and 4 MB per image. Use a clear image showing the full selection, odds and stake. Daily AI parsing limits apply.</p>
          <p>No bookmaker connection is required. The public homepage demo accepts text; sign in to import screenshots. For an existing spreadsheet, use the CSV or Excel importer instead.</p>
        </details>
        </section>
        <section className="compare-cta"><div><div className="compare-cta-title">Your bets, wherever you find them.</div><div className="compare-cta-sub">Free bet tracking, with no credit card required.</div></div><Link href="/sign-in" className="btn-primary" style={{ padding: "12px 20px", textDecoration: "none" }}>Start tracking free →</Link></section>
        <footer className="compare-foot"><Link href="/">Free bet tracker</Link><Link href="/sample">Sample profile</Link><Link href="/learn/yield">Understanding yield</Link><Link href="/learn">All guides</Link></footer>
      </main>
    </div>
  );
}
