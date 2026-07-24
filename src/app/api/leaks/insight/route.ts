// /api/leaks/insight — generate a one-line AI insight for a single leak
// or edge card on /analytics/leaks.
//
// Body: { dimension, label, n, pl, yieldPct, avgOdds, winRate, tone }
//   tone: "leak" (the segment is losing money) or "strength" (winning)
//
// Response: { insight: string } — one sentence, plain-English,
//   framed as a specific observation the user can act on. Not a
//   generic pep talk.
//
// Cheap: Haiku costs ~$0.0005 per call. Even 10 calls per page load
// per user is negligible. Client caches by leak fingerprint so a
// re-render doesn't re-call.
//
// Auth: this endpoint is not authenticated — the /analytics/leaks
// page is already gated behind sign-in in the UI, so callers land
// here only through an authenticated session. The insight itself
// contains no user-identifying data (just the leak stats sent in
// the request). If we ever surface this via the public profile we
// need to gate it.

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

interface InsightRequest {
  dimension: "sport" | "competition" | "market" | "odds";
  label: string;
  n: number;
  pl: number;
  yieldPct: number;
  avgOdds: number;
  winRate: number;
  tone: "leak" | "strength";
}

function isValid(body: unknown): body is InsightRequest {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.dimension === "string" &&
    typeof b.label === "string" &&
    typeof b.n === "number" &&
    typeof b.pl === "number" &&
    typeof b.yieldPct === "number" &&
    typeof b.avgOdds === "number" &&
    typeof b.winRate === "number" &&
    (b.tone === "leak" || b.tone === "strength")
  );
}

const SYSTEM_PROMPT = `You are a sports-betting analyst. You get one row of aggregated bet
data (a segment of the user's betting history — one sport, one
competition, one market type, or one odds range) and you write ONE
sentence explaining what the number means for this specific bettor.

Rules:
- One sentence. Under 30 words. No preamble.
- No emoji. No exclamation marks. No sports metaphors.
- Speak directly to the user ("you", not "the bettor").
- Concrete: reference the actual numbers where useful.
- Actionable when possible: hint at what the number implies.
- For "leak" tone (negative P/L segments): identify the mechanic
  (bad prices, bad picks, wrong odds range) if the numbers suggest one.
- For "strength" tone: acknowledge the edge honestly. Don't oversell
  — small samples deserve caveats.
- If the sample size is under 50, add a subtle "small sample" note.
- Do NOT recommend the user "stop betting" a segment. That is the
  user's call. Frame observations, not commands.

Style examples (mimic this shape, don't copy the content):
  "Your Correct Score bets averaged 12.4 odds but hit only 6% — you'd
   need 8% just to break even at those prices."
  "Goalscorer bets at 3.10 average odds are landing at 33%, well
   above the 32% needed to profit."
  "Short-odds favourites (avg 1.55) hit 62% but you'd need 65% to
   beat the juice, so the edge isn't there yet."
`;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server misconfigured: ANTHROPIC_API_KEY not set" },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!isValid(body)) {
    return NextResponse.json({ error: "Invalid request shape" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const plSign = body.pl >= 0 ? "+" : "";
  const yldSign = body.yieldPct >= 0 ? "+" : "";
  const userMessage = `Segment: ${body.label} (dimension: ${body.dimension})
Tone: ${body.tone}
P/L: ${plSign}${body.pl.toFixed(1)} units
Yield: ${yldSign}${body.yieldPct.toFixed(1)}%
Sample size: ${body.n} settled bets
Win rate: ${body.winRate.toFixed(1)}%
Average odds: ${body.avgOdds.toFixed(2)}

Write ONE sentence per the system prompt rules.`;

  try {
    const resp = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 120,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
    // Extract text from the response — Haiku returns one text block
    // for a plain messages call. Guard against unexpected shapes.
    const first = resp.content[0];
    if (!first || first.type !== "text") {
      return NextResponse.json(
        { error: "Unexpected response shape from model" },
        { status: 502 },
      );
    }
    const insight = first.text.trim();
    if (!insight) {
      return NextResponse.json(
        { error: "Empty response from model" },
        { status: 502 },
      );
    }
    return NextResponse.json({ insight });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[leaks/insight] error:", msg);
    return NextResponse.json(
      { error: "Insight generation failed", detail: msg },
      { status: 502 },
    );
  }
}
