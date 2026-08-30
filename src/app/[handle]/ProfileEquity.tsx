"use client";

// Thin client wrapper around the existing EquityCurve component. Lives in
// its own file so the server-rendered ProfilePage can stay a server
// component (it can import a "use client" child but can't directly use
// React hooks itself).

import { EquityCurve } from "@/components/EquityCurve";
import { UnitProvider } from "@/components/UnitContext";
import type { EquityData } from "@/lib/data";

interface Props {
  equity: EquityData;
  weekly: number[];
}

export function ProfileEquity({ equity, weekly }: Props) {
  return (
    // Public profiles always render in unit-mode (u) — we don't know the
    // viewer's preferred currency, and units are the bet-tracking universal.
    <UnitProvider unit="u">
      <EquityCurve
        data={equity}
        weekly={weekly}
        mode="cumulative"
      />
    </UnitProvider>
  );
}
