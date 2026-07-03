// POST /api/bets/parse
//
// Free-text bet parser. User pastes "Barcelona vs Real Madrid, Barcelona -0.75
// AH at 1.79, 2 units (win)" etc., we extract structured bet records via
// Claude. Multi-leg parlays collapse to a single bet with market="parlay".
//
// System prompt, tool schema, and per-bet validation live in
// src/lib/parse-bets.ts so /api/demo/parse can reuse them.

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser } from "@/lib/api-auth";
import { claimAiQuota } from "@/lib/ai-quota";
import {
  SYSTEM_PROMPT,
  TOOL_DEF,
  validateAndClean,
  type ParsedBet,
} from "@/lib/parse-bets";

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

  // Final pass: shared validator handles date/odds/stake/enum checks and
  // clamps future kickoffs on settled bets. Same rules apply to the demo
  // route via the shared lib.
  const { cleaned, issues } = validateAndClean(aggregatedBets, today);

  // Surface chunk-level failures alongside bet-level issues so the UI can
  // show them.
  return NextResponse.json({
    bets: cleaned,
    issues: [...chunkErrors, ...issues],
  });
}
