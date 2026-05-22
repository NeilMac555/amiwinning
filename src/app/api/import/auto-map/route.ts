// POST /api/import/auto-map
//
// AI-assisted column-mapping for spreadsheets that don't match a known preset.
// Single LLM call per file — row processing stays deterministic and happens
// on the client. The model never sees individual bets.
//
// Required env var: ANTHROPIC_API_KEY (same one SharpCheck uses).

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ColumnMap, FieldKey } from "@/lib/import/types";

const VALID_FIELDS: FieldKey[] = [
  "skip",
  "date",
  "time",
  "kickoff",
  "event",
  "home",
  "away",
  "sport",
  "league",
  "market",
  "selection",
  "odds",
  "stake",
  "status",
  "result",
  "returns",
  "tipster",
  "tags",
  "notes",
];

const SYSTEM_PROMPT = `You are an expert at recognising betting-tracker spreadsheet formats. Given headers and a few sample rows, identify which target field each column represents.

Available fields (return the KEY, not the label):
- skip — should not be imported (irrelevant or duplicate column)
- date — date of the bet/match, e.g. "2024-01-15"
- time — kickoff time, e.g. "19:30:00"
- kickoff — combined date+time in one cell
- event — full fixture text, e.g. "Liverpool v Chelsea"
- home / away — separate team columns
- sport — sport name (soccer/football/basketball/etc.)
- league — competition name
- market — market type (1X2, OU, AH, BTTS, etc.)
- selection — the actual pick the user bet on (this is NOT the market type — it's "Liverpool ML", "Over 2.5", etc.)
- odds — decimal, fractional, or American odds
- stake — amount staked
- status — outcome label (won/lost/push/void/half-won/etc.)
- result — NET profit/loss (signed: negative means a loss). Often labelled "P/L" or "Result"
- returns — GROSS returns (stake + winnings, never negative)
- tipster — tipster or source
- tags — comma-separated tags
- notes — free-form comments

Critical distinctions:
- "Result" is usually net P/L, NOT a win/loss outcome label. The outcome label is "Status".
- "Selection" is the pick text ("BTTS Yes", "Liverpool ML"). "Market" is the market type ("BTTS", "1X2").
- Bookmaker / sportsbook columns are NOT tracked — map them to "skip".
- If unsure, use "skip" rather than guess.

Output ONLY a JSON object, no prose:
{ "mapping": [{ "header": "<exact header>", "field": "<key>", "reason": "<≤60 char justification>" }] }`;

interface ParsedMapping {
  mapping: Array<{ header: string; field: FieldKey; reason?: string }>;
}

interface AutoMapResponse {
  columnMap: ColumnMap;
  mapping: Array<{ header: string; field: FieldKey; reason?: string }>;
}

export async function POST(req: Request): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY not set. Add it to .env.local to enable AI mapping.",
      },
      { status: 503 },
    );
  }

  let payload: { headers?: string[]; rows?: string[][] };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { headers, rows } = payload;
  if (!Array.isArray(headers) || !Array.isArray(rows) || headers.length === 0) {
    return NextResponse.json(
      { error: "Body must include headers[] and rows[][]" },
      { status: 400 },
    );
  }

  const samples = rows
    .slice(0, 10)
    .map((row, i) =>
      `Row ${i + 1}: ` +
      headers
        .map((h, ci) => `${h}=${JSON.stringify(row[ci] ?? "")}`)
        .join(" · "),
    )
    .join("\n");

  const userPrompt = `Headers (${headers.length}):
${headers.map((h, i) => `  ${i}: ${JSON.stringify(h)}`).join("\n")}

Sample rows:
${samples}

Return the JSON object now.`;

  const client = new Anthropic({ apiKey });

  let text = "";
  try {
    const resp = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2000,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          // Cache the system prompt — same instructions every call.
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    });
    const first = resp.content[0];
    text = first && first.type === "text" ? first.text : "";
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Anthropic API error: ${msg}` },
      { status: 502 },
    );
  }

  // Extract the JSON blob from the model's response.
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json(
      { error: "Model did not return JSON", raw: text },
      { status: 502 },
    );
  }

  let parsed: ParsedMapping;
  try {
    parsed = JSON.parse(jsonMatch[0]) as ParsedMapping;
  } catch {
    return NextResponse.json(
      { error: "Could not parse model JSON", raw: text },
      { status: 502 },
    );
  }

  if (!Array.isArray(parsed.mapping)) {
    return NextResponse.json(
      { error: "Model JSON missing mapping[] array", raw: parsed },
      { status: 502 },
    );
  }

  // Build a ColumnMap keyed by index, validating fields.
  const columnMap: ColumnMap = {};
  const validatedMapping: AutoMapResponse["mapping"] = [];
  for (const entry of parsed.mapping) {
    const idx = headers.indexOf(entry.header);
    if (idx < 0) continue;
    const field = VALID_FIELDS.includes(entry.field) ? entry.field : "skip";
    columnMap[idx] = field;
    validatedMapping.push({ header: entry.header, field, reason: entry.reason });
  }
  // Fill in any unmapped indices with "skip".
  for (let i = 0; i < headers.length; i++) {
    if (columnMap[i] === undefined) columnMap[i] = "skip";
  }

  return NextResponse.json({ columnMap, mapping: validatedMapping });
}
