// Weekly Sharp Report — the model call.
//
// Claude Fable 5.1 reads the WeeklyReportInput JSON and returns a small
// structured report: one headline, 3 to 6 segment bullets, one closing
// action. Structured outputs (output_config.format) guarantee the JSON
// shape; the prompt carries the editorial rules.
//
// Why Fable and not Haiku: the per-segment insight ("your Premier League
// Asian handicap bets are -9u on 58 bets while your Serie A totals are
// +6u on 41, and the difference is the odds band you're buying") needs
// cross-sectional reasoning over the whole table, not one-line
// summarisation. Fable at effort "low" is documented to match or beat
// prior-generation models at their highest effort, so low is the right
// setting for a weekly batch job. Cost is roughly $0.05 to $0.10 per
// report.
//
// Fable-specific API notes (see the claude-api skill / migration guide):
//   - Thinking is always on. Do NOT send a `thinking` param.
//   - Forced tool_choice is rejected (400). We use structured outputs
//     instead, which is the right tool for "give me JSON back" anyway.
//   - Safety classifiers can return stop_reason "refusal". A bettor's own
//     analytics should never trip them, but if it does we re-run once on
//     Claude Opus 5 rather than dropping the user's email on the floor.

import Anthropic from "@anthropic-ai/sdk";
import type { WeeklyReportInput } from "./data";

export const PRIMARY_MODEL = "claude-fable-5-1";
export const FALLBACK_MODEL = "claude-opus-5";

export type BulletKind = "leak" | "edge" | "note";

export interface ReportBullet {
  kind: BulletKind;
  /** Segment name, e.g. "Premier League" or "Asian handicap" or "Longshots (2.5 to 4.0)". */
  segment: string;
  text: string;
}

export interface WeeklyReport {
  headline: string;
  bullets: ReportBullet[];
  closing: string;
}

export interface GeneratedReport {
  report: WeeklyReport;
  model: string;
  usage: { input: number; output: number; cacheRead: number };
}

// ─ Output schema ─────────────────────────────────────────────────────────
//
// Kept to the JSON Schema subset structured outputs supports (object /
// array / string / enum / required / additionalProperties). Length caps
// are enforced in the prompt and clamped in code, not in the schema.

const REPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "bullets", "closing"],
  properties: {
    headline: {
      type: "string",
      description:
        "One sentence verdict on the week, under 15 words. Quote this week's P/L in units if there were settled bets.",
    },
    bullets: {
      type: "array",
      description: "3 to 6 bullets. Biggest leak first if one exists, then biggest edge.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "segment", "text"],
        properties: {
          kind: { type: "string", enum: ["leak", "edge", "note"] },
          segment: {
            type: "string",
            description:
              "The competition, market, or odds band this bullet is about. Copy the label from the payload verbatim.",
          },
          text: {
            type: "string",
            description:
              "Two to three short sentences. Quote P/L in units and the sample size. End with what to do: stop, keep going, size up, or wait for more data.",
          },
        },
      },
    },
    closing: {
      type: "string",
      description: "One concrete thing to do this coming week, under 25 words.",
    },
  },
} as const;

// ─ System prompt ─────────────────────────────────────────────────────────
//
// Written for Fable: state the goal, the reader, the constraints, and the
// communication style. No step-by-step scaffolding — the migration guide
// is explicit that over-prescribed prompts reduce output quality on this
// model.

const SYSTEM_PROMPT = `You write the weekly Sharp Report email for Am I Up, a free sports bet tracker. The reader is a bettor looking at their own results. This email exists to bring them back to their data once a week with something specific they could not have seen at a glance, so it has to be about THEIR numbers, not betting advice in general.

You receive a JSON payload: lifetime headline stats, this week's results, ranked leaks and strengths (segments with 30 or more settled bets), and full per-segment tables across exactly three axes: competitions, markets, and odds bands. A sports table is included only when the account spreads across sports. Every number you cite must appear in that payload. Do not compute, estimate, round differently, or invent anything.

What good looks like:
- 3 to 6 bullets. Lead with the biggest leak if there is one, then the biggest edge. Fill the rest with the most decision-relevant segments.
- Each bullet is about one segment. Quote its P/L in units and its sample size. Say what to do: stop, keep going, size up, or wait for more data.
- Cross-reference when it earns its place. "You are +6u on Serie A but -9u on Premier League at the same market" is worth more than two separate bullets.
- Sample size drives confidence. Under 30 settled bets is an early signal: say so, and do not tell them to change staking on it. 30 to 99 is moderate. 100 or more is strong.
- If this week had no settled bets, say that in the headline and build the bullets from lifetime segments.
- If CLV is null the user is not logging closing odds. One bullet of kind "note" may suggest logging them, once, plainly.

Rules:
- Axes are competition, market, and odds band only. Never analyse day of week, time of day, month, or streaks.
- Units, not currency. Decimal odds.
- Plain English. Short sentences. No hype, no motivational filler, no emojis, no em dashes. Write like a sharp friend, not a marketing team.
- Return only the JSON object described by the output schema.`;

