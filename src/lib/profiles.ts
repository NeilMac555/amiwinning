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
  avatarUrl: string | null;
  createdAt: string;
}

interface ProfileRow {
  user_id: string;
  handle: string;
  is_public: boolean;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

function rowToProfile(r: ProfileRow): Profile {
  return {
    userId: r.user_id,
    handle: r.handle,
    isPublic: r.is_public,
    displayName: r.display_name,
    bio: r.bio,
    avatarUrl: r.avatar_url,
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
  avatarUrl?: string | null;
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
  if (patch.avatarUrl !== undefined) row.avatar_url = patch.avatarUrl;

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

// ─ Avatar upload / delete ─────────────────────────────────────────────────

const AVATAR_BUCKET = "avatars";

/**
 * Client-side resize before upload. Big-camera-JPEGs are easily 5MB+; we
 * never need higher than 512x512 for a profile pic. Returns a JPEG blob
 * at quality 0.9 — small enough to upload over a phone connection.
 */
async function resizeImage(file: File, maxSize = 512): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(maxSize / bitmap.width, maxSize / bitmap.height, 1);
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Encode failed"))),
      "image/jpeg",
      0.9,
    );
  });
}

/**
 * Upload a new avatar for the signed-in user. Resizes client-side,
 * overwrites any existing avatar (single canonical path per user), and
 * updates profiles.avatar_url with the public URL.
 *
 * Returns the new public URL on success, or an error string.
 */
export async function uploadMyAvatar(
  file: File,
): Promise<{ url?: string; error?: string }> {
  if (!supabase) return { error: "Supabase not configured" };
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) return { error: "Sign in required" };

  if (!file.type.startsWith("image/")) {
    return { error: "That doesn't look like an image." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { error: "Image is too large (max 10MB)." };
  }

  let blob: Blob;
  try {
    blob = await resizeImage(file);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Resize failed." };
  }

  // Canonical path: <user_id>/avatar.jpg. Reusing the same name lets us
  // upsert without leaving orphaned files behind.
  const path = `${userId}/avatar.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, blob, {
      contentType: "image/jpeg",
      cacheControl: "300", // 5min — short enough that updates show fast.
      upsert: true,
    });
  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  // Append a cache-buster so the new image shows immediately even if a
  // cached version is in the browser/CDN.
  const url = `${data.publicUrl}?v=${Date.now()}`;

  const upd = await updateMyProfile({ avatarUrl: url });
  if (upd.error) return { error: upd.error };
  return { url };
}

/** Remove the avatar — deletes the file and clears profiles.avatar_url. */
export async function removeMyAvatar(): Promise<{ error?: string }> {
  if (!supabase) return { error: "Supabase not configured" };
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) return { error: "Sign in required" };

  // Best-effort delete; even if the file is already gone, we still want to
  // clear the column. Ignore the storage error.
  await supabase.storage
    .from(AVATAR_BUCKET)
    .remove([`${userId}/avatar.jpg`]);

  const upd = await updateMyProfile({ avatarUrl: null });
  return { error: upd.error };
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
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey) return { profile: null, bets: [] };

  // Service-role key when available so we can read the user's books table
  // (which has owner-only RLS) and filter bets to the chosen public book.
  // The profile.is_public check below is the privacy gate — if a profile
  // isn't public we never return rows. Falls back to anon when not set.
  const client = createClient(url, serviceKey ?? anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Profile — gated on is_public = true. Critical privacy check.
  const { data: profileRow } = await client
    .from("profiles")
    .select("*")
    .eq("handle", handle)
    .eq("is_public", true)
    .maybeSingle();
  if (!profileRow) return { profile: null, bets: [] };

  const profile = rowToProfile(profileRow as ProfileRow);

  // 2. Pick which book to share publicly. Order of preference:
  //    a. Any book the user has explicitly marked is_public = true
  //    b. The oldest book — auto-created "Personal" on first sign-in
  // The user's other books (e.g. "Ylose Tennis") stay private unless they
  // flip is_public on them. This stops the profile from accidentally
  // mixing strategies together.
  interface BookRow {
    id: string;
    name: string;
    is_public: boolean;
    created_at: string;
  }
  const { data: bookRows } = await client
    .from("books")
    .select("id, name, is_public, created_at")
    .eq("user_id", profile.userId)
    .order("created_at", { ascending: true });
  const books = (bookRows ?? []) as BookRow[];
  if (books.length === 0) {
    // User has no books — return empty bets but still show the profile.
    return { profile, bets: [] };
  }
  const publicBooks = books.filter((b) => b.is_public);
  const selectedBook = (publicBooks[0] ?? books[0]) as BookRow;

  // 3. Fetch every bet in that book. Paginate to dodge Supabase's
  //    default 1000-row cap. Also include legacy bets without a book_id
  //    (created before the books system existed) — those belong with
  //    the user's oldest book by convention.
  const PAGE_SIZE = 1000;
  const MAX_PAGES = 100;
  const isOldestBook = selectedBook.id === books[0].id;
  const allRows: RawBetRow[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let q = client
      .from("bets")
      .select("*")
      .eq("user_id", profile.userId)
      .order("kickoff", { ascending: true })
      .range(from, to);
    q = isOldestBook
      ? q.or(`book_id.eq.${selectedBook.id},book_id.is.null`)
      : q.eq("book_id", selectedBook.id);
    const { data: pageRows, error } = await q;
    if (error) break;
    const rows = (pageRows ?? []) as RawBetRow[];
    allRows.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }

  const bets = allRows.map(supabaseRowToImportedBet);

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
