// Admin-access helpers. The list of admin emails lives in an env var so it
// can differ between dev and prod, and so we don't ship Neil's email in the
// repo. Server-side checks always run; the client-side helper is purely a
// UI hint (hides the sidebar link) — never trusted on its own.

const ADMIN_EMAILS_RAW =
  process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "";

const ADMIN_EMAILS = ADMIN_EMAILS_RAW
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/** True when the given email is in the configured admin allow-list. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
