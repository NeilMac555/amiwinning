"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { applyTheme } from "@/lib/settings";

export default function SignInPage() {
  const router = useRouter();
  const { user, loading, configured, signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    applyTheme();
  }, []);

  // If already signed in, bounce to dashboard.
  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await signInWithEmail(email);
    if (error) {
      setError(error);
      setSubmitting(false);
      return;
    }
    setSent(true);
    setSubmitting(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--bg)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            fontWeight: 600,
            fontSize: 14,
            letterSpacing: "-0.01em",
            color: "var(--text)",
            textDecoration: "none",
            marginBottom: 32,
            justifyContent: "center",
          }}
        >
          <span className="brand-mark" aria-hidden="true" />
          Am I Winning
        </Link>

        <div className="card" style={{ padding: 24 }}>
          {!configured ? (
            <NotConfiguredPanel />
          ) : sent ? (
            <SentPanel email={email} onUseDifferent={() => setSent(false)} />
          ) : (
            <form onSubmit={submit}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: "-0.015em",
                  marginBottom: 4,
                  fontFamily: "var(--serif)",
                  fontVariationSettings: '"opsz" 36',
                }}
              >
                Sign in
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--text-muted)",
                  marginBottom: 18,
                }}
              >
                Enter your email — we&rsquo;ll send a one-tap sign-in link. No
                password. New here? Same flow signs you up.
              </div>

              <label
                style={{
                  display: "block",
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: 5,
                }}
              >
                Email
              </label>
              <input
                type="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: "100%",
                  padding: "9px 11px",
                  fontSize: 13,
                  fontFamily: "var(--sans)",
                  background: "var(--surface)",
                  border: "var(--border-w) solid var(--border-strong)",
                  borderRadius: 5,
                  color: "var(--text)",
                  marginBottom: 16,
                }}
              />

              {error && (
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--red)",
                    marginBottom: 12,
                    padding: "8px 10px",
                    border: "var(--border-w) solid var(--red)",
                    borderRadius: 5,
                    background: "var(--red-bg)",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !email.trim()}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "var(--sans)",
                  background: "var(--text)",
                  color: "var(--bg)",
                  border: 0,
                  borderRadius: 6,
                  cursor: submitting || !email.trim() ? "not-allowed" : "pointer",
                  opacity: submitting || !email.trim() ? 0.5 : 1,
                }}
              >
                {submitting ? "Sending link…" : "Email me a sign-in link"}
              </button>
            </form>
          )}
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 18,
            fontSize: 11.5,
            color: "var(--text-faint)",
          }}
        >
          By signing in you agree to keep your bet log honest.
        </div>
      </div>
    </div>
  );
}

function SentPanel({
  email,
  onUseDifferent,
}: {
  email: string;
  onUseDifferent: () => void;
}) {
  return (
    <>
      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: "-0.015em",
          marginBottom: 6,
          fontFamily: "var(--serif)",
          fontVariationSettings: '"opsz" 36',
        }}
      >
        Check your email
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          marginBottom: 18,
        }}
      >
        We sent a sign-in link to{" "}
        <span className="mono" style={{ color: "var(--text)" }}>
          {email}
        </span>
        . Click it and you&rsquo;re in. Link expires in an hour.
      </div>
      <button
        onClick={onUseDifferent}
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          background: "none",
          border: 0,
          padding: 0,
          cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        Use a different email
      </button>
    </>
  );
}

function NotConfiguredPanel() {
  return (
    <>
      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: "-0.015em",
          marginBottom: 6,
          fontFamily: "var(--serif)",
          fontVariationSettings: '"opsz" 36',
        }}
      >
        Auth isn&rsquo;t wired up yet
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: "var(--text-muted)",
          lineHeight: 1.5,
          marginBottom: 14,
        }}
      >
        To enable email sign-in, create a Supabase project and add these to
        your <span className="mono">.env.local</span>:
      </div>
      <pre
        className="mono"
        style={{
          fontSize: 11.5,
          padding: 12,
          background: "var(--surface-2)",
          border: "var(--border-w) solid var(--border)",
          borderRadius: 5,
          margin: 0,
          color: "var(--text-muted)",
          whiteSpace: "pre-wrap",
        }}
      >{`NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...`}</pre>
      <div
        style={{
          fontSize: 11.5,
          color: "var(--text-faint)",
          marginTop: 12,
        }}
      >
        Restart the dev server after pasting them in. Until then, the dashboard
        runs on localStorage only.
      </div>
    </>
  );
}