// ─ Retry policy ──────────────────────────────────────────────────────────

const RETRYABLE_STATUSES = new Set([500, 502, 503, 504, 529]);
const RETRY_DELAYS_MS = [1500, 4000];

async function createWithRetry(
  client: Anthropic,
  params: Anthropic.MessageCreateParamsNonStreaming,
): Promise<Anthropic.Message> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await client.messages.create(params);
    } catch (err) {
      lastErr = err;
      const status = err instanceof Anthropic.APIError ? err.status : undefined;
      const retryable = status !== undefined && RETRYABLE_STATUSES.has(status);
      if (!retryable || attempt === RETRY_DELAYS_MS.length) throw err;
      const jitter = Math.floor(Math.random() * 400);
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt] + jitter));
    }
  }
  throw lastErr;
}

// ─ Public API ────────────────────────────────────────────────────────────

export async function generateWeeklyReport(args: {
  /** Omit to let the SDK resolve credentials from the environment (an
   *  `ant auth login` profile on a dev box). Production passes it. */
  apiKey?: string;
  input: WeeklyReportInput;
}): Promise<GeneratedReport> {
  const client = new Anthropic(args.apiKey ? { apiKey: args.apiKey } : {});

  const userMessage = [
    `Write @${args.input.handle}'s Sharp Report for the week ${args.input.week.start} to ${args.input.week.end}.`,
    ``,
    `Payload:`,
    JSON.stringify(args.input),
  ].join("\n");

  const baseParams = {
    max_tokens: 4000,
    system: [
      {
        type: "text" as const,
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" as const },
      },
    ],
    output_config: {
      effort: "low" as const,
      format: { type: "json_schema" as const, schema: REPORT_SCHEMA as unknown as Record<string, unknown> },
    },
    messages: [{ role: "user" as const, content: userMessage }],
  };

  let model = PRIMARY_MODEL;
  let resp = await createWithRetry(client, { model, ...baseParams });

  if (resp.stop_reason === "refusal") {
    // Log the category so we can see if this ever actually happens on
    // bettor analytics. Then re-run once on Opus 5, which carries
    // different classifiers.
    console.warn(
      `[weekly-report] ${PRIMARY_MODEL} refused for @${args.input.handle}: ` +
        `${resp.stop_details?.category ?? "?"} — retrying on ${FALLBACK_MODEL}`,
    );
    model = FALLBACK_MODEL;
    resp = await createWithRetry(client, { model, ...baseParams });
    if (resp.stop_reason === "refusal") {
      throw new Error(`Both models refused (${resp.stop_details?.category ?? "unknown"})`);
    }
  }

  const text = resp.content.find((c) => c.type === "text");
  if (!text || text.type !== "text") {
    throw new Error(`No text block in response (stop_reason=${resp.stop_reason})`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text.text);
  } catch {
    throw new Error("Model output was not valid JSON");
  }
  const report = coerceReport(parsed);

  return {
    report,
    model,
    usage: {
      input: resp.usage.input_tokens,
      output: resp.usage.output_tokens,
      cacheRead: resp.usage.cache_read_input_tokens ?? 0,
    },
  };
}

// Belt-and-braces over the schema guarantee: clamp counts, trim strings,
// and drop anything malformed rather than emailing it.
function coerceReport(v: unknown): WeeklyReport {
  if (!v || typeof v !== "object") throw new Error("Report is not an object");
  const o = v as Record<string, unknown>;
  const headline = String(o.headline ?? "").trim();
  const closing = String(o.closing ?? "").trim();
  const rawBullets = Array.isArray(o.bullets) ? o.bullets : [];
  const bullets: ReportBullet[] = [];
  for (const b of rawBullets) {
    if (!b || typeof b !== "object") continue;
    const bb = b as Record<string, unknown>;
    const kind = bb.kind;
    if (kind !== "leak" && kind !== "edge" && kind !== "note") continue;
    const segment = String(bb.segment ?? "").trim();
    const text = String(bb.text ?? "").trim();
    if (!segment || !text) continue;
    bullets.push({ kind, segment, text: text.slice(0, 600) });
    if (bullets.length >= 6) break;
  }
  if (!headline || bullets.length < 3) {
    throw new Error(`Report too thin (headline=${headline ? "ok" : "missing"}, bullets=${bullets.length})`);
  }
  return { headline: headline.slice(0, 200), bullets, closing: closing.slice(0, 300) };
}
