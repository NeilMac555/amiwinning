"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { UnitProvider, fmtStake, fmtUnit, type DisplayUnit } from "@/components/UnitContext";
// useSettings replaces the local unit useState/useEffect pattern.
import { appendBets } from "@/lib/import/store";
import { guessMarket } from "@/lib/import/normalise";
import type { ImportedBet, MarketGuess } from "@/lib/import/types";
import { applyTheme, useSettings } from "@/lib/settings";
import { computeClvPct } from "@/lib/clv";
import { useAuth } from "@/lib/auth";
import { authedFetch } from "@/lib/authed-fetch";
import { classifySport } from "@/lib/sport-classify";

interface FormState {
  kickoffDate: string; // YYYY-MM-DD
  event: string;
  market: MarketGuess | "auto";
  selection: string;
  odds: string;
  stake: string;
  closingOdds: string; // optional Pinnacle close
  notes: string;
}

interface ParsedBet {
  kickoff: string;
  event: string;
  selection: string;
  market: MarketGuess;
  odds: number;
  stake: number;
  status: import("@/lib/import/types").Status;
}

const MARKET_OPTIONS: Array<{ value: FormState["market"]; label: string }> = [
  { value: "auto", label: "Auto-detect from selection" },
  { value: "1X2", label: "1X2 / moneyline" },
  { value: "ah", label: "Asian handicap" },
  { value: "ou", label: "Over / under" },
  { value: "btts", label: "BTTS" },
  { value: "dnb", label: "Draw no bet" },
  { value: "totals_team", label: "Team totals" },
  { value: "shots", label: "Player shots" },
  { value: "corners", label: "Corners" },
  { value: "scorer", label: "Goalscorer" },
  { value: "cards", label: "Cards" },
  { value: "half_time", label: "Half-time" },
  { value: "ht_ft", label: "HT/FT" },
  { value: "clean_sheet", label: "Clean sheet" },
  { value: "winning_margin", label: "Winning margin" },
  { value: "exact_score", label: "Correct score" },
  { value: "tournament", label: "Outrights" },
  { value: "other", label: "Other" },
];

function defaultKickoffDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseOddsInput(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = parseFloat(s);
    return n >= 1.01 && n <= 1000 ? n : null;
  }
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) {
    const a = parseInt(frac[1], 10);
    const b = parseInt(frac[2], 10);
    if (b > 0) return a / b + 1;
  }
  const am = s.match(/^([+-]?)(\d+)$/);
  if (am) {
    const sign = am[1] === "-" ? -1 : 1;
    const n = parseInt(am[2], 10);
    if (sign > 0) return n / 100 + 1;
    return 100 / n + 1;
  }
  return null;
}

function uid(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    "-" +
    Date.now().toString(36)
  );
}

