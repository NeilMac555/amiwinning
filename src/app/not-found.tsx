// Branded 404 page. Hit when notFound() is called or when a URL doesn't
// match any route. Friendly copy + dashboard link.

import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false },
};

export default function NotFoundPage() {
  return (
    <div className="legal-page">
      <div className="legal-topbar">
        <Link href="/" className="brand" style={{ textDecoration: "none" }}>
          <div className="brand-mark" aria-hidden="true"></div>
          <span>{BRAND.name}</span>
        </Link>
      </div>
      <main className="legal-main legal-main--center">
        <p
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--text-faint)",
            marginBottom: 8,
          }}
        >
          404
        </p>
        <h1 className="legal-title">Nothing here.</h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-muted)",
            lineHeight: 1.55,
            marginTop: 4,
          }}
        >
          This page either never existed, was moved, or was a profile that
          went private. Either way: dead end.
        </p>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginTop: 24,
          }}
        >
          <Link
            href="/"
            className="btn-primary"
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
