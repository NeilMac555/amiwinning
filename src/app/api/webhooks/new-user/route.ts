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
// Optional env vars for the 24h nudge email to the new user:
//   - NEXT_PUBLIC_SUPABASE_URL       — same URL used by the frontend
//   - SUPABASE_SERVICE_ROLE_KEY      — read auth.users to fetch the
//                                      new user's email address
//   - USER_NUDGE_FROM               — verified sender for user-facing
//                                      mail, e.g. hi@amiup.io. Falls
//                                      back to SIGNUP_NOTIFY_FROM.
//   - USER_NUDGE_REPLY_TO           — optional Reply-To for the nudge.
//   - AMIUP_URL                     — public site URL, defaults to
//                                      https://amiup.io.
// If any of the two required nudge vars are missing the nudge is
// skipped silently — the founder-notification email still sends.
//
// On any failure (missing env, bad secret, Resend error) we log to
// stderr (Railway captures these) and return a 4xx/5xx so Supabase
// retries — Supabase webhooks retry up to 3 times with backoff. The
// 24h nudge scheduling is wrapped in its own try/catch so a Resend
// failure on that leg does NOT fail the webhook (log and continue).

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

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
  // Defensive trim — webhook providers sometimes append \n or whitespace when
  // headers round-trip through their UI. Without this we'd 401 on what is
  // otherwise the right secret.
  const providedSecret = req.headers.get("x-signup-webhook-secret")?.trim();
  if (providedSecret !== expectedSecret) {
    // Diagnostic — fingerprint both sides so we can compare in Railway logs
    // without ever revealing the actual secret. Remove this block once the
    // webhook is confirmed working end-to-end.
    const fp = (s: string | undefined | null) =>
      !s
        ? "null"
        : `len=${s.length} first=${s.slice(0, 4)} last=${s.slice(-4)}`;
    const headerKeys: string[] = [];
    req.headers.forEach((_v, k) => headerKeys.push(k));
    console.error(
      "[new-user] 401 secret mismatch.",
      "provided:",
      fp(providedSecret),
      "expected:",
      fp(expectedSecret),
      "headers:",
      headerKeys.join(","),
    );
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

  // Attribution lookup. Fetch the user's raw_user_meta_data from the
  // admin API so we can surface utm_source / utm_medium in the
  // notification email. Wrapped so a missing service-role key or a
  // bad admin response does not break the notification. The 24h-nudge
  // helper below does its own lookup for the email address — kept
  // separate so a change to attribution doesn't risk the nudge.
  const attribution = await fetchUserAttribution(user_id);
  const attribLine = attribution.utm_source
    ? `${attribution.utm_source}${attribution.utm_medium ? ` / ${attribution.utm_medium}` : ""}${attribution.utm_campaign ? ` / ${attribution.utm_campaign}` : ""}`
    : attribution.utm_referrer
      ? `(referrer: ${attribution.utm_referrer})`
      : "(direct / unknown)";

  // Plain text first (always works in any client), then HTML version for
  // anything modern. Both carry the same info.
  const lines = [
    `Someone just signed up to Am I Up.`,
    ``,
    `Handle:      @${handle}${displayLine}`,
    `Attribution: ${attribLine}`,
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
        <tr><td style="padding: 6px 0; color: #5F574F; width: 110px;">Attribution</td><td style="padding: 6px 0; font-family: 'JetBrains Mono', monospace; font-size: 12px;">${escapeHtml(attribLine)}</td></tr>
        <tr><td style="padding: 6px 0; color: #5F574F;">Visibility</td><td style="padding: 6px 0;">${is_public ? "Public profile" : "Private (handle not published)"}</td></tr>
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

    // ── 4. Schedule the 24h nudge email to the new user ────────────────
    // Best-effort. Wrapped so no failure here can break the founder-
    // notification response above (which is what Supabase retries on).
    const nudgeInfo = await scheduleUserNudge({
      resend,
      userId: user_id,
      handle,
    });

    return NextResponse.json({
      ok: true,
      emailId: result.data?.id,
      nudge: nudgeInfo,
    });
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

// ────────────────────────────────────────────────────────────────────────
// Attribution lookup. Reads auth.users.raw_user_meta_data via the
// service-role admin API and pulls out any utm_source / utm_medium /
// utm_campaign / utm_referrer set at sign-up time by lib/utm.ts.
//
// Every path is defensive: missing env vars, admin failures, or a user
// with no metadata all just return an empty attribution object. The
// notification email still sends; Neil sees "(direct / unknown)".
// ────────────────────────────────────────────────────────────────────────

interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_referrer?: string;
  utm_content?: string;
  utm_term?: string;
  utm_landing_path?: string;
}

async function fetchUserAttribution(
  userId: string | undefined,
): Promise<Attribution> {
  try {
    if (!userId) return {};
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return {};
    const admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data?.user) return {};
    const meta = data.user.user_metadata ?? {};
    const pick = (k: string) =>
      typeof meta[k] === "string" ? (meta[k] as string) : undefined;
    return {
      utm_source: pick("utm_source"),
      utm_medium: pick("utm_medium"),
      utm_campaign: pick("utm_campaign"),
      utm_referrer: pick("utm_referrer"),
      utm_content: pick("utm_content"),
      utm_term: pick("utm_term"),
      utm_landing_path: pick("utm_landing_path"),
    };
  } catch (e) {
    console.error(
      "[new-user] attribution lookup failed:",
      e instanceof Error ? e.message : String(e),
    );
    return {};
  }
}

