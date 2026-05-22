// Single source of truth for brand strings. Anything that needs to render
// the product name, tagline, or full title imports from here — never
// hardcoded duplicates. Keeps the wordmark, metadata, README, package.json
// and logged-out pages in lockstep.

export const BRAND = {
  name: "Am I Up",
  tagline: "The terminal for serious punters.",
  taglineShort: "The terminal for serious punters",
  fullTitle: "Am I Up — The terminal for serious punters.",
} as const;
