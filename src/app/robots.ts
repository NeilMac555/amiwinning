// Robots configuration. Allow indexing of public surfaces (homepage,
// legal pages, public profiles), disallow internal/private routes so
// they don't appear in Google.

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/terms", "/privacy", "/u/"],
        disallow: [
          "/api/",       // server routes, never crawl
          "/admin",      // operator console
          "/settings",   // signed-in only, no value to crawl
          "/bets",       // signed-in only
          "/bets/new",
          "/analytics",
          "/import",
          "/auth/",      // magic-link callback URLs
          "/sign-in",    // auth flow
        ],
      },
    ],
    sitemap: "https://amiup.io/sitemap.xml",
  };
}
