// Sitemap for search engines. Includes only public surfaces — the
// homepage and the two legal pages. Future enhancement: query Supabase
// for every public profile and emit a /u/<handle> entry per row. Holding
// that off until we have enough public profiles to make it worthwhile
// (and to avoid leaking handle counts in the early days).

import type { MetadataRoute } from "next";

const BASE = "https://amiup.io";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: `${BASE}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      // SEO comparison page. High priority (0.8) because this is one
      // of our deliberate long-tail keyword targets ("bettin.gs
      // alternative", "bet tracker comparison").
      url: `${BASE}/compare/bettin-gs`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      // Pikkit comparison — second SEO target in the /compare/* series,
      // catching "Pikkit alternative" / "Pikkit vs Am I Up" searches.
      url: `${BASE}/compare/pikkit`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
