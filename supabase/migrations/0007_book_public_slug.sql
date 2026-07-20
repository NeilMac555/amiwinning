-- ---------------------------------------------------------------------------
-- Am I Up — per-book public share slugs.
--
-- Feature: a user with multiple books (Personal, Ylose Soccer, Ylose Tennis)
-- can share DIFFERENT public URLs for each book, one at a time. E.g.
--   amiup.io/u/filthyjabba/ylose-soccer
--   amiup.io/u/filthyjabba/ylose-tennis
--
-- Adds a new nullable column `public_slug` on public.books. When set, it is
-- the URL fragment used on the multi-book profile route. When null, the book
-- is NOT reachable via a per-book URL (the existing bare /u/<handle> still
-- picks whichever book is public per its own resolution rules).
--
-- Constraints:
--   - Unique per user (a user cannot have two books sharing the same slug).
--   - Regex-checked so no funny characters land in a URL.
--   - Length capped at 32 chars to keep URLs short.
--
-- This migration is additive:
--   - Column defaults to NULL, so no existing book becomes publicly reachable
--     as a side effect of running it.
--   - Existing bare /u/<handle> route is untouched by this migration.
--   - RLS policies from migrations 0005 + 0006 already gate books SELECT on
--     the owning profile being is_public = true; the app also enforces
--     book.is_public + slug match at the server-component layer.
-- ---------------------------------------------------------------------------

alter table public.books
  add column public_slug text;

-- Case rule: lowercase letters, digits, hyphens. 2-32 chars. Any user input
-- that fails this constraint will be rejected at the DB layer, so a rogue
-- client cannot poison the URL space with e.g. path traversal characters.
alter table public.books
  add constraint books_public_slug_check
  check (public_slug is null or public_slug ~ '^[a-z0-9-]{2,32}$');

-- Uniqueness is per-user: two different users can each have a book whose
-- public_slug is "personal" without colliding — the URL includes the handle,
-- so the full path (handle, book slug) stays globally unique.
--
-- Partial index ("where public_slug is not null") keeps books with no slug
-- out of the constraint entirely.
create unique index books_public_slug_per_user
  on public.books (user_id, public_slug)
  where public_slug is not null;

-- Rollback (uncomment if reverting):
--   drop index if exists books_public_slug_per_user;
--   alter table public.books drop constraint if exists books_public_slug_check;
--   alter table public.books drop column if exists public_slug;
