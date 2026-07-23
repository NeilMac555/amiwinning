// /api/cron/drip — daily dormant-user drip sender.
//
// Runs once a day (external scheduler on Railway or Supabase pg_cron
// hits this endpoint). For each drip key (day3, day7, day14) it:
//
//   1. Finds users who signed up ~N days ago (24h window)
//   2. Filters out anyone with a real bet already
//   3. Filters out anyone who has already been sent this drip key
//   4. Filters out anyone with email_unsubscribed = true in user_metadata
//   5. Sends the email via Resend
//   6. Records the send in public.drip_sends
//
// Returns a JSON summary of counts so an operator can eyeball what
// happened by hitting the endpoint manually with the secret header.
//
// Required env vars:
//   - CRON_SECRET                 — shared secret in x-cron-secret header
//   - NEXT_PUBLIC_SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY   — reads auth.users + writes drip_sends
//   - RESEND_API_KEY
//   - USER_NUDGE_FROM             — verified sender (or SIGNUP_NOTIFY_FROM
//                                    as fallback, matching the 24h nudge)
//   - EMAIL_UNSUBSCRIBE_SECRET    — HMAC key for unsubscribe tokens
//   - AMIUP_URL                   — public site URL, defaults to
//                                    https://amiup.io. Used in email
//                                    links and unsubscribe URLs.
// Optional:
//   - USER_NUDGE_REPLY_TO
//   - CRON_DRIP_DRY_RUN=1         — count who WOULD be sent to but do
//                                    not send or record. Use for the
//                                    first end-to-end check.

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DAYS_FOR_KEY, DRIP_KEYS, renderDrip, type DripKey } from "@/lib/emails/drip";

export const runtime = "nodejs";

// Cap per-run sends. If for some reason (backfill, cron missed a day)
// eligibility balloons, we don't want to blast 500 emails in one shot
// and burn sender reputation. Runs re-run daily so any overflow gets
// picked up in later runs.
const MAX_SENDS_PER_RUN = 100;

interface KeySummary {
  key: DripKey;
  candidates: number;   // users in the age window
  filtered: {
    hasBets: number;
    alreadySent: number;
    unsubscribed: number;
    noEmail: number;
  };
  eligible: number;     // survived all filters
  sent: number;
  failed: number;
  dryRun: boolean;
}

