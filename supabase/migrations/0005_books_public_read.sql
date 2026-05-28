-- ---------------------------------------------------------------------------
-- Allow anon SELECT on books that belong to a public-profile user.
--
-- The /u/<handle> page needs to know which book to show stats from (the
-- user's oldest, by convention "Personal"). Without this policy, the
-- anon-key query against public.books returns nothing — the existing
-- books_select_own policy only matches the row's user_id = auth.uid().
--
-- Same pattern we used for bets_select_public_profile in migration 0003.
-- ---------------------------------------------------------------------------

drop policy if exists "books_select_public_profile" on public.books;
create policy "books_select_public_profile" on public.books
  for select using (
    user_id in (
      select user_id from public.profiles where is_public = true
    )
  );
