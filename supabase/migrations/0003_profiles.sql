-- ---------------------------------------------------------------------------
-- Am I Up — public tipster profiles.
--
-- Every signed-up user gets a row here automatically (opt-out model). The
-- handle defaults to the email local-part with a numeric suffix on collision.
-- A profile is publicly viewable at /u/<handle> when is_public = true.
--
-- The profile page shows aggregated stats only (lifetime P/L, equity curve,
-- yield, CLV, win rate). Individual bets are NOT shown publicly. The bets
-- RLS policy below allows SELECTing rows owned by a public-profile user so
-- the server can aggregate them, but the UI never renders the raw rows.
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  user_id       uuid         primary key references auth.users(id) on delete cascade,
  handle        text         not null unique,
  is_public     boolean      not null default true,
  display_name  text,
  bio           text,
  created_at    timestamptz  not null default now(),
  updated_at    timestamptz  not null default now(),

  -- Constraints:
  --   handle: 2-32 chars, lowercase letters/digits/underscore only.
  --   bio: max 200 chars.
  constraint profiles_handle_format
    check (handle ~ '^[a-z0-9_]{2,32}$'),
  constraint profiles_bio_length
    check (bio is null or char_length(bio) <= 200),
  constraint profiles_display_name_length
    check (display_name is null or char_length(display_name) <= 60)
);

create index profiles_public_idx on public.profiles (is_public) where is_public;

-- updated_at trigger (reuses the helper from migration 0001).
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
--   - SELECT: anyone (including anon) can read rows where is_public = true.
--     This is what powers the public /u/<handle> page.
--   - SELECT (own row): the signed-in owner can always read their row, even
--     if private — they need to see their settings.
--   - UPDATE: only the owner can modify their row.
--   - INSERT/DELETE: handled by the trigger below; users never insert
--     directly.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

create policy "profiles_select_public" on public.profiles
  for select using (is_public = true);

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id)
              with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Bets RLS: allow SELECTing rows where the owner has a public profile, so
-- the /u/<handle> page can aggregate stats. The existing "bets_select_own"
-- policy stays — owners always see their own bets regardless of public flag.
-- ---------------------------------------------------------------------------

create policy "bets_select_public_profile" on public.bets
  for select using (
    user_id in (
      select user_id from public.profiles where is_public = true
    )
  );

-- ---------------------------------------------------------------------------
-- Handle generation: derive from email local-part, with a digit suffix on
-- collision. Keeps handles short, readable, and predictable for users
-- sharing their first link.
-- ---------------------------------------------------------------------------

create or replace function public.generate_handle_from_email(p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  base    text;
  candidate text;
  suffix  int := 0;
begin
  -- Lowercase, take the bit before @, strip everything but a-z 0-9 _.
  base := lower(regexp_replace(split_part(coalesce(p_email, ''), '@', 1), '[^a-z0-9_]', '', 'g'));

  -- Empty after sanitisation (e.g. all punctuation) → fall back to "user".
  if base = '' then
    base := 'user';
  end if;

  -- Cap at 28 chars to leave room for a -NN suffix.
  base := left(base, 28);

  -- Enforce the 2-char minimum.
  if char_length(base) < 2 then
    base := base || '0';
  end if;

  candidate := base;
  while exists (select 1 from public.profiles where handle = candidate) loop
    suffix := suffix + 1;
    candidate := base || suffix::text;
  end loop;
  return candidate;
end;
$$;

-- Trigger: auto-create a profile for every new auth.users row. Runs as
-- SECURITY DEFINER so it can insert despite RLS.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, handle)
  values (new.id, public.generate_handle_from_email(new.email))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Backfill: every existing auth.users row gets a profile too.
-- ---------------------------------------------------------------------------

insert into public.profiles (user_id, handle)
select id, public.generate_handle_from_email(email)
from auth.users
where id not in (select user_id from public.profiles)
on conflict (user_id) do nothing;
