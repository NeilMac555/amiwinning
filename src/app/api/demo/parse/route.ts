// POST /api/demo/parse
//
// Rate-limited public demo of the paste-and-parse feature. Powers the
// DemoPasteBox on the signed-out landing page. Text only, small cap,
// stateless: bets come back as JSON but NOTHING is written to Supabase
// or any store. Aggressive per-IP daily cap so this can't be used to
// burn Anthropic budget.
//
// Reuses SYSTEM_PROMPT, TOOL_DEF, and validateAndClean from
// src/lib/parse-bets.ts so demo output matches what the real parser
// would produce.

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  SYSTEM_PROMPT,
  TOOL_DEF,
  validateAndClean,
} from "@/lib/parse-bets";

// Kept small on purpose: the demo is meant to convince a visitor that
// the parser works, not to be their tracker. Sign-up unlocks the real
// route's 50KB cap.
const MAX_TEXT = 2_000;

// Per-IP daily cap. In-memory, so a deploy/restart resets everyone. That
// is acceptable per the spec: the point is to stop a scripted attacker
// from draining the API key, not to be a perfect enforcement layer.
const DAILY_CAP = 3;

interface UsageRecord {
  count: number;
  dayKey: string; // ISO YYYY-MM-DD in UTC.
}

// module-scope Map; persists for the life of the server process.
const usage = new Map<string, UsageRecord>();

function ipFromRequest(req: Request): string {
  // Railway + most edges put the client IP in x-forwarded-for as a
  // comma-separated list, left-most = original client. Fall back to
  // x-real-ip and finally a bucket labelled "anon" so a missing header
  // still counts against a shared quota rather than being unlimited.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") ?? "anon";
}

function todayUtcDayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(req: Request): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Demo parser is not configured. Sign up for the real thing." },
      { status: 503 },
    );
  }

  let body: { text?: string; today?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json(
      { error: "Paste some bet text to try the demo." },
      { status: 400 },
    );
  }

  // Character cap (not byte cap) is fine here: the demo is public-facing
  // copy that reads "max 2,000 characters", and character length matches
  // what the user sees in the textarea counter.
  if (text.length > MAX_TEXT) {
    return NextResponse.json(
      {
        error: `Demo paste is limited to ${MAX_TEXT.toLocaleString()} characters. Sign up for unlimited parsing.`,
      },
      { status: 413 },
    );
  }

  // Rate limit: same-day count keyed by IP. Reset happens implicitly
  // whenever the record's dayKey no longer matches todayUtcDayKey.
  const ip = ipFromRequest(req);
  const dayKey = todayUtcDayKey();
  const prior = usage.get(ip);
  const currentCount =
    prior && prior.dayKey === dayKey ? prior.count : 0;
  if (currentCount >= DAILY_CAP) {
    return NextResponse.json(
      {
        error: "Demo limit reached. Sign up for unlimited parsing.",
        rateLimited: true,
        limit: DAILY_CAP,
      },
      { status: 429 },
    );
  }
  usage.set(ip, { count: currentCount + 1, dayKey });

  const today = body.today ?? todayUtcDayKey();
  const client = new Anthropic({ apiKey });

  try {
    const resp = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2_000,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [TOOL_DEF],
      tool_choice: { type: "tool", name: "submit_bets" },
      messages: [
        {
          role: "user",
          content: `TODAY is ${today}.\n\nParse the following bets:\n\n${text}`,
        },
      ],
    });
    const toolBlock = resp.content.find((c) => c.type === "tool_use");
    if (!toolBlock || toolBlock.type !== "tool_use") {
      return NextResponse.json(
        { error: "Parser returned no bets. Try a clearer paste." },
        { status: 502 },
      );
    }
    const parsed = toolBlock.input as { bets?: unknown };
    const rawBets = Array.isArray(parsed.bets) ? parsed.bets : [];
    const { cleaned, issues } = validateAndClean(rawBets, today);

    // remaining reflects the count AFTER this successful call, so the UI
    // can show "2 demo parses left" straight after the first parse.
    return NextResponse.json({
      bets: cleaned,
      issues,
      remaining: Math.max(0, DAILY_CAP - (currentCount + 1)),
      limit: DAILY_CAP,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
