"use client";

import { DashboardLoading } from "./DashboardLoading";
import { LandingPage } from "./LandingPage";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const sessionKey = supabaseUrl
  ? `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`
  : null;

// Runs before the following HTML is painted. The saved session is ONLY a
// visual hint: AuthProvider still resolves the session and gates the account.
// No token, betting data, or storage is modified. With JS/storage unavailable,
// the complete marketing page remains visible in the initial server HTML.
const startupScript = `try {
  var saved = JSON.parse(localStorage.getItem(${JSON.stringify(sessionKey)}) || "null");
  document.documentElement.toggleAttribute("data-account-startup", Boolean(saved && saved.access_token && saved.user && saved.user.id));
} catch (_) { document.documentElement.removeAttribute("data-account-startup"); }`;

export function HomeStartup() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: startupScript }} />
      <div className="homepage-initial-landing"><LandingPage /></div>
      <div className="homepage-initial-account"><DashboardLoading /></div>
    </>
  );
}
