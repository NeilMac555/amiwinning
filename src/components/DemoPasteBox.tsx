"use client";

// DemoPasteBox — live paste-parse demo shown on the signed-out landing
// page. Sits above the fold in the hero. Pre-loaded with the same
// Telegram-style sample tip the signed-in first-run hero uses so the
// two experiences stay consistent.
//
// Wire:
//   1. Visitor lands, sees the pre-loaded scruffy tip and a "Parse it"
//      button.
//   2. Click "Parse it" -> POST /api/demo/parse (text only, max 2,000
//      chars, in-memory 3-per-IP-per-day cap). NOTHING is written to
//      Supabase or any store.
//   3. Parsed bets render as cards inside the same panel.
//   4. "Sign up to keep these" stores the parsed bets in sessionStorage
//      under aiw_demo_bets and links to /sign-in. The post-signup import
//      is deliberately not built yet; the sessionStorage payload sits
//      there for a later commit to pick up.
//
// Styling: dark panel, amber Parse button, mono numeric text, green
// reserved for won-bet colour. No emoji, no em dashes.

import Link from "next/link";
import { useState } from "react";
import { SAMPLE_TIP_TEXT } from "@/lib/sample-tip";

const MAX_CHARS = 2_000;
const DEMO_STORAGE_KEY = "aiw_demo_bets";

interface DemoBet {
  kickoff: string;
  event: string;
  selection: string;
  market: string;
  odds: number;
  stake: number;
  status: string;
  sport: string;
}

interface DemoResponse {
  bets?: DemoBet[];
  issues?: string[];
  remaining?: number;
  limit?: number;
  error?: string;
  rateLimited?: boolean;
}

type ViewState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "results"; bets: DemoBet[]; remaining: number | null; issues: string[] }
  | { kind: "error"; message: string; rateLimited: boolean };

// Human-friendly market labels for the result cards. Keeps the cards
// short; the raw enum ("ah", "ou", "1X2") reads as jargon to a first-
// time visitor.
const MARKET_LABEL: Record<string, string> = {
  "1X2": "Moneyline",
  ah: "Handicap",
  ou: "Over/Under",
  btts: "Both teams to score",
  dnb: "Draw no bet",
  totals_team: "Team totals",
  shots: "Shots",
  corners: "Corners",
  scorer: "Scorer",
  cards: "Cards",
  half_time: "Half time",
  ht_ft: "HT/FT",
  clean_sheet: "Clean sheet",
  winning_margin: "Winning margin",
  exact_score: "Exact score",
  tournament: "Outright",
  parlay: "Parlay",
  other: "Other",
};

function marketLabel(m: string): string {
  return MARKET_LABEL[m] ?? m;
}

