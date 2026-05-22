// bettin.gs CSV export adapter.
// Signature: headers ["Date","Time","Game","Bet","Stake","Odds","Status","Result","Tipster","Sport","Bookie"]
// "Result" is the net P/L. "Status" is the W/L/P outcome. "Game" is "Home v Away".

import type { ColumnMap, FieldKey, SourcePreset } from "../types";

const BETTINGS_HEADERS = [
  "date",
  "time",
  "game",
  "bet",
  "stake",
  "odds",
  "status",
  "result",
  "tipster",
  "sport",
  "bookie",
];

function norm(s: string) {
  return s.trim().toLowerCase();
}

export const bettingsPreset: SourcePreset = {
  id: "bettings",
  name: "bettin.gs export",
  detect(headers) {
    const lower = headers.map(norm);
    return BETTINGS_HEADERS.every((h) => lower.includes(h));
  },
  columnMap(headers) {
    const map: ColumnMap = {};
    headers.forEach((h, i) => {
      const key = norm(h);
      const field: FieldKey | null = (() => {
        switch (key) {
          case "date":
            return "date";
          case "time":
            return "time";
          case "game":
            return "event";
          case "bet":
            return "selection";
          case "stake":
            return "stake";
          case "odds":
            return "odds";
          case "status":
            return "status";
          case "result":
            return "result";
          case "tipster":
            return "tipster";
          case "sport":
            return "sport";
          case "bookie":
            // Bookmaker tracking removed — column is captured into the raw
            // record but never mapped to a usable field.
            return null;
          default:
            return null;
        }
      })();
      map[i] = field ?? "skip";
    });
    return map;
  },
};

export const ALL_PRESETS: SourcePreset[] = [bettingsPreset];

export function detectPreset(headers: string[]): SourcePreset | null {
  for (const p of ALL_PRESETS) if (p.detect(headers)) return p;
  return null;
}
