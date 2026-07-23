// Dormant-user drip email templates.
//
// Sequence targets users who signed up but never entered a real bet:
//   day3   — "You don't actually know if you're winning"  (CLV intro)
//   day7   — "30 seconds. Paste anything."               (AI parser demo)
//   day14  — "See what real edge looks like"             (sample profile)
//
// Design constraints:
//   - Plain text + HTML (both required so any client renders sensibly).
//   - No em dashes, no emojis. Same conventions as the founder-notification
//     and 24h-nudge emails in /api/webhooks/new-user.
//   - Every template renders an unsubscribe footer with an HMAC-signed
//     link. See ./unsubscribe-token.ts for the token scheme.
//   - Palette matches terminal-dark: bg #0A0C10, text #E6EDF3, accent
//     amber #F5A623, green #00D26A. Applied inline because Gmail/Outlook
//     strip <style> tags.

import { mintUnsubscribeToken } from "./unsubscribe-token";

export type DripKey = "day3" | "day7" | "day14";

export const DRIP_KEYS: DripKey[] = ["day3", "day7", "day14"];

export const DAYS_FOR_KEY: Record<DripKey, number> = {
  day3: 3,
  day7: 7,
  day14: 14,
};

export interface DripEmail {
  subject: string;
  text: string;
  html: string;
}

export interface RenderContext {
  userId: string;
  handle: string;
  siteUrl: string;
}

// ─ Public API ────────────────────────────────────────────────────────────

export function renderDrip(key: DripKey, ctx: RenderContext): DripEmail {
  switch (key) {
    case "day3":
      return renderDay3(ctx);
    case "day7":
      return renderDay7(ctx);
    case "day14":
      return renderDay14(ctx);
  }
}

// ─ Individual templates ──────────────────────────────────────────────────

function renderDay3(ctx: RenderContext): DripEmail {
  const subject = "You don't actually know if you're winning";
  const dashUrl = ctx.siteUrl;
  const clvUrl = `${ctx.siteUrl}/learn/clv`;
  const text = [
    `Hi @${ctx.handle},`,
    ``,
    `Quick question: are you actually winning at betting? Not "I think I'm up`,
    `for the year." Actually winning. With numbers.`,
    ``,
    `Most bettors can't answer that. They remember the wins. They forget the`,
    `losses. They never track closing lines, so they never know if the sharps`,
    `agreed with their bet.`,
    ``,
    `The one metric that separates winners from wishers is CLV (Closing Line`,
    `Value). If you consistently beat the closing odds, you have an edge. If`,
    `you don't, you're gambling with extra steps.`,
    ``,
    `Read the 2-min primer: ${clvUrl}`,
    ``,
    `Then log your first bet: ${dashUrl}`,
    ``,
    `Neil`,
    `Am I Up`,
  ].join("\n");
  const html = wrapHtml({
    ...ctx,
    eyebrow: "Am I Up · day 3",
    headline: "You don't actually know if you're winning",
    body: [
      `Are you <em>actually</em> winning at betting? Not "I think I'm up for the year." Actually winning. With numbers.`,
      `Most bettors can't answer that. They remember the wins. They forget the losses. They never track closing lines, so they never know if the sharps agreed with their bet.`,
      `The one metric that separates winners from wishers is <strong>CLV (Closing Line Value)</strong>. If you consistently beat the closing odds, you have an edge. If you don't, you're gambling with extra steps.`,
    ],
    primaryCta: { href: clvUrl, label: "Read the 2-min CLV primer →" },
    secondaryCta: { href: dashUrl, label: "Log your first bet" },
  });
  return { subject, text, html };
}

function renderDay7(ctx: RenderContext): DripEmail {
  const subject = "30 seconds. Paste anything. See it work.";
  const dashUrl = ctx.siteUrl;
  const text = [
    `Hi @${ctx.handle},`,
    ``,
    `The most common reason people abandon a bet tracker: it takes 5 minutes`,
    `to log a single bet. Team, market, stake, odds, book, date. Every time.`,
    ``,
    `Am I Up doesn't do that. Paste the tip. Paste the screenshot. Paste the`,
    `Telegram message. The AI extracts everything automatically:`,
    ``,
    `- Teams and market (Man City -1 AH, Arsenal BTTS Yes)`,
    `- Stake, odds, sport, kickoff`,
    `- Even splits multi-bet paragraphs into separate rows`,
    ``,
    `Every source works. Bookmaker copy, tipster tweets, WhatsApp forwards,`,
    `spreadsheet rows. Paste it and it's logged.`,
    ``,
    `Try it now: ${dashUrl}`,
    ``,
    `Takes 30 seconds. First bet in.`,
    ``,
    `Neil`,
    `Am I Up`,
  ].join("\n");
  const html = wrapHtml({
    ...ctx,
    eyebrow: "Am I Up · day 7",
    headline: "30 seconds. Paste anything.",
    body: [
      `The most common reason people abandon a bet tracker: it takes 5 minutes to log a single bet. Team, market, stake, odds, book, date. Every time.`,
      `Am I Up doesn't do that. Paste the tip. Paste the screenshot. Paste the Telegram message. The AI extracts everything automatically.`,
    ],
    bullets: [
      `Teams and market (<code style="color:#F5A623">Man City -1 AH</code>, <code style="color:#F5A623">Arsenal BTTS Yes</code>)`,
      `Stake, odds, sport, kickoff`,
      `Splits multi-bet paragraphs into separate rows`,
    ],
    postBullets: `Every source works. Bookmaker copy, tipster tweets, WhatsApp forwards, spreadsheet rows. Paste it and it's logged.`,
    primaryCta: { href: dashUrl, label: "Try the AI paste →" },
    footerLine: `Takes 30 seconds. First bet in.`,
  });
  return { subject, text, html };
}

