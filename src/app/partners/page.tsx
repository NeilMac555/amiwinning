import type { Metadata } from "next";
import Link from "next/link";
import { PartnerApplicationForm } from "@/components/PartnerApplicationForm";

const title = "Creator partners: get paid to track with Am I Up";
const description = "Have a betting audience? Apply for a paid creator partnership. Make Am I Up your primary tracker and share your experience. Terms agreed individually.";
export const metadata: Metadata = {
  title, description, alternates: { canonical: "/partners" },
  openGraph: { title, description, type: "website", url: "https://amiup.io/partners" },
  twitter: { card: "summary_large_image", title, description },
};

export default function PartnersPage() {
  return (
    <div className="learn-page">
      <header className="legal-topbar"><Link href="/" className="brand">Am I Up</Link><Link href="#apply" className="btn-primary">Apply to partner →</Link></header>
      <main className="learn-main creator-partners-page">
        <nav className="learn-crumbs" aria-label="Breadcrumb"><Link href="/">Am I Up</Link><span>›</span><span>Creator partners</span></nav>
        <p className="creator-kicker">Paid creator partnerships · Applications open</p>
        <h1 className="learn-title">Have an audience?<br />Get paid to track with Am I Up.</h1>
        <p className="learn-deck">Share your bets on X, Telegram, YouTube, a newsletter or another social channel? We’re looking for creators who want to move their record to Am I Up, make it their primary tracker and introduce it to their audience.</p>
        <p><a href="#apply" className="btn-primary">Apply to become a creator partner →</a></p>
        <p className="compare-fine">A small, manually reviewed pilot. Payment and deliverables agreed before you start.</p>
        <section className="learn-section"><h2 className="learn-h2">Your record. Your audience. A paid partnership.</h2>
          <p>You bring an engaged audience and an honest account of your experience. We offer an individually agreed paid collaboration for using and demonstrating the tracker. Am I Up remains free for your followers.</p>
          <ul className="learn-list"><li><strong>Move your record over.</strong> Import your existing CSV or Excel history, or log bets from text and screenshots.</li><li><strong>Make it your primary tracker.</strong> Maintain a public record and share results consistently, including losing periods.</li><li><strong>Show your audience how it works.</strong> Create a walkthrough, post or newsletter feature in your own voice, clearly identifying the paid partnership.</li></ul>
          <p>We agree the scope, fee, payment schedule and any capped referral bonus directly with each accepted creator. Applying does not commit you to anything or guarantee a paid place.</p>
        </section>
        <section className="learn-section"><h2 className="learn-h2">You don’t need a huge following.</h2><p>Relevant followers, genuine engagement and a willingness to use the product matter more than a headline follower count. Tell us about your community and how you would introduce the tracker.</p><p>Payment is for the agreed creator work, not for betting more or producing a profitable record. No minimum number of new wagers is required to apply.</p></section>
        <section className="learn-section" id="apply"><h2 className="learn-h2">Tell us about yourself</h2><p>No account needed. Neil reviews applications personally and will contact you if there’s a fit.</p><PartnerApplicationForm /><p>Prefer to contact Neil directly? <a href="mailto:filthyjabba@gmail.com?subject=Am%20I%20Up%20creator%20partnership">Email Neil</a> or find <a href="https://x.com/NeilMac555">@NeilMac555 on X</a>.</p></section>
        <footer className="learn-foot"><Link href="/">Free bet tracker</Link><Link href="/sample">Explore a sample profile</Link><Link href="/privacy">Privacy</Link></footer>
      </main>
    </div>
  );
}
