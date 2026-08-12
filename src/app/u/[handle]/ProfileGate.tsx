"use client";

// ProfileGate — the sign-up wall on public profiles. Anonymous viewers
// see a CTA; anyone signed in sees the full report.
//
//   Signed-out visitor    → sign-up CTA with a blurred KPI teaser
//                            ("sign up to unlock" — high-intent conversion
//                            surface).
//   Signed-in stranger    → full content, no gate. Signing up buys them
//                            access to every user's full report, including
//                            every settled bet. That's the deal.
//   Profile owner         → full content, no gate.
//   /u/sample handle      → always full content (marketing tour bypass).
//
// Policy note (v3, 2026-08):
//   Previously the deep report was owner-only; signed-in strangers got a
//   "private to owner" card. Neil's product call to reverse that: the
//   sign-up wall is the only barrier, and once past it a viewer sees the
//   entire bet history. Pending bets are still hidden from strangers
//   (page.tsx filters them out) so live picks don't leak — but every
//   settled bet is visible, which is what makes the shared profile a
//   real receipt.
//
// Why client-side gating:
//   Supabase JS stores sessions in localStorage, not cookies, so the
//   server can't read auth state during the SSR pass without a major
//   infrastructure change. Client-side is fine here — the data is
//   already user-public by definition. We're creating a privacy layer,
//   not protecting secrets that the server itself must guard.

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";

interface ProfileGateProps {
  handle: string;
  /** Auth user_id of the profile owner. When the signed-in viewer's
   *  id matches this, the gate is bypassed and the deep report renders. */
  ownerUserId?: string;
  /** Optional book slug when this gate is rendered on the per-book
   *  route (/u/<handle>/<bookSlug>). If set, the sign-up returnTo
   *  preserves the slug so viewers of a book-specific URL come back
   *  to the SAME book after auth — never bounced to the bare handle
   *  where they might land on a different public book. */
  bookSlug?: string;
  children: ReactNode;
}

export function ProfileGate({
  handle,
  ownerUserId,
  bookSlug,
  children,
}: ProfileGateProps) {
  const { user, loading } = useAuth();

  // The sample profile is our marketing tour — never gated.
  if (handle === "sample") {
    return <>{children}</>;
  }

  // While auth is resolving, render nothing rather than briefly
  // flashing gate content that then swaps to owner content (or vice
  // versa) on a slow connection.
  if (loading) return null;

  // Any signed-in viewer (owner or stranger) → full report. Once you
  // have an AmIUp account you can see every public profile's deep
  // report, including full bet history. The signup CTA is the only
  // gate.
  if (user) {
    // Suppress the unused-variable warning without changing the
    // signature — ownerUserId is still passed in from the profile
    // pages for future policy tweaks (e.g. per-user privacy toggles).
    void ownerUserId;
    return <>{children}</>;
  }

  // Signed-out visitor → the signup CTA (existing high-intent conversion).
  return <SignUpGate handle={handle} bookSlug={bookSlug} />;
}

// ─ The gate itself ───────────────────────────────────────────────────────

function SignUpGate({
  handle,
  bookSlug,
}: {
  handle: string;
  bookSlug?: string;
}) {
  // Returnto sends the user back to this exact profile after sign-in,
  // so the gate dissolves seamlessly into the full report. When we're
  // on the per-book route, include the slug so the viewer lands back
  // on the same book, not on whichever book the bare handle happens
  // to resolve to for that user.
  const returnPath = bookSlug ? `/u/${handle}/${bookSlug}` : `/u/${handle}`;
  const signUpHref = `/sign-in?returnTo=${encodeURIComponent(returnPath)}`;

  // The visible-but-blurred KPI teaser. Numbers are deliberately
  // illustrative — they're a visual hint at the depth of the gated
  // report, not real metrics. The blur on top makes it impossible
  // to read but easy to see the SHAPE of what's hidden.
  const teaserKpis: Array<{ label: string; value: string }> = [
    { label: "YIELD", value: "+4.1%" },
    { label: "ROC", value: "+28%" },
    { label: "CLV", value: "+0.8%" },
    { label: "WIN RATE", value: "53%" },
    { label: "MAX DD", value: "−8%" },
    { label: "MEDIAN ODDS", value: "1.95" },
  ];

  return (
    <section className="profile-gate" aria-label="Sign up to see the full report">
      {/* Decorative blurred preview at the top — same visual rhythm as
          the real KPI grid would have, but unreadable, suggesting depth. */}
      <div className="profile-gate-teaser" aria-hidden="true">
        {teaserKpis.map((k) => (
          <div key={k.label} className="profile-gate-teaser-kpi">
            <div className="profile-gate-teaser-label">{k.label}</div>
            <div className="profile-gate-teaser-value">{k.value}</div>
          </div>
        ))}
      </div>

      {/* The conversion card itself */}
      <div className="profile-gate-card">
        <div className="profile-gate-eyebrow">
          <span className="profile-gate-dot" aria-hidden="true" />
          Sign up to unlock
        </div>
        <h2 className="profile-gate-title">
          See <span className="profile-gate-handle">@{handle}</span>
          &rsquo;s full report
        </h2>
        <ul className="profile-gate-list">
          <li>
            <strong>Yield, ROC, CLV vs Pinnacle close</strong> — the real
            edge metrics, not vanity stats.
          </li>
          <li>
            <strong>Win rate, max drawdown, median odds</strong> — see
            how the curve was actually earned.
          </li>
          <li>
            <strong>Breakdown by sport, market, odds range</strong> —
            where the profit comes from.
          </li>
          <li>
            <strong>Monthly P/L for the last 18 months</strong> + the
            full CLV distribution chart.
          </li>
          <li>
            <strong>Every settled bet</strong>, full history — event,
            selection, odds, stake, P/L on each. Nothing hidden.
          </li>
        </ul>
        <Link href={signUpHref} className="btn-primary profile-gate-cta">
          Sign up free to see the full report →
        </Link>
        <p className="profile-gate-fine">
          No credit card. You get your own public profile too — drop a
          link in your X bio, prove your edge with receipts.
        </p>
      </div>
    </section>
  );
}
