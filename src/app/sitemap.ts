// Sitemap for search engines. Includes:
//   - Static marketing surfaces (homepage, legal, /compare, /learn,
//     /partners).
//   - Public tipster profiles that the user has actually configured
//     (display_name set — filters out the ghost signups). Both the
//     bare /u/<handle> and any per-book /u/<handle>/<book_slug> URLs.
//
// The profile queries hit Supabase at request time via the anon client
// (RLS policies profiles_select_public + books_select_public_profile
// gate what we can read). Revalidated hourly so Google crawls see a
// fresh sitemap without hammering Supabase on every hit.

import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE = "https://amiup.io";

// Cache the generated sitemap for an hour. New public profiles won't
// appear instantly, but Google typically re-crawls sitemap.xml on a
// multi-hour cadence anyway, so this trade is invisible in practice.
export const revalidate = 3600;

interface ProfileRow {
  handle: string;
  updated_at?: string | null;
}

interface BookRow {
  user_id: string;
  public_slug: string;
  updated_at?: string | null;
}

// Fetch public profiles with a configured display_name. Anyone who has
// bothered to set a display name is treated as a real user we want
// indexed; ghost signups (~350 of 380 public profiles as of writing)
// are excluded so we don't feed Google thin-content pages.
async function fetchPublicProfileEntries(): Promise<MetadataRoute.Sitemap> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return [];

  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client
    .from("profiles")
    .select("handle, updated_at")
    .eq("is_public", true)
    .not("display_name", "is", null);

  if (error || !data) return [];

  return (data as ProfileRow[]).map((p) => ({
    url: `${BASE}/u/${p.handle}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));
}

// Fetch public books that have a slug set — these are the per-book
// profile URLs (/u/<handle>/<slug>). No FK exists between books and
// profiles in PostgREST's schema (both just reference auth.users), so
// we can't use an inline `!inner` join. Fetch books, then fetch the
// handles for their user_ids and stitch client-side.
async function fetchPublicBookEntries(): Promise<MetadataRoute.Sitemap> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return [];

  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: bookData, error: bookErr } = await client
    .from("books")
    .select("user_id, public_slug, updated_at")
    .eq("is_public", true)
    .not("public_slug", "is", null);

  if (bookErr || !bookData || bookData.length === 0) return [];

  const books = bookData as BookRow[];
  const userIds = Array.from(new Set(books.map((b) => b.user_id)));

  const { data: profileData } = await client
    .from("profiles")
    .select("user_id, handle")
    .in("user_id", userIds)
    .eq("is_public", true);

  const handleByUser = new Map<string, string>();
  for (const p of (profileData ?? []) as { user_id: string; handle: string }[]) {
    handleByUser.set(p.user_id, p.handle);
  }

  const out: MetadataRoute.Sitemap = [];
  for (const b of books) {
    const handle = handleByUser.get(b.user_id);
    if (!handle) continue; // profile not public → don't leak URL
    out.push({
      url: `${BASE}/u/${handle}/${b.public_slug}`,
      lastModified: b.updated_at ? new Date(b.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.65,
    });
  }
  return out;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [profileEntries, bookEntries] = await Promise.all([
    fetchPublicProfileEntries(),
    fetchPublicBookEntries(),
  ]);
  const staticEntries: MetadataRoute.Sitemap = [
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
  return [...staticEntries, ...profileEntries, ...bookEntries];
}
