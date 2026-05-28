-- ---------------------------------------------------------------------------
-- Am I Up — per-user daily quota for AI-backed API routes (parse, auto-map).
--
-- Purpose: prevent a single signed-in user from burning the shared Anthropic
-- budget with a runaway loop. Caps are enforced server-side via the
-- claim_ai_quota() RPC — see src/lib/ai-quota.ts.
--
-- Schema design:
--   - One row per (user, action, day). Old rows are harmless but the helper
--     never reads them; you can prune nightly with a cron if you like.
--   - "action" is a free text but should be one of: 'parse', 'auto_map'.
--   - "used" counts successful CLAIMS (not successful API calls — claims
--     happen before the work runs, so a failed API call still consumed
--     quota. That's intentional; otherwise infinite-retry would dodge it).
-- ---------------------------------------------------------------------------

create table if not exists public.ai_quota (
  user_id  uuid        not null references auth.users(id) on delete cascade,
  action   text        not null,
  day      date        not null default current_date,
  used     int         not null default 0,
  primary key (user_id, action, day)
);

-- RLS: the RPC runs with security definer so it bypasses RLS itself. We
-- still enable RLS to prevent any accidental client-side reads/writes from
-- the anon role — there's no policy granting access, so direct queries
-- return zero rows.
alter table public.ai_quota enable row level security;

-- ---------------------------------------------------------------------------
-- claim_ai_quota(user_id, action, max)
--
-- Atomically:
--   1. Increment the counter for (user, action, today). Inserts a row at
--      `used = 1` if none exists.
--   2. If the new value exceeds `max`, roll back the increment so the
--      user isn't permanently locked out (and so retrying isn't penalised
--      beyond the cap).
--   3. Return (used, allowed).
--
-- Concurrency: the INSERT ... ON CONFLICT DO UPDATE is atomic in Postgres,
-- so two concurrent calls each get a unique `used` value. If two race to
-- the cap, one passes and one rolls back. No deadlocks.
-- ---------------------------------------------------------------------------

create or replace function public.claim_ai_quota(
  p_user_id uuid,
  p_action  text,
  p_max     int
)
returns table(used int, allowed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_used int;
begin
  insert into public.ai_quota (user_id, action, day, used)
  values (p_user_id, p_action, current_date, 1)
  on conflict (user_id, action, day)
  do update set used = ai_quota.used + 1
  returning ai_quota.used into new_used;

  if new_used > p_max then
    -- Over cap: undo the increment so repeated denied calls don't
    -- compound. Return (p_max, false).
    update public.ai_quota
    set used = used - 1
    where user_id = p_user_id
      and action  = p_action
      and day     = current_date;
    return query select p_max, false;
    return;
  end if;

  return query select new_used, true;
end;
$$;

-- Don't grant EXECUTE to anon/authenticated — only the service role calls
-- this RPC (from src/lib/ai-quota.ts). Service role bypasses grants anyway,
-- but being explicit prevents accidental client invocation.
revoke all on function public.claim_ai_quota(uuid, text, int) from public;
revoke all on function public.claim_ai_quota(uuid, text, int) from anon, authenticated;
