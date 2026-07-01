// Shared sample tip text used by the first-run PasteHero (dashboard, when
// the signed-in user has zero non-sample bets). Kept as a single source
// of truth so any future landing-page demo can reuse the same text and
// stay in sync.
//
// Style intent: a slightly-scruffy Telegram-style tip block — two football
// bets, decimal odds, stakes in units, no headings, minor typo-level
// messiness — so the first parse feels realistic rather than staged.
//
// Bets committed from this sample carry source === SAMPLE_SOURCE_TAG so
// the dashboard can (a) show a "these are sample bets" banner with a
// Clear them action, and (b) still treat the account as first-run for
// PasteHero purposes until a non-sample bet is logged.

export const SAMPLE_SOURCE_TAG = "sample" as const;

export const SAMPLE_TIP_TEXT = `Sat weekend tips
Man City -1 AH 1.85 2u
Arsenal v Liverpool BTTS Yes 1.95 stake 1.5u`;
