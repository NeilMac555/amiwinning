// Robots configuration. Allow indexing of public surfaces (homepage,
// legal pages, public profiles), disallow internal/private routes so
// they don't appear in Google.

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Public content plus the llms.txt / llms-full.txt LLM discovery
        // files. These are static plain-text files served from /public so
        // no Next.js route pattern is needed, but we allow-list them here
        // so no future robots.txt tightening accidentally excludes them.
        allow: [
          "/",
          "/terms",
          "/privacy",
          "/u/",
          "/compare/",
          "/learn/",
          "/partners",
          "/llms.txt",
          "/llms-full.txt",
        ],
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
    // LLM discovery hint. Not part of the RFC-standard robots.txt schema,
    // but Anthropic / Perplexity / OpenAI crawlers explicitly look for
    // /llms.txt at the site root. Advertising it here lets a curious
    // human crawler operator find it too. Emitted as a raw directive
    // via Next's `host` string trick would be brittle — the crawlers
    // that care already probe /llms.txt directly, so we rely on that.
  };
}
