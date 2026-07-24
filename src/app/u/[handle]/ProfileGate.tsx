"use client";

// ProfileGate — wraps the deep-analysis sections of a public profile so
// they're only shown to the profile owner. Everyone else sees a gate:
//
//   Signed-out visitor    → sign-up CTA with a blurred KPI teaser
//                            ("sign up to unlock" — high-intent conversion
//                            surface, unchanged from v1).
//   Signed-in stranger    → "private to owner" card. They're already a
//                            user; asking them to sign up again would be
//                            confusing. Instead we're transparent: the
//                            profile owner keeps their deep report to
//                            themselves.
//   Profile owner         → full content, no gate.
//   /u/sample handle      → always full content (marketing tour bypass).
//
// Why owner-only for the whole deep report (v2, 2026-07):
//   The signed-in-stranger case previously saw the full KPI grid, market
//   breakdowns, monthly P/L, and recent-bets table. That exposed
//   competitive/strategic detail — where the owner leaks, where they
//   win, and their upcoming individual selections — to anyone with an
//   AmIUp account. Users shouldn't have to trade their strategy privacy
//   for a shareable profile URL.
//
// What non-owners can still see (above the gate, in page.tsx):
//   Identity (name, handle, avatar), lifetime P/L, and the equity
//   curve. Enough to verify "this person is real and has an edge" —
//   the proof-of-edge share hook is preserved.
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

  // Owner viewing their own profile → full report.
  if (user && ownerUserId && user.id === ownerUserId) {
    return <>{children}</>;
  }

  // Signed-in stranger → a distinct "private to owner" card. Different
  // from the signup CTA because asking a signed-in user to sign up
  // makes no sense.
  if (user) {
    return <PrivateToOwnerGate handle={handle} />;
  }

  // Signed-out visitor → the signup CTA (existing high-intent conversion).
  return <SignUpGate handle={handle} bookSlug={bookSlug} />;
}

// ─ Private-to-owner gate (signed-in stranger) ──────────────────────────
// Shown when the viewer is a signed-in AmIUp user but not the profile
// owner. No sign-up CTA — they're already a user. Just an honest
// message that the owner keeps their deep report private, with a
// pointer to build their own if they want one.

function PrivateToOwnerGate({ handle }: { handle: string }) {
  return (
    <section
      className="profile-gate profile-gate--private"
      aria-label="Deep report is private to the owner"
    >
      <div className="profile-gate-card">
        <div className="profile-gate-eyebrow">
          <span className="profile-gate-dot" aria-hidden="true" />
          Private to owner
        </div>
        <h2 className="profile-gate-title">
          <span className="profile-gate-handle">@{handle}</span>&rsquo;s
          detailed report is private.
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 20px" }}>
          The lifetime P/L and equity curve above are the public snapshot.
          The KPI grid, per-market breakdown, monthly P/L, and recent bets
          are kept private to the profile owner.
        </p>
        <Link href="/" className="btn-primary profile-gate-cta">
          Build your own profile →
        </Link>
        <p className="profile-gate-fine">
          Free. Your data stays yours. You choose what to make public.
        </p>
      </div>
    </section>
  );
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
            <strong>The last 30 settled bets</strong> with closing-line
            context on each.
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
