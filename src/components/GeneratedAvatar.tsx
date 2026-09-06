// Deterministic SVG avatar derived from a handle. Used as a fallback
// whenever a profile has no uploaded image. The same handle always
// produces the same gradient + accent, so a tipster's identity is stable
// even before they upload anything.
//
// Design: a two-stop linear gradient picked from an 8-swatch palette
// tuned to fit the app's editorial cream / charcoal / muted-green tone,
// with a subtle diagonal accent stripe and the handle initials overlaid.

import type { CSSProperties } from "react";

// Muted amber variations with high-contrast charcoal initials.
// Handle-based variation stays subtle so every fallback fits the same theme.
const PALETTES: Array<[string, string, string, string]> = [
  ["#DFA13C", "#BE812C", "#FFE0A0", "#171A20"],
  ["#E5AE53", "#C58C36", "#FFE0A0", "#171A20"],
  ["#DBA247", "#BC8534", "#FFE0A0", "#171A20"],
  ["#E1AA4E", "#C18A38", "#FFE0A0", "#171A20"],
];

// Simple deterministic hash for picking a palette. Doesn't need to be a
// real hash — just consistent across renders and well-distributed across
// short input strings.
function hashHandle(handle: string): number {
  let h = 0;
  for (let i = 0; i < handle.length; i++) {
    h = (h * 31 + handle.charCodeAt(i)) >>> 0;
  }
  return h;
}

function initials(handle: string, displayName?: string | null): string {
  const source = displayName?.trim() || handle;
  // Take first 1-2 alphanumeric chars, uppercase.
  const stripped = source.replace(/[^a-zA-Z0-9]/g, "");
  return stripped.slice(0, 2).toUpperCase() || "·";
}

interface Props {
  handle: string;
  displayName?: string | null;
  size?: number;
  /** Inline style overrides — used when the parent needs to set borderRadius. */
  style?: CSSProperties;
  className?: string;
}

export function GeneratedAvatar({
  handle,
  displayName,
  size = 56,
  style,
  className,
}: Props) {
  const hash = hashHandle(handle);
  const [bgA, bgB, accent, text] = PALETTES[hash % PALETTES.length];
  // Variant 0-3: which corner the diagonal accent sweeps into.
  const variant = (hash >> 3) % 4;

  // Map variant to a clip-path triangle in the corners.
  const accents = [
    "M0,0 L40,0 L0,40 Z",        // top-left
    "M60,0 L100,0 L100,40 Z",    // top-right
    "M0,60 L40,100 L0,100 Z",    // bottom-left
    "M100,60 L100,100 L60,100 Z", // bottom-right
  ];

  const gradId = `grad-${hash.toString(36)}`;
  const fontSize = 36;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{ display: "block", borderRadius: 8, ...style }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={bgA} />
          <stop offset="100%" stopColor={bgB} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${gradId})`} />
      <path d={accents[variant]} fill={accent} opacity="0.3" />
      <text
        x="50"
        y="50"
        dominantBaseline="central"
        textAnchor="middle"
        fontFamily="var(--mono), monospace"
        fontSize={fontSize}
        fontWeight="600"
        fill={text}
        letterSpacing="0.03em"
      >
        {initials(handle, displayName)}
      </text>
    </svg>
  );
}
