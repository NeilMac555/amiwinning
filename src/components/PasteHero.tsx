"use client";

// Dashboard hero card. The headline feature: paste any free-form bet log
// and AI parses it into structured rows you can commit straight to the
// active book without leaving the dashboard.
//
// Three states: input → review → success.

import { useState } from "react";
import Link from "next/link";
import { appendBets } from "@/lib/import/store";
import type { ImportedBet, MarketGuess, Status } from "@/lib/import/types";
import { useAuth } from "@/lib/auth";
import { classifySport } from "@/lib/sport-classify";
import { fmtUnit, useUnit } from "./UnitContext";

interface ParsedBet {
  kickoff: string;
  event: string;
  selection: string;
  market: MarketGuess;
  odds: number;
  stake: number;
  status: Status;
  sport?: string;
}

interface Props {
  // Called once bets are committed so the dashboard re-aggregates.
  onCommitted?: (n: number) => void;
}

function uid(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    "-" +
    Date.now().toString(36)
  );
}

function splitTeams(event: string): { home?: string; away?: string } {
  for (const sep of [" v ", " vs ", " vs. ", " -v- "]) {
    const i = event.indexOf(sep);
    if (i > 0) {
      return {
        home: event.slice(0, i).trim(),
        away: event.slice(i + sep.length).trim(),
      };
    }
  }
  return {};
}

