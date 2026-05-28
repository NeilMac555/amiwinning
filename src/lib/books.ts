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
    oddsFormat: (r.odds_format as OddsFormat) ?? "decimal",
    createdAt: r.created_at,
  };
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

/** Fetch all books for the current user (RLS handles the user filter). */
export async function listBooks(): Promise<Book[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("books")
    .select("*")
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
  patch: Partial<Pick<Book, "name" | "description" | "isPublic" | "oddsFormat">>,
): Promise<void> {
  if (!supabase) return;
  const row: Record<string, unknown> = {};
  if (patch.name != null) {
    row.name = patch.name.trim();
    row.slug = slugify(patch.name);
  }
  if (patch.description !== undefined) {
    row.description = patch.description?.trim() || null;
  }
  if (patch.isPublic !== undefined) row.is_public = patch.isPublic;
  if (patch.oddsFormat !== undefined) row.odds_format = patch.oddsFormat;
  const { error } = await supabase.from("books").update(row).eq("id", id);
  if (error) {
     
    console.error("[aiw] updateBook failed:", error.message);
  }
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
