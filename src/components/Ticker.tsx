import type { TickerItem } from "@/lib/data";

interface TickerProps {
  items: TickerItem[];
}

export function Ticker({ items }: TickerProps) {
  const doubled = items.concat(items);
  return (
    <div className="ticker">
      <div className="ticker-tag">
        <span className="dot-live"></span>
        Closing line
      </div>
      <div className="ticker-track">
        {doubled.map((t, i) => {
          const dir =
            t.moved > 0 ? "num-pos" : t.moved < 0 ? "num-neg" : "num-flat";
          return (
            <span className="ticker-item" key={i}>
              <span className="tk-tag">{t.league}</span>
              <span className="tk-event">{t.match}</span>
              <span className="tk-sep">·</span>
              <span
                className="tk-from"
                style={{ color: "var(--text-muted)" }}
              >
                {t.sel}
              </span>
              <span className="tk-from">{t.from}</span>
              <span className="tk-arrow">→</span>
              <span className={`tk-to ${dir}`}>{t.to}</span>
              <span className="tk-tag" style={{ color: "var(--text-faint)" }}>
                {t.tag}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