export function PasteHero({ onCommitted }: Props) {
  const { activeBook } = useAuth();
  const unit = useUnit();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bets, setBets] = useState<ParsedBet[] | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [justAdded, setJustAdded] = useState<number | null>(null);

  const runParse = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setBets(null);
    setIssues([]);
    setJustAdded(null);
    try {
      const res = await fetch("/api/bets/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          today: new Date().toISOString().slice(0, 10),
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? `HTTP ${res.status}`);
        return;
      }
      setBets(body.bets ?? []);
      setIssues(body.issues ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const commit = () => {
    if (!bets || bets.length === 0) return;
    const importedAt = new Date().toISOString();
    const out: ImportedBet[] = bets.map((p) => {
      const { home, away } = splitTeams(p.event);
      let pl = 0;
      if (p.status === "won") pl = p.stake * (p.odds - 1);
      else if (p.status === "lost") pl = -p.stake;
      else if (p.status === "half_won") pl = (p.stake * (p.odds - 1)) / 2;
      else if (p.status === "half_lost") pl = -p.stake / 2;
      return {
        id: uid(),
        bookId: activeBook?.id,
        kickoff: p.kickoff,
        // Defense in depth: trust the classifier's verdict on the bet text
        // over whatever the AI returned. The classifier has the full player
        // / club / market dictionary; the AI sees one bet at a time and can
        // get confused by short rows.
        sport: classifySport({
          selection: p.selection,
          event: p.event,
          market: p.market,
          home,
          away,
          sport: p.sport,
        }),
        home,
        away,
        event: p.event,
        market: p.market,
        selection: p.selection,
        odds: p.odds,
        stake: p.stake,
        status: p.status,
        pl: Math.round(pl * 100) / 100,
        source: "manual:paste",
        importedAt,
        raw: {},
      };
    });
    appendBets(out);
    const n = out.length;
    setJustAdded(n);
    setBets(null);
    setText("");
    setIssues([]);
    onCommitted?.(n);
  };

  const reset = () => {
    setBets(null);
    setError(null);
    setIssues([]);
    setJustAdded(null);
  };

  const bookName = activeBook?.name ?? "your book";

  // -------------------------------------------------------------------------
  // Eyebrow row (shared across input + review states)

  const eyebrow = (
    <div className="paste-hero-eyebrow-row">
      <span className="paste-hero-eyebrow">Paste &amp; parse · AI</span>
      <span className="paste-hero-book-wrap">
        <span className="paste-hero-book-label">Logging to</span>
        <span className="paste-hero-book-chip">{bookName}</span>
      </span>
    </div>
  );

  // -------------------------------------------------------------------------
  // Success state — bets just added.

  if (justAdded != null) {
    return (
      <div className="paste-hero paste-hero--success">
        <span className="paste-hero-success-text">
          <span className="paste-hero-success-check">✓</span>
          <span>
            <strong>
              {justAdded} bet{justAdded === 1 ? "" : "s"} added
            </strong>{" "}
            to {bookName}.
          </span>
        </span>
        <span className="paste-hero-success-actions">
          <Link
            href="/bets"
            className="btn-ghost"
            style={{ padding: "6px 12px", fontSize: 12 }}
          >
            View bet log →
          </Link>
          <button
            type="button"
            className="btn-primary"
            onClick={reset}
            style={{ padding: "6px 14px", fontSize: 12.5 }}
          >
            Paste more
          </button>
        </span>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Review state — bets parsed, awaiting commit.

  if (bets && bets.length > 0) {
    const totalStake = bets.reduce((a, b) => a + b.stake, 0);
    return (
      <div className="paste-hero paste-hero--review">
        <div className="paste-hero-review-head">
          <div style={{ minWidth: 0 }}>
            {eyebrow}
            <h2 className="paste-hero-review-title">
              <em>{bets.length}</em> bet{bets.length === 1 ? "" : "s"} ready
              to log
            </h2>
            <div className="paste-hero-review-meta">
              <span>Review then commit.</span>
              <span style={{ color: "var(--text-faint)" }}>·</span>
              <span className="mono">
                {fmtUnit(totalStake, unit, { dp: 0 })} staked
              </span>
              {issues.length > 0 && (
                <>
                  <span style={{ color: "var(--text-faint)" }}>·</span>
                  <span style={{ color: "var(--red)" }}>
                    {issues.length} skipped
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="paste-hero-review-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={reset}
              style={{ padding: "7px 14px", fontSize: 12.5 }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={commit}
            >
              Add {bets.length} to {bookName} →
            </button>
          </div>
        </div>

        <div className="paste-hero-review-table">
          <table className="tbl" data-density="dense">
            <thead>
              <tr>
                <th>Kickoff</th>
                <th>Event</th>
                <th>Selection</th>
                <th className="num">Odds</th>
                <th className="num">Stake</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bets.map((b, i) => (
                <tr key={i}>
                  <td className="mono" style={{ fontSize: 11 }}>
                    {b.kickoff}
                  </td>
                  <td className="event">{b.event}</td>
                  <td className="selection">
                    <span className="sel-main">{b.selection}</span>
                  </td>
                  <td className="num">{b.odds.toFixed(2)}</td>
                  <td className="num">{fmtUnit(b.stake, unit, { dp: 0 })}</td>
                  <td>
                    <span
                      className={`badge ${
                        b.status === "won" || b.status === "half_won"
                          ? "win"
                          : b.status === "lost" || b.status === "half_lost"
                            ? "loss"
                            : "void"
                      }`}
                    >
                      {b.status.replace("_", "-")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {issues.length > 0 && (
          <div className="paste-hero-issues">
            <div className="paste-hero-issues-title">Skipped</div>
            <div className="paste-hero-issues-list">
              {issues.slice(0, 4).map((iss, i) => (
                <div key={i}>{iss}</div>
              ))}
              {issues.length > 4 && (
                <div className="paste-hero-issues-more">
                  …and {issues.length - 4} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Default state — empty textarea ready for paste.

  return (
    <div className="paste-hero paste-hero--input">
      {eyebrow}

      <h2 className="paste-hero-title">
        Paste <em>anything.</em>
      </h2>
      <p className="paste-hero-subtitle">
        X posts, Telegram channels, Substack tips, paper notes, bookmaker
        copy-paste. AI extracts every bet — date, market, odds, stake,
        result — ready to commit.
      </p>

      <textarea
        className="paste-hero-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder={`Sunday
Barcelona vs Real Madrid · Barcelona -0.75 @ 1.79 · 2u (win)
Milan vs Atalanta · Atalanta +0.25 @ 2.00 · 2u (win)
…`}
        spellCheck={false}
      />

      {error && <div className="paste-hero-error">{error}</div>}

      <div className="paste-hero-footer">
        <span className="paste-hero-tip">
          Tip: prefix parlays with <code>Double:</code> or <code>Treble:</code>
        </span>
        <button
          type="button"
          className="btn-primary"
          onClick={runParse}
          disabled={!text.trim() || loading}
        >
          {loading ? (
            <>Parsing…</>
          ) : (
            <>
              Parse bets
              <span style={{ fontSize: 14, marginLeft: -2 }}>→</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
