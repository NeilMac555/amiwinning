-- ---------------------------------------------------------------------------
-- Am I Up — weekly "Sharp Report" email tracking.
--
-- Feature: once a week, active users with enough settled bets get a
-- personalised report written by Claude from their own data. It covers
-- the competitions they bet, the markets they bet, and the odds bands
-- they bet, and tells them where they are bleeding and where they have
-- an edge. Nothing about time of day or day of week.
--
-- This table records which week's report has gone to which user so the
-- weekly cron never double-sends, and it stores the generated report so
-- we can show it in-app later (and audit what the model said) without
-- paying to regenerate it.
--
-- Suppression signals:
--   - `weekly_report_sends` — one row per (user_id, week_start).
--   - `auth.users.raw_user_meta_data.email_unsubscribed` — global opt-out,
--     shared with the drip sequence, set by /api/unsubscribe/<token>.
--
-- RLS: enabled with NO policies. Service-role only, same as drip_sends.
-- ---------------------------------------------------------------------------

create table if not exists public.weekly_report_sends (
  user_id         uuid        not null references auth.users(id) on delete cascade,
  -- Monday (UTC) of the ISO week the report covers. Used as the
  -- idempotency key so a re-run on Tuesday is a no-op.
  week_start      date        not null,
  sent_at         timestamptz not null default now(),
  resend_email_id text,
  -- Which model produced the report. Lets us compare fable vs the
  -- refusal-fallback model later if we ever need to.
  model           text,
  -- The structured report the model returned: headline, bullets,
  -- closing. Kept so the email is reproducible and so a future
  -- /reports page can render history without another AI call.
  report          jsonb,
  primary key (user_id, week_start)
);

alter table public.weekly_report_sends enable row level security;

comment on table public.weekly_report_sends is
  'One row per (user, ISO week) weekly Sharp Report email. Written by /api/cron/weekly-report via service-role key. No RLS policies = only service-role can read/write.';
