// Privacy Policy — plain English, MVP scope.
// Covers what we collect, where it goes, who processes it, GDPR rights.

import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${BRAND.name}.`,
};

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <header className="legal-topbar">
        <Link href="/" className="brand" style={{ textDecoration: "none" }}>
          <div className="brand-mark" aria-hidden="true"></div>
          <span>{BRAND.name}</span>
        </Link>
      </header>
      <main className="legal-main">
        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-meta">Last updated: 2 June 2026</p>

        <section className="legal-section">
          <h2>The short version</h2>
          <p>
            We collect the minimum information needed to run a bet tracker:
            your email, your bets, your settings. We store it in a managed
            database in the EU. We don&rsquo;t sell it, share it, advertise
            against it, or train AI on it. You can export it or delete it
            whenever you want.
          </p>
        </section>

        <section className="legal-section">
          <h2>What we collect</h2>
          <ul>
            <li>
              <strong>Your email address</strong> — required to create an
              account so you can sync bets across devices.
            </li>
            <li>
              <strong>Your bets</strong> — every bet you log, including the
              event, selection, odds, stake, status, result, tipster, tags,
              notes, and timestamps. Plus any closing-line prices and
              CLV/profit derived from them.
            </li>
            <li>
              <strong>Your profile</strong> — handle, optional display name,
              optional bio, optional avatar image, public/private flag.
            </li>
            <li>
              <strong>Settings</strong> — preferred currency unit, theme,
              active book selection.
            </li>
            <li>
              <strong>Infrastructure logs</strong> — IP address, browser
              user-agent, and timestamps of requests, retained for up to 30
              days for abuse-prevention and debugging. We don&rsquo;t link
              these to your identity for any other purpose.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>What we don&rsquo;t collect</h2>
          <ul>
            <li>Real-world identity (no full name, address, or ID required)</li>
            <li>Payment details (the app is free; we don&rsquo;t take payments)</li>
            <li>Bookmaker account credentials</li>
            <li>Information about anyone besides you</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Where it lives</h2>
          <p>
            Your data is stored in a managed Postgres database operated by{" "}
            <a
              href="https://supabase.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Supabase
            </a>
            , hosted in the eu-west-1 AWS region (Ireland). Daily backups
            with 7-day point-in-time recovery are managed by Supabase.
          </p>
          <p>
            Row-Level Security at the database layer means even other
            authenticated users can&rsquo;t see your private books or bets.
            Only public-profile data (aggregate stats, last 30 settled bets
            from your chosen public book) is visible at your{" "}
            <Link href="/">/u/your-handle</Link> URL, and only if you have
            the public-profile toggle on.
          </p>
        </section>

        <section className="legal-section">
          <h2>Who processes it on our behalf</h2>
          <ul>
            <li>
              <strong>Supabase</strong> — database, authentication, file
              storage (for profile avatars). EU-hosted, GDPR-compliant.
            </li>
            <li>
              <strong>Resend</strong> — sending the magic-link sign-in
              emails. Receives your email address only.
            </li>
            <li>
              <strong>Anthropic (Claude)</strong> — when you use the paste
              parser to extract bets from free text, the text you paste is
              sent to Anthropic for processing. The model never sees your
              email or any account identifier. Pasted text is not retained
              beyond the request.
            </li>
            <li>
              <strong>Railway</strong> — hosts the application server.
              Receives requests as part of routing.
            </li>
          </ul>
          <p>
            We don&rsquo;t use third-party analytics scripts, ad networks,
            or cross-site trackers. There&rsquo;s no Google Analytics, no
            Facebook pixel, no Hotjar. The only cookies set are the ones
            Supabase uses to keep you signed in.
          </p>
        </section>

        <section className="legal-section">
          <h2>Your rights</h2>
          <p>If you&rsquo;re in the UK, EU, or anywhere with comparable data laws, you have the right to:</p>
          <ul>
            <li>
              <strong>Access</strong> your data — go to Settings &gt; Your
              data &gt; Export to CSV. You get every bet you&rsquo;ve
              logged. Email us if you want the profile / settings data too
              and we&rsquo;ll send it.
            </li>
            <li>
              <strong>Correct</strong> your data — edit any bet or profile
              field in the app directly.
            </li>
            <li>
              <strong>Delete</strong> your data — email us at{" "}
              <a href="mailto:privacy@amiup.io">privacy@amiup.io</a> and
              we&rsquo;ll delete your account and bets within 30 days.
              (Self-serve deletion is on the roadmap.)
            </li>
            <li>
              <strong>Restrict processing</strong> — turn your profile
              private in Settings to remove it from public discovery, then
              stop using the app until you&rsquo;re ready.
            </li>
            <li>
              <strong>Object</strong> to processing — if you think
              we&rsquo;re processing your data unfairly, tell us at{" "}
              <a href="mailto:privacy@amiup.io">privacy@amiup.io</a>.
            </li>
            <li>
              <strong>Complain</strong> to a supervisory authority. In the
              UK that&rsquo;s the{" "}
              <a
                href="https://ico.org.uk/"
                target="_blank"
                rel="noopener noreferrer"
              >
                ICO
              </a>
              .
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>How long we keep your data</h2>
          <p>
            For as long as your account exists. When you delete your
            account, all your bets, books, profile, and avatar are removed
            within 30 days. Backups may retain copies for an additional 30
            days before being overwritten.
          </p>
          <p>
            Infrastructure logs (IP, user-agent, timestamps) are retained
            for up to 30 days then deleted.
          </p>
        </section>

        <section className="legal-section">
          <h2>Children</h2>
          <p>
            {BRAND.name} is not intended for anyone under 18. We don&rsquo;t
            knowingly collect data from children. If you believe we have,
            contact us and we&rsquo;ll delete it immediately.
          </p>
        </section>

        <section className="legal-section">
          <h2>Changes to this policy</h2>
          <p>
            We&rsquo;ll update the &ldquo;Last updated&rdquo; date when this
            policy changes. For material changes, we&rsquo;ll notify you in
            the app or by email before the new policy takes effect.
          </p>
        </section>

        <section className="legal-section">
          <h2>Contact</h2>
          <p>
            Privacy questions, data requests, or anything else:{" "}
            <a href="mailto:privacy@amiup.io">privacy@amiup.io</a>
          </p>
        </section>

        <footer className="legal-foot">
          <Link href="/">← Back to {BRAND.name}</Link>
          <span className="legal-foot-sep">·</span>
          <Link href="/terms">Terms of Service</Link>
        </footer>
      </main>
    </div>
  );
}
