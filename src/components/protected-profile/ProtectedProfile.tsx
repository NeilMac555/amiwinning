"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { loadProtectedReport } from "./actions";

export function ProtectedProfile({ handle, bookSlug }: { handle: string; bookSlug?: string }) {
  const { user, loading } = useAuth();
  const [result, setResult] = useState<{ viewer: string; path: string; content: ReactNode } | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const path = bookSlug ? `/${handle}/${bookSlug}` : `/${handle}`;
  const viewer = user && !user.is_anonymous ? user.id : null;
  useEffect(() => {
    let cancelled = false;
    if (!viewer) return;
    async function load() {
      try {
        const { data } = await supabase!.auth.getSession();
        if (!data.session) throw new Error("No session");
        const content = await loadProtectedReport(data.session.access_token, handle, bookSlug);
        if (!cancelled) { setFailed(false); setResult({ viewer: viewer!, path, content }); }
      } catch {
        if (!cancelled) setFailed(true);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [viewer, handle, bookSlug, path, attempt]);

  if (viewer && result?.viewer === viewer && result.path === path) return <>{result.content}</>;
  const href = `/sign-in?returnTo=${encodeURIComponent(path)}`;
  return <div className="profile-page">
    <header className="profile-topbar"><Link href="/" className="brand">Am I Up</Link></header>
    <main className="profile-main">
      <section className="profile-gate-card" style={{ margin: "48px auto", maxWidth: 600 }}>
        <h1 className="profile-gate-title">{loading || viewer ? "Your access to the report" : "Sign up to view this betting record"}</h1>
        {loading ? <p role="status">Checking your session…</p> : viewer ? <>
          <p role="status">{failed ? "We couldn’t load the report. Please retry or sign in again." : "Loading the report securely…"}</p>
          {failed && <><button className="btn-primary" onClick={() => { setFailed(false); setAttempt(n => n + 1); }}>Retry</button><p><Link href={href}>Sign in again</Link></p></>}
        </> : <>
          <p>Create a free Am I Up account to see Neil Mac’s profit and loss, performance charts and betting history.</p>
          <Link className="btn-primary profile-gate-cta" href={href}>Create a free account →</Link>
          <p className="profile-gate-fine">Already have an account? <Link href={href}>Sign in</Link></p>
        </>}
      </section>
    </main>
  </div>;
}
