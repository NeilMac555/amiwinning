"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { UnitProvider, fmtUnit, type DisplayUnit } from "@/components/UnitContext";
import { deleteBet, getBet, updateBet } from "@/lib/import/store";
import { guessMarket } from "@/lib/import/normalise";
import type { ImportedBet, MarketGuess, Status } from "@/lib/import/types";
import { applyTheme, loadSettings } from "@/lib/settings";
import { computeClvPct } from "@/lib/clv";
import { useAuth } from "@/lib/auth";

interface FormState {
  kickoffDate: string;
  event: string;
  market: MarketGuess | "auto";
  selection: string;
  odds: string;
  stake: string;
  closingOdds: string;
  status: Status;
  pl: string;
  notes: string;
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

const STATUS_OPTIONS: Array<{ value: Status; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "half_won", label: "Half-won" },
  { value: "half_lost", label: "Half-lost" },
  { value: "push", label: "Push" },
  { value: "void", label: "Void" },
];

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

function autoPl(status: Status, odds: number, stake: number): number {
  switch (status) {
    case "won":
      return Math.round(stake * (odds - 1) * 100) / 100;
    case "lost":
      return -stake;
    case "half_won":
      return Math.round((stake * (odds - 1)) / 2 * 100) / 100;
    case "half_lost":
      return -stake / 2;
    case "push":
    case "void":
    case "pending":
    default:
      return 0;
  }
}

