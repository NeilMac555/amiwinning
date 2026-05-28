// Deterministic SVG avatar derived from a handle. Used as a fallback
// whenever a profile has no uploaded image. The same handle always
// produces the same gradient + accent, so a tipster's identity is stable
// even before they upload anything.
//
// Design: a two-stop linear gradient picked from an 8-swatch palette
// tuned to fit the app's editorial cream / charcoal / muted-green tone,
// with a subtle diagonal accent stripe and the handle initials overlaid.

import type { CSSProperties } from "react";

// Eight palettes — each a [bg-start, bg-end, accent, text] tuple. Picked
// to be tasteful: muted, low-saturation, avoiding day-glo. The text color
// is always contrasty enough against the gradient to read at small sizes.
const PALETTES: Array<[string, string, string, string]> = [
  ["#2D4A3E", "#5A7B6B", "#E8D9A7", "#F5F2EA"], // forest → sage, cream text
  ["#7A3F2B", "#B5402E", "#F0D5B8", "#F5F2EA"], // burnt sienna → terracotta
  ["#3E4A6E", "#6B7BA5", "#D9E0F0", "#F5F2EA"], // navy → slate, pale text
  ["#5F3D6B", "#8B6BA0", "#E8D5E5", "#F5F2EA"], // plum → mauve
  ["#1E5F4F", "#3FA083", "#E0F0D9", "#F5F2EA"], // teal → mint
  ["#6B5230", "#A88A4F", "#F0E8D5", "#F5F2EA"], // bronze → tan
  ["#2D3D4F", "#5F7589", "#D5E5F0", "#F5F2EA"], // graphite → blue-gray
  ["#5A3030", "#8B5252", "#F0D5D5", "#F5F2EA"], // wine → blush
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
  const fontSize = size * 0.36;

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
      <path d={accents[variant]} fill={accent} opacity="0.7" />
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
