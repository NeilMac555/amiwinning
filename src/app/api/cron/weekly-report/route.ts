// /api/cron/weekly-report — weekly Sharp Report sender.
//
// Runs once a week, Monday morning UTC (external scheduler hits this
// endpoint with the x-cron-secret header, same as /api/cron/drip). For
// each eligible user it:
//
//   1. Pulls their full bet history via the service-role key
//   2. Builds the three-axis payload (competitions / markets / odds bands)
//   3. Asks Claude Fable 5.1 for a 3-to-6 bullet report
//   4. Sends it via Resend
//   5. Records the send + the report JSON in public.weekly_report_sends
//
// Eligibility:
//   - at least MIN_SETTLED_FOR_REPORT settled bets lifetime
//   - at least one bet with kickoff in the last 14 days (active, not a
//     dormant account we'd just be spending AI budget on)
//   - not email_unsubscribed
//   - no row in weekly_report_sends for this week_start
//
// Operator switches (query string):
//   ?user=<uuid>   send to ONE user only. For testing on yourself.
//   ?force=1       with ?user only: ignore the already-sent check.
//   ?dry=1         count + build payloads but do not call the model,
//                  send, or record. CRON_WEEKLY_DRY_RUN=1 does the same.
//
// Required env vars:
//   CRON_SECRET, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//   RESEND_API_KEY, ANTHROPIC_API_KEY, EMAIL_UNSUBSCRIBE_SECRET,
//   USER_NUDGE_FROM (or SIGNUP_NOTIFY_FROM)
// Optional: USER_NUDGE_REPLY_TO, AMIUP_URL, CRON_WEEKLY_DRY_RUN

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ImportedBet } from "@/lib/import/types";
import {
  betRowToImported,
  buildWeeklyReportInput,
  isoDate,
  lastCompleteWeek,
  MIN_SETTLED_FOR_REPORT,
  type BetRow,
} from "@/lib/weekly-report/data";
import { generateWeeklyReport } from "@/lib/weekly-report/ai";
import { renderWeeklyReport } from "@/lib/emails/weekly-report";

export const runtime = "nodejs";
// Fable turns can take a while and we loop over users. Give the route
// room. (Railway does not impose Vercel's 10s function cap, but be
// explicit so a future host change does not silently truncate the run.)
export const maxDuration = 300;

// Per-run send cap. Each send is one Fable call (~$0.05 to $0.10), so this
// is also the per-run AI spend ceiling. Overflow is picked up next week;
// if that becomes a real constraint, run the cron twice on Monday.
const MAX_SENDS_PER_RUN = 60;
const ACTIVE_WINDOW_DAYS = 14;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RunSummary {
  ok: boolean;
  dryRun: boolean;
  weekStart: string;
  weekEnd: string;
  candidates: number;
  filtered: {
    tooFewSettled: number;
    alreadySent: number;
    unsubscribed: number;
    noEmail: number;
    noHandle: number;
  };
  eligible: number;
  sent: number;
  failed: number;
  aiTokens: { input: number; output: number; cacheRead: number };
  models: Record<string, number>;
  errors: string[];
}

