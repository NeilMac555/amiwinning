"use client";

// ProfileGate — wraps the deep-analysis sections of a public profile so
// they're only shown to signed-in viewers. Signed-out viewers see a
// sign-up CTA instead, with a blurred KPI teaser hinting at what's
// behind the gate.
//
// Why gate this:
//   The snapshot (identity + lifetime P/L + equity curve) is enough to
//   verify "this person is real and has an edge." The deep KPIs, market
//   breakdowns, monthly P/L, CLV distribution, and recent-bets table
//   are the real value. Gating them turns every X share of a profile
//   into a signup driver — viewers see enough to want more, then need
//   an account to get it.
//
// Exceptions:
//   - /u/sample is the marketing tour — always fully visible. We
//     detect it by handle and short-circuit the gate.
//   - Signed-in viewers (any account) see everything as before.
//
// Why client-side gating:
//   Supabase JS stores sessions in localStorage, not cookies, so the
//   server can't read auth state during the SSR pass without a major
//   infrastructure change. Client-side is fine here — the data is
//   already user-public by definition. We're creating signup
//   incentive, not protecting secrets.

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";

interface ProfileGateProps {
  handle: string;
  /** Optional book slug when this gate is rendered on the per-book
   *  route (/u/<handle>/<bookSlug>). If set, the sign-up returnTo
   *  preserves the slug so viewers of a book-specific URL come back
   *  to the SAME book after auth — never bounced to the bare handle
   *  where they might land on a different public book. */
  bookSlug?: string;
  children: ReactNode;
}

export function ProfileGate({ handle, bookSlug, children }: ProfileGateProps) {
  const { user } = useAuth();

  // The sample profile is our marketing tour — never gated.
  if (handle === "sample") {
    return <>{children}</>;
  }

  // Signed-in viewers see the full report regardless of whose profile.
  if (user) {
    return <>{children}</>;
  }

  // Signed-out: replace the gated sections with a sign-up CTA card.
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