export default function EditBetPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [unit, setUnit] = useState<DisplayUnit>("u");
  const [original, setOriginal] = useState<ImportedBet | null>(null);
  const [missing, setMissing] = useState(false);
  const [f, setF] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [plTouched, setPlTouched] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { betsVersion } = useAuth();

  useEffect(() => {
    applyTheme();
    setUnit(loadSettings().unit);
    if (!id) return;
    const b = getBet(id);
    if (!b) {
      setMissing(true);
      return;
    }
    setMissing(false);
    setOriginal(b);
    setF({
      kickoffDate: b.kickoff.slice(0, 10),
      event: b.event,
      market: (b.market as MarketGuess) ?? "auto",
      selection: b.selection,
      odds: String(b.odds),
      stake: String(b.stake),
      closingOdds: b.closingOdds != null ? String(b.closingOdds) : "",
      status: b.status,
      pl: String(b.pl),
      notes: b.notes ?? "",
    });
    setShowNotes(Boolean(b.notes));
  }, [id, betsVersion]);

  const update = (patch: Partial<FormState>) => {
    setF((prev) => (prev ? { ...prev, ...patch } : prev));
    setError(null);
  };

  // Auto-compute P/L when status / odds / stake change, UNLESS the user has
  // explicitly typed a value — then we respect their override.
  const oddsParsed = useMemo(() => (f ? parseOddsInput(f.odds) : null), [f]);
  const closingParsed = useMemo(
    () => (f ? parseOddsInput(f.closingOdds) : null),
    [f],
  );
  const clvPct = useMemo(
    () => computeClvPct(oddsParsed, closingParsed),
    [oddsParsed, closingParsed],
  );
  const stakeParsed = useMemo(() => {
    if (!f) return null;
    const n = parseFloat(f.stake);
    return isFinite(n) && n > 0 ? n : null;
  }, [f]);

  useEffect(() => {
    if (!f || plTouched) return;
    if (oddsParsed == null || stakeParsed == null) return;
    const v = autoPl(f.status, oddsParsed, stakeParsed);
    if (f.pl !== String(v)) setF((prev) => prev && { ...prev, pl: String(v) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f?.status, oddsParsed, stakeParsed, plTouched]);

  const canSubmit =
    f != null &&
    f.event.trim().length > 0 &&
    f.selection.trim().length > 0 &&
    oddsParsed != null &&
    stakeParsed != null &&
    f.kickoffDate.length === 10;

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!f || !canSubmit || !id || oddsParsed == null || stakeParsed == null) return;
    setSubmitting(true);
    try {
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
      const market: MarketGuess =
        f.market === "auto" ? guessMarket(f.selection) : f.market;
      const plParsed = parseFloat(f.pl);
      updateBet(id, {
        kickoff: f.kickoffDate,
        event: f.event.trim(),
        home,
        away,
        market,
        selection: f.selection.trim(),
        odds: Math.round(oddsParsed * 1000) / 1000,
        stake: Math.round(stakeParsed * 100) / 100,
        closingOdds:
          closingParsed != null
            ? Math.round(closingParsed * 1000) / 1000
            : undefined,
        status: f.status,
        pl: isFinite(plParsed) ? Math.round(plParsed * 100) / 100 : 0,
        notes: f.notes.trim() || undefined,
      });
      router.push("/bets");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  };

  const onDelete = () => {
    if (!id) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteBet(id);
    router.push("/bets");
  };

  if (missing) {
    return (
      <UnitProvider unit={unit}>
        <div className="app">
          <Sidebar />
          <div className="main-col">
            <TopBar />
            <div className="page">
              <div className="page-header">
                <div>
                  <h1 className="page-title">Bet not found</h1>
                  <div className="page-subtitle">
                    This bet doesn&rsquo;t exist or was already deleted.{" "}
                    <Link href="/bets" style={{ color: "var(--blue)" }}>
                      Back to bet log
                    </Link>
                    .
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UnitProvider>
    );
  }

  if (!f || !original) {
    return (
      <UnitProvider unit={unit}>
        <div className="app">
          <Sidebar />
          <div className="main-col">
            <TopBar />
            <div className="page">
              <div style={{ padding: 40, color: "var(--text-faint)" }}>Loading…</div>
            </div>
          </div>
        </div>
      </UnitProvider>
    );
  }

  return (
    <UnitProvider unit={unit}>
      <div className="app">
        <Sidebar />
        <div className="main-col">
          <TopBar />
          <div className="page" style={{ maxWidth: 640, paddingTop: 0 }}>
            <div className="page-header">
              <div>
                <h1 className="page-title">Edit bet</h1>
                <div className="page-subtitle">
                  Logged {new Date(original.importedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} · source{" "}
                  <span className="mono" style={{ fontSize: 11 }}>
                    {original.source}
                  </span>
                </div>
              </div>
            </div>

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

              <Field label="Event">
                <input
                  type="text"
                  value={f.event}
                  onChange={(e) => update({ event: e.target.value })}
                  style={input}
                  required
                />
              </Field>

              <Field label="Selection">
                <input
                  type="text"
                  value={f.selection}
                  onChange={(e) => update({ selection: e.target.value })}
                  style={input}
                  required
                />
              </Field>

              <Field label="Market">
                <select
                  value={f.market}
                  onChange={(e) =>
                    update({ market: e.target.value as FormState["market"] })
                  }
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
                <Field label="Odds">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={f.odds}
                    onChange={(e) => update({ odds: e.target.value })}
                    style={{
                      ...input,
                      fontFamily: "var(--mono)",
                      borderColor:
                        f.odds && oddsParsed == null ? "var(--red)" : undefined,
                    }}
                    required
                  />
                </Field>
                <Field label="Stake">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={f.stake}
                    onChange={(e) => update({ stake: e.target.value })}
                    style={{ ...input, fontFamily: "var(--mono)" }}
                    required
                  />
                </Field>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Status">
                  <select
                    value={f.status}
                    onChange={(e) => {
                      setPlTouched(false); // re-enable auto P/L when status changes
                      update({ status: e.target.value as Status });
                    }}
                    style={input}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="P/L"
                  hint={
                    plTouched
                      ? "Manual override"
                      : "Auto from status × odds × stake"
                  }
                >
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={f.pl}
                    onChange={(e) => {
                      setPlTouched(true);
                      update({ pl: e.target.value });
                    }}
                    style={{ ...input, fontFamily: "var(--mono)" }}
                  />
                  {!plTouched && stakeParsed != null && (
                    <Hint>
                      Currently{" "}
                      {fmtUnit(parseFloat(f.pl) || 0, unit, { signed: true })}
                    </Hint>
                  )}
                </Field>
              </div>

              <Field
                label="Pinnacle closing line"
                hint="Closing price on the same selection. CLV is computed live."
              >
                <input
                  type="text"
                  inputMode="decimal"
                  value={f.closingOdds}
                  onChange={(e) => update({ closingOdds: e.target.value })}
                  placeholder="—"
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
                  borderTop: "var(--border-w) solid var(--border)",
                  paddingTop: 14,
                }}
              >
                <button
                  type="button"
                  onClick={onDelete}
                  style={{
                    padding: "6px 12px",
                    fontSize: 12,
                    background: "none",
                    border: confirmDelete
                      ? "var(--border-w) solid var(--red)"
                      : "var(--border-w) solid transparent",
                    borderRadius: 5,
                    color: confirmDelete ? "var(--red)" : "var(--text-muted)",
                    cursor: "pointer",
                  }}
                  onBlur={() => setConfirmDelete(false)}
                >
                  {confirmDelete ? "Click again to confirm delete" : "Delete"}
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Link
                    href="/bets"
                    className="btn-ghost"
                    style={{ padding: "8px 16px", fontSize: 13 }}
                  >
                    Cancel
                  </Link>
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
                    {submitting ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </UnitProvider>
  );
}

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
        <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
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