export default function NewBetPage() {
  const router = useRouter();
  const { activeBook } = useAuth();
  const unit = useSettings().unit;
  const [f, setF] = useState<FormState>({
    kickoffDate: defaultKickoffDate(),
    event: "",
    market: "auto",
    selection: "",
    odds: "",
    stake: "",
    closingOdds: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // Paste mode — parse a free-text dump of multiple bets in one shot.
  const [mode, setMode] = useState<"single" | "paste">("single");
  const [pasteText, setPasteText] = useState("");
  const [pasteLoading, setPasteLoading] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [parsedBets, setParsedBets] = useState<ParsedBet[] | null>(null);
  const [parsedIssues, setParsedIssues] = useState<string[]>([]);

  const runPaste = async () => {
    setPasteLoading(true);
    setPasteError(null);
    setParsedBets(null);
    setParsedIssues([]);
    try {
      const res = await authedFetch("/api/bets/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: pasteText,
          today: new Date().toISOString().slice(0, 10),
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setPasteError(body.error ?? `HTTP ${res.status}`);
        return;
      }
      setParsedBets(body.bets ?? []);
      setParsedIssues(body.issues ?? []);
    } catch (e) {
      setPasteError(e instanceof Error ? e.message : String(e));
    } finally {
      setPasteLoading(false);
    }
  };

  const commitPasted = () => {
    if (!parsedBets || parsedBets.length === 0) return;
    const importedAt = new Date().toISOString();
    const bets: ImportedBet[] = parsedBets.map((p) => {
      let home: string | undefined;
      let away: string | undefined;
      for (const sep of [" v ", " vs ", " vs. ", " -v- "]) {
        const i = p.event.indexOf(sep);
        if (i > 0) {
          home = p.event.slice(0, i).trim();
          away = p.event.slice(i + sep.length).trim();
          break;
        }
      }
      // P/L: derive from status × odds × stake if settled, else 0.
      let pl = 0;
      if (p.status === "won") pl = p.stake * (p.odds - 1);
      else if (p.status === "lost") pl = -p.stake;
      else if (p.status === "half_won") pl = (p.stake * (p.odds - 1)) / 2;
      else if (p.status === "half_lost") pl = -p.stake / 2;
      return {
        id: uid(),
        bookId: activeBook?.id,
        kickoff: p.kickoff,
        sport: classifySport({
          selection: p.selection,
          event: p.event,
          market: p.market,
          home,
          away,
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
    appendBets(bets);
    router.push("/bets");
  };

  useEffect(() => {
    applyTheme();
  }, []);

  const update = (patch: Partial<FormState>) => {
    setF((prev) => ({ ...prev, ...patch }));
    setError(null);
  };

  const oddsParsed = useMemo(() => parseOddsInput(f.odds), [f.odds]);
  const closingParsed = useMemo(
    () => parseOddsInput(f.closingOdds),
    [f.closingOdds],
  );
  const clvPct = useMemo(
    () => computeClvPct(oddsParsed, closingParsed),
    [oddsParsed, closingParsed],
  );
  const stakeParsed = useMemo(() => {
    const n = parseFloat(f.stake);
    return isFinite(n) && n > 0 ? n : null;
  }, [f.stake]);
  const toWin = useMemo(() => {
    if (oddsParsed == null || stakeParsed == null) return null;
    return Math.round(stakeParsed * (oddsParsed - 1) * 100) / 100;
  }, [oddsParsed, stakeParsed]);

  const canSubmit =
    f.event.trim().length > 0 &&
    f.selection.trim().length > 0 &&
    oddsParsed != null &&
    stakeParsed != null &&
    f.kickoffDate.length === 10;

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSubmit || oddsParsed == null || stakeParsed == null) return;
    setSubmitting(true);
    try {
      const kickoff = f.kickoffDate;
      const market: MarketGuess =
        f.market === "auto" ? guessMarket(f.selection) : f.market;
      // Split home/away when the event reads "X v Y" / "X vs Y".
      let home: string | undefined;
      let away: string | undefined;
      for (const sep of [" v ", " vs ", " vs. ", " -v- "]) {
        const i = f.event.indexOf(sep);
        if (i > 0) {
          home = f.event.slice(0, i).trim();
          away = f.event.slice(i + sep.length).trim();
          break;
        }
      }

      const bet: ImportedBet = {
        id: uid(),
        bookId: activeBook?.id,
        kickoff,
        sport: classifySport({
          selection: f.selection.trim(),
          event: f.event.trim(),
          market,
          home,
          away,
        }),
        home,
        away,
        event: f.event.trim(),
        market,
        selection: f.selection.trim(),
        odds: Math.round(oddsParsed * 1000) / 1000,
        stake: Math.round(stakeParsed * 100) / 100,
        closingOdds:
          closingParsed != null
            ? Math.round(closingParsed * 1000) / 1000
            : undefined,
        notes: f.notes.trim() || undefined,
        status: "pending",
        pl: 0,
        source: "manual",
        importedAt: new Date().toISOString(),
        raw: {},
      };
      appendBets([bet]);
      router.push("/bets");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  };

  // Keyboard shortcut: ⌘/Ctrl + Enter submits.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, canSubmit]);

  return (
    <UnitProvider unit={unit}>
      <div className="app">
        <Sidebar />
        <div className="main-col">
          <TopBar />
          <div className="page" style={{ maxWidth: 640, paddingTop: 0 }}>
            <div className="page-header">
              <div>
                <h1 className="page-title">
                  {mode === "single" ? "New bet" : "Paste multiple bets"}
                </h1>
                <div className="page-subtitle">
                  {mode === "single"
                    ? "Logged before kickoff. CLV will populate once a closing line is captured at start time."
                    : "Dump bets in free-form English — AI parses them into rows you can review before committing."}
                </div>
              </div>
              {mode === "single" ? (
                // Headline CTA. Pulse + "AI" badge make it unmistakable
                // that this is the magic feature — not just a "paste
                // multiple at once" utility. User feedback during
                // launch (Fanteam Journey on X) was that "Paste
                // multiple →" felt like a power-user utility, hiding
                // the actual AI-powered wedge.
                <button
                  type="button"
                  className="btn-paste-ai"
                  onClick={() => {
                    setMode("paste");
                    setPasteError(null);
                    setParsedBets(null);
                  }}
                  title="Paste any source — AI extracts every bet"
                >
                  <span className="btn-paste-ai-pulse" aria-hidden="true" />
                  <span className="btn-paste-ai-text">Paste anything</span>
                  <span className="btn-paste-ai-badge">AI</span>
                  <span className="btn-paste-ai-arrow" aria-hidden="true">
                    →
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setMode("single");
                    setPasteError(null);
                    setParsedBets(null);
                  }}
                  style={{ padding: "5px 12px", fontSize: 12 }}
                >
                  ← Single bet
                </button>
              )}
            </div>

            {mode === "paste" ? (
              <PasteMode
                text={pasteText}
                setText={setPasteText}
                loading={pasteLoading}
                error={pasteError}
                bets={parsedBets}
                issues={parsedIssues}
                onParse={runPaste}
                onCommit={commitPasted}
                unit={unit}
              />
            ) : null}

            {mode === "single" ? (
            <form onSubmit={submit} className="card" style={{ padding: 20 }}>
              <Field label="Kickoff date">
                <input
                  type="date"
                  value={f.kickoffDate}
                  onChange={(e) => update({ kickoffDate: e.target.value })}
                  style={input}
                  required
                />
              </Field>

              <Field label="Event" hint='Format: "Home v Away" splits into teams automatically.'>
                <input
                  type="text"
                  value={f.event}
                  onChange={(e) => update({ event: e.target.value })}
                  placeholder="Liverpool v Chelsea"
                  style={input}
                  autoFocus
                  required
                />
              </Field>

              <Field label="Selection" hint='The pick text, e.g. "Liverpool ML", "Over 2.5", "BTTS yes".'>
                <input
                  type="text"
                  value={f.selection}
                  onChange={(e) => update({ selection: e.target.value })}
                  placeholder="Over 2.5 goals"
                  style={input}
                  required
                />
              </Field>

              <Field label="Market" hint="Auto-detect will infer from the selection text.">
                <select
                  value={f.market}
                  onChange={(e) => update({ market: e.target.value as FormState["market"] })}
                  style={input}
                >
                  {MARKET_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field
                  label="Odds"
                  hint="Decimal (1.85), fractional (6/4), or American (+185)."
                >
                  <input
                    type="text"
                    inputMode="decimal"
                    value={f.odds}
                    onChange={(e) => update({ odds: e.target.value })}
                    placeholder="1.85"
                    style={{
                      ...input,
                      fontFamily: "var(--mono)",
                      borderColor:
                        f.odds && oddsParsed == null
                          ? "var(--red)"
                          : undefined,
                    }}
                    required
                  />
                  {f.odds && oddsParsed != null && (
                    <Hint>
                      ≡ {oddsParsed.toFixed(2)} decimal · break-even{" "}
                      {(100 / oddsParsed).toFixed(1)}%
                    </Hint>
                  )}
                </Field>
                <Field label="Stake" hint={`In ${unit === "u" ? "units" : unit}.`}>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={f.stake}
                    onChange={(e) => update({ stake: e.target.value })}
                    placeholder="1"
                    style={{
                      ...input,
                      fontFamily: "var(--mono)",
                    }}
                    required
                  />
                  {toWin != null && (
                    <Hint>
                      to win{" "}
                      <span style={{ color: "var(--green)" }}>
                        {fmtUnit(toWin, unit)}
                      </span>
                    </Hint>
                  )}
                </Field>
              </div>

              <Field
                label="Pinnacle closing line"
                hint='Optional. Their closing price on the same selection — used to compute CLV. Skip if you don’t have it yet.'
              >
                <input
                  type="text"
                  inputMode="decimal"
                  value={f.closingOdds}
                  onChange={(e) => update({ closingOdds: e.target.value })}
                  placeholder="1.85"
                  style={{
                    ...input,
                    fontFamily: "var(--mono)",
                    borderColor:
                      f.closingOdds && closingParsed == null
                        ? "var(--red)"
                        : undefined,
                  }}
                />
                {clvPct != null && (
                  <Hint>
                    CLV{" "}
                    <span
                      style={{
                        color:
                          clvPct > 0
                            ? "var(--green)"
                            : clvPct < 0
                              ? "var(--red)"
                              : "var(--text-muted)",
                      }}
                    >
                      {clvPct >= 0 ? "+" : "−"}
                      {Math.abs(clvPct).toFixed(2)}%
                    </span>
                    <span style={{ color: "var(--text-faint)", marginLeft: 8 }}>
                      (you got{" "}
                      {clvPct > 0
                        ? "better"
                        : clvPct < 0
                          ? "worse"
                          : "same"}{" "}
                      odds than the close)
                    </span>
                  </Hint>
                )}
              </Field>

              {showNotes ? (
                <Field label="Notes">
                  <textarea
                    value={f.notes}
                    onChange={(e) => update({ notes: e.target.value })}
                    rows={2}
                    autoFocus
                    style={{
                      ...input,
                      fontFamily: "var(--sans)",
                      resize: "vertical",
                    }}
                  />
                </Field>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNotes(true)}
                  style={{
                    fontSize: 12,
                    color: "var(--text-faint)",
                    marginBottom: 16,
                    padding: "2px 0",
                    background: "none",
                    border: 0,
                    cursor: "pointer",
                  }}
                >
                  + Add note
                </button>
              )}

              {error && (
                <div style={{ color: "var(--red)", fontSize: 12, marginBottom: 10 }}>
                  {error}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <Link
                  href="/bets"
                  className="btn-ghost"
                  style={{ padding: "8px 16px", fontSize: 13 }}
                >
                  Cancel
                </Link>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  <span
                    className="kbd"
                    style={{ display: canSubmit ? "inline-flex" : "none" }}
                  >
                    ⌘↵
                  </span>
                  <button
                    type="submit"
                    className="btn-ghost"
                    data-active="true"
                    disabled={!canSubmit || submitting}
                    style={{
                      padding: "8px 18px",
                      fontSize: 13,
                      opacity: canSubmit ? 1 : 0.4,
                      cursor: canSubmit ? "pointer" : "not-allowed",
                    }}
                  >
                    {submitting ? "Logging…" : "Log bet"}
                  </button>
                </div>
              </div>
            </form>
            ) : null}
          </div>
        </div>
      </div>
    </UnitProvider>
  );
}

// ---------------------------------------------------------------------------

function PasteMode({
  text,
  setText,
  loading,
  error,
  bets,
  issues,
  onParse,
  onCommit,
  unit,
}: {
  text: string;
  setText: (v: string) => void;
  loading: boolean;
  error: string | null;
  bets: ParsedBet[] | null;
  issues: string[];
  onParse: () => void;
  onCommit: () => void;
  unit: DisplayUnit;
}) {
  return (
    <>
      <div className="card" style={{ padding: 20 }}>
        <Field
          label="Bets"
          hint='Free-form. Include date / event / selection / odds / stake / result. "Double:" for parlays. AI extracts the rest.'
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder={`Sunday\nBarcelona vs Real Madrid · Barcelona -0.75 AH @ 1.79 · 2u (win)\nPSG vs Brest · Over 3.5 @ 1.85 · 2u (lost)\n…`}
            style={{
              ...input,
              fontFamily: "var(--mono)",
              fontSize: 12.5,
              lineHeight: 1.5,
              resize: "vertical",
            }}
          />
        </Field>

        {error && (
          <div
            style={{
              color: "var(--red)",
              fontSize: 12,
              marginBottom: 10,
              padding: "8px 10px",
              border: "var(--border-w) solid var(--red)",
              borderRadius: 5,
              background: "var(--red-bg)",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn-ghost"
            data-active="true"
            onClick={onParse}
            disabled={!text.trim() || loading}
            style={{
              padding: "8px 18px",
              fontSize: 13,
              opacity: text.trim() && !loading ? 1 : 0.4,
              cursor: text.trim() && !loading ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "Parsing…" : "Parse bets"}
          </button>
        </div>
      </div>

      {bets && bets.length > 0 && (
        <div className="card" style={{ marginTop: 14, padding: 0, overflow: "hidden" }}>
          <div className="card-header">
            <div>
              <div className="card-title">{bets.length} bet{bets.length === 1 ? "" : "s"} parsed</div>
              <div className="card-meta" style={{ marginTop: 4 }}>
                <span>Review before committing.</span>
                {issues.length > 0 && (
                  <span style={{ color: "var(--red)" }}>
                    {issues.length} skipped
                  </span>
                )}
              </div>
            </div>
          </div>
          <table className="tbl" data-density="dense">
            <thead>
              <tr>
                <th>Kickoff</th>
                <th>Event</th>
                <th>Selection</th>
                <th>Market</th>
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
                  <td className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {b.market}
                  </td>
                  <td className="num">{b.odds.toFixed(2)}</td>
                  <td className="num">{fmtStake(b.stake, unit)}</td>
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
      )}

      {issues.length > 0 && (
        <div className="card" style={{ marginTop: 14, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            Skipped
          </div>
          {issues.map((iss, i) => (
            <div
              key={i}
              style={{
                fontSize: 11.5,
                color: "var(--red)",
                fontFamily: "var(--mono)",
                padding: "2px 0",
              }}
            >
              {iss}
            </div>
          ))}
        </div>
      )}

      {bets && bets.length > 0 && (
        <div
          style={{
            marginTop: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link
            href="/bets"
            className="btn-ghost"
            style={{ padding: "8px 16px", fontSize: 13 }}
          >
            Cancel
          </Link>
          <button
            type="button"
            className="btn-ghost"
            data-active="true"
            onClick={onCommit}
            style={{ padding: "8px 18px", fontSize: 13 }}
          >
            Add {bets.length} bet{bets.length === 1 ? "" : "s"} →
          </button>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------

const input: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  fontSize: 13,
  fontFamily: "var(--sans)",
  background: "var(--surface)",
  border: "var(--border-w) solid var(--border-strong)",
  borderRadius: 5,
  color: "var(--text)",
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      {children}
      {hint && (
        <div
          style={{
            fontSize: 11,
            color: "var(--text-faint)",
            marginTop: 4,
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: "var(--text-muted)",
        marginTop: 4,
        fontFamily: "var(--mono)",
      }}
    >
      {children}
    </div>
  );
}
