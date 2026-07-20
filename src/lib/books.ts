// Books — a single user can have multiple "books" (Personal, Ylose Tennis,
// etc.) and bets live inside exactly one book. Active book is a UI/local
// concept stored in localStorage; book records themselves live in Supabase
// RLS-locked to the owning user.

import { supabase } from "./supabase";

export type OddsFormat = "decimal" | "american" | "fractional";

export interface Book {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string;
  isPublic: boolean;
  /** URL fragment for the per-book public profile route
   *  (/u/<handle>/<publicSlug>). Null when the book is not
   *  reachable via a per-book URL. See migration 0007. */
  publicSlug: string | null;
  oddsFormat: OddsFormat;
  createdAt: string;
}

interface BookRow {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_public: boolean;
  public_slug: string | null;
  odds_format: string;
  created_at: string;
}

function rowToBook(r: BookRow): Book {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    slug: r.slug,
    description: r.description ?? undefined,
    isPublic: r.is_public,
    publicSlug: r.public_slug ?? null,
    oddsFormat: (r.odds_format as OddsFormat) ?? "decimal",
    createdAt: r.created_at,
  };
}

/** Validates a proposed public slug against the same regex the DB enforces
 *  (see migration 0007's check constraint). Returns an error message or null. */
export function validatePublicSlug(slug: string): string | null {
  if (!slug) return "Slug is required to make this book publicly shareable.";
  if (slug.length < 2) return "At least 2 characters.";
  if (slug.length > 32) return "Maximum 32 characters.";
  if (!/^[a-z0-9-]+$/.test(slug))
    return "Only lowercase letters, digits, and hyphens.";
  if (/^-|-$/.test(slug)) return "Cannot start or end with a hyphen.";
  if (/--/.test(slug)) return "No consecutive hyphens.";
  return null;
}

/** Suggests a URL-safe slug from a book name. Used to pre-fill the slug
 *  field when the user first ticks Public on a book. */
export function suggestPublicSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// ─────────────────────────────────────────────────────────────────────────
// Supabase calls
// ─────────────────────────────────────────────────────────────────────────

/** Fetch all books for the current user.
 *
 *  Important: explicitly filters by user_id even though RLS exists. The
 *  books_select_public_profile policy (migration 0005) grants every
 *  signed-in user SELECT on every public-profile user's books — that's
 *  what powers the /u/<handle> server route. Without an explicit filter,
 *  a signed-in user would see other users' "Personal" books in their
 *  switcher dropdown. The check pins the result set to the current
 *  session's user.
 */
export async function listBooks(): Promise<Book[]> {
  if (!supabase) return [];
  const { data: sess } = await supabase.auth.getSession();
  const userId = sess.session?.user.id;
  if (!userId) return [];
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) {

    console.error("[aiw] listBooks failed:", error.message);
    return [];
  }
  return (data as BookRow[]).map(rowToBook);
}

/** Create a new book. Returns the created record, or null on error. */
export async function createBook(
  userId: string,
  name: string,
  description?: string,
): Promise<Book | null> {
  if (!supabase) return null;
  const slug = slugify(name);
  if (!slug) return null;
  const { data, error } = await supabase
    .from("books")
    .insert({
      user_id: userId,
      name: name.trim(),
      slug,
      description: description?.trim() || null,
    })
    .select()
    .single();
  if (error) {
     
    console.error("[aiw] createBook failed:", error.message);
    return null;
  }
  return rowToBook(data as BookRow);
}

/** Ensure the user has at least one book — create a default "Personal"
 *  if their books list is empty. Called from AuthProvider on sign-in. */
export async function ensureDefaultBook(userId: string): Promise<Book[]> {
  const books = await listBooks();
  if (books.length > 0) return books;
  const created = await createBook(userId, "Personal");
  return created ? [created] : [];
}

export async function updateBook(
  id: string,
  patch: Partial<
    Pick<Book, "name" | "description" | "isPublic" | "publicSlug" | "oddsFormat">
  >,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: "Supabase not configured." };
  const row: Record<string, unknown> = {};
  if (patch.name != null) {
    row.name = patch.name.trim();
    row.slug = slugify(patch.name);
  }
  if (patch.description !== undefined) {
    row.description = patch.description?.trim() || null;
  }
  if (patch.isPublic !== undefined) row.is_public = patch.isPublic;
  if (patch.publicSlug !== undefined) {
    // Client-side pre-validation with the same rules as the DB check
    // constraint. This gives the user a clean inline error instead of
    // a raw Postgres error string on save.
    if (patch.publicSlug === null || patch.publicSlug === "") {
      row.public_slug = null;
    } else {
      const err = validatePublicSlug(patch.publicSlug);
      if (err) return { ok: false, error: err };
      row.public_slug = patch.publicSlug;
    }
  }
  if (patch.oddsFormat !== undefined) row.odds_format = patch.oddsFormat;
  const { error } = await supabase.from("books").update(row).eq("id", id);
  if (error) {
    console.error("[aiw] updateBook failed:", error.message);
    // Surface unique-violation as a friendly message; anything else is
    // returned verbatim so the caller can render it.
    if (error.code === "23505") {
      return {
        ok: false,
        error:
          "That URL slug is already in use by one of your other books.",
      };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function deleteBook(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) {
     
    console.error("[aiw] deleteBook failed:", error.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Active book — UI state, stored in localStorage.
// ─────────────────────────────────────────────────────────────────────────

const ACTIVE_BOOK_KEY = "aiw_active_book_id";

export function loadActiveBookId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_BOOK_KEY);
}

export function saveActiveBookId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem(ACTIVE_BOOK_KEY, id);
  else window.localStorage.removeItem(ACTIVE_BOOK_KEY);
}
