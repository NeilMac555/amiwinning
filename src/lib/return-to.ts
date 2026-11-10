// "Send me back where I came from" after sign-in.
//
// The sign-up wall on profile pages links to /sign-in?returnTo=/<handle>
// so a new account lands back on the record it wanted to see. Sign-in is
// a magic link, so the visitor leaves the site and comes back through
// /auth/callback in a fresh page load. The destination is parked in
// localStorage in between (same browser only; a link opened on another
// device just lands on the dashboard, which is the old behaviour).
//
// Only profile-shaped paths are accepted: /<handle> or /<handle>/<book>.
// That is everything the app ever puts in returnTo, and it means a
// crafted link can never bounce someone to another site after sign-in.

const KEY = "aiw_return_to_v1";

// Magic links are short-lived; a destination older than this is stale.
const MAX_AGE_MS = 30 * 60 * 1000;

// Same shapes the database enforces: handle [a-z0-9_]{2,32}, book slug
// [a-z0-9-]{2,32}. Must start with exactly one slash.
const SAFE_PATH = /^\/[a-z0-9_]{2,32}(\/[a-z0-9-]{2,32})?$/;

export function sanitizeReturnTo(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return SAFE_PATH.test(raw) ? raw : null;
}

/** Park a destination for the callback page. Anything unsafe or empty
 *  clears whatever was parked before. */
export function rememberReturnTo(raw: string | null | undefined): void {
  if (typeof window === "undefined") return;
  try {
    const path = sanitizeReturnTo(raw);
    if (!path) {
      window.localStorage.removeItem(KEY);
      return;
    }
    window.localStorage.setItem(KEY, JSON.stringify({ path, ts: Date.now() }));
  } catch {
    // Storage blocked: sign-in still works, it just lands on the dashboard.
  }
}

/** Read and clear the parked destination. Null if none, stale, or unsafe. */
export function consumeReturnTo(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    window.localStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as { path?: unknown; ts?: unknown };
    if (typeof parsed.ts !== "number" || Date.now() - parsed.ts > MAX_AGE_MS) {
      return null;
    }
    return sanitizeReturnTo(typeof parsed.path === "string" ? parsed.path : null);
  } catch {
    return null;
  }
}
