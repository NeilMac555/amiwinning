import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { buildBreadcrumbList } from "@/lib/breadcrumb-schema";

const comparison = {
  "slug": "betdiary",
  "name": "BetDiary",
  "title": "Free BetDiary Alternative: AI Bet Tracker",
  "description": "Compare Am I Up and BetDiary: AI screenshot imports, bet analytics, CSV export and closing odds. Find the free bet tracker that fits your workflow.",
  "intro": "Choosing between Am I Up and BetDiary? Am I Up focuses on importing the bets you already have in screenshots, text and spreadsheets. BetDiary also offers odds movement tools and automatic closing odds for matched bets.",
  "rows": [
    [
      "Bet entry",
      "AI text and screenshot imports; manual entry also available",
      "Match and market autocomplete"
    ],
    [
      "Closing odds",
      "Enter closing odds yourself to calculate CLV",
      "Automatic closing odds for bets matched through autocomplete"
    ],
    [
      "Analysis",
      "Profit and loss, yield, equity curve and sport / market breakdowns",
      "ROI, profit, units, odds movement and closing-odds statistics"
    ]
  ],
  "strengths": "BetDiary is worth considering if automatic closing odds are your priority. Its documentation describes matching bets to Cloudbet odds using both match and market/selection autocomplete. Am I Up currently requires you to supply closing odds. BetDiary also advertises tracking across sports and bookmakers.",
  "migration": "If you export your BetDiary history to a spreadsheet, Am I Up can import CSV and Excel files with a column-mapping preview. Keep the original file. Review dates, odds, stakes and settlement results before saving, and compare the imported records with your original export. Compatibility depends on the columns and formats in your file.",
  "sources": [
    [
      "BetDiary product overview",
      "https://betdiary.io/"
    ],
    [
      "BetDiary automatic closing odds documentation",
      "https://betdiary.io/new-feature-automatic-closing-odds-for-all-your-bets/"
    ]
  ]
};

export const metadata: Metadata = {
  title: comparison.title,
  description: comparison.description,
  alternates: { canonical: "/compare/betdiary" },
  openGraph: { title: comparison.title + " | Am I Up", description: comparison.description, type: "article" },
  twitter: { card: "summary_large_image", title: comparison.title + " | Am I Up", description: comparison.description },
};

export default function ComparePage() {
  const breadcrumb = buildBreadcrumbList([
    { name: BRAND.name, url: "https://amiup.io" },
    { name: "Compare", url: "https://amiup.io/compare" },
    { name: comparison.name, url: "https://amiup.io/compare/betdiary" },
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
          <p>Paste bookmaker text or upload a bet-slip screenshot, review the extracted bets, then save. You do not need to connect a bookmaker account. AI can make mistakes, so the review step matters.</p>
          <p>The <Link href="/">free bet tracker</Link> includes your dashboard, separate books and CSV export. Daily limits apply to AI parsing and automatic spreadsheet mapping; manual entry remains available when you reach an AI limit. No credit card is required.</p>
          <p><Link href="/sample">Explore a sample profile</Link> to see the charts and betting record before creating an account.</p>
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
        <section className="compare-cta"><div><div className="compare-cta-title">Try your next bet slip in Am I Up</div><div className="compare-cta-sub">Free bet tracking. Review before saving. No credit card.</div></div><Link href="/sign-in" className="btn-primary" style={{ padding: "12px 22px", fontSize: 15, textDecoration: "none" }}>Start tracking free →</Link></section>
        <footer className="compare-foot"><Link href="/">Free bet tracker</Link><Link href="/compare">All comparisons</Link><Link href="/sample">Sample profile</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></footer>
      </main>
    </div>
  );
}
