// Display-safe helpers for rendering parsed-bet fields.
//
// The AI parser occasionally emits placeholder tokens (<UNKNOWN>, N/A,
// null, empty strings) when a field is genuinely missing from the input.
// UI code should never surface those tokens to the user; instead render
// the field as a small muted tag ("opponent not stated" / "kickoff not
// stated" etc).
//
// This module is a pure render-time cleanup. It does not touch stored
// bet records (import/store.ts is off-limits per spec), and it does not
// change API responses. It is safe to import from any component.

/** Values the parser returns when a field is missing but the model
 *  decided to output something anyway. Matched case-insensitively. */
const PLACEHOLDER_TOKENS: readonly string[] = [
  "<unknown>",
  "unknown",
  "<n/a>",
  "n/a",
  "na",
  "null",
  "undefined",
  "tbd",
  "tba",
  "?",
  "-",
  "--",
];

/** True when the given value is missing, empty, whitespace only, or
 *  one of the well-known placeholder tokens the AI parser emits. */
export function isMissing(value: string | null | undefined): boolean {
  if (value == null) return true;
  const s = String(value).trim();
  if (s.length === 0) return true;
  return PLACEHOLDER_TOKENS.includes(s.toLowerCase());
}

/** Strip any placeholder tokens embedded inside a longer string. Used
 *  when the parser writes something like "Man City vs <UNKNOWN>" — we
 *  want the string minus the placeholder token, plus a signal that a
 *  side was missing. */
function stripPlaceholders(value: string): string {
  // Remove any <XXX> or [XXX] tokens outright.
  let out = value.replace(/[<[][^>\]]*[>\]]/g, " ");
  // Collapse whitespace runs the removal may have introduced.
  out = out.replace(/\s+/g, " ").trim();
  return out;
}

/**
 * Break an "event" field into { home, away, missingSide } if it uses
 * a familiar separator (v, vs, vs., -v-, @). When one side is missing
 * (placeholder token) we surface which side is missing so the UI can
 * label it cleanly.
 *
 * Returns { fullText } if no separator is found. Callers can then
 * decide whether to render the raw text or fall back to a tag.
 */
export interface EventParts {
  home?: string;
  away?: string;
  fullText: string;
  missingSide?: "home" | "away" | "both";
}
export function splitEventForDisplay(event: string): EventParts {
  const raw = event ?? "";
  // Reuse the same separator set as the import splitter so the display
  // stays consistent with the parsed record.
  const seps = [" v ", " vs. ", " vs ", " -v- ", " @ "];
  for (const sep of seps) {
    const i = raw.toLowerCase().indexOf(sep);
    if (i > 0) {
      const left = stripPlaceholders(raw.slice(0, i));
      const right = stripPlaceholders(raw.slice(i + sep.length));
      const leftMissing = isMissing(left);
      const rightMissing = isMissing(right);
      let missingSide: EventParts["missingSide"];
      if (leftMissing && rightMissing) missingSide = "both";
      else if (leftMissing) missingSide = "home";
      else if (rightMissing) missingSide = "away";
      return {
        home: leftMissing ? undefined : left,
        away: rightMissing ? undefined : right,
        fullText: raw,
        missingSide,
      };
    }
  }
  // No separator. Treat as a single team / event name; caller decides.
  return { fullText: raw };
}

/**
 * Turn a parsed event into what the UI should render. Two shapes:
 *   { text }            -- render the text as normal.
 *   { text, missingTag } -- render text with a small muted tag below /
 *                           after that says why the field is partial.
 *
 * Examples:
 *   "Man City v Everton"     -> { text: "Man City v Everton" }
 *   "Man City v <UNKNOWN>"   -> { text: "Man City", missingTag: "opponent not stated" }
 *   "<UNKNOWN>"              -> { text: "",         missingTag: "event not stated" }
 *   ""                       -> { text: "",         missingTag: "event not stated" }
 */
export interface DisplayEvent {
  text: string;
  missingTag?: string;
}
export function displayEvent(event: string | null | undefined): DisplayEvent {
  if (isMissing(event)) return { text: "", missingTag: "event not stated" };
  const parts = splitEventForDisplay(String(event));
  if (parts.missingSide === "both") {
    return { text: "", missingTag: "event not stated" };
  }
  if (parts.missingSide === "away" && parts.home) {
    return { text: parts.home, missingTag: "opponent not stated" };
  }
  if (parts.missingSide === "home" && parts.away) {
    return { text: parts.away, missingTag: "opponent not stated" };
  }
  // No separator, or both sides present. Clean any leftover placeholder
  // tokens inside the string so a "Man City <UNKNOWN>" (no separator)
  // still renders as "Man City" with a tag.
  const cleaned = stripPlaceholders(parts.fullText);
  if (isMissing(cleaned)) return { text: "", missingTag: "event not stated" };
  if (cleaned !== parts.fullText.trim()) {
    return { text: cleaned, missingTag: "opponent not stated" };
  }
  return { text: cleaned };
}

/**
 * Generic single-field display: keep the value, or return a "not
 * stated" tag when the value is missing or a placeholder. Used for
 * selection / market / kickoff / etc.
 */
export interface DisplayField {
  text: string;
  missingTag?: string;
}
export function displayField(
  value: string | null | undefined,
  fieldLabel: string,
): DisplayField {
  if (isMissing(value)) {
    return { text: "", missingTag: `${fieldLabel} not stated` };
  }
  const cleaned = stripPlaceholders(String(value));
  if (isMissing(cleaned)) {
    return { text: "", missingTag: `${fieldLabel} not stated` };
  }
  if (cleaned !== String(value).trim()) {
    return { text: cleaned, missingTag: `${fieldLabel} partial` };
  }
  return { text: cleaned };
}
