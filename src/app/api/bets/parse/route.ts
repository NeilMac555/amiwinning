// POST /api/bets/parse
//
// Free-text bet parser. User pastes "Barcelona vs Real Madrid, Barcelona -0.75
// AH at 1.79, 2 units (win)" etc., we extract structured bet records via
// Claude. Multi-leg parlays collapse to a single bet with market="parlay".

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { MarketGuess, Status } from "@/lib/import/types";
import { requireUser } from "@/lib/api-auth";
import { claimAiQuota } from "@/lib/ai-quota";

// Hard caps on input size. The model is the expensive part of this route,
// so we bound it before we ever call Anthropic.
const MAX_TEXT_BYTES = 50_000; // ~50KB of paste — generous for normal use.
const MAX_CHUNKS = 20; // ≈300 lines at 15 lines per chunk. More than enough.

const VALID_MARKETS: MarketGuess[] = [
  "1X2",
  "ah",
  "ou",
  "btts",
  "dnb",
  "totals_team",
  "shots",
  "corners",
  "scorer",
  "cards",
  "half_time",
  "ht_ft",
  "clean_sheet",
  "winning_margin",
  "exact_score",
  "tournament",
  "parlay",
  "other",
];

const VALID_STATUS: Status[] = [
  "won",
  "lost",
  "push",
  "void",
  "pending",
  "half_won",
  "half_lost",
];

const SYSTEM_PROMPT = `You are a betting tracker's text parser. The user pastes descriptions of one or more sports bets — could be prose, could be tabular columns, could be a screenshot transcription. Extract each as a structured bet and call the submit_bets tool with the full list.

Field guidance:
- kickoff: ISO YYYY-MM-DD. Resolve relative dates ("Sunday", "yesterday") against TODAY. CRITICAL: A bet that is already settled (won/lost/push/half_won/half_lost) MUST have a kickoff in the past — never today or future. When a relative day is ambiguous (e.g. "Sunday" with no week) and the bet is settled, resolve to the MOST RECENT past occurrence of that day, not the upcoming one. Pending bets may use today or future.
- event: full fixture text, e.g. "Mensik vs Struff" / "Barcelona vs Real Madrid".
- selection: the pick text, exactly as the user wrote it, e.g. "Mensik -1.5 sets" / "Barcelona -0.75 AH" / "BTTS yes".
- market: pick the best match from the enum. For tennis: "ah" for set/game spreads, "ou" for over/under games or sets, "1X2" for moneyline. For multi-leg bets: "parlay".
- odds: ALWAYS decimal. Convert American (+150 → 2.50, -110 → 1.91) and fractional (5/2 → 3.50). Never return American or fractional.
- stake: number in units. "2 units", "2u", just "2" → 2.
- status: "(W)" or "(win)" → "won". "(L)" or "(lost)" → "lost". "(P)" or "(push)" → "push". "(half-won)" / "(half-lost)" → "half_won"/"half_lost". If not stated, "pending".

CRITICAL:
- For multi-leg bets (Double / Treble / Parlay / Accumulator / "leg 1 + leg 2"), output ONE bet with market="parlay" and selection summarising the legs ("Double: <leg 1> + <leg 2>"). The odds apply to the combined parlay.
- Ignore bookmaker mentions ("Pinnacle", "Bet365", "with Pinnacle") — we don't track them.
- Be aggressive about extraction even from messy tabular data. Each line/row that has odds + a pick is probably a bet.
- Sport defaults to "Tennis" if the text mentions ATP / WTA / sets / games / known tennis players (Zverev, Sinner, Alcaraz, Djokovic, Sabalenka, Swiatek, Medvedev, Tsitsipas, Rublev, Auger-Aliassime, Monfils, Tien, Michelsen, etc.). Defaults to "Soccer" otherwise.`;

interface ParsedBet {
  kickoff: string;
  event: string;
  selection: string;
  market: MarketGuess;
  odds: number;
  stake: number;
  status: Status;
  sport: string;
}

