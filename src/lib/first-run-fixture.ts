// Static fixture for the first-run ghost preview on the dashboard and
// analytics pages. Single source of truth so the numbers only need to
// be edited in one place if the founder wants to tune the demo.
//
// Presentational only — nothing here flows through aggregate.ts,
// analytics.ts, or any /api route. GhostPreview renders these values
// straight into the DOM at 65% opacity with pointer-events: none.
//
// The equity polyline is intentionally choppy-but-trending-up so it
// looks like real punter variance, not a straight line. Points are in
// a 0..100 domain on both axes; the SVG viewBox in GhostPreview scales
// them to whatever the card is sized at.

export interface SampleBookBet {
  text: string; // e.g. "Man City -1 AH @ 1.85"
  pl: number; // signed units, e.g. +1.70 or -1.50
}

export interface SampleBookFixture {
  kpis: {
    pl: number; // in units
    roi: number; // percent
    strikeRate: number; // percent
    betsTracked: number;
  };
  equity: Array<{ x: number; y: number }>;
  bets: SampleBookBet[];
}

export const SAMPLE_BOOK: SampleBookFixture = {
  kpis: {
    pl: 18.4,
    roi: 4.2,
    strikeRate: 54,
    betsTracked: 312,
  },
  // Choppy-but-up sample series. 15 points is enough to look like real
  // variance without oversampling the chart card's width. Values chosen
  // so the max/min give a visible drawdown around index 4-5 before the
  // recovery.
  equity: [
    { x: 0, y: 8 },
    { x: 7, y: 12 },
    { x: 14, y: 10 },
    { x: 22, y: 15 },
    { x: 29, y: 11 },
    { x: 36, y: 14 },
    { x: 43, y: 21 },
    { x: 50, y: 26 },
    { x: 57, y: 22 },
    { x: 64, y: 30 },
    { x: 71, y: 36 },
    { x: 79, y: 32 },
    { x: 86, y: 41 },
    { x: 93, y: 46 },
    { x: 100, y: 52 },
  ],
  bets: [
    { text: "Man City -1 AH @ 1.85", pl: 1.7 },
    { text: "Arsenal v Liverpool BTTS Yes @ 1.95", pl: -1.5 },
    { text: "Leverkusen +0.25 AH @ 2.02", pl: 2.04 },
  ],
};
