// /api/webhooks/new-user — fires an email to Neil whenever a new user
// signs up to Am I Up.
//
// Wiring (set up once in Supabase dashboard, see README or the comment
// in this commit message):
//
//   Supabase Database Webhook
//     · Table:  public.profiles
//     · Events: INSERT
//     · Type:   HTTP Request
//     · URL:    https://amiup.io/api/webhooks/new-user
//     · HTTP Headers:
//         x-signup-webhook-secret: <SIGNUP_WEBHOOK_SECRET env var>
//
// Why webhook the `profiles` table and not `auth.users`?
//   - auth.users is in the auth schema; Supabase Database Webhooks only
//     trigger on tables in `public`. The `on_auth_user_created` trigger
//     (migration 0003) auto-inserts a row into `public.profiles` for
//     every new auth user, so it's the right hook for "someone joined."
//   - Bonus: the profile row already has the handle, so the email can
//     link straight to /u/<handle>.
//
// Required env vars (set on Railway before deploying):
//   - RESEND_API_KEY            — from https://resend.com/api-keys
//   - SIGNUP_WEBHOOK_SECRET     — any long random string; share with
//                                 the Supabase dashboard config (above)
//   - SIGNUP_NOTIFY_FROM        — verified sender, e.g. signups@amiup.io
//   - SIGNUP_NOTIFY_TO          — destination inbox, e.g. filthyjabba@gmail.com
//
// On any failure (missing env, bad secret, Resend error) we log to
// stderr (Railway captures these) and return a 4xx/5xx so Supabase
// retries — Supabase webhooks retry up to 3 times with backoff.

import { NextResponse } from "next/server";
import { Resend } from "resend";

// Force this route to the Node runtime — the Resend SDK uses Node fetch
// internals. Edge runtime would be marginally faster but isn't needed
// for a low-volume one-off-per-signup webhook.
export const runtime = "nodejs";

const SUPABASE_USERS_URL =
  "https://supabase.com/dashboard/project/hshuclevpkvqeduuiovs/auth/users";

// What Supabase sends in the request body for an INSERT webhook. We
// type only the fields we read; the rest of the payload is ignored.
interface SupabaseInsertPayload {
  type?: "INSERT" | "UPDATE" | "DELETE";
  table?: string;
  record?: {
    user_id?: string;
    handle?: string;
    display_name?: string | null;
    is_public?: boolean;
    created_at?: string;
  };
}

export async function POST(req: Request) {
  // ── 1. Auth ────────────────────────────────────────────────────────────
  // Shared secret in the header. Without this anyone who guessed the URL
  // could spam the inbox. The secret lives in env vars on both sides.
  const expectedSecret = process.env.SIGNUP_WEBHOOK_SECRET;
  if (!expectedSecret) {
    console.error("[new-user] SIGNUP_WEBHOOK_SECRET env var is not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  const providedSecret = req.headers.get("x-signup-webhook-secret");
  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Parse + extract ─────────────────────────────────────────────────
  let payload: SupabaseInsertPayload;
  try {
    payload = (await req.json()) as SupabaseInsertPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (payload.type !== "INSERT" || !payload.record?.handle) {
    // Defensive: only act on profile inserts with at least a handle.
    return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
  }

  const { handle, display_name, is_public, created_at, user_id } = payload.record;
  // We don't have the user's email in the profiles row (it lives in
  // auth.users which webhooks can't see). The handle is auto-generated
  // from the email-local-part on signup though, so it's already a strong
  // hint about who joined.
  const profileUrl = is_public ? `https://amiup.io/u/${handle}` : null;
  const joinedAt = created_at ? new Date(created_at).toUTCString() : "just now";
  const displayLine = display_name ? ` (${display_name})` : "";

  // ── 3. Compose + send the email ────────────────────────────────────────
  const resendKey = process.env.RESEND_API_KEY;
  const fromAddr = process.env.SIGNUP_NOTIFY_FROM;
  const toAddr = process.env.SIGNUP_NOTIFY_TO;
  if (!resendKey || !fromAddr || !toAddr) {
    console.error(
      "[new-user] Missing one of RESEND_API_KEY / SIGNUP_NOTIFY_FROM / SIGNUP_NOTIFY_TO",
    );
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 },
    );
  }

  const resend = new Resend(resendKey);
  const subject = `🎯 New Am I Up signup — @${handle}`;

  // Plain text first (always works in any client), then HTML version for
  // anything modern. Both carry the same info.
  const lines = [
    `Someone just signed up to Am I Up.`,
    ``,
    `Handle:      @${handle}${displayLine}`,
    `Visibility:  ${is_public ? "Public profile" : "Private (handle not published)"}`,
    `Joined:      ${joinedAt}`,
    `User ID:     ${user_id ?? "—"}`,
    ``,
    profileUrl ? `Their public profile: ${profileUrl}` : null,
    `All users:   ${SUPABASE_USERS_URL}`,
  ].filter(Boolean) as string[];

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #1A1817;">
      <div style="font-size: 14px; color: #5F574F; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 8px;">Am I Up · new signup</div>
      <h1 style="font-size: 24px; font-weight: 600; margin: 0 0 18px; letter-spacing: -0.01em;">@${escapeHtml(handle)}${displayLine ? ` <span style="font-weight:400;color:#5F574F;">${escapeHtml(displayLine.trim())}</span>` : ""} just joined</h1>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
        <tr><td style="padding: 6px 0; color: #5F574F; width: 110px;">Visibility</td><td style="padding: 6px 0;">${is_public ? "Public profile" : "Private (handle not published)"}</td></tr>
        <tr><td style="padding: 6px 0; color: #5F574F;">Joined</td><td style="padding: 6px 0; font-family: 'JetBrains Mono', monospace;">${escapeHtml(joinedAt)}</td></tr>
        <tr><td style="padding: 6px 0; color: #5F574F;">User&nbsp;ID</td><td style="padding: 6px 0; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8F857A;">${escapeHtml(user_id ?? "—")}</td></tr>
      </table>
      ${
        profileUrl
          ? `<a href="${profileUrl}" style="display: inline-block; padding: 10px 18px; background: #1A1817; color: #FBF9F3; text-decoration: none; border-radius: 6px; font-size: 13px; margin-right: 8px;">View their profile →</a>`
          : ""
      }
      <a href="${SUPABASE_USERS_URL}" style="display: inline-block; padding: 10px 18px; background: transparent; color: #5F574F; text-decoration: none; border: 1px solid #E5DFD2; border-radius: 6px; font-size: 13px;">See all users →</a>
      <p style="font-size: 11px; color: #8F857A; margin-top: 32px; line-height: 1.5;">
        You're getting this because the Supabase Database Webhook fired
        on a new row in <code>public.profiles</code>. Disable it in the
        Supabase dashboard if you no longer want signup alerts.
      </p>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: fromAddr,
      to: toAddr,
      subject,
      text: lines.join("\n"),
      html,
    });
    if (result.error) {
      console.error("[new-user] Resend error:", result.error);
      return NextResponse.json(
        { error: "Email send failed", detail: result.error.message },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, emailId: result.data?.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[new-user] Unexpected exception:", msg);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// Tiny HTML escaper — the handle is regex-validated on the way in
// (lowercase a-z0-9_), so this is belt-and-braces for the display
// name and timestamps. Avoids pulling in a dependency.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