export async function POST(req: Request): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY not set. Add it to .env.local to enable bet parsing.",
      },
      { status: 503 },
    );
  }

  // 1. Auth gate. Anonymous callers can't burn budget.
  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;

  let payload: { text?: string; today?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = (payload.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  // 2. Size cap — reject huge pastes outright instead of paying Anthropic
  //    to chunk them. Byte length, not char count, to handle multibyte.
  const bytes = new TextEncoder().encode(text).byteLength;
  if (bytes > MAX_TEXT_BYTES) {
    return NextResponse.json(
      {
        error: `Paste too large (${(bytes / 1024).toFixed(0)}KB). Maximum is ${MAX_TEXT_BYTES / 1024}KB. Split it into smaller batches or use the spreadsheet importer.`,
      },
      { status: 413 },
    );
  }

  const today =
    payload.today ?? new Date().toISOString().slice(0, 10);

  // 3. Per-user daily quota. Skipped silently when service key isn't set
  //    (dev). In prod this should always run.
  const quota = await claimAiQuota(auth.user.id, "parse");
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: `Daily AI parse limit reached (${quota.max}/${quota.max}). Resets at midnight UTC. Tap the "Add bet" button to log manually in the meantime.`,
      },
      { status: 429 },
    );
  }

  // Chunk the input by lines so each LLM call has a small, bounded payload.
  // Large pastes were truncating Claude's tool_use response and returning
  // empty bets[]. Chunking dodges that.
  const allLines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const CHUNK_LINES = 15;
  const chunks: string[] = [];
  for (let i = 0; i < allLines.length; i += CHUNK_LINES) {
    chunks.push(allLines.slice(i, i + CHUNK_LINES).join("\n"));
  }
  if (chunks.length === 0) chunks.push(text);

  // Hard ceiling on chunks even if MAX_TEXT_BYTES would allow more — belt
  // and braces against pathological inputs (e.g. one character per line).
  if (chunks.length > MAX_CHUNKS) {
    return NextResponse.json(
      {
        error: `Too many lines (${allLines.length}). Maximum is ~${MAX_CHUNKS * CHUNK_LINES} per parse — split into smaller batches.`,
      },
      { status: 413 },
    );
  }

  const client = new Anthropic({ apiKey });
  const TOOL_DEF = {
    name: "submit_bets",
    description: "Submit the structured list of bets extracted from the user's text.",
    input_schema: {
      type: "object" as const,
      properties: {
        bets: {
          type: "array" as const,
          description: "Each parsed bet as an object.",
          items: {
            type: "object" as const,
            properties: {
              kickoff: { type: "string", description: "ISO date YYYY-MM-DD." },
              event: { type: "string" },
              selection: { type: "string" },
              market: { type: "string", enum: VALID_MARKETS },
              odds: { type: "number", description: "Decimal odds, e.g. 1.85." },
              stake: { type: "number" },
              status: { type: "string", enum: VALID_STATUS },
              sport: {
                type: "string",
                description:
                  "Best-guess sport label: 'Tennis', 'Soccer', 'Basketball', 'NFL', 'MLB', 'NHL', 'Cricket', 'Golf', 'Boxing', 'MMA', 'Horse Racing', or 'Other'. Infer from event text and player/team names.",
              },
            },
            required: [
              "kickoff",
              "event",
              "selection",
              "market",
              "odds",
              "stake",
              "status",
              "sport",
            ],
          },
        },
      },
      required: ["bets"],
    },
  };

  const aggregatedBets: ParsedBet[] = [];
  const chunkErrors: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const userPrompt = `TODAY is ${today}.\n\nParse the following bets (chunk ${i + 1} of ${chunks.length}):\n\n${chunk}`;
    try {
      const resp = await client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 4000,
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        tools: [TOOL_DEF],
        tool_choice: { type: "tool", name: "submit_bets" },
        messages: [{ role: "user", content: userPrompt }],
      });
      const toolBlock = resp.content.find((c) => c.type === "tool_use");
      if (!toolBlock || toolBlock.type !== "tool_use") {
        chunkErrors.push(`Chunk ${i + 1}: no tool_use returned`);
        continue;
      }
      const parsed = toolBlock.input as { bets?: unknown };
      if (!Array.isArray(parsed.bets)) {
        chunkErrors.push(`Chunk ${i + 1}: tool input missing bets[]`);
        continue;
      }
      // Push raw — final validation happens below in one pass.
      for (const b of parsed.bets) {
        aggregatedBets.push(b as ParsedBet);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      chunkErrors.push(`Chunk ${i + 1}: ${msg}`);
    }
  }

  if (aggregatedBets.length === 0 && chunkErrors.length > 0) {
    return NextResponse.json(
      { error: `All chunks failed: ${chunkErrors.join("; ")}` },
      { status: 502 },
    );
  }

  const parsed = { bets: aggregatedBets };

  const cleaned: ParsedBet[] = [];
  const issues: string[] = [];
  for (let i = 0; i < parsed.bets.length; i++) {
    const b = parsed.bets[i] as Partial<ParsedBet>;
    if (!b.kickoff || typeof b.kickoff !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.kickoff)) {
      issues.push(`Bet ${i + 1}: missing or invalid kickoff date`);
      continue;
    }
    if (!b.event || !b.selection) {
      issues.push(`Bet ${i + 1}: missing event or selection`);
      continue;
    }
    const odds = typeof b.odds === "number" ? b.odds : parseFloat(String(b.odds));
    if (!isFinite(odds) || odds < 1.01) {
      issues.push(`Bet ${i + 1}: invalid odds`);
      continue;
    }
    const stake = typeof b.stake === "number" ? b.stake : parseFloat(String(b.stake));
    if (!isFinite(stake) || stake <= 0) {
      issues.push(`Bet ${i + 1}: invalid stake`);
      continue;
    }
    const market: MarketGuess = VALID_MARKETS.includes(b.market as MarketGuess)
      ? (b.market as MarketGuess)
      : "other";
    const status: Status = VALID_STATUS.includes(b.status as Status)
      ? (b.status as Status)
      : "pending";
    // Backstop the "no future kickoffs for settled bets" rule on the server
    // — if the model still emits a future date, clamp to today. This stops
    // bad parses from cluttering "Recent settled" with phantom "1m ago" rows.
    let kickoff = b.kickoff;
    const isSettled =
      status === "won" ||
      status === "lost" ||
      status === "push" ||
      status === "half_won" ||
      status === "half_lost";
    if (isSettled) {
      const todayIso = today;
      if (kickoff > todayIso) {
        kickoff = todayIso;
        issues.push(
          `Bet ${i + 1}: future kickoff clamped to today (settled bet)`,
        );
      }
    }
    const sport =
      typeof b.sport === "string" && b.sport.trim().length > 0
        ? b.sport.trim()
        : "Soccer";
    cleaned.push({
      kickoff,
      event: String(b.event).trim(),
      selection: String(b.selection).trim(),
      market,
      odds: Math.round(odds * 1000) / 1000,
      stake: Math.round(stake * 100) / 100,
      status,
      sport,
    });
  }

  // Surface chunk-level failures alongside bet-level issues so the UI can
  // show them.
  return NextResponse.json({
    bets: cleaned,
    issues: [...chunkErrors, ...issues],
  });
}