export async function POST(req: Request) {
  // ── 1. Auth ────────────────────────────────────────────────────────────
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error("[cron/drip] CRON_SECRET env var not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  const provided = req.headers.get("x-cron-secret")?.trim();
  if (provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Env ─────────────────────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.USER_NUDGE_FROM ?? process.env.SIGNUP_NOTIFY_FROM;
  const replyTo = process.env.USER_NUDGE_REPLY_TO;
  const siteUrl = process.env.AMIUP_URL ?? "https://amiup.io";
  const dryRun = process.env.CRON_DRIP_DRY_RUN === "1";

  if (!supabaseUrl || !serviceKey || !resendKey || !from) {
    return NextResponse.json(
      { error: "Server misconfigured: missing one of SUPABASE_URL / SERVICE_ROLE_KEY / RESEND_API_KEY / USER_NUDGE_FROM" },
      { status: 500 },
    );
  }
  // Hard fail if the unsubscribe secret is missing — sending mail with
  // non-working unsubscribe links is a CAN-SPAM/GDPR compliance risk.
  if (!process.env.EMAIL_UNSUBSCRIBE_SECRET) {
    return NextResponse.json(
      { error: "Server misconfigured: EMAIL_UNSUBSCRIBE_SECRET not set — refusing to send drips without working unsubscribe links" },
      { status: 500 },
    );
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const resend = new Resend(resendKey);

  // ── 3. Per-key send loop ───────────────────────────────────────────────
  const summaries: KeySummary[] = [];
  let totalSent = 0;

  for (const key of DRIP_KEYS) {
    if (totalSent >= MAX_SENDS_PER_RUN) {
      // Hard cap — cron will pick up the rest tomorrow.
      summaries.push(emptySummary(key, dryRun, "cap reached"));
      continue;
    }
    const summary = await processKey({
      key,
      admin,
      resend,
      from,
      replyTo,
      siteUrl,
      dryRun,
      remainingBudget: MAX_SENDS_PER_RUN - totalSent,
    });
    totalSent += summary.sent;
    summaries.push(summary);
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    totalSent,
    perKey: summaries,
  });
}

// ─ Per-key processing ────────────────────────────────────────────────────

async function processKey(args: {
  key: DripKey;
  admin: SupabaseClient;
  resend: Resend;
  from: string;
  replyTo: string | undefined;
  siteUrl: string;
  dryRun: boolean;
  remainingBudget: number;
}): Promise<KeySummary> {
  const { key, admin, resend, from, replyTo, siteUrl, dryRun, remainingBudget } = args;
  const days = DAYS_FOR_KEY[key];

  const summary: KeySummary = {
    key,
    candidates: 0,
    filtered: { hasBets: 0, alreadySent: 0, unsubscribed: 0, noEmail: 0 },
    eligible: 0,
    sent: 0,
    failed: 0,
    dryRun,
  };

  // 1. Users who signed up N days ago (24h window). Signup time lives on
  //    the profile row (created_at). We already trust the on-auth-user-
  //    created trigger to insert one profile per new user (mig 0003).
  const now = Date.now();
  const rangeEnd = new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
  const rangeStart = new Date(now - (days + 1) * 24 * 60 * 60 * 1000).toISOString();

  const { data: profiles, error: profilesErr } = await admin
    .from("profiles")
    .select("user_id, handle, created_at")
    .gte("created_at", rangeStart)
    .lt("created_at", rangeEnd);

  if (profilesErr || !profiles) {
    console.error(`[cron/drip] ${key}: profiles fetch error:`, profilesErr?.message);
    return summary;
  }
  summary.candidates = profiles.length;
  if (profiles.length === 0) return summary;

  const userIds = profiles.map((p) => p.user_id as string);

  // 2. Filter out users who already have any bet on record. `bets` has
  //    an RLS-restricted read for owners; service-role bypasses.
  const { data: betRows } = await admin
    .from("bets")
    .select("user_id")
    .in("user_id", userIds);
  const usersWithBets = new Set(
    (betRows ?? []).map((r) => (r as { user_id: string }).user_id),
  );

  // 3. Filter out users who already received this drip key.
  const { data: sendRows } = await admin
    .from("drip_sends")
    .select("user_id")
    .eq("drip_key", key)
    .in("user_id", userIds);
  const alreadySent = new Set(
    (sendRows ?? []).map((r) => (r as { user_id: string }).user_id),
  );

  // Walk the candidates; look up email + unsubscribe flag per-user via the
  // admin API. This is one HTTP round-trip per candidate, which is fine at
  // our scale (a few dozen candidates per day max). A batch endpoint would
  // be faster but the admin SDK doesn't expose one.
  const eligible: Array<{ userId: string; handle: string; email: string }> = [];
  for (const p of profiles) {
    const userId = p.user_id as string;
    const handle = (p.handle as string) ?? "";
    if (usersWithBets.has(userId)) {
      summary.filtered.hasBets++;
      continue;
    }
    if (alreadySent.has(userId)) {
      summary.filtered.alreadySent++;
      continue;
    }
    const { data: u, error: uErr } = await admin.auth.admin.getUserById(userId);
    if (uErr || !u?.user?.email) {
      summary.filtered.noEmail++;
      continue;
    }
    const meta = u.user.user_metadata ?? {};
    if (meta.email_unsubscribed === true) {
      summary.filtered.unsubscribed++;
      continue;
    }
    eligible.push({ userId, handle, email: u.user.email });
    if (eligible.length >= remainingBudget) break;
  }
  summary.eligible = eligible.length;

  if (dryRun) return summary;

  // 4. Send and record.
  for (const target of eligible) {
    const email = renderDrip(key, {
      userId: target.userId,
      handle: target.handle,
      siteUrl,
    });
    try {
      const send = await resend.emails.send({
        from,
        to: target.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
        ...(replyTo ? { replyTo } : {}),
      });
      if (send.error) {
        summary.failed++;
        console.error(
          `[cron/drip] ${key}: send failed for ${target.userId}:`,
          send.error.message,
        );
        continue;
      }
      // Record BEFORE trusting the count — a crash between send and
      // insert would double-send tomorrow. Belt-and-braces: rely on the
      // primary key (user_id, drip_key) to make an accidental resend a
      // no-op ON CONFLICT.
      const { error: insertErr } = await admin
        .from("drip_sends")
        .upsert({
          user_id: target.userId,
          drip_key: key,
          resend_email_id: send.data?.id,
        });
      if (insertErr) {
        console.error(
          `[cron/drip] ${key}: drip_sends insert error for ${target.userId}:`,
          insertErr.message,
        );
        // The email went out; the record didn't. Still count as sent —
        // if the row lands tomorrow's run will suppress correctly, and
        // if it doesn't the user may get a rare double-send. Acceptable
        // failure mode vs the alternative of no send record at all.
      }
      summary.sent++;
    } catch (e) {
      summary.failed++;
      console.error(
        `[cron/drip] ${key}: unexpected exception for ${target.userId}:`,
        e instanceof Error ? e.message : String(e),
      );
    }
  }

  return summary;
}

function emptySummary(key: DripKey, dryRun: boolean, _reason: string): KeySummary {
  return {
    key,
    candidates: 0,
    filtered: { hasBets: 0, alreadySent: 0, unsubscribed: 0, noEmail: 0 },
    eligible: 0,
    sent: 0,
    failed: 0,
    dryRun,
  };
}
