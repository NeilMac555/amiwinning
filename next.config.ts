import type { NextConfig } from "next";

// Security headers applied to every response. Skip Content-Security-Policy
// for now — Next.js's hydration scripts make per-request nonces non-
// trivial; revisit when we have a dedicated security pass.
const SECURITY_HEADERS = [
  // HSTS: tell browsers to only ever use HTTPS for this domain. 2 years,
  // includes subdomains, eligible for the preload list.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Block being embedded in iframes. Defends against clickjacking on the
  // dashboard / bet log / settings.
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-sniffing so a misuploaded image-as-html doesn't execute.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send only origin (no path/query) when navigating cross-origin. Lets
  // referrer-based analytics work in-app but limits info leaking to
  // bookmaker landings if a user clicks an external link.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features we don't use. Defence-in-depth against XSS
  // that might try to access the camera / geolocation / etc.
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=(), interest-cohort=()",
  },
  // Mark cross-origin opening as restricted — prevents window.opener
  // attacks on links that open new tabs.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply to every route. The OG-image route under /u/-/opengraph-image
        // is whitelisted by Next.js's own metadata handling; these headers
        // don't break image rendering.
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
