import { trackingMilestone } from "@/lib/tracking-milestone";

function MilestoneSymbol({ minimum }: { minimum: number }) {
  const star = "m12 2.5 2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.32l-5.8 3.05 1.1-6.47-4.69-4.58 6.49-.94Z";
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" style={{ flexShrink: 0 }}>
      {minimum < 1000 ? (
        <path d="M12 3 21 12 12 21 3 12Z" fill={minimum >= 500 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      ) : minimum < 5000 ? (
        <path fill="currentColor" d={star} />
      ) : (
        <>
          <path fill="currentColor" d={star} transform="translate(4.2 2.4) scale(.65)" />
          <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <path d="M10 22C2 20 1 12 4 5M14 22C22 20 23 12 20 5" />
          </g>
          <g fill="currentColor">
            <ellipse cx="3.5" cy="8" rx="1.2" ry="2.2" transform="rotate(-25 3.5 8)" />
            <ellipse cx="3" cy="13" rx="1.2" ry="2.2" transform="rotate(-40 3 13)" />
            <ellipse cx="5" cy="18" rx="1.2" ry="2.2" transform="rotate(-55 5 18)" />
            <ellipse cx="20.5" cy="8" rx="1.2" ry="2.2" transform="rotate(25 20.5 8)" />
            <ellipse cx="21" cy="13" rx="1.2" ry="2.2" transform="rotate(40 21 13)" />
            <ellipse cx="19" cy="18" rx="1.2" ry="2.2" transform="rotate(55 19 18)" />
          </g>
        </>
      )}
    </svg>
  );
}

export function TrackingBadge({ count, sample = false }: { count: number; sample?: boolean }) {
  const milestone = trackingMilestone(count);
  if (!milestone) return null;
  return (
    <details className="tracking-badge">
      <summary aria-label={`${sample ? "Sample badge: " : ""}${milestone.label}. About this milestone`}>
        <MilestoneSymbol minimum={milestone.minimum} />
        <span>{milestone.label}</span>
        {sample && <span className="tracking-badge-sample">Demo</span>}
      </summary>
      <p>{count.toLocaleString("en-GB")} settled bets recorded. This milestone recognises {milestone.minimum.toLocaleString("en-GB")}+ settled records, including imported history and losses. It does not verify results, identity or profitability.{sample ? " This badge uses illustrative sample data." : ""}</p>
    </details>
  );
}
