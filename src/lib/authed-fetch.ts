// Client-side fetch wrapper that attaches the current Supabase access token
// to the Authorization header. Use for any call into our /api/* routes that
// requires the caller to be signed in (parse, auto-map, admin).
//
// If the user isn't signed in, the request still goes out — the server will
// 401 it, which the UI surfaces as a "sign in required" error. This keeps
// the helper free of UI concerns.

import { supabase } from "./supabase";

export async function authedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  let token: string | null = null;
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token ?? null;
  }

  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(input, { ...init, headers });
}
