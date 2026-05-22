-- ---------------------------------------------------------------------------
-- Am I Winning — initial bets schema.
-- Mirrors the ImportedBet TypeScript type in src/lib/import/types.ts.
-- One row per bet, owned by exactly one user, locked down with RLS so users
-- only see their own.
-- ---------------------------------------------------------------------------

create table public.bets (
  -- The id is the same string the client generated (manual:xxxxx /
  -- seed-2026-... / a UUID). Keeping it as text lets us migrate localStorage
  -- entries without re-keying everything.
  id           text         primary key,
  user_id      uuid         not null references auth.users(id) on delete cascade,

  -- Kickoff stored as timestamptz so both "2026-05-10" and ISO timestamps
  -- like "2026-05-13T17:00:00Z" cast cleanly. Date-only entries become
  -- midnight UTC, which is fine for v1 — refine when SteamWatch supplies
  -- real kickoff times.
  kickoff      timestamptz  not null,

  sport        text         not null default 'Soccer',
  league       text,
  home         text,
  away         text,
  event        text         not null,
  market       text,        -- MarketGuess enum value: 1X2 / ah / ou / btts / etc.
  selection    text         not null,
  odds         numeric(8,3) not null check (odds >= 1.01 and odds <= 1000),
  stake        numeric(10,2) not null check (stake > 0),

  -- Pinnacle closing line on the same selection. Null until captured (manual
  -- entry today, SteamWatch auto-capture later).
  closing_odds numeric(8,3),

  tipster      text,
  tags         text[],
  notes        text,
  status       text         not null
                            check (status in (
                              'won','lost','push','void','pending',
                              'half_won','half_lost'
                            )),
  pl           numeric(10,2) not null default 0,

  source       text         not null default 'manual',
  imported_at  timestamptz  not null default now(),
  raw          jsonb        not null default '{}'::jsonb,

  created_at   timestamptz  not null default now(),
  updated_at   timestamptz  not null default now()
);

-- Indexes for the common access patterns.
create index bets_user_kickoff_idx on public.bets (user_id, kickoff desc);
create index bets_user_status_idx  on public.bets (user_id, status);

-- Keep updated_at fresh on every UPDATE so the client can do simple
-- "anything new since X?" sync queries later.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger bets_set_updated_at
before update on public.bets
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: users can only touch rows where user_id = auth.uid().
-- ---------------------------------------------------------------------------

alter table public.bets enable row level security;

create policy "bets_select_own" on public.bets
  for select using (auth.uid() = user_id);

create policy "bets_insert_own" on public.bets
  for insert with check (auth.uid() = user_id);

create policy "bets_update_own" on public.bets
  for update using (auth.uid() = user_id);

create policy "bets_delete_own" on public.bets
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Sanity check — uncomment to verify nothing leaks:
--   select count(*) from public.bets;  -- should be 0 from any session
-- ---------------------------------------------------------------------------
