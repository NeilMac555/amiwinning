"use client";

// Inline application form for the /partners page. Posts to
// /api/partners/apply which emails Neil via Resend. No Supabase writes,
// no auth, just a structured intake.
//
// UX: single card, six fields (contact required, handle required,
// audience optional, bets/month optional, edge required, payment
// optional). Submit -> success state confirming Neil will reply.
// Server-side error surfaces inline.
//
// Honeypot: an off-screen "website" field that real users never touch;
// bots fill everything. The API silently drops submissions where it
// is populated.

import { useState } from "react";

interface FormState {
  contact: string;
  handle: string;
  audience: string;
  betsPerMonth: string;
  edge: string;
  payment: string;
  notes: string;
}

const EMPTY: FormState = {
  contact: "",
  handle: "",
  audience: "",
  betsPerMonth: "",
  edge: "",
  payment: "",
  notes: "",
};

const MAX = {
  contact: 200,
  handle: 200,
  audience: 200,
  betsPerMonth: 60,
  edge: 500,
  payment: 100,
  notes: 1000,
};

type ViewState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; message: string; rateLimited: boolean };

export function PartnerApplicationForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [honey, setHoney] = useState("");
  const [view, setView] = useState<ViewState>({ kind: "idle" });

  const update = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (view.kind === "error") setView({ kind: "idle" });
  };

  const canSubmit =
    form.contact.trim().length >= 3 &&
    form.handle.trim().length >= 2 &&
    form.edge.trim().length >= 10 &&
    view.kind !== "sending";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setView({ kind: "sending" });
    try {
      const res = await fetch("/api/partners/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          hp_verify_ref: honey,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setView({
          kind: "error",
          message: body.error ?? `Server error (HTTP ${res.status}).`,
          rateLimited: body.rateLimited === true || res.status === 429,
        });
        return;
      }
      // The server returns 200 with { dropped: true } when the honeypot
      // trips. Previously we treated 200 as unconditional success, which
      // meant users whose password manager or browser autofill happened
      // to fill the hidden field saw "Application received" while the
      // server silently dropped their submission. Now we detect it and
      // ask them to email Neil directly instead.
      if (body.dropped === true) {
        setView({
          kind: "error",
          message:
            "Your submission was flagged by the spam filter. This is almost always a browser or password manager autofilling a hidden field. Please email filthyjabba@gmail.com directly with your details.",
          rateLimited: false,
        });
        return;
      }
      setView({ kind: "sent" });
    } catch (err) {
      setView({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
        rateLimited: false,
      });
    }
  };

  if (view.kind === "sent") {
    return (
      <div
        style={{
          padding: "22px 24px",
          border: "var(--border-w) solid var(--border)",
          borderRadius: 10,
          background: "var(--surface)",
        }}
        role="status"
      >
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--green)",
            marginBottom: 6,
          }}
        >
          Application received
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
          Thanks. Neil reads every message.
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
          Expect a reply within 48 hours to the contact you provided. If you
          do not hear back, DM{" "}
          <a
            href="https://x.com/NeilMac555"
            target="_blank"
            rel="noopener noreferrer"
          >
            @NeilMac555
          </a>{" "}
          on X and mention you submitted the form.
        </div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    fontSize: 13,
    fontFamily: "var(--sans)",
    background: "var(--surface-2)",
    color: "var(--text)",
    border: "var(--border-w) solid var(--border-strong)",
    borderRadius: 6,
    outline: "none",
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontFamily: "var(--mono)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    marginBottom: 4,
  };
  const helpStyle: React.CSSProperties = {
    fontSize: 11,
    color: "var(--text-faint)",
    marginTop: 4,
  };

  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: "22px 24px",
        border: "var(--border-w) solid var(--border)",
        borderRadius: 10,
        background: "var(--surface)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
        }}
      >
        Apply to partner
      </div>

      {/* Honeypot: visually hidden but present in the DOM so bots fill
          it. Real users never see it. Server drops submissions where
          this is non-empty.
          Renamed from `website` because password managers and browser
          autofillers happily populate any hidden field with a
          well-known semantic name (`website`, `url`, `homepage`,
          `email`), which was silently dropping legitimate submissions
          before this hotfix. `hp_verify_ref` is deliberately opaque so
          autofillers ignore it while spray-fill bots still trip it.
          Extra hardening: autoComplete="off" on both the label and the
          input, plus a nonsense-looking label that autofillers do not
          key off. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          width: 1,
          height: 1,
          overflow: "hidden",
        }}
      >
        <label htmlFor="pa-hp-verify-ref">Verification reference</label>
        <input
          id="pa-hp-verify-ref"
          type="text"
          name="hp_verify_ref"
          tabIndex={-1}
          autoComplete="off"
          value={honey}
          onChange={(e) => setHoney(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="pa-contact" style={labelStyle}>
          Contact (email or X handle) *
        </label>
        <input
          id="pa-contact"
          type="text"
          value={form.contact}
          onChange={update("contact")}
          maxLength={MAX.contact}
          placeholder="you@domain.com or @yourhandle"
          style={inputStyle}
          autoComplete="email"
          required
        />
        <div style={helpStyle}>
          Where Neil should reply. Email is preferred.
        </div>
      </div>

      <div>
        <label htmlFor="pa-handle" style={labelStyle}>
          Your public handle *
        </label>
        <input
          id="pa-handle"
          type="text"
          value={form.handle}
          onChange={update("handle")}
          maxLength={MAX.handle}
          placeholder="X handle, Substack URL, or Telegram channel"
          style={inputStyle}
          required
        />
      </div>

      <div>
        <label htmlFor="pa-audience" style={labelStyle}>
          Audience size (approximate)
        </label>
        <input
          id="pa-audience"
          type="text"
          value={form.audience}
          onChange={update("audience")}
          maxLength={MAX.audience}
          placeholder="e.g. 4,200 X followers or 800 paid Substack subscribers"
          style={inputStyle}
        />
      </div>

      <div>
        <label htmlFor="pa-bets" style={labelStyle}>
          Bets you log per month today
        </label>
        <input
          id="pa-bets"
          type="text"
          value={form.betsPerMonth}
          onChange={update("betsPerMonth")}
          maxLength={MAX.betsPerMonth}
          placeholder="e.g. 40-60"
          style={inputStyle}
        />
      </div>

      <div>
        <label htmlFor="pa-edge" style={labelStyle}>
          One-line pitch on your edge *
        </label>
        <textarea
          id="pa-edge"
          value={form.edge}
          onChange={update("edge")}
          maxLength={MAX.edge}
          rows={3}
          placeholder="Where you make money, what you're good at, and why we should trust the record."
          style={{
            ...inputStyle,
            resize: "vertical",
            minHeight: 72,
            fontFamily: "var(--sans)",
          }}
          required
        />
      </div>

      <div>
        <label htmlFor="pa-payment" style={labelStyle}>
          Preferred payment method
        </label>
        <input
          id="pa-payment"
          type="text"
          value={form.payment}
          onChange={update("payment")}
          maxLength={MAX.payment}
          placeholder="Bank transfer, PayPal, USDT, ETH, other"
          style={inputStyle}
        />
      </div>

      <div>
        <label htmlFor="pa-notes" style={labelStyle}>
          Anything else Neil should know
        </label>
        <textarea
          id="pa-notes"
          value={form.notes}
          onChange={update("notes")}
          maxLength={MAX.notes}
          rows={3}
          placeholder="Existing tracker, sports you focus on, references, dealbreakers, etc."
          style={{
            ...inputStyle,
            resize: "vertical",
            minHeight: 60,
            fontFamily: "var(--sans)",
          }}
        />
      </div>

      {view.kind === "error" && (
        <div
          role="alert"
          style={{
            padding: "10px 12px",
            border: "var(--border-w) solid var(--red)",
            borderRadius: 6,
            background: "var(--surface-2)",
            fontSize: 12.5,
            color: "var(--text)",
          }}
        >
          {view.message}
          {view.rateLimited && (
            <div
              style={{
                marginTop: 6,
                fontSize: 11.5,
                fontFamily: "var(--mono)",
                color: "var(--text-muted)",
              }}
            >
              Fallback: email filthyjabba@gmail.com.
            </div>
          )}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginTop: 4,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "var(--text-faint)",
            fontFamily: "var(--mono)",
          }}
        >
          Neil replies within 48 hours.
        </div>
        <button
          type="submit"
          className="btn-primary"
          disabled={!canSubmit}
          style={{
            padding: "10px 22px",
            fontSize: 14,
            opacity: canSubmit ? 1 : 0.4,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {view.kind === "sending" ? "Sending." : "Send application"}
        </button>
      </div>
    </form>
  );
}
