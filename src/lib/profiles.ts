// Public tipster profiles. Every signed-up user has one (auto-created by the
// `on_auth_user_created` Supabase trigger — see migration 0003).
//
// This module provides the client-side read/write helpers used by the
// /settings page. The server-rendered /u/[handle] page uses its own server-
// only fetcher (see `getProfileServer` further down).

import { createClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export interface Profile {
  userId: string;
  handle: string;
  isPublic: boolean;
  displayName: string | null;
  bio: string | null;
  createdAt: string;
}

interface ProfileRow {
  user_id: string;
  handle: string;
  is_public: boolean;
  display_name: string | null;
  bio: string | null;
  created_at: string;
}

function rowToProfile(r: ProfileRow): Profile {
  return {
    userId: r.user_id,
    handle: r.handle,
    isPublic: r.is_public,
    displayName: r.display_name,
    bio: r.bio,
    createdAt: r.created_at,
  };
}

// Handle constraint enforced by the DB check; we mirror it here for
// fast client-side validation feedback.
const HANDLE_RE = /^[a-z0-9_]{2,32}$/;

export function validateHandle(handle: string): string | null {
  if (!handle) return "Handle is required.";
  if (handle.length < 2) return "At least 2 characters.";
  if (handle.length > 32) return "Maximum 32 characters.";
  if (!HANDLE_RE.test(handle))
    return "Only lowercase letters, digits, and underscores.";
  return null;
}

/**
 * Load the signed-in user's own profile row. Uses the `profiles_select_own`
 * RLS policy. Returns null if not signed in or no row exists (which would
 * indicate the trigger didn't fire — corrupted state, surface to user).
 */
export async function loadMyProfile(): Promise<Profile | null> {
  if (!supabase) return null;
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return rowToProfile(data as ProfileRow);
}

/**
 * Check whether a handle is available. Returns true if free, false if taken
 * by another user. Returns true for the user's OWN current handle (so the
 * Settings form doesn't block on saving the same handle they already have).
 */
export async function isHandleAvailable(
  handle: string,
  excludeUserId?: string,
): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("handle", handle)
    .maybeSingle();
  if (error) return false;
  if (!data) return true;
  // Row exists but is owned by the caller → still "available" to them.
  return excludeUserId != null && data.user_id === excludeUserId;
}

interface ProfileUpdate {
  handle?: string;
  isPublic?: boolean;
  displayName?: string | null;
  bio?: string | null;
}

/**
 * Update the signed-in user's profile. RLS ensures they can only update
 * their own row. Returns the updated profile or an error message.
 */
export async function updateMyProfile(
  patch: ProfileUpdate,
): Promise<{ profile?: Profile; error?: string }> {
  if (!supabase) return { error: "Supabase not configured" };
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) return { error: "Sign in required" };

  const row: Partial<ProfileRow> = {};
  if (patch.handle !== undefined) row.handle = patch.handle;
  if (patch.isPublic !== undefined) row.is_public = patch.isPublic;
  if (patch.displayName !== undefined) row.display_name = patch.displayName;
  if (patch.bio !== undefined) row.bio = patch.bio;

  const { data, error } = await supabase
    .from("profiles")
    .update(row)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();
  if (error) {
    // Unique-violation on handle → friendlier error.
    if (error.code === "23505") return { error: "That handle is taken." };
    return { error: error.message };
  }
  if (!data) return { error: "Profile not found." };
  return { profile: rowToProfile(data as ProfileRow) };
}

// ─ Server-side fetchers ────────────────────────────────────────────────────
//
// Used by the /u/[handle] route handler and its OG image generator. These
// run on the server with the public anon key — RLS lets them through only
// when is_public = true, which is exactly what we want.

interface PublicProfileFetchResult {
  profile: Profile | null;
  /** All bets owned by the profile owner. Empty if profile is private/
   *  not found, since the RLS policy on bets gates on profile publicity. */
  bets: import("./import/types").ImportedBet[];
}

export async function getPublicProfileServer(
  handle: string,
): Promise<PublicProfileFetchResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return { profile: null, bets: [] };

  // Anon-only client. RLS will reject anything we shouldn't see.
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profileRow } = await client
    .from("profiles")
    .select("*")
    .eq("handle", handle)
    .eq("is_public", true)
    .maybeSingle();
  if (!profileRow) return { profile: null, bets: [] };

  const profile = rowToProfile(profileRow as ProfileRow);

  const { data: betRows } = await client
    .from("bets")
    .select("*")
    .eq("user_id", profile.userId)
    .order("kickoff", { ascending: true });

  // Map snake_case rows to the ImportedBet shape used by the analytics
  // helpers. Mirrors the mapper in bet-sync.ts.
  const bets = (betRows ?? []).map(supabaseRowToImportedBet);

  return { profile, bets };
}

interface RawBetRow {
  id: string;
  user_id: string;
  book_id: string | null;
  kickoff: string;
  sport: string;
  league: string | null;
  home: string | null;
  away: string | null;
  event: string;
  market: string | null;
  selection: string;
  odds: number;
  stake: number;
  closing_odds: number | null;
  tipster: string | null;
  tags: string[] | null;
  notes: string | null;
  status: string;
  pl: number;
  source: string;
  imported_at: string;
}

function supabaseRowToImportedBet(
  r: RawBetRow,
): import("./import/types").ImportedBet {
  return {
    id: r.id,
    bookId: r.book_id ?? undefined,
    kickoff: r.kickoff,
    sport: r.sport,
    league: r.league ?? undefined,
    home: r.home ?? undefined,
    away: r.away ?? undefined,
    event: r.event,
    market:
      (r.market as import("./import/types").MarketGuess) ?? undefined,
    selection: r.selection,
    odds: Number(r.odds),
    stake: Number(r.stake),
    closingOdds: r.closing_odds != null ? Number(r.closing_odds) : undefined,
    tipster: r.tipster ?? undefined,
    tags: r.tags ?? undefined,
    notes: r.notes ?? undefined,
    status: r.status as import("./import/types").Status,
    pl: Number(r.pl),
    source: r.source,
    importedAt: r.imported_at,
    // `raw` is the optional original-row dump from the importer; not
    // surfaced on public profiles, so we always pass an empty object.
    raw: {},
  };
}
