"use client";

// Branded error boundary. Replaces Next.js's bare-bones default 500
// screen. Triggered when a route handler or client component throws an
// uncaught error. Reset() retries the same route; the dashboard link is
// the escape hatch.

import { useEffect } from "react";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: Props) {
  useEffect(() => {
    // Surface the error in the browser console for debugging. Includes
    // the Next.js error digest so we can correlate with server logs.

    console.error("[aiw] Unhandled route error:", error);
  }, [error]);

  return (
    <div className="legal-page">
      <div className="legal-topbar">
        <Link href="/" className="brand" style={{ textDecoration: "none" }}>
          <div className="brand-mark" aria-hidden="true"></div>
          <span>{BRAND.name}</span>
        </Link>
      </div>
      <main className="legal-main legal-main--center">
        <h1 className="legal-title">Something broke.</h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-muted)",
            lineHeight: 1.55,
            marginTop: 4,
          }}
        >
          The page hit an error we didn&rsquo;t expect. Your bets are safe —
          this is a rendering hiccup, not a data loss. Try again, or head
          back to the dashboard.
        </p>
        {error.digest && (
          <p
            style={{
              fontSize: 11,
              fontFamily: "var(--mono)",
              color: "var(--text-faint)",
              marginTop: 14,
            }}
          >
            Reference: {error.digest}
          </p>
        )}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginTop: 24,
          }}
        >
          <button
            type="button"
            onClick={reset}
            className="btn-primary"
            style={{ padding: "10px 20px", fontSize: 14 }}
          >
            Try again
          </button>
          <Link
            href="/"
            className="btn-ghost"
            style={{
              padding: "10px 20px",
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
