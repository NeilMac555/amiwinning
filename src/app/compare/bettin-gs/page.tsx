import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { buildBreadcrumbList } from "@/lib/breadcrumb-schema";

const comparison = {
  "slug": "bettin-gs",
  "name": "bettin.gs",
  "title": "Free bettin.gs Alternative: AI Bet Tracker",
  "description": "Looking for a free bettin.gs alternative? Compare AI screenshot and text imports, analytics and CSV migration with Am I Up. No credit card required.",
  "intro": "Already using bettin.gs and looking for an easier way to record bets? Am I Up is a free bet tracker that turns screenshots and bookmaker text into records you can check after parsing.",
  "rows": [
    [
      "Bet entry",
      "AI text and screenshot imports; manual entry also available",
      "Bet registration with match selection"
    ],
    [
      "Analysis",
      "Profit and loss, yield, equity curve and sport / market breakdowns",
      "Portfolio analysis and betting statistics"
    ],
    [
      "Community",
      "Optional public profiles and separate books",
      "Expert discovery and social features"
    ]
  ],
  "strengths": "bettin.gs combines portfolio tracking with discovering and following other bettors. If those social features are central to how you use a tracker, keep them in your decision. Changing tools also means learning a new workflow.",
  "migration": "Am I Up includes an import preset for bettin.gs CSV exports. Keep an untouched copy of your original export, then review the column mapping and preview before saving. Check dates, odds, stakes and settlement results against the original; formatting differences can need adjustment.",
  "sources": [
    [
      "bettin.gs product overview",
      "https://bettin.gs/"
    ]
  ]
};

export const metadata: Metadata = {
  title: comparison.title,
  description: comparison.description,
  alternates: { canonical: "/compare/bettin-gs" },
  openGraph: { title: comparison.title + " | Am I Up", description: comparison.description, type: "article" },
  twitter: { card: "summary_large_image", title: comparison.title + " | Am I Up", description: comparison.description },
};

export default function ComparePage() {
  const breadcrumb = buildBreadcrumbList([
    { name: BRAND.name, url: "https://amiup.io" },
    { name: "Compare", url: "https://amiup.io/compare" },
    { name: comparison.name, url: "https://amiup.io/compare/bettin-gs" },
  ]);
  return (
    <div className="compare-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <header className="legal-topbar">
        <Link href="/" className="brand" style={{ textDecoration: "none" }}><div className="brand-mark" aria-hidden="true" /><span>{BRAND.name}</span></Link>
        <Link href="/sign-in" className="btn-primary" style={{ padding: "7px 16px", fontSize: 13, textDecoration: "none" }}>Try Am I Up free →</Link>
      </header>
      <main className="compare-main">
        <nav className="learn-crumbs" aria-label="Breadcrumb"><Link href="/">Am I Up</Link><span>›</span><Link href="/compare">Compare</Link><span>›</span><span>{comparison.name}</span></nav>
        <p className="compare-eyebrow">Am I Up vs {comparison.name}</p>
        <h1 className="compare-title">A free {comparison.name} alternative for tracking your bets</h1>
        <p className="compare-deck">{comparison.intro}</p>
        <p className="compare-fine">Written by the Am I Up team. Product information checked <time dateTime="2026-09-06">6 September 2026</time>; sources below.</p>
        <section className="compare-section">
          <h2 className="compare-h2">Compare the workflows</h2>
          <div className="compare-table-wrap"><table className="compare-table">
            <thead><tr><th scope="col">Feature</th><th scope="col">Am I Up</th><th scope="col">{comparison.name}</th></tr></thead>
            <tbody>{comparison.rows.map(([feature, ours, theirs]) => <tr key={feature}><th scope="row">{feature}</th><td>{ours}</td><td>{theirs}</td></tr>)}</tbody>
          </table></div>
        </section>
        <section className="compare-section">
          <h2 className="compare-h2">Choose Am I Up for screenshot and text imports</h2>
          <p>Paste bookmaker text or upload a bet-slip screenshot, parse the bets, then check the saved records. You do not need to connect a bookmaker account. Parsing logs bets automatically, with Undo available for 30 seconds. AI can make mistakes, so check the saved details.</p>
          <p>The <Link href="/">free bet tracker</Link> includes your dashboard, separate books and CSV export. Daily limits apply to AI parsing and automatic spreadsheet mapping; manual entry remains available when you reach an AI limit. No credit card is required.</p>
          <p><Link href="/learn/import-bet-screenshots">See the screenshot import walkthrough</Link> or <Link href="/sample">explore a sample profile</Link> to see the charts and betting record before creating an account.</p>
        </section>
        <section className="compare-section"><h2 className="compare-h2">When {comparison.name} may suit you better</h2><p>{comparison.strengths}</p></section>
        <section className="compare-section"><h2 className="compare-h2">Bringing your existing betting history</h2><p>{comparison.migration}</p><p>Trying a tracker does not require deleting your old account or original files. Start with a small export to check that the workflow fits.</p></section>
        <section className="compare-section">
          <h2 className="compare-h2">A few things to know</h2>
          <div className="compare-faq">
            <div className="compare-faq-item"><h3 className="compare-faq-q">Why is Am I Up free?</h3><p className="compare-faq-a">Founder Neil Macdonald has made a living from professional gambling, his newsletter and other ventures. Offering Am I Up free is his way of giving back to the community that has given him so much. <Link href="/author/neil-macdonald">Meet Neil</Link>.</p></div>
            <div className="compare-faq-item"><h3 className="compare-faq-q">Does Am I Up fetch closing odds automatically?</h3><p className="compare-faq-a">No. You supply the closing odds; Am I Up uses them to calculate closing line value. <Link href="/learn/clv">Learn how CLV works</Link>.</p></div>
            <div className="compare-faq-item"><h3 className="compare-faq-q">What does a public profile show?</h3><p className="compare-faq-a">If you enable a public profile, it shows performance statistics and settled bets. Pending bets are excluded. Review your sharing settings before publishing a profile.</p></div>
            <div className="compare-faq-item"><h3 className="compare-faq-q">Can I export my bets?</h3><p className="compare-faq-a">Yes. Am I Up provides CSV export so you can keep a copy of your betting record.</p></div>
          </div>
        </section>
        <section className="compare-section"><h2 className="compare-h2">Sources and scope</h2><p>This comparison covers the workflows described above, rather than every feature or subscription option. Check the provider for current terms.</p><ul className="compare-list">{comparison.sources.map(([label, url]) => <li key={url}><a href={url}>{label}</a></li>)}</ul></section>
        <section className="compare-cta"><div><div className="compare-cta-title">Try your next bet slip in Am I Up</div><div className="compare-cta-sub">Free bet tracking. No credit card.</div></div><Link href="/sign-in" className="btn-primary" style={{ padding: "12px 22px", fontSize: 15, textDecoration: "none" }}>Start tracking free →</Link></section>
        <footer className="compare-foot"><Link href="/">Free bet tracker</Link><Link href="/compare">All comparisons</Link><Link href="/sample">Sample profile</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></footer>
      </main>
    </div>
  );
}
