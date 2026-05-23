// GET /api/admin/users
//
// Returns every signed-up user along with their aggregated activity stats:
// when they joined, when they last signed in, how many books / bets they
// have. Used by the /admin page.
//
// Security:
//   1. The caller must be authenticated.
//   2. The caller's email must be in NEXT_PUBLIC_ADMIN_EMAILS.
//   3. We use the Supabase service role key (server-only) to bypass RLS
//      so we can see every user's row counts. Never exposed to the client.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/admin";

interface UserRow {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  bets: number;
  books: number;
  // Activity flags for at-a-glance scanning:
  hasLoggedABet: boolean;
  activeLast7d: boolean;
}

export async function GET(req: Request): Promise<Response> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "Admin API not configured (missing SUPABASE_SERVICE_ROLE_KEY)" },
      { status: 503 },
    );
  }

  // The browser sends the user's access token as an Authorization Bearer
  // header; we verify it with the regular anon client first to learn who
  // is calling. If they're an admin, we then escalate to the service-role
  // client for the actual data query.
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    return NextResponse.json(
      { error: "Server misconfigured (missing anon key)" },
      { status: 503 },
    );
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the access token belongs to a real, current user.
  const checkClient = createClient(url, anonKey);
  const { data: userData, error: userErr } = await checkClient.auth.getUser(
    token,
  );
  if (userErr || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Admin allow-list gate.
  if (!isAdminEmail(userData.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Service-role client — bypasses RLS. Never used for endpoints the
  // public can reach without the admin gate above.
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. List all auth users. The admin API paginates; loop until we have
  //    everyone (cap at 1000 for safety — overkill for our scale).
  const allUsers: { id: string; email: string; created_at: string; last_sign_in_at: string | null }[] = [];
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      return NextResponse.json(
        { error: `listUsers failed: ${error.message}` },
        { status: 500 },
      );
    }
    for (const u of data.users) {
      if (!u.email) continue;
      allUsers.push({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
      });
    }
    if (data.users.length < perPage || page >= 5) break;
    page++;
  }

  // 2. Aggregate bet counts and book counts per user. Two simple queries
  //    against the public schema, server-side.
  const userIds = allUsers.map((u) => u.id);
  const betsByUser = new Map<string, number>();
  const booksByUser = new Map<string, number>();

  if (userIds.length > 0) {
    const { data: betRows, error: betErr } = await admin
      .from("bets")
      .select("user_id")
      .in("user_id", userIds);
    if (betErr) {
      return NextResponse.json(
        { error: `bets aggregation failed: ${betErr.message}` },
        { status: 500 },
      );
    }
    for (const r of betRows ?? []) {
      const k = (r as { user_id: string }).user_id;
      betsByUser.set(k, (betsByUser.get(k) ?? 0) + 1);
    }

    const { data: bookRows, error: bookErr } = await admin
      .from("books")
      .select("user_id")
      .in("user_id", userIds);
    if (bookErr) {
      return NextResponse.json(
        { error: `books aggregation failed: ${bookErr.message}` },
        { status: 500 },
      );
    }
    for (const r of bookRows ?? []) {
      const k = (r as { user_id: string }).user_id;
      booksByUser.set(k, (booksByUser.get(k) ?? 0) + 1);
    }
  }

  // 3. Build the response. Sort newest-signup first so the admin sees
  //    the most recent activity at the top.
  const sevenDaysAgo = Date.now() - 7 * 86_400_000;
  const rows: UserRow[] = allUsers
    .map((u) => {
      const bets = betsByUser.get(u.id) ?? 0;
      const lastSignInMs = u.last_sign_in_at
        ? new Date(u.last_sign_in_at).getTime()
        : 0;
      return {
        id: u.id,
        email: u.email,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at,
        bets,
        books: booksByUser.get(u.id) ?? 0,
        hasLoggedABet: bets > 0,
        activeLast7d: lastSignInMs >= sevenDaysAgo,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  // Totals for the dashboard header.
  const totals = {
    users: rows.length,
    withABet: rows.filter((r) => r.hasLoggedABet).length,
    activeLast7d: rows.filter((r) => r.activeLast7d).length,
    totalBets: rows.reduce((s, r) => s + r.bets, 0),
  };

  return NextResponse.json({ rows, totals });
}