// Status pill styling: won stays green, lost stays red (P/L meaning),
// pending stays neutral. Everything else falls through to neutral.
function statusToneClass(s: string): string {
  if (s === "won" || s === "half_won") return "demo-bet-status demo-bet-status--won";
  if (s === "lost" || s === "half_lost")
    return "demo-bet-status demo-bet-status--lost";
  return "demo-bet-status demo-bet-status--neutral";
}
function statusLabel(s: string): string {
  if (s === "half_won") return "Half won";
  if (s === "half_lost") return "Half lost";
  if (s === "pending") return "Pending";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function DemoPasteBox() {
  const [text, setText] = useState<string>(SAMPLE_TIP_TEXT);
  const [view, setView] = useState<ViewState>({ kind: "idle" });
  const [saved, setSaved] = useState(false);

  const onParse = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setView({ kind: "loading" });
    try {
      const res = await fetch("/api/demo/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: trimmed,
          today: new Date().toISOString().slice(0, 10),
        }),
      });
      const body: DemoResponse = await res.json();
      if (!res.ok) {
        setView({
          kind: "error",
          message: body.error ?? `Parser error (HTTP ${res.status}).`,
          rateLimited: body.rateLimited === true || res.status === 429,
        });
        return;
      }
      setView({
        kind: "results",
        bets: body.bets ?? [],
        remaining: typeof body.remaining === "number" ? body.remaining : null,
        issues: body.issues ?? [],
      });
    } catch (err) {
      setView({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
        rateLimited: false,
      });
    }
  };

  const onSaveForSignup = () => {
    if (view.kind !== "results" || view.bets.length === 0) return;
    try {
      window.sessionStorage.setItem(
        DEMO_STORAGE_KEY,
        JSON.stringify({
          bets: view.bets,
          savedAt: new Date().toISOString(),
        }),
      );
      setSaved(true);
    } catch {
      // sessionStorage blocked (privacy mode etc). Silent: the link still
      // navigates to /sign-in, we just can't hydrate the bets afterwards.
      setSaved(true);
    }
  };

  const remainingChars = MAX_CHARS - text.length;
  const overCap = remainingChars < 0;

  return (
    <div className="demo-box">
      <div className="demo-box-eyebrow">
        <span className="demo-box-eyebrow-dot" aria-hidden="true" />
        <span>Live demo. Try it right now.</span>
      </div>
      <h2 className="demo-box-title">Paste anything. See it parsed.</h2>
      <p className="demo-box-sub">
        Below is a scruffy Telegram-style tip. Hit Parse it and the AI
        extracts each bet. No sign-up. Nothing is saved.
      </p>

      <textarea
        className="demo-box-textarea"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (view.kind !== "idle" && view.kind !== "loading") {
            setView({ kind: "idle" });
            setSaved(false);
          }
        }}
        spellCheck={false}
        rows={5}
        placeholder="Paste one or more bets here."
        disabled={view.kind === "loading"}
      />

      <div className="demo-box-footer">
        <span
          className="demo-box-counter"
          data-over={overCap ? "true" : undefined}
        >
          <span className="mono">{text.length.toLocaleString()}</span>
          <span className="demo-box-counter-sep">/</span>
          <span className="mono">{MAX_CHARS.toLocaleString()}</span>
        </span>
        <button
          type="button"
          className="btn-primary demo-box-parse"
          onClick={onParse}
          disabled={
            view.kind === "loading" ||
            text.trim().length === 0 ||
            overCap
          }
        >
          {view.kind === "loading" ? "Parsing." : "Parse it"}
        </button>
      </div>

      {view.kind === "error" && (
        <div className="demo-box-error" role="alert">
          <div className="demo-box-error-msg">{view.message}</div>
          {view.rateLimited && (
            <Link href="/sign-in" className="btn-primary demo-box-error-cta">
              Sign up for unlimited parsing
            </Link>
          )}
        </div>
      )}

      {view.kind === "results" && (
        <div className="demo-box-results">
          <div className="demo-box-results-head">
            <span className="mono demo-box-results-count">
              {view.bets.length} bet{view.bets.length === 1 ? "" : "s"} parsed
            </span>
            {view.remaining != null && (
              <span className="demo-box-results-remaining">
                <span className="mono">{view.remaining}</span> demo parse
                {view.remaining === 1 ? "" : "s"} left today
              </span>
            )}
          </div>

          {view.bets.length === 0 ? (
            <div className="demo-box-empty">
              The parser could not find a bet in that text. Try the
              pre-loaded example.
            </div>
          ) : (
            <ul className="demo-box-list">
              {view.bets.map((b, i) => (
                <li className="demo-bet" key={i}>
                  <div className="demo-bet-head">
                    <span className="demo-bet-sport">{b.sport}</span>
                    <span className="demo-bet-market">
                      {marketLabel(b.market)}
                    </span>
                    <span className={statusToneClass(b.status)}>
                      {statusLabel(b.status)}
                    </span>
                  </div>
                  <div className="demo-bet-event">{b.event}</div>
                  <div className="demo-bet-selection">{b.selection}</div>
                  <div className="demo-bet-metrics">
                    <span className="demo-bet-metric">
                      <span className="demo-bet-metric-label">Odds</span>
                      <span className="mono demo-bet-metric-value">
                        {b.odds.toFixed(2)}
                      </span>
                    </span>
                    <span className="demo-bet-metric">
                      <span className="demo-bet-metric-label">Stake</span>
                      <span className="mono demo-bet-metric-value">
                        {b.stake}u
                      </span>
                    </span>
                    <span className="demo-bet-metric">
                      <span className="demo-bet-metric-label">Kickoff</span>
                      <span className="mono demo-bet-metric-value">
                        {b.kickoff}
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {view.bets.length > 0 && (
            <div className="demo-box-save-row">
              <Link
                href="/sign-in"
                onClick={onSaveForSignup}
                className="btn-primary demo-box-save"
              >
                {saved ? "Saved. Continue to sign up." : "Sign up to keep these"}
              </Link>
              <span className="demo-box-save-fine">
                Free. No card. Your data stays yours.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