// ────────────────────────────────────────────────────────────────────────
// 24-hour nudge email to the new user.
//
// Goal: cut activation churn by reminding users who signed up but haven't
// logged their first bet. The webhook only carries the profile row (which
// lacks the email address), so we look up auth.users via the service-role
// client. Any failure at any step here is caught and logged — the founder
// notification above must not depend on this succeeding.
// ────────────────────────────────────────────────────────────────────────

type NudgeInfo =
  | { scheduled: true; scheduledAt: string; emailId: string | undefined }
  | { scheduled: false; reason: string };

async function scheduleUserNudge({
  resend,
  userId,
  handle,
}: {
  resend: Resend;
  userId: string | undefined;
  handle: string;
}): Promise<NudgeInfo> {
  try {
    if (!userId) {
      return { scheduled: false, reason: "missing user_id" };
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return {
        scheduled: false,
        reason:
          "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — nudge skipped",
      };
    }
    const from = process.env.USER_NUDGE_FROM ?? process.env.SIGNUP_NOTIFY_FROM;
    if (!from) {
      return { scheduled: false, reason: "no from address configured" };
    }
    const replyTo = process.env.USER_NUDGE_REPLY_TO;
    const siteUrl = process.env.AMIUP_URL ?? "https://amiup.io";

    // Look up the new user's email via the admin API. Service-role only —
    // we can't read auth.users from an RLS-restricted client.
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error) {
      console.error("[new-user] nudge: admin.getUserById error:", error.message);
      return { scheduled: false, reason: `getUserById: ${error.message}` };
    }
    const email = data?.user?.email;
    if (!email) {
      return { scheduled: false, reason: "user has no email on record" };
    }

    // 24 hours from now. Resend accepts an ISO string in UTC.
    const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Plain-text body, no emojis, no em dashes, under 100 words. Single
    // link to the app, single line at the end for reply-to-opt-out.
    const text = [
      `Hi @${handle},`,
      ``,
      `Quick nudge: your first bet takes about 10 seconds.`,
      ``,
      `Paste any tip, screenshot, or bookmaker copy into Am I Up and the AI`,
      `logs it for you. Odds, stake, market, sport — all extracted, ready`,
      `to track.`,
      ``,
      `Open your dashboard: ${siteUrl}`,
      ``,
      `If you have already logged your first bet, ignore this — check your`,
      `dashboard anytime.`,
      ``,
      `Reply to this email with the word "stop" and you will not hear from`,
      `us again.`,
    ].join("\n");

    const send = await resend.emails.send({
      from,
      to: email,
      subject: "Your first bet takes 10 seconds",
      text,
      scheduledAt,
      // Only include reply-to when it's configured; passing undefined
      // trips Resend's runtime validation on some SDK versions.
      ...(replyTo ? { replyTo } : {}),
    });
    if (send.error) {
      console.error("[new-user] nudge: resend error:", send.error);
      return { scheduled: false, reason: `resend: ${send.error.message}` };
    }
    return {
      scheduled: true,
      scheduledAt,
      emailId: send.data?.id,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[new-user] nudge: unexpected exception:", msg);
    return { scheduled: false, reason: `exception: ${msg}` };
  }
}
