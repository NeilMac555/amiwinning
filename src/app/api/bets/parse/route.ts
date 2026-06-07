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

// Image input caps. Anthropic accepts up to ~5MB per image; we cap at 4MB
// per image and 4 images per request to bound both API spend and request
// body size (base64 inflation makes the raw JSON 33% larger than the
// underlying bytes).
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_IMAGES = 4;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

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

const SYSTEM_PROMPT = `You are a betting tracker's input parser. The user pastes descriptions of one or more sports bets — could be prose, tabular columns, a screenshot transcription, OR a direct screenshot (bookmaker app, Telegram tip, X post, paper bet slip). If you receive an image, read every bet visible in it including kickoff dates/times, stakes, odds, selections, and results. If you receive both an image and accompanying text, the text is supplementary context (e.g. "these are from yesterday, 2u default stake"). Extract each bet as a structured record and call the submit_bets tool with the full list.

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

Sport classification (read in order, first match wins):
- "Tennis" if the text mentions ATP / WTA / sets / games / known tennis players (Zverev, Sinner, Alcaraz, Djokovic, Sabalenka, Swiatek, Medvedev, Tsitsipas, Rublev, Auger-Aliassime, Monfils, Tien, Michelsen, etc.).
- "Basketball" if the text mentions NBA, basketball-specific player props (points / rebounds / assists / 3-pointers / blocks / steals / double-double / triple-double / PRA), NBA team names (Lakers, Celtics, Warriors, Bucks, Heat, Knicks, Nets, 76ers, Mavericks, Nuggets, Thunder, Suns, Clippers, Pacers, Cavaliers, Magic, etc.), or NBA player names (LeBron, Curry, Durant, Giannis, Dončić, Tatum, Jokić, Embiid, Shai / Gilgeous-Alexander, Wembanyama, Brunson, Anthony Davis, Jaylen Brown, Booker, Edwards, Ant, etc.). Three-digit point totals (e.g. "over 224.5") are strong basketball signals.
- "American Football" if NFL team names (Chiefs, Cowboys, Eagles, 49ers, Bills, Ravens, etc.) or NFL-specific markets (first touchdown, anytime touchdown scorer).
- "Baseball" if MLB team names (Yankees, Red Sox, Dodgers, Astros, etc.) or MLB markets (run line, NRFI, YRFI, home runs).
- "Ice Hockey" if NHL team names (Rangers, Bruins, Maple Leafs, Oilers, etc.) or NHL markets (puck line).
- "Soccer" otherwise (default).

For basketball markets specifically:
- Point spread (e.g. "Lakers -5.5") → market="ah"
- Point total (e.g. "Over 224.5") → market="ou"
- Money line (e.g. "Lakers ML") → market="1X2"
- Player props (e.g. "LeBron over 25.5 points") → market="other" with selection preserving the player name and stat
- Quarter/half markets → market="other"`;

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

  // Payload accepts text, images, or both. At least one must be present.
  interface ImagePayload {
    mediaType: string;
    data: string; // raw base64 (no "data:..." prefix)
  }
  let payload: { text?: string; today?: string; images?: ImagePayload[] };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = (payload.text ?? "").trim();
  const rawImages = Array.isArray(payload.images) ? payload.images : [];

  if (!text && rawImages.length === 0) {
    return NextResponse.json(
      { error: "Provide text or at least one image" },
      { status: 400 },
    );
  }

  // 2. Size cap on text — reject huge pastes outright instead of paying
  //    Anthropic to chunk them. Byte length, not char count, to handle
  //    multibyte. Empty text (image-only paste) skips this.
  if (text) {
    const bytes = new TextEncoder().encode(text).byteLength;
    if (bytes > MAX_TEXT_BYTES) {
      return NextResponse.json(
        {
          error: `Paste too large (${(bytes / 1024).toFixed(0)}KB). Maximum is ${MAX_TEXT_BYTES / 1024}KB. Split it into smaller batches or use the spreadsheet importer.`,
        },
        { status: 413 },
      );
    }
  }

  // Validate images: count, mime type, and rough size (each base64 byte
  // represents ~0.75 raw bytes, so 4MB raw = 5.33MB base64).
  if (rawImages.length > MAX_IMAGES) {
    return NextResponse.json(
      { error: `Maximum ${MAX_IMAGES} images per parse — drop a few and retry.` },
      { status: 413 },
    );
  }
  const images: ImagePayload[] = [];
  for (let i = 0; i < rawImages.length; i++) {
    const img = rawImages[i];
    if (!img || typeof img.data !== "string" || typeof img.mediaType !== "string") {
      return NextResponse.json(
        { error: `Image ${i + 1}: malformed (missing data or mediaType)` },
        { status: 400 },
      );
    }
    if (!SUPPORTED_IMAGE_TYPES.has(img.mediaType)) {
      return NextResponse.json(
        {
          error: `Image ${i + 1}: unsupported type "${img.mediaType}" (use PNG, JPEG, WebP, or GIF)`,
        },
        { status: 400 },
      );
    }
    // Approx raw bytes = 0.75 * base64 length. Cheap check; avoids fully
    // decoding the base64 just to measure it.
    const approxRawBytes = Math.floor(img.data.length * 0.75);
    if (approxRawBytes > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        {
          error: `Image ${i + 1}: too large (~${(approxRawBytes / 1024 / 1024).toFixed(1)}MB; max ${MAX_IMAGE_BYTES / 1024 / 1024}MB)`,
        },
        { status: 413 },
      );
    }
    images.push(img);
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

  // Chunking strategy:
  //   - Text-only paste: chunk by lines so each LLM call has a small,
  //     bounded payload (large pastes were truncating Claude's tool_use
  //     response and returning empty bets[]).
  //   - Image-only OR mixed image+text paste: send ONE multimodal call
  //     with all images + the text as a single user message. Images
  //     can't be safely split, and the model needs the full visual
  //     context anyway.
  const hasImages = images.length > 0;
  const chunks: string[] = [];
  if (hasImages) {
    // Single chunk — the model sees all images plus all text in one shot.
    chunks.push(text);
  } else {
    const allLines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const CHUNK_LINES = 15;
    for (let i = 0; i < allLines.length; i += CHUNK_LINES) {
      chunks.push(allLines.slice(i, i + CHUNK_LINES).join("\n"));
    }
    if (chunks.length === 0) chunks.push(text);

    // Hard ceiling on chunks — belt-and-braces against pathological inputs
    // (e.g. one character per line). Image mode bypasses this since it's
    // always exactly one chunk.
    if (chunks.length > MAX_CHUNKS) {
      return NextResponse.json(
        {
          error: `Too many lines (${allLines.length}). Maximum is ~${MAX_CHUNKS * CHUNK_LINES} per parse — split into smaller batches.`,
        },
        { status: 413 },
      );
    }
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

    // Build the user message content. For text-only mode it's a single
    // string. For image mode it's an array: every image as an image_block,
    // followed by a text block with the instruction + any text the user
    // pasted alongside the image.
    let userContent: Anthropic.Messages.MessageParam["content"];
    if (hasImages) {
      const imageBlocks: Anthropic.Messages.ImageBlockParam[] = images.map(
        (img) => ({
          type: "image",
          source: {
            type: "base64",
            media_type: img.mediaType as
              | "image/png"
              | "image/jpeg"
              | "image/webp"
              | "image/gif",
            data: img.data,
          },
        }),
      );
      const textInstruction = chunk
        ? `TODAY is ${today}.\n\nExtract every bet visible in the attached image(s). The user has also provided this context text — treat it as supplementary information about the image(s):\n\n${chunk}`
        : `TODAY is ${today}.\n\nExtract every bet visible in the attached image(s).`;
      userContent = [
        ...imageBlocks,
        { type: "text", text: textInstruction },
      ];
    } else {
      userContent = `TODAY is ${today}.\n\nParse the following bets (chunk ${i + 1} of ${chunks.length}):\n\n${chunk}`;
    }

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
        messages: [{ role: "user", content: userContent }],
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
