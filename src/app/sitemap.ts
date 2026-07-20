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
    {
      // Bet Diary comparison — third /compare page. Catches
      // "bet diary alternative" / "betdiary vs" searches. Bet Diary
      // is UK-focused with a horse-racing lineage; page positions
      // Am I Up as the AI-first multi-sport alternative.
      url: `${BASE}/compare/betdiary`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      // /compare hub. Consolidates PageRank across the individual
      // comparison pages, ranks in its own right for "bet tracker
      // comparison" style queries, gives Google a topical-authority
      // signal.
      url: `${BASE}/compare`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      // /learn hub. Same rationale as /compare hub — bare /learn
      // used to 404, now it's a DefinedTermSet index of the five
      // glossary entries.
      url: `${BASE}/learn`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      // Glossary page — first in the /learn/* series. Targets
      // "what is CLV in betting" + "closing line value" long-tail
      // searches. More pages in this series shipping daily.
      url: `${BASE}/learn/clv`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      // Glossary day 2 — Yield. Targets "what is yield in betting" +
      // "what is a good yield betting" + "yield vs ROI betting".
      url: `${BASE}/learn/yield`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      // Glossary day 3 — Expected Value. Highest combined search
      // volume of the cluster (~2k/mo "what is EV in sports betting"
      // alone) so priority is bumped to 0.75.
      url: `${BASE}/learn/expected-value`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      // Glossary day 4 — ROI. Same-priority as yield: mid-volume
      // ("what is ROI in betting") and cited from the yield / ROC
      // pages so it accumulates internal PageRank fast.
      url: `${BASE}/learn/roi`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      // Glossary day 5 — ROC. Lower absolute volume ("return on
      // capital sports betting") but zero real competition, so it
      // gets the same 0.7 priority. Together with /learn/roi it
      // resolves the yield-vs-ROI-vs-ROC confusion on Google + LLMs.
      url: `${BASE}/learn/roc`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      // Tipster partnership landing. Lower priority (0.5) than the
      // marketing / glossary pages because organic search intent is
      // small, but we still want Google + LLMs to know it exists so
      // "am i up partners" resolves cleanly.
      url: `${BASE}/partners`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
