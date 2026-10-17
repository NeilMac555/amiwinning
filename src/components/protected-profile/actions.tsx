"use server";

import { createClient } from "@supabase/supabase-js";
import { requiresProfileAccount } from "@/lib/profile-access";
import HandleReport from "./HandleReport";
import BookReport from "./BookReport";

// A server action returns the rendered report only after verifying the viewer.
// Tokens never appear in URLs, cookies, logs, metadata or persisted state here.
export async function loadProtectedReport(token: string, handle: string, bookSlug?: string) {
  if (!requiresProfileAccount(handle) || !token || token.length > 8192 ||
      (bookSlug !== undefined && !/^[a-z0-9-]{1,100}$/.test(bookSlug))) {
    throw new Error("Sign in to view this report.");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Report temporarily unavailable.");
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user || data.user.is_anonymous) throw new Error("Sign in to view this report.");
  const canonicalHandle = handle.toLowerCase();
  return bookSlug
    ? await BookReport({ params: Promise.resolve({ handle: canonicalHandle, book: bookSlug }), accessToken: token })
    : await HandleReport({ params: Promise.resolve({ handle: canonicalHandle }), accessToken: token });
}
