# Am I Up

The terminal for serious punters. A free bet tracker that leads with closing line value (CLV) and return on capital instead of vanity ROI. Live at [amiup.io](https://amiup.io).

Paste a tip, a bookmaker slip, a screenshot or a spreadsheet and the AI logs the bets for you. Every account gets a dashboard, a bet log, analytics and a shareable profile.

## Stack

- Next.js 16 (App Router, Turbopack) and React 19. This is newer than most examples online: read `AGENTS.md` before writing Next code.
- Supabase: Postgres, magic-link auth, row-level security.
- Anthropic API: Claude Haiku for parsing pasted bets, column mapping and leak insights. A larger model writes the weekly report.
- Resend for email.
- Hosted on Railway. A push to `main` deploys.

## Run it locally

```bash
npm install
```

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` (see below), then:

```bash
npm run dev
```

Open http://localhost:3000. Without Supabase keys the app still starts, but sign-in and sync are off.

## Environment variables

`.env.local.example` lists every variable with a note on what it is for. In short:

| Variable | Needed for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sign-in, sync, public profiles |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin page, AI quotas, crons, signup webhook. Server only |
| `ANTHROPIC_API_KEY` | Paste parser, spreadsheet column mapping, leak insights, weekly report |
| `RESEND_API_KEY`, `USER_NUDGE_FROM`, `SIGNUP_NOTIFY_FROM`, `SIGNUP_NOTIFY_TO` | Email |
| `EMAIL_UNSUBSCRIBE_SECRET` | Signing unsubscribe links. Emails will not send without it |
| `CRON_SECRET` | Authorises the two cron endpoints |
| `SIGNUP_WEBHOOK_SECRET` | Authorises the new-signup webhook from Supabase |
| `NEXT_PUBLIC_ADMIN_EMAILS` | Who can open `/admin` |

## Checks

```bash
npm run lint
```

```bash
npx tsc --noEmit
```

```bash
npm run build
```

There are also three smoke tests in `scripts/`:

- `node scripts/bet-cache-smoke.cjs` checks the browser bet cache (compression, pending deletes).
- `node scripts/profile-access-smoke.cjs` checks the sign-in gate on account-only profiles. Needs a built app running.
- `scripts/weekly-report-smoke.ts` builds a weekly report from made-up bets using the live model, so each run costs a few cents. The command is in the comment at the top of the file.

## Database

Migrations live in `supabase/migrations/`, numbered in the order they were applied. There is no migration runner: each file is pasted into the Supabase SQL editor by hand. A few early tables (books, some bet columns) were created in the dashboard and are not in this folder yet.

## Scheduled jobs

Two endpoints are meant to be called by an external scheduler with an `x-cron-secret` header:

- `POST /api/cron/drip` once a day. Sends the day 3, 7 and 14 nudges to people who signed up but have not logged a bet.
- `POST /api/cron/weekly-report` once a week. Sends each active user their Sharp Report.

Both support a dry run. See the comment at the top of each route file.

## Where things are

- `src/app/` pages and API routes. `src/app/page.tsx` is the dashboard for signed-in users and the landing page for everyone else.
- `src/app/[handle]/` public profiles.
- `src/components/` UI.
- `src/lib/` everything else: the local bet cache and sync (`import/store.ts`, `bet-sync.ts`), the numbers (`aggregate.ts`, `analytics.ts`, `leaks.ts`, `clv.ts`), classifiers, email templates.
- `public/` static files, including `llms.txt`.