function renderDay14(ctx: RenderContext): DripEmail {
  const subject = "See what real edge looks like";
  const sampleUrl = `${ctx.siteUrl}/u/sample`;
  const dashUrl = ctx.siteUrl;
  const text = [
    `Hi @${ctx.handle},`,
    ``,
    `Two weeks ago you signed up. If you're on the fence, here's what a real`,
    `Am I Up profile looks like when someone actually uses it.`,
    ``,
    `Sample profile: ${sampleUrl}`,
    ``,
    `Notice what's there:`,
    ``,
    `- Lifetime P/L with the actual equity curve, not a claim`,
    `- Yield, ROC, and CLV vs Pinnacle close — the metrics that separate`,
    `  gambling from investing`,
    `- Breakdown by sport, market, and odds range — where the profit came from`,
    `- Every bet logged, sortable, exportable`,
    ``,
    `You get the same. Your profile at /u/${ctx.handle} becomes real receipts`,
    `you can share on X, in tipster group chats, wherever it matters. Real`,
    `numbers you tracked yourself. Nothing to fake.`,
    ``,
    `Start now: ${dashUrl}`,
    ``,
    `Neil`,
    `Am I Up`,
  ].join("\n");
  const html = wrapHtml({
    ...ctx,
    eyebrow: "Am I Up · day 14",
    headline: "See what real edge looks like",
    body: [
      `Two weeks ago you signed up. If you're on the fence, here's what a real Am I Up profile looks like when someone actually uses it.`,
    ],
    bullets: [
      `Lifetime P/L with the <strong>actual equity curve</strong>, not a claim`,
      `Yield, ROC, and CLV vs Pinnacle close — the metrics that separate gambling from investing`,
      `Breakdown by sport, market, and odds range — where the profit came from`,
      `Every bet logged, sortable, exportable`,
    ],
    postBullets: `You get the same. Your profile at <code style="color:#F5A623">/u/${escapeHtml(ctx.handle)}</code> becomes real receipts you can share on X, in tipster group chats, wherever it matters. Real numbers you tracked yourself. Nothing to fake.`,
    primaryCta: { href: sampleUrl, label: "See a sample profile →" },
    secondaryCta: { href: dashUrl, label: "Track yours" },
  });
  return { subject, text, html };
}

// ─ Shared HTML shell ─────────────────────────────────────────────────────

interface WrapArgs extends RenderContext {
  eyebrow: string;
  headline: string;
  body: string[];
  bullets?: string[];
  postBullets?: string;
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  footerLine?: string;
}

function wrapHtml(a: WrapArgs): string {
  const unsubUrl = `${a.siteUrl}/api/unsubscribe/${mintUnsubscribeToken(a.userId)}`;
  const bulletsHtml = a.bullets
    ? `<ul style="margin: 16px 0 20px; padding-left: 20px; color: #E6EDF3; line-height: 1.6; font-size: 15px;">${a.bullets
        .map(
          (b) =>
            `<li style="margin-bottom: 8px;">${b}</li>`,
        )
        .join("")}</ul>`
    : "";
  return `<div style="background: #0A0C10; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
    <div style="max-width: 520px; margin: 0 auto; background: #0A0C10; color: #E6EDF3; padding: 8px;">
      <div style="font-size: 11px; color: #F5A623; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 12px; font-weight: 600;">${escapeHtml(a.eyebrow)}</div>
      <h1 style="font-size: 26px; font-weight: 600; margin: 0 0 22px; letter-spacing: -0.015em; color: #E6EDF3; line-height: 1.2;">${a.headline}</h1>
      ${a.body.map((p) => `<p style="font-size: 15px; line-height: 1.65; color: #C9D1D9; margin: 0 0 16px;">${p}</p>`).join("")}
      ${bulletsHtml}
      ${a.postBullets ? `<p style="font-size: 15px; line-height: 1.65; color: #C9D1D9; margin: 0 0 22px;">${a.postBullets}</p>` : ""}
      <div style="margin: 28px 0 8px;">
        <a href="${a.primaryCta.href}" style="display: inline-block; padding: 12px 22px; background: #F5A623; color: #0A0C10; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; margin-right: 8px;">${escapeHtml(a.primaryCta.label)}</a>
        ${a.secondaryCta ? `<a href="${a.secondaryCta.href}" style="display: inline-block; padding: 12px 22px; background: transparent; color: #C9D1D9; text-decoration: none; border: 1px solid #30363D; border-radius: 6px; font-size: 14px;">${escapeHtml(a.secondaryCta.label)}</a>` : ""}
      </div>
      ${a.footerLine ? `<p style="font-size: 13px; color: #8B949E; margin: 20px 0 0;">${escapeHtml(a.footerLine)}</p>` : ""}
      <hr style="border: 0; border-top: 1px solid #21262D; margin: 36px 0 18px;" />
      <p style="font-size: 12px; color: #6E7681; line-height: 1.55; margin: 0;">
        You signed up to Am I Up at <a href="${a.siteUrl}" style="color: #8B949E; text-decoration: underline;">amiup.io</a>.
        <a href="${unsubUrl}" style="color: #8B949E; text-decoration: underline;">Unsubscribe from these emails</a>
        and you will not hear from us again.
      </p>
    </div>
  </div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
