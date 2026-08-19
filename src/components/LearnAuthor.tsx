// LearnAuthor — small byline + last-updated card that renders under the
// title of every /learn glossary page.
//
// Why this exists (SEO / GEO):
//   Google explicitly weights E-E-A-T (Experience, Expertise,
//   Authoritativeness, Trustworthiness) on YMYL — Your Money Your Life
//   — topics. Sports betting analytics is textbook YMYL. A visible
//   author byline + credentials tied to a real, verifiable person is
//   one of the highest-ROI signals we can add.
//
//   AI answer engines (Google AI Overview, Perplexity, ChatGPT,
//   Claude) also cite content differently when it has clear
//   authorship — "amiup.io says" (weak) versus "Neil Macdonald,
//   sports betting analyst, says" (strong). The link out to Neil's
//   own tracker profile gives the AI a concrete entity to point at.
//
//   The last-updated date is the freshness signal — Google
//   deprioritises stale content especially in YMYL, and having a
//   real recent date on a well-linked glossary page is a small but
//   consistent boost.
//
// Contract:
//   - `lastUpdated` is an ISO date string ("2026-08-17"). Formatted for
//     display; kept ISO so it can also drive `dateModified` in the
//     Article JSON-LD if the caller wants to (currently caller passes
//     it separately).
//   - No auth-check, no client behaviour, pure server component.

import Link from "next/link";

interface Props {
  lastUpdated: string; // ISO YYYY-MM-DD
}

const AUTHOR_HANDLE = "neilmac555";
const AUTHOR_NAME = "Neil Macdonald";
const AUTHOR_CRED = "Independent sports betting analyst";

function fmtDate(iso: string): string {
  // "2026-08-17" → "Aug 17, 2026"
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return iso;
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function LearnAuthor({ lastUpdated }: Props) {
  return (
    <div
      className="learn-author"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 12,
        color: "var(--text-muted)",
        margin: "12px 0 20px",
        letterSpacing: "0.005em",
      }}
    >
      <span>
        By{" "}
        <Link
          href={`/u/${AUTHOR_HANDLE}`}
          style={{
            color: "var(--text)",
            textDecoration: "none",
            fontWeight: 600,
            borderBottom: "var(--border-w) solid var(--border-strong)",
          }}
          rel="author"
        >
          {AUTHOR_NAME}
        </Link>
      </span>
      <span
        aria-hidden="true"
        style={{ color: "var(--text-faint)" }}
      >
        ·
      </span>
      <span style={{ color: "var(--text-faint)" }}>{AUTHOR_CRED}</span>
      <span
        aria-hidden="true"
        style={{ color: "var(--text-faint)" }}
      >
        ·
      </span>
      <span style={{ fontFamily: "var(--mono)", color: "var(--text-faint)" }}>
        Updated <time dateTime={lastUpdated}>{fmtDate(lastUpdated)}</time>
      </span>
    </div>
  );
}
