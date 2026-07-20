// React wrappers over lib/bet-display so callers can drop
// <SafeEvent> / <SafeField> into any bet-row JSX without pasting the
// same six-line render dance every time.
//
// Rendering rules:
//   1. If the underlying value is present and clean, render it as text.
//   2. If it is a partial "X vs UNKNOWN" style value, render the known
//      side + a muted "opponent not stated" tag next to it.
//   3. If it is entirely missing, render just the tag ("event not
//      stated" / "kickoff not stated" / etc). No angle-bracketed
//      placeholders ever leak through.

import { displayEvent, displayField } from "@/lib/bet-display";

// Tag component. Keeps its own tiny style so it works in any row layout
// (table cell, card, list) without needing surrounding flex containers.
function MissingTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="safe-bet-missing"
      style={{
        fontFamily: "var(--mono)",
        fontSize: "0.72em",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--text-faint)",
        fontWeight: 500,
        marginLeft: 6,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

/**
 * Render a bet's event field safely. Handles the "one side missing"
 * case by rendering the known team + a muted "opponent not stated" tag.
 */
export function SafeEvent({ value }: { value: string | null | undefined }) {
  const e = displayEvent(value);
  if (!e.text) {
    return <MissingTag>{e.missingTag ?? "event not stated"}</MissingTag>;
  }
  if (e.missingTag) {
    return (
      <>
        {e.text}
        <MissingTag>{e.missingTag}</MissingTag>
      </>
    );
  }
  return <>{e.text}</>;
}

/**
 * Render an arbitrary bet field. Pass the human label (e.g. "selection",
 * "kickoff") that appears inside the "X not stated" tag when the value
 * is missing.
 */
export function SafeField({
  value,
  label,
}: {
  value: string | null | undefined;
  label: string;
}) {
  const f = displayField(value, label);
  if (!f.text) {
    return <MissingTag>{f.missingTag ?? `${label} not stated`}</MissingTag>;
  }
  if (f.missingTag) {
    return (
      <>
        {f.text}
        <MissingTag>{f.missingTag}</MissingTag>
      </>
    );
  }
  return <>{f.text}</>;
}
