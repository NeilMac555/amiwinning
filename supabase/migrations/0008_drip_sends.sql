-- ---------------------------------------------------------------------------
-- Am I Up — dormant-user drip email tracking.
--
-- Feature: a 3-email drip sequence (day3, day7, day14 after signup) that
-- targets users who signed up but never entered a real bet. Sends stop as
-- soon as a user activates or unsubscribes.
--
-- This table records which drip email has been sent to which user so the
-- daily cron never double-sends. It is intentionally minimal: the drip
-- logic itself lives in application code (/api/cron/drip), not in
-- Postgres, because the eligibility check (zero real bets, not
-- unsubscribed) crosses multiple sources of truth.
--
-- Suppression signals live in two places:
--   - `drip_sends`   — this table, one row per (user_id, drip_key).
--                      Presence = do not resend that specific drip.
--   - `auth.users.raw_user_meta_data.email_unsubscribed` — global opt-out
--                      that the cron respects for all keys. Set by the
--                      /api/unsubscribe/<token> route when a user clicks
--                      the unsubscribe link in any drip email.
--
-- RLS: enabled with NO policies, so no anon/client role can read or write.
-- The daily cron uses the service-role key which bypasses RLS.
-- ---------------------------------------------------------------------------

create table if not exists public.drip_sends (
  user_id         uuid        not null references auth.users(id) on delete cascade,
  drip_key        text        not null check (drip_key in ('day3', 'day7', 'day14')),
  sent_at         timestamptz not null default now(),
  resend_email_id text,
  primary key (user_id, drip_key)
);

alter table public.drip_sends enable row level security;

-- No policies = zero access via anon/authenticated. Service-role bypasses.
-- This is deliberate — the drip send log is operator-only data.

comment on table public.drip_sends is
  'Records which dormant-user drip email has been sent to which user. Written by /api/cron/drip via service-role key. No RLS policies = only service-role can read/write.';
