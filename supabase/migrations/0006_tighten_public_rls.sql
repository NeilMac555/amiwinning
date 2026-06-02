-- ---------------------------------------------------------------------------
-- Am I Up — restrict public-profile RLS policies to the anon role.
--
-- Background: migrations 0003 and 0005 added select policies that allowed
-- anyone (anon and authenticated) to read public-profile users' data.
-- The intent was to power the server-rendered /u/<handle> page from an
-- anon-key client. But because those policies also apply to authenticated
-- callers, a signed-in user running `select * from bets` (no user_id
-- filter) would receive their own bets PLUS every public-profile user's
-- bets. We caught and fixed that in app code, but the right fix is at
-- the database layer — restrict these policies to anon-only.
--
-- After this migration:
--   - Signed-in users get bets/books/profiles_select_own ONLY (their own
--     rows), regardless of whether their app code pins user_id.
--   - Anonymous server-side queries (the /u/<handle> route) still work
--     because they execute with the anon role.
--   - A future code mistake that forgets the .eq("user_id", ...) filter
--     can no longer leak other users' data.
-- ---------------------------------------------------------------------------

-- profiles: public read for anon only.
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public" on public.profiles
  for select to anon
  using (is_public = true);

-- bets: public-profile read for anon only.
drop policy if exists "bets_select_public_profile" on public.bets;
create policy "bets_select_public_profile" on public.bets
  for select to anon
  using (
    user_id in (
      select user_id from public.profiles where is_public = true
    )
  );

-- books: public-profile read for anon only.
drop policy if exists "books_select_public_profile" on public.books;
create policy "books_select_public_profile" on public.books
  for select to anon
  using (
    user_id in (
      select user_id from public.profiles where is_public = true
    )
  );

-- ---------------------------------------------------------------------------
-- Sanity check (uncomment to test as different roles):
--   set role anon;
--   select count(*) from public.bets;           -- should see public users' bets
--   reset role;
--   set role authenticated;
--   select set_config('request.jwt.claims', '{"sub":"<other-uid>"}', true);
--   select count(*) from public.bets;           -- should see ONLY own bets
-- ---------------------------------------------------------------------------
