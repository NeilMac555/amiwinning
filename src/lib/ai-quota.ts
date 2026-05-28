// Server-side per-user daily quota for AI-backed API routes.
//
// Each call atomically increments a (user_id, action, today) counter via the
// `claim_ai_quota` Postgres RPC. If the counter would exceed the cap, the
// increment is rolled back and the helper returns { allowed: false }.
//
// Caps are intentionally generous — they exist to stop a single user from
// running a 10,000-row loop, not to limit normal usage. Adjust here.

import { createClient } from "@supabase/supabase-js";

export type QuotaAction = "parse" | "auto_map";

// Per-user, per-day caps. Burning through 50 paste-parses or 30 spreadsheet
// auto-maps in a single day would be highly unusual real usage.
const DAILY_CAPS: Record<QuotaAction, number> = {
  parse: 50,
  auto_map: 30,
};

export interface QuotaResult {
  allowed: boolean;
  used: number;
  max: number;
  /** When skipped because service key isn't configured (dev). */
  skipped?: boolean;
  error?: string;
}

export async function claimAiQuota(
  userId: string,
  action: QuotaAction,
): Promise<QuotaResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const max = DAILY_CAPS[action];

  // Without a service role key we can't run the RPC. Treat as "allowed" so
  // dev environments still work — the auth gate is doing the heavy lifting
  // anyway. Production MUST set SUPABASE_SERVICE_ROLE_KEY.
  if (!url || !serviceKey) {
    return { allowed: true, used: 0, max, skipped: true };
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin.rpc("claim_ai_quota", {
    p_user_id: userId,
    p_action: action,
    p_max: max,
  });

  if (error) {
    // Fail open on RPC errors so a broken migration doesn't break the app.
    // We log via the return value; the caller can decide to surface it.
    return {
      allowed: true,
      used: 0,
      max,
      skipped: true,
      error: error.message,
    };
  }

  // RPC returns a single row: { used, allowed }
  const row = Array.isArray(data) ? data[0] : data;
  const used = typeof row?.used === "number" ? row.used : 0;
  const allowed = row?.allowed === true;

  return { allowed, used, max };
}
