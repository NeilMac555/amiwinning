"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { applyTheme } from "@/lib/settings";
import Link from "next/link";
import { parseFile } from "@/lib/import/parse";
import { detectPreset, ALL_PRESETS } from "@/lib/import/presets/bettings";
import { normalise } from "@/lib/import/normalise";
import { appendBets, summarise } from "@/lib/import/store";
import { useAuth } from "@/lib/auth";
import { authedFetch } from "@/lib/authed-fetch";
import { Sidebar } from "@/components/Sidebar";
import { generateSampleImport } from "@/lib/sample-import";
import {
  FIELD_LABELS,
  type ColumnMap,
  type FieldKey,
  type ImportedBet,
  type NormalisationIssue,
  type ParsedFile,
  type SourcePreset,
} from "@/lib/import/types";

type Phase = "idle" | "parsing" | "ready" | "normalising" | "review" | "committed" | "error";

const ALL_FIELDS: FieldKey[] = [
  "skip",
  "date",
  "time",
  "kickoff",
  "event",
  "home",
  "away",
  "sport",
  "league",
  "market",
  "selection",
  "odds",
  "stake",
  "status",
  "result",
  "returns",
  "tipster",
  "tags",
  "notes",
];

export default function ImportPage() {
  const { activeBook } = useAuth();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<ParsedFile | null>(null);
  const [preset, setPreset] = useState<SourcePreset | null>(null);
  const [map, setMap] = useState<ColumnMap>({});
  const [bets, setBets] = useState<ImportedBet[]>([]);
  const [issues, setIssues] = useState<NormalisationIssue[]>([]);
  const [committedCount, setCommittedCount] = useState(0);
  // Tour mode — true when the user clicked "Try with sample data". The
  // review screen shows a banner and the commit copy changes to make
  // clear these are demo bets, not from a real file.
  const [isSample, setIsSample] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    applyTheme();
  }, []);

  const onFile = async (f: File) => {
    setPhase("parsing");
    setError(null);
    try {
      const parsed = await parseFile(f);
      if (parsed.headers.length === 0 || parsed.totalRows === 0) {
        throw new Error("File appears to be empty.");
      }
      const detected = detectPreset(parsed.headers);
      const initialMap = detected
        ? detected.columnMap(parsed.headers)
        : autoMap(parsed.headers);
      setFile(parsed);
      setPreset(detected);
      setMap(initialMap);
      setPhase("ready");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("error");
    }
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  const runNormalise = () => {
    if (!file) return;
    setPhase("normalising");
    // Small async tick so the UI shows "normalising" for files that take a moment.
    setTimeout(() => {
      const result = normalise(file, map, {
        sourceId: preset?.id ?? "manual",
        defaultSport: "Soccer",
      });
      setBets(result.bets);
      setIssues(result.issues);
      setPhase("review");
    }, 0);
  };

  const commit = () => {
    // Stamp every imported bet with the active book so Supabase + cache filters
    // can scope correctly.
    const stamped = bets.map((b) => ({ ...b, bookId: activeBook?.id }));
    appendBets(stamped);
    setCommittedCount(stamped.length);
    setPhase("committed");
  };

  // "Try with sample data" — jumps the user straight to the review screen
  // with ~25 in-memory bets so they see the whole flow without dropping a
  // real file. They can commit (bets land in their active book, taggable
  // as sample-import) or cancel back to idle.
  const loadSample = () => {
    const sample = generateSampleImport();
    setFile(sample.file);
    setPreset(null);
    setBets(sample.bets);
    setIssues(sample.issues);
    setIsSample(true);
    setPhase("review");
  };

  const reset = () => {
    setPhase("idle");
    setFile(null);
    setPreset(null);
    setMap({});
    setBets([]);
    setIssues([]);
    setCommittedCount(0);
    setError(null);
    setIsSample(false);
  };

  return (
    <div className="app">
      <Sidebar />

      <div className="main-col">
        <div className="page">
          <div className="page-header">
            <div>
              <h1 className="page-title">Import data</h1>
              <div className="page-subtitle">
                Drop a CSV or XLSX export. We&rsquo;ll detect the format and map
                columns to your bet log. Known sources auto-fill; everything
                else gets a manual mapping step.
              </div>
            </div>
          </div>

          {phase === "idle" && (
            <IdleView
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              onTrySample={loadSample}
              presets={ALL_PRESETS}
            />
          )}

          {phase === "parsing" && (
            <Card>
              <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
                Parsing&hellip;
              </div>
            </Card>
          )}

          {phase === "normalising" && (
            <Card>
              <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
                Normalising rows&hellip;
              </div>
            </Card>
          )}

          {phase === "error" && (
            <Card>
              <div style={{ padding: 24 }}>
                <div style={{ color: "var(--red)", fontWeight: 600, marginBottom: 8 }}>
                  Could not parse file
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 12.5, marginBottom: 16 }}>
                  {error}
                </div>
                <button className="btn-ghost" onClick={reset} data-active="true">
                  Try another file
                </button>
              </div>
            </Card>
          )}

          {phase === "ready" && file && (
            <ReadyView
              file={file}
              preset={preset}
              map={map}
              onChangeMap={setMap}
              onCancel={reset}
              onContinue={runNormalise}
            />
          )}

          {phase === "review" && file && (
            <ReviewView
              file={file}
              bets={bets}
              issues={issues}
              presetName={
                isSample
                  ? "Sample data tour"
                  : preset?.name ?? "Manual mapping"
              }
              isSample={isSample}
              onBack={isSample ? reset : () => setPhase("ready")}
              onCancelSample={reset}
              onCommit={commit}
            />
          )}

          {phase === "committed" && (
            <CommittedView count={committedCount} onReset={reset} />
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".csv,.tsv,.txt,.xlsx,.xls,.xlsm"
            onChange={onPickFile}
            style={{ display: "none" }}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Card({ children }: { children: React.ReactNode }) {
  return <div className="card" style={{ marginTop: 14 }}>{children}</div>;
}

function autoMap(headers: string[]): ColumnMap {
  const map: ColumnMap = {};
  headers.forEach((h, i) => {
    const k = h.trim().toLowerCase();
    const guess = HEADER_HEURISTICS[k];
    map[i] = guess ?? "skip";
  });
  return map;
}

const HEADER_HEURISTICS: Record<string, FieldKey> = {
  date: "date",
  "match date": "date",
  time: "time",
  "kickoff": "kickoff",
  "kick off": "kickoff",
  "kick-off": "kickoff",
  event: "event",
  match: "event",
  fixture: "event",
  game: "event",
  home: "home",
  "home team": "home",
  away: "away",
  "away team": "away",
  sport: "sport",
  league: "league",
  competition: "league",
  market: "market",
  bet: "selection",
  pick: "selection",
  selection: "selection",
  odds: "odds",
  price: "odds",
  decimal: "odds",
  stake: "stake",
  wager: "stake",
  status: "status",
  outcome: "status",
  result: "result",
  "p/l": "result",
  pl: "result",
  pnl: "result",
  profit: "result",
  returns: "returns",
  payout: "returns",
  // bookmaker / bookie / book / sportsbook columns are deliberately not mapped
  // — bookmaker tracking is out of scope by product decision.
  bookmaker: "skip",
  bookie: "skip",
  book: "skip",
  sportsbook: "skip",
  tipster: "tipster",
  source: "tipster",
  tags: "tags",
  notes: "notes",
  comment: "notes",
};

// ---------------------------------------------------------------------------

// IdleView — the redesigned empty state. Editorial hero + 4-step visual
// stepper + drop-zone-and-sample-CTA side-by-side + refined auto-detected
// sources card. The "Try with sample data" path jumps the user straight
// to the review screen so they see the flow end-to-end without dropping
// a real file.
function IdleView({
  onDrop,
  onClick,
  onTrySample,
  presets,
}: {
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  onTrySample: () => void;
  presets: SourcePreset[];
}) {
  const [over, setOver] = useState(false);

  // Each step: short title + one-line description. Kept short so they
  // fit on one row at desktop widths. Stepper stacks on mobile via CSS.
  const STEPS: Array<{ num: string; title: string; sub: string }> = [
    { num: "01", title: "Upload", sub: "CSV or XLSX from any source" },
    { num: "02", title: "Map", sub: "Known formats auto-fill" },
    { num: "03", title: "Review", sub: "Every row, before you commit" },
    { num: "04", title: "Done", sub: "Bets in your log, stats live" },
  ];

  return (
    <>
      {/* Stepper — visual reassurance that this is a fast, structured flow.
          Decorative, not interactive. */}
      <div className="import-stepper" aria-hidden="true">
        {STEPS.map((s, i) => (
          <Fragment key={s.num}>
            <div className="import-step">
              <div className="import-step-num">{s.num}</div>
              <div className="import-step-title">{s.title}</div>
              <div className="import-step-sub">{s.sub}</div>
            </div>
            {i < STEPS.length - 1 && (
              <svg
                className="import-step-arrow"
                width="18"
                height="14"
                viewBox="0 0 18 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              >
                <path d="M2 7h13M11 3l4 4-4 4" />
              </svg>
            )}
          </Fragment>
        ))}
      </div>

      {/* Drop zone (left) + sample CTA (right). Stack on mobile. */}
      <div className="import-drop-row">
        <div
          className="import-dropzone"
          data-over={over ? "true" : undefined}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            setOver(false);
            onDrop(e);
          }}
          onClick={onClick}
        >
          <svg
            className="import-dropzone-icon"
            width="36"
            height="36"
            viewBox="0 0 36 36"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 4v18M11 11l7-7 7 7" />
            <path d="M5 24v4a2 2 0 0 0 2 2h22a2 2 0 0 0 2-2v-4" />
          </svg>
          <div className="import-dropzone-title">
            Drop a file here, or click to choose
          </div>
          <div className="import-dropzone-sub">
            Accepted: .csv, .tsv, .xlsx, .xls — up to ~50k rows.
          </div>
        </div>

        <div className="import-sample-card">
          <div className="import-sample-eyebrow">
            <span className="import-sample-dot" aria-hidden="true" />
            <span>No file yet?</span>
          </div>
          <div className="import-sample-title">
            Try a <em>sample import</em>
          </div>
          <div className="import-sample-body">
            Walk through a complete import in seconds with ~25 realistic
            bets across soccer and tennis. See the mapping, the review
            screen, the committed bet log — without dropping your own
            file first.
          </div>
          <button
            type="button"
            className="btn-primary import-sample-btn"
            onClick={onTrySample}
          >
            Try with sample data →
          </button>
          <div className="import-sample-fine">
            Sample bets are tagged <span className="import-mono">sample-import</span>.
            Delete them any time from the bet log.
          </div>
        </div>
      </div>

      {/* Auto-detected sources — same content, restyled to match the
          new aesthetic. The two-tone badge layout reads as a small
          legend rather than a bullet list. */}
      <div className="card import-sources">
        <div className="import-sources-eyebrow">Auto-detected sources</div>
        <div className="import-sources-list">
          {presets.map((p) => (
            <div key={p.id} className="import-source-row">
              <span className="badge import-source-badge import-source-badge--known">
                {p.name}
              </span>
              <span className="import-source-desc">
                One-click mapping — header signature is fingerprinted.
              </span>
            </div>
          ))}
          <div className="import-source-row">
            <span className="badge import-source-badge">Anything else</span>
            <span className="import-source-desc">
              Map columns manually. Common headers (date / event / odds /
              stake / etc.) are pre-guessed.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------

function ReadyView({
  file,
  preset,
  map,
  onChangeMap,
  onCancel,
  onContinue,
}: {
  file: ParsedFile;
  preset: SourcePreset | null;
  map: ColumnMap;
  onChangeMap: (m: ColumnMap) => void;
  onCancel: () => void;
  onContinue: () => void;
}) {
  const previewRows = file.rows.slice(0, 8);
  const hasRequired =
    Object.values(map).includes("selection") &&
    Object.values(map).includes("odds") &&
    Object.values(map).includes("stake") &&
    (Object.values(map).includes("date") ||
      Object.values(map).includes("kickoff"));

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiReasons, setAiReasons] = useState<
    Array<{ header: string; field: FieldKey; reason?: string }> | null
  >(null);

  const runAutoDetect = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiReasons(null);
    try {
      const res = await authedFetch("/api/import/auto-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headers: file.headers,
          rows: file.rows.slice(0, 12),
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setAiError(body.error ?? `HTTP ${res.status}`);
        return;
      }
      onChangeMap(body.columnMap as ColumnMap);
      setAiReasons(body.mapping ?? null);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : String(e));
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <>
      <div className="card" style={{ marginTop: 14, padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {preset ? `Detected: ${preset.name}` : "Unrecognised format — manual mapping"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {file.sourceName} · {file.totalRows.toLocaleString()} rows ·{" "}
            {file.headers.length} columns
          </div>
        </div>
        {preset && (
          <span className="badge" style={{ color: "var(--green)", borderColor: "var(--green-tint)", background: "var(--green-bg)" }}>
            Preset matched
          </span>
        )}
      </div>

      <div
        className="card"
        style={{ marginTop: 14, padding: 0, overflow: "hidden" }}
      >
        <div className="card-header">
          <div>
            <div className="card-title">Column mapping</div>
            <div className="card-meta" style={{ marginTop: 4 }}>
              <span>
                Required: <span className="mono">selection · odds · stake · date</span>
              </span>
            </div>
          </div>
          {!preset && (
            <div className="card-actions">
              <button
                className="btn-ghost"
                data-active="true"
                onClick={runAutoDetect}
                disabled={aiLoading}
                style={{
                  padding: "5px 12px",
                  fontSize: 12,
                  opacity: aiLoading ? 0.6 : 1,
                }}
              >
                {aiLoading ? "Detecting…" : "Auto-detect with AI"}
              </button>
            </div>
          )}
        </div>
        {aiError && (
          <div
            style={{
              padding: "10px 16px",
              fontSize: 12,
              color: "var(--red)",
              borderBottom: "var(--border-w) solid var(--border)",
            }}
          >
            AI mapping failed: {aiError}
          </div>
        )}
        {aiReasons && aiReasons.length > 0 && (
          <div
            style={{
              padding: "10px 16px",
              fontSize: 12,
              color: "var(--text-muted)",
              borderBottom: "var(--border-w) solid var(--border)",
              background: "var(--surface-2)",
            }}
          >
            <div style={{ marginBottom: 6, fontWeight: 600, color: "var(--text)" }}>
              AI-detected mapping — review below before continuing
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "2px 12px", fontFamily: "var(--mono)", fontSize: 11 }}>
              {aiReasons.map((r, i) => (
                <Fragment key={i}>
                  <span style={{ color: "var(--text)" }}>{r.header} → {r.field}</span>
                  <span style={{ color: "var(--text-faint)" }}>{r.reason ?? ""}</span>
                </Fragment>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 240px", gap: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", padding: "10px 16px", borderBottom: "var(--border-w) solid var(--border)", borderRight: "var(--border-w) solid var(--border)" }}>
            Column header
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", padding: "10px 16px", borderBottom: "var(--border-w) solid var(--border)", borderRight: "var(--border-w) solid var(--border)" }}>
            Sample values
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", padding: "10px 16px", borderBottom: "var(--border-w) solid var(--border)" }}>
            Maps to
          </div>
          {file.headers.map((h, i) => (
            <ColumnRow
              key={i}
              header={h}
              samples={previewRows.map((r) => r[i] ?? "")}
              value={map[i] ?? "skip"}
              onChange={(v) => onChangeMap({ ...map, [i]: v })}
            />
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 14, padding: 0, overflow: "hidden" }}>
        <div className="card-header">
          <div>
            <div className="card-title">Preview</div>
            <div className="card-meta" style={{ marginTop: 4 }}>
              <span>First {previewRows.length} of {file.totalRows.toLocaleString()} rows</span>
            </div>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl" data-density="dense">
            <thead>
              <tr>
                {file.headers.map((h, i) => (
                  <th key={i}>{h || `Col ${i + 1}`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="mono" style={{ fontSize: 11 }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button className="btn-ghost" onClick={onCancel}>
          ← Choose a different file
        </button>
        <button
          className="btn-ghost"
          data-active="true"
          disabled={!hasRequired}
          onClick={onContinue}
          style={{
            opacity: hasRequired ? 1 : 0.4,
            cursor: hasRequired ? "pointer" : "not-allowed",
            padding: "8px 16px",
            fontSize: 13,
          }}
        >
          {hasRequired ? "Continue →" : "Map required columns first"}
        </button>
      </div>
    </>
  );
}

function ColumnRow({
  header,
  samples,
  value,
  onChange,
}: {
  header: string;
  samples: string[];
  value: FieldKey;
  onChange: (v: FieldKey) => void;
}) {
  const cellStyle: React.CSSProperties = {
    padding: "10px 16px",
    borderBottom: "var(--border-w) solid var(--border)",
    borderRight: "var(--border-w) solid var(--border)",
    fontSize: 12.5,
  };
  return (
    <>
      <div style={{ ...cellStyle, fontWeight: 500 }}>{header || <em style={{ color: "var(--text-faint)" }}>(empty)</em>}</div>
      <div style={{ ...cellStyle, fontFamily: "var(--mono)", color: "var(--text-muted)", fontSize: 11 }}>
        {samples.slice(0, 3).filter(Boolean).join(" · ") || <em style={{ color: "var(--text-faint)" }}>(no samples)</em>}
      </div>
      <div style={{ ...cellStyle, borderRight: 0 }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as FieldKey)}
          style={{
            width: "100%",
            padding: "4px 6px",
            fontSize: 12.5,
            fontFamily: "var(--sans)",
            background: "var(--surface)",
            border: "var(--border-w) solid var(--border-strong)",
            borderRadius: 4,
            color: "var(--text)",
          }}
        >
          {ALL_FIELDS.map((f) => (
            <option key={f} value={f}>
              {FIELD_LABELS[f]}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------

function ReviewView({
  file,
  bets,
  issues,
  presetName,
  isSample,
  onBack,
  onCancelSample,
  onCommit,
}: {
  file: ParsedFile;
  bets: ImportedBet[];
  issues: NormalisationIssue[];
  presetName: string;
  isSample?: boolean;
  onBack: () => void;
  onCancelSample?: () => void;
  onCommit: () => void;
}) {
  const summary = useMemo(() => summarise(bets), [bets]);
  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warnCount = issues.filter((i) => i.severity === "warning").length;
  const preview = bets.slice(0, 20);

  return (
    <>
      {/* Sample-mode banner — makes it unambiguous that these aren't from
          a real file. The user can commit them as practice or cancel. */}
      {isSample && (
        <div className="import-sample-banner" role="status">
          <div className="import-sample-banner-icon" aria-hidden="true">
            ✦
          </div>
          <div className="import-sample-banner-body">
            <div className="import-sample-banner-title">
              You&rsquo;re in sample-data tour mode
            </div>
            <div className="import-sample-banner-sub">
              These {bets.length} bets were generated in your browser, not
              from a real file. Click <strong>Import as practice</strong>{" "}
              to add them to your active book (tagged{" "}
              <span className="import-mono">sample-import</span>, easy to
              delete from the bet log), or <strong>Cancel</strong> to back
              out without saving anything.
            </div>
          </div>
        </div>
      )}

      <div className="kpi-strip" style={{ marginTop: 14 }}>
        <div className="kpi">
          <div className="kpi-label">Source</div>
          <div className="kpi-value mono" style={{ fontSize: 16 }}>{presetName}</div>
          <div className="kpi-foot">
            <div className="kpi-meta">
              <span style={{ color: "var(--text-faint)" }}>{file.sourceName}</span>
            </div>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Normalised</div>
          <div className="kpi-value mono num-pos">{bets.length.toLocaleString()}</div>
          <div className="kpi-foot">
            <div className="kpi-meta">
              <span style={{ color: "var(--text-faint)" }}>of {file.totalRows.toLocaleString()} rows</span>
            </div>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Errors (skipped)</div>
          <div className={`kpi-value mono ${errorCount > 0 ? "num-neg" : "num-flat"}`}>
            {errorCount.toLocaleString()}
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Warnings</div>
          <div className={`kpi-value mono ${warnCount > 0 ? "" : "num-flat"}`} style={{ color: warnCount > 0 ? "#A06E18" : undefined }}>
            {warnCount.toLocaleString()}
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Net P/L</div>
          <div className={`kpi-value mono ${summary.totalPl >= 0 ? "num-pos" : "num-neg"}`}>
            {summary.totalPl >= 0 ? "+" : "−"}
            {Math.abs(summary.totalPl).toLocaleString("en-US", { maximumFractionDigits: 2 })}
          </div>
          <div className="kpi-foot">
            <div className="kpi-meta">
              <span style={{ color: "var(--text-faint)" }}>
                {summary.earliest?.slice(0, 10)} → {summary.latest?.slice(0, 10)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {issues.length > 0 && (
        <div className="card" style={{ marginTop: 14, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            Issues
          </div>
          <div style={{ maxHeight: 160, overflowY: "auto", fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--text-muted)" }}>
            {[...issues]
              .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "error" ? -1 : 1))
              .slice(0, 50)
              .map((iss, i) => (
                <div key={i} style={{ padding: "2px 0", color: iss.severity === "error" ? "var(--red)" : "#A06E18" }}>
                  Row {iss.rowIndex + 1} · {iss.field} · {iss.message}
                </div>
              ))}
            {issues.length > 50 && (
              <div style={{ padding: "4px 0", color: "var(--text-faint)" }}>
                …and {issues.length - 50} more
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 14, padding: 0, overflow: "hidden" }}>
        <div className="card-header">
          <div>
            <div className="card-title">Normalised preview</div>
            <div className="card-meta" style={{ marginTop: 4 }}>
              <span>First {preview.length} of {bets.length.toLocaleString()} bets</span>
            </div>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
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
                <th className="num">P/L</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((b) => (
                <tr key={b.id}>
                  <td className="mono" style={{ fontSize: 11 }}>
                    {b.kickoff.slice(0, 10)}
                  </td>
                  <td className="event">{b.event}</td>
                  <td className="selection">
                    <span className="sel-main">{b.selection}</span>
                  </td>
                  <td className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {b.market}
                  </td>
                  <td className="num">{b.odds.toFixed(2)}</td>
                  <td className="num">{b.stake}</td>
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
                  <td className={`num ${b.pl > 0 ? "num-pos" : b.pl < 0 ? "num-neg" : "num-flat"}`}>
                    {b.pl > 0 ? "+" : b.pl < 0 ? "−" : ""}
                    {Math.abs(b.pl).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          className="btn-ghost"
          onClick={isSample ? onCancelSample : onBack}
        >
          {isSample ? "Cancel — just looking" : "← Back to mapping"}
        </button>
        <button
          className="btn-ghost"
          data-active="true"
          onClick={onCommit}
          style={{ padding: "8px 16px", fontSize: 13 }}
        >
          {isSample
            ? `Import ${bets.length.toLocaleString()} as practice →`
            : `Import ${bets.length.toLocaleString()} bets →`}
        </button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------

function CommittedView({ count, onReset }: { count: number; onReset: () => void }) {
  return (
    <div className="card" style={{ marginTop: 14, padding: 32, textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 6 }}>
        Imported {count.toLocaleString()} bets
      </div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
        Saved to your browser. They&rsquo;ll sync to your account once auth is wired up.
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <Link href="/" className="btn-ghost" data-active="true" style={{ padding: "8px 16px", fontSize: 13 }}>
          View dashboard →
        </Link>
        <button className="btn-ghost" onClick={onReset} style={{ padding: "8px 16px", fontSize: 13 }}>
          Import another file
        </button>
      </div>
    </div>
  );
}
