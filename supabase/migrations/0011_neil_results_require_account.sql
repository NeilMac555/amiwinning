-- Neil Mac's shared results require a registered, authenticated viewer.
-- Access policies only: no bet rows or owner write policies are changed.
create policy neil_results_require_account on public.bets
as restrictive for select to anon
using (user_id <> 'e54b2aaa-35be-41b9-9803-3c201e5ab8b3'::uuid);

create policy neil_profile_for_members on public.profiles
for select to authenticated
using (user_id = 'e54b2aaa-35be-41b9-9803-3c201e5ab8b3'::uuid
  and is_public and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false);

create policy neil_public_books_for_members on public.books
for select to authenticated
using (user_id = 'e54b2aaa-35be-41b9-9803-3c201e5ab8b3'::uuid
  and is_public
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
  and exists (select 1 from public.profiles p where p.user_id = books.user_id and p.is_public));

create policy neil_public_results_for_members on public.bets
for select to authenticated
using (user_id = 'e54b2aaa-35be-41b9-9803-3c201e5ab8b3'::uuid
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
  and exists (select 1 from public.profiles p where p.user_id = bets.user_id and p.is_public)
  and (exists (select 1 from public.books b where b.id = bets.book_id and b.user_id = bets.user_id and b.is_public)
    or (book_id is null and exists (select 1 from public.books b where b.user_id = bets.user_id and b.is_public))));
