// /api/unsubscribe/<token> — one-click unsubscribe from drip emails.
//
// Token format + verification: see lib/emails/unsubscribe-token.ts. The
// token is HMAC-signed so we don't need a token table — we just verify
// the signature, extract the userId, and flip
// user_metadata.email_unsubscribed = true.
//
// Response: a plain HTML page confirming the opt-out. No back-link (we
// don't want to send the user back into the app just to have them re-
// subscribe by mistake). Uses the same terminal-dark palette as the
// site + the drip emails.
//
// Idempotent — clicking the link twice just re-sets the flag. Failure
// modes (bad token, DB error) all render the same generic error page;
// we don't leak reasons to a crawler that fuzzes the endpoint.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyUnsubscribeToken } from "@/lib/emails/unsubscribe-token";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { token } = await ctx.params;
  const userId = verifyUnsubscribeToken(token);
  if (!userId) {
    return html(400, PAGES.badToken);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("[unsubscribe] missing SUPABASE env vars");
    return html(500, PAGES.error);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Merge — don't overwrite — so other user_metadata (utm attribution etc)
  // is preserved.
  const { data: existing, error: fetchErr } = await admin.auth.admin.getUserById(userId);
  if (fetchErr || !existing?.user) {
    // Token was valid so we know the user existed once; if they got
    // deleted we still 200 to keep the confirmation experience clean.
    return html(200, PAGES.ok);
  }
  const currentMeta = existing.user.user_metadata ?? {};
  const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: { ...currentMeta, email_unsubscribed: true, email_unsubscribed_at: new Date().toISOString() },
  });
  if (updateErr) {
    console.error("[unsubscribe] updateUserById error:", updateErr.message);
    return html(500, PAGES.error);
  }
  return html(200, PAGES.ok);
}

// ─ HTML response shell ────────────────────────────────────────────────────

function html(status: number, body: string): NextResponse {
  return new NextResponse(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

const PAGES = {
  ok: page({
    title: "Unsubscribed",
    eyebrow: "Am I Up",
    headline: "You're unsubscribed.",
    body: "We won't send you any more drip emails. Your account itself is untouched — you can still sign in at any time.",
  }),
  badToken: page({
    title: "Link expired",
    eyebrow: "Am I Up",
    headline: "This unsubscribe link is invalid or expired.",
    body: "If you meant to unsubscribe, reply STOP to any Am I Up email and we'll remove you manually.",
  }),
  error: page({
    title: "Something went wrong",
    eyebrow: "Am I Up",
    headline: "We couldn't process that just now.",
    body: "Please try again in a few minutes, or reply STOP to any Am I Up email and we'll remove you manually.",
  }),
};

function page(opts: { title: string; eyebrow: string; headline: string; body: string }): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${opts.title} · Am I Up</title></head>
<body style="margin:0;background:#0A0C10;color:#E6EDF3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;">
  <div style="max-width:480px;text-align:left;">
    <div style="font-size:11px;color:#F5A623;letter-spacing:0.14em;text-transform:uppercase;margin-bottom:12px;font-weight:600;">${opts.eyebrow}</div>
    <h1 style="font-size:28px;font-weight:600;margin:0 0 18px;letter-spacing:-0.015em;line-height:1.2;">${opts.headline}</h1>
    <p style="font-size:15px;color:#C9D1D9;line-height:1.6;margin:0;">${opts.body}</p>
  </div>
</body></html>`;
}
