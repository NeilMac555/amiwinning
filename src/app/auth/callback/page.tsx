"use client";

// Magic-link landing page. Supabase's client SDK (with `detectSessionInUrl`)
// automatically picks up the ?code= param and exchanges it for a session as
// soon as the page boots. We just wait for the auth state to flip, then
// redirect home.

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

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
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)",
        fontSize: 13,
        background: "var(--bg)",
      }}
    >
      Signing you in…
    </div>
  );
}
