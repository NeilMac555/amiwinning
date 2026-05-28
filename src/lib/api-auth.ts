// Server-side auth helper for API routes that need to know who's calling.
//
// Verifies a Supabase access token from the Authorization: Bearer header
// using the anon key. If the token is missing or invalid, returns a ready-
// to-return Response. Mirrors the pattern in /api/admin/users.
//
// Usage:
//   const auth = await requireUser(req);
//   if ("error" in auth) return auth.error;
//   // auth.user is a verified Supabase User

import { NextResponse } from "next/server";
import { createClient, type User } from "@supabase/supabase-js";

interface AuthOk {
  user: User;
  token: string;
}

interface AuthErr {
  error: Response;
}

export async function requireUser(req: Request): Promise<AuthOk | AuthErr> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // When Supabase isn't configured at all, the app runs in local-only mode
  // and these routes shouldn't be callable in prod. We allow no-auth here
  // so dev environments still work without setting up Supabase.
  if (!url || !anonKey) {
    return {
      error: NextResponse.json(
        { error: "Server not configured for auth" },
        { status: 503 },
      ),
    };
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return {
      error: NextResponse.json(
        { error: "Sign in required" },
        { status: 401 },
      ),
    };
  }

  const client = createClient(url, anonKey);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    return {
      error: NextResponse.json(
        { error: "Invalid or expired session — sign in again" },
        { status: 401 },
      ),
    };
  }

  return { user: data.user, token };
}