export async function POST(req: Request) {
  // ── 1. Auth ────────────────────────────────────────────────────────────
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error("[cron/weekly-report] CRON_SECRET env var not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  const provided = req.headers.get("x-cron-secret")?.trim();
  if (provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Switches ────────────────────────────────────────────────────────
  const url = new URL(req.url);
  const onlyUser = url.searchParams.get("user")?.trim() || null;
  if (onlyUser && !UUID_RE.test(onlyUser)) {
    return NextResponse.json({ error: "?user must be a UUID" }, { status: 400 });
  }
  const force = onlyUser !== null && url.searchParams.get("force") === "1";
  const dryRun =
    url.searchParams.get("dry") === "1" || process.env.CRON_WEEKLY_DRY_RUN === "1";

  // ── 3. Env ─────────────────────────────────────────────────────────────
  // Supabase is needed even for a dry run (eligibility is computed from
  // real bets). The send-side keys are only enforced for a live run so a
  // dry run works from a dev box that has no Resend / Anthropic keys.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const from = process.env.USER_NUDGE_FROM ?? process.env.SIGNUP_NOTIFY_FROM;
  const replyTo = process.env.USER_NUDGE_REPLY_TO;
  const siteUrl = process.env.AMIUP_URL ?? "https://amiup.io";

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Server misconfigured: missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 },
    );
  }
  if (!dryRun) {
    if (!resendKey || !anthropicKey || !from) {
      return NextResponse.json(
        { error: "Server misconfigured: missing one of RESEND_API_KEY / ANTHROPIC_API_KEY / USER_NUDGE_FROM" },
        { status: 500 },
      );
    }
    if (!process.env.EMAIL_UNSUBSCRIBE_SECRET) {
      return NextResponse.json(
        { error: "Server misconfigured: EMAIL_UNSUBSCRIBE_SECRET not set — refusing to send without working unsubscribe links" },
        { status: 500 },
      );
    }
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // Only constructed for a live run; `resendKey` is verified above.
  const resend = dryRun ? null : new Resend(resendKey as string);

  const now = new Date();
  const week = lastCompleteWeek(now);
  const weekStart = isoDate(week.start);

  const summary: RunSummary = {
    ok: true,
    dryRun,
    weekStart,
    weekEnd: isoDate(week.end),
    candidates: 0,
    filtered: { tooFewSettled: 0, alreadySent: 0, unsubscribed: 0, noEmail: 0, noHandle: 0 },
    eligible: 0,
    sent: 0,
    failed: 0,
    aiTokens: { input: 0, output: 0, cacheRead: 0 },
    models: {},
    errors: [],
  };

  // ── 4. Candidates: users with a bet kicking off in the last 14 days ────
  let candidateIds: string[];
  if (onlyUser) {
    candidateIds = [onlyUser];
  } else {
    const since = new Date(now.getTime() - ACTIVE_WINDOW_DAYS * 86_400_000).toISOString();
    const { data, error } = await admin
      .from("bets")
      .select("user_id")
      .gte("kickoff", since);
    if (error) {
      summary.ok = false;
      summary.errors.push(`candidates query: ${error.message}`);
      return NextResponse.json(summary, { status: 500 });
    }
    candidateIds = Array.from(
      new Set((data ?? []).map((r) => (r as { user_id: string }).user_id)),
    );
  }
  summary.candidates = candidateIds.length;
  if (candidateIds.length === 0) return NextResponse.json(summary);

  // Already-sent set for this week (one query, not one per user).
  const alreadySent = new Set<string>();
  if (!force) {
    const { data: sentRows } = await admin
      .from("weekly_report_sends")
      .select("user_id")
      .eq("week_start", weekStart)
      .in("user_id", candidateIds);
    for (const r of sentRows ?? []) alreadySent.add((r as { user_id: string }).user_id);
  }

  // Handles for all candidates in one query.
  const { data: profileRows } = await admin
    .from("profiles")
    .select("user_id, handle")
    .in("user_id", candidateIds);
  const handleByUser = new Map<string, string>();
  for (const p of (profileRows ?? []) as { user_id: string; handle: string | null }[]) {
    if (p.handle) handleByUser.set(p.user_id, p.handle);
  }

  // ── 5. Per-user loop ───────────────────────────────────────────────────
  for (const userId of candidateIds) {
    if (summary.sent >= MAX_SENDS_PER_RUN) break;

    if (alreadySent.has(userId)) {
      summary.filtered.alreadySent++;
      continue;
    }
    const handle = handleByUser.get(userId);
    if (!handle) {
      summary.filtered.noHandle++;
      continue;
    }

    // Email + unsubscribe flag via the admin API (one round-trip each;
    // fine at tens of candidates per week).
    const { data: u, error: uErr } = await admin.auth.admin.getUserById(userId);
    if (uErr || !u?.user?.email) {
      summary.filtered.noEmail++;
      continue;
    }
    if (u.user.user_metadata?.email_unsubscribed === true) {
      summary.filtered.unsubscribed++;
      continue;
    }

    let bets: ImportedBet[];
    try {
      bets = await fetchAllBets(admin, userId);
    } catch (e) {
      summary.failed++;
      summary.errors.push(`${handle}: bets fetch: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }
    const settled = bets.filter((b) => b.status !== "pending" && b.status !== "void").length;
    if (settled < MIN_SETTLED_FOR_REPORT) {
      summary.filtered.tooFewSettled++;
      continue;
    }

    summary.eligible++;
    if (dryRun || !resend) continue;

    try {
      const input = buildWeeklyReportInput({ handle, bets, now });
      const gen = await generateWeeklyReport({ apiKey: anthropicKey as string, input });
      summary.aiTokens.input += gen.usage.input;
      summary.aiTokens.output += gen.usage.output;
      summary.aiTokens.cacheRead += gen.usage.cacheRead;
      summary.models[gen.model] = (summary.models[gen.model] ?? 0) + 1;

      const email = renderWeeklyReport({ userId, handle, siteUrl }, gen.report, input);
      const send = await resend.emails.send({
        // Verified non-empty in the live-run env check above.
        from: from as string,
        to: u.user.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
        ...(replyTo ? { replyTo } : {}),
      });
      if (send.error) {
        summary.failed++;
        summary.errors.push(`${handle}: resend: ${send.error.message}`);
        continue;
      }

      // Record. Primary key (user_id, week_start) makes an accidental
      // re-run a no-op via upsert.
      const { error: insErr } = await admin.from("weekly_report_sends").upsert({
        user_id: userId,
        week_start: weekStart,
        resend_email_id: send.data?.id ?? null,
        model: gen.model,
        report: gen.report,
      });
      if (insErr) {
        // Email went out; log row didn't. Count as sent; the worst case is
        // one duplicate next run, which the upsert then absorbs.
        summary.errors.push(`${handle}: weekly_report_sends upsert: ${insErr.message}`);
      }
      summary.sent++;
    } catch (e) {
      summary.failed++;
      summary.errors.push(`${handle}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json(summary);
}

// ─ Helpers ───────────────────────────────────────────────────────────────

async function fetchAllBets(admin: SupabaseClient, userId: string): Promise<ImportedBet[]> {
  const PAGE = 1000;
  let from = 0;
  const rows: BetRow[] = [];
  for (;;) {
    const { data, error } = await admin
      .from("bets")
      .select("*")
      .eq("user_id", userId)
      .order("kickoff", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const page = (data ?? []) as BetRow[];
    rows.push(...page);
    if (page.length < PAGE) break;
    from += PAGE;
  }
  return rows.map(betRowToImported);
}
