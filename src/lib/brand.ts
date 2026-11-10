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

// The version shown in the sidebar and the dashboard footer. One constant
// so the two can't drift apart again (they used to read 0.4.5 and 0.4.2).
export const APP_VERSION = "0.4.5";
