// UTM attribution capture.
//
// The problem this solves: Neil ships the same "amiup.io" link across
// SteamWatch, X bio, Substack, Ylose Telegram. Without instrumentation
// he cannot tell which channel is driving signups. Adding utm_source
// query params to each variant of the link, capturing them into
// sessionStorage on landing, and forwarding into Supabase auth
// metadata on signup gives him per-user attribution he can query.
//
// Contract:
//   1. captureUtmFromUrl() runs on landing. Reads utm_source, utm_medium,
//      utm_campaign, referrer, and the entry pathname from the browser.
//      Writes to sessionStorage[UTM_STORAGE_KEY] as JSON.
//   2. Freshest wins: if the current URL has any utm_ param, it
//      overwrites whatever was in sessionStorage. If the URL has no
//      utm_ params but sessionStorage has one, we keep the existing.
//      This preserves attribution across in-app navigation.
//   3. readUtm() reads back. Returns null if nothing captured.
//   4. signInWithEmail() reads UTM and forwards into
//      signInWithOtp's options.data — Supabase persists that into
//      auth.users.raw_user_meta_data at first sign-in.
//   5. The new-user webhook reads user_metadata.utm_* and includes
//      it in the notification email so Neil sees attribution per
//      signup in near-real-time.
//
// Privacy: UTM data is first-party marketing telemetry, no PII. Stored
// only in the user's own sessionStorage until they choose to sign up,
// at which point it becomes part of their own user_metadata row.

export const UTM_STORAGE_KEY = "aiw_utm";

export interface UtmData {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  referrer?: string;
  landingPath?: string;
  capturedAt: string;
}

/**
 * Read UTM params from the current URL and merge into sessionStorage.
 * Call from a client effect on the landing page and sign-in page.
 * No-op on the server. Safe to call multiple times per session; the
 * "freshest wins" rule below preserves the latest attribution.
 */
export function captureUtmFromUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    const source = url.searchParams.get("utm_source");
    const medium = url.searchParams.get("utm_medium");
    const campaign = url.searchParams.get("utm_campaign");
    const content = url.searchParams.get("utm_content");
    const term = url.searchParams.get("utm_term");

    // If the URL carries NO utm_* params, do not clobber an existing
    // capture from earlier in the session. This preserves attribution
    // as the user navigates around the site.
    const anyInUrl = source || medium || campaign || content || term;
    if (!anyInUrl) {
      const existing = window.sessionStorage.getItem(UTM_STORAGE_KEY);
      if (existing) return;
      // No URL UTMs and no prior capture — still worth logging the
      // referrer + landing path so we at least know they arrived
      // (organic search vs. direct vs. some external site).
      const referrer = document.referrer || undefined;
      if (!referrer) return;
      const data: UtmData = {
        referrer,
        landingPath: url.pathname,
        capturedAt: new Date().toISOString(),
      };
      window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(data));
      return;
    }

    const data: UtmData = {
      source: source ?? undefined,
      medium: medium ?? undefined,
      campaign: campaign ?? undefined,
      content: content ?? undefined,
      term: term ?? undefined,
      referrer: document.referrer || undefined,
      landingPath: url.pathname,
      capturedAt: new Date().toISOString(),
    };
    window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage blocked (privacy mode) or malformed URL. Silent.
  }
}

/** Read the captured UTM payload, or null. Client-only. */
export function readUtm(): UtmData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UtmData;
  } catch {
    return null;
  }
}

/** Flatten UtmData into a plain object suitable for Supabase's
 *  signInWithOtp options.data slot (goes into user_metadata). Prefixed
 *  with `utm_` so the fields are self-describing when queried later. */
export function utmToUserMetadata(u: UtmData | null): Record<string, string> {
  if (!u) return {};
  const out: Record<string, string> = {};
  if (u.source) out.utm_source = u.source;
  if (u.medium) out.utm_medium = u.medium;
  if (u.campaign) out.utm_campaign = u.campaign;
  if (u.content) out.utm_content = u.content;
  if (u.term) out.utm_term = u.term;
  if (u.referrer) out.utm_referrer = u.referrer;
  if (u.landingPath) out.utm_landing_path = u.landingPath;
  out.utm_captured_at = u.capturedAt;
  return out;
}
