"use client";

import { RANGES, type Range } from "@/lib/range";

interface Props {
  value: Range;
  onChange: (r: Range) => void;
  /** Subset of ranges to show. Defaults to all. */
  options?: Range[];
}

export function RangeTabs({ value, onChange, options = RANGES }: Props) {
  return (
    <div className="range-tabs" role="tablist">
      {options.map((r) => (
        <button
          key={r}
          data-active={r === value ? "true" : undefined}
          onClick={() => onChange(r)}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
