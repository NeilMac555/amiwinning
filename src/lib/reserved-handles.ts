// Reserved handles.
//
// Since 2026-08-17 the profile URL is /{handle} — no /u/ prefix. That
// means every top-level route on the site now competes with a possible
// user handle. Next.js gives static routes higher priority than dynamic
// ones, so if a user takes handle "learn", their profile is unreachable
// at amiup.io/learn (Next serves the /learn page instead).
//
// This set defines every handle we refuse to allow at sign-up or
// handle-change, verified 2026-08-17 against the live profiles table
// to have zero existing collisions. If we add a new top-level route,
// add its name here at the same time.
//
// Rules for adding entries:
//   - Only handles that would ACTUALLY collide with a live route or a
//     route we plan to add soon. Not a blanket "brand-protection" list.
//   - Lowercase only — the handle regex already restricts to
//     [a-z0-9_]{2,32}, so uppercase/hyphenated forms can never occur.
//   - Compound routes with hyphens (sign-in, expected-value,
//     kelly-criterion, bet-analytix, bettin-gs) are safe from
//     collision because the handle regex forbids hyphens — no need
//     to list them.
//   - Compound routes with dots (robots.txt, sitemap.xml, llms.txt,
//     favicon.ico) are safe for the same reason.

export const RESERVED_HANDLES = new Set<string>([
  // Current top-level routes (2026-08)
  "admin",
  "analytics",
  "api",
  "auth",
  "bets",
  "compare",
  "dev",
  "import",
  "learn",
  "partners",
  "pending",
  "privacy",
  "settings",
  "terms",
  "u", // preserved for the legacy /u/[handle] redirect path
  // Auth flow reservations (future-proofing common CTAs)
  "callback",
  "login",
  "logout",
  "oauth",
  "register",
  "signin",
  "signout",
  "signup",
  // Common web / brand generics we'd likely add later
  "about",
  "account",
  "blog",
  "contact",
  "docs",
  "embed",
  "feed",
  "help",
  "home",
  "index",
  "me",
  "my",
  "pricing",
  "profile",
  "profiles",
  "search",
  "share",
  "static",
  "support",
  "user",
  "users",
  "www",
  // Infra / crawler discovery — most of these are dot-containing so
  // can't collide with the handle regex, but including the bare
  // stems protects against typos in future routing.
  "favicon",
  "llms",
  "manifest",
  "opengraph",
  "robots",
  "sitemap",
  "vercel",
  // Content the marketing pages already link to as demos
  "sample",
]);

export function isReservedHandle(handle: string): boolean {
  return RESERVED_HANDLES.has(handle.toLowerCase());
}
