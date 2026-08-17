-- 0009_bets_bookmaker.sql
--
-- Adds an optional bookmaker column to public.bets.
--
-- Product context (2026-08): users asked to be able to record which
-- bookmaker they placed each bet with (Pinnacle, Bet365, DraftKings,
-- etc.). Not mandatory — legacy rows stay NULL, and new bets can be
-- logged without a bookmaker. The AI parser extracts the value when
-- the user mentions one; manual entry gets a free-text field.
--
-- Kept as free text (no lookup table) because the space is
-- long-tailed and non-exhaustive across jurisdictions. Grouping in
-- analytics is done case-insensitively by trimming + lowercasing on
-- the fly, so "Pinnacle" and "PINNACLE" merge into one row.
--
-- Nullable + no default: bookmaker is genuinely optional. A NULL
-- means "not recorded", which shows as "Unspecified" in breakdowns
-- rather than getting hidden — informative for existing users who
-- had bookmakers in mind but never wrote them down.

alter table public.bets
  add column if not exists bookmaker text;

-- Deliberate no-op on existing rows. Users can backfill via the
-- edit form if they care about historical attribution.

comment on column public.bets.bookmaker is
  'Free-text bookmaker name (e.g. "Pinnacle", "Bet365"). NULL means not recorded. Analytics groups case-insensitively.';
