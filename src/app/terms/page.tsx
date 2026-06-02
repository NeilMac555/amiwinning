// Terms of Service — stub content suitable for an MVP-stage tracker.
// Plain English, no boilerplate fluff. Consult a real lawyer if you scale.

import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${BRAND.name}.`,
};

export default function TermsPage() {
  return (
    <div className="legal-page">
      <header className="legal-topbar">
        <Link href="/" className="brand" style={{ textDecoration: "none" }}>
          <div className="brand-mark" aria-hidden="true"></div>
          <span>{BRAND.name}</span>
        </Link>
      </header>
      <main className="legal-main">
        <h1 className="legal-title">Terms of Service</h1>
        <p className="legal-meta">
          Last updated: 2 June 2026
        </p>

        <section className="legal-section">
          <h2>What this app does</h2>
          <p>
            {BRAND.name} is a personal sports bet tracking tool. You log the
            bets you place with third-party bookmakers; we store them, run
            analytics on them, and let you share a public profile of your
            aggregate performance.
          </p>
          <p>
            We are <strong>not</strong> a bookmaker, broker, or financial
            adviser. We do not place bets on your behalf, take money for
            placement of bets, give betting tips, or guarantee any outcome.
            Every bet you log is one you placed yourself, somewhere else.
          </p>
        </section>

        <section className="legal-section">
          <h2>Use at your own risk</h2>
          <p>
            Sports betting carries real financial risk. Past performance,
            including any numbers shown on a {BRAND.name} profile, does not
            predict future returns. Information shown in the app may contain
            errors, be incomplete, or be out of date.
          </p>
          <p>
            You are solely responsible for your own betting decisions and any
            losses you incur. We provide the tracking infrastructure; we
            don&rsquo;t recommend bets and we don&rsquo;t verify the accuracy
            of what you log.
          </p>
          <p>
            If you find yourself betting beyond your means or chasing losses,
            please seek help. In the UK:{" "}
            <a
              href="https://www.begambleaware.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              BeGambleAware
            </a>
            . US:{" "}
            <a
              href="https://www.ncpgambling.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              National Council on Problem Gambling
            </a>
            .
          </p>
        </section>

        <section className="legal-section">
          <h2>Accounts</h2>
          <p>
            To save bets, sync across devices, and publish a public profile,
            you need an account. You verify your email by clicking a magic
            link we send. You agree to give us a working email address you
            actually own.
          </p>
          <p>
            One account per person. Don&rsquo;t impersonate someone else, log
            in to an account that isn&rsquo;t yours, or attempt to circumvent
            our rate limits or quotas.
          </p>
          <p>
            We may suspend or delete accounts that break these terms, harm
            other users, abuse our API, or appear to be automated bots. We
            will try to give notice and let you export your data before any
            such action where reasonably possible.
          </p>
        </section>

        <section className="legal-section">
          <h2>Your content</h2>
          <p>
            The bets, notes, tags, display name, bio, and profile image you
            upload remain yours. By publishing a public profile, you grant us
            the limited right to display the data you marked public at the
            URL you chose, and to generate a social-card image from it.
            You can revoke this at any time by turning your profile private
            in Settings.
          </p>
          <p>
            We don&rsquo;t sell your data, your bet history, or your analytics
            to advertisers, bookmakers, or anyone else. We don&rsquo;t train
            machine-learning models on it. Your bets are not anyone&rsquo;s
            business but yours.
          </p>
        </section>

        <section className="legal-section">
          <h2>Service availability</h2>
          <p>
            We make a reasonable effort to keep the app up and your data
            safe — daily database backups, encrypted at rest, RLS-isolated
            per user. We can&rsquo;t guarantee 100% uptime, instant sync, or
            that any specific feature will exist forever.
          </p>
          <p>
            We may add, remove, or change features without notice. If we
            shut the service down, we&rsquo;ll give you reasonable time and a
            way to export your data first.
          </p>
        </section>

        <section className="legal-section">
          <h2>Liability</h2>
          <p>
            To the maximum extent permitted by law, our liability to you
            for any claim arising out of or related to {BRAND.name} is
            limited to the amount you paid us in the twelve months before
            the claim, which is zero for free accounts.
          </p>
          <p>
            We are not liable for any indirect, incidental, or consequential
            losses, including lost profits or lost bets. Even in disaster
            scenarios where our service is unavailable when a tipster wants
            to share their profile, we&rsquo;re not liable for missed
            audience or revenue.
          </p>
        </section>

        <section className="legal-section">
          <h2>Governing law</h2>
          <p>
            These terms are governed by the laws of England and Wales. Any
            dispute will be heard in the English courts.
          </p>
        </section>

        <section className="legal-section">
          <h2>Changes to these terms</h2>
          <p>
            We may update these terms. When we do, we&rsquo;ll change the
            &ldquo;Last updated&rdquo; date at the top and, for material
            changes, notify you in the app or by email. Continued use after
            an update means you accept the new terms.
          </p>
        </section>

        <section className="legal-section">
          <h2>Contact</h2>
          <p>
            Questions about these terms: <a href="mailto:hello@amiup.io">hello@amiup.io</a>
          </p>
        </section>

        <footer className="legal-foot">
          <Link href="/">← Back to {BRAND.name}</Link>
          <span className="legal-foot-sep">·</span>
          <Link href="/privacy">Privacy Policy</Link>
        </footer>
      </main>
    </div>
  );
}
