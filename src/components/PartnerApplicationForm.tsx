"use client";

import { useState } from "react";
import Link from "next/link";

const FIELDS = [
  { key: "name", label: "Your name", max: 100, required: true, placeholder: "Name or creator name" },
  { key: "contact", label: "Email", max: 200, required: true, placeholder: "you@example.com", type: "email" },
  { key: "handle", label: "Social profiles or channel links", max: 200, required: true, placeholder: "X, Telegram, YouTube, newsletter…" },
  { key: "audience", label: "Approximate audience size", max: 200, required: false, placeholder: "e.g. 2,000 on X, 400 newsletter readers" },
  { key: "tracker", label: "Current tracker or public record", max: 300, required: false, placeholder: "Tracker name and record link, if you have one" },
  { key: "edge", label: "How would you introduce Am I Up to your audience?", max: 500, required: true, placeholder: "Tell us about your content and what you’d like to create.", multiline: true },
] as const;
type FieldKey = typeof FIELDS[number]["key"];
const EMPTY: Record<FieldKey, string> = { name: "", contact: "", handle: "", audience: "", tracker: "", edge: "" };

export function PartnerApplicationForm() {
  const [form, setForm] = useState(EMPTY);
  const [honey, setHoney] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    setSending(true); setError("");
    try {
      const res = await fetch("/api/partners/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, hp_verify_ref: honey }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body.dropped || body.ok !== true) throw new Error(body.error || "We couldn’t send your application. Please try again or email Neil directly.");
      setSent(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Please try again or email Neil directly."); }
    finally { setSending(false); }
  }
  if (sent) return <div className="creator-form" role="status"><h3>Application received</h3><p>Thanks for your interest. Neil will review your details and contact you if there’s a fit. Fees and deliverables will be agreed before any work starts.</p></div>;
  return (
    <form className="creator-form" onSubmit={submit}>
      <div aria-hidden="true" style={{ position: "absolute", left: -9999, width: 1, height: 1, overflow: "hidden" }}><label htmlFor="pa-hp">Verification reference</label><input id="pa-hp" name="hp_verify_ref" tabIndex={-1} autoComplete="off" value={honey} onChange={e => setHoney(e.target.value)} /></div>
      {FIELDS.map(field => <div key={field.key}><label htmlFor={`pa-${field.key}`}>{field.label}{field.required ? " *" : " (optional)"}</label>{"multiline" in field ? <textarea id={`pa-${field.key}`} name={field.key} rows={4} required minLength={10} maxLength={field.max} placeholder={field.placeholder} value={form[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.value })} /> : <input id={`pa-${field.key}`} name={field.key} type={"type" in field ? field.type : "text"} autoComplete={field.key === "contact" ? "email" : field.key === "name" ? "name" : "off"} minLength={field.key === "handle" ? 2 : 1} required={field.required} maxLength={field.max} placeholder={field.placeholder} value={form[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.value })} />}</div>)}
      <p className="compare-fine">Your details are emailed to our team to review and respond to your application. <Link href="/privacy">Privacy policy</Link>.</p>
      {error && <p role="alert">{error} <a href="mailto:filthyjabba@gmail.com">Email Neil</a>.</p>}
      <button type="submit" className="btn-primary" disabled={sending}>{sending ? "Sending…" : "Apply to become a creator partner →"}</button>
    </form>
  );
}
