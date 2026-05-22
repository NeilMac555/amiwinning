"use client";

// Magic-link landing page. Supabase's client SDK (with `detectSessionInUrl`)
// automatically picks up the ?code= param and exchanges it for a session as
// soon as the page boots. We just wait for the auth state to flip, then
// redirect home.

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { BRAND } from "@/lib/brand";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { user, loading, configured } = useAuth();
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    // Give the SDK a moment to consume the URL and emit the auth event.
    const t = setTimeout(() => setWaited(true), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace("/");
    } else if (waited && configured) {
      // SDK didn't pick anything up — link probably expired or already used.
      router.replace("/sign-in");
    }
  }, [loading, user, router, waited, configured]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        gap: 10,
        padding: 24,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 9,
          fontWeight: 600,
          fontSize: 14,
          letterSpacing: "-0.01em",
          color: "var(--text)",
        }}
      >
        <span className="brand-mark" aria-hidden="true" />
        {BRAND.name}
      </div>
      <div
        style={{
          fontFamily: "var(--serif)",
          fontStyle: "normal",
          fontSize: 18,
          fontWeight: 500,
          letterSpacing: "-0.015em",
          color: "var(--text-muted)",
          lineHeight: 1.25,
          fontVariationSettings: '"opsz" 36, "SOFT" 50',
          maxWidth: 280,
          textAlign: "center",
        }}
      >
        {BRAND.tagline}
      </div>
      <div
        style={{
          marginTop: 8,
          color: "var(--text-faint)",
          fontSize: 13,
        }}
      >
        Signing you in…
      </div>
    </div>
  );
}
