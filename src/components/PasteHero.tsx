"use client";

// Dashboard hero card. The headline feature: paste any free-form bet log
// and AI parses it into structured rows you can commit straight to the
// active book without leaving the dashboard.
//
// Three states: input → review → success.
//
// As of the launch-day v2, paste accepts EITHER text or screenshots
// (or both). Vision input goes through the same /api/bets/parse route;
// Claude Haiku 4.5 handles multimodal natively.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { appendBets, deleteBet } from "@/lib/import/store";
import type { ImportedBet, MarketGuess, Status } from "@/lib/import/types";
import { useAuth } from "@/lib/auth";
import { authedFetch } from "@/lib/authed-fetch";
import { classifySport } from "@/lib/sport-classify";
import {
  SAMPLE_SOURCE_TAG,
  SAMPLE_TIP_TEXT,
} from "@/lib/sample-tip";
// Unit display helpers were used by the old review-table render; the
// auto-commit flow doesn't show stakes/per-bet rows so they're no longer
// needed here. Keep the import path for if/when we add a per-bet summary
// to the undo toast.

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
  // When true (signed-in user with zero non-sample bets), the textarea
  // pre-fills with a demo tip, the Parse button pulses, and a caption
  // nudges the user to try the sample or paste their own. Bets parsed
  // from the untouched pre-fill get tagged with source === "sample" so
  // the dashboard can separate them from real bets. Editing the
  // textarea before parsing clears the sample flag and reverts to a
  // normal parse.
  firstRun?: boolean;
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

// Each attached screenshot kept as a base64 data URL so we can preview it
// inline AND send it straight to the API without a separate upload step.
interface AttachedImage {
  id: string;
  name: string;
  dataUrl: string; // "data:image/png;base64,..."
  mediaType: string; // "image/png", "image/jpeg" etc.
  bytes: number;
}

// Anthropic accepts up to ~5MB per image. We cap at 4MB to leave headroom
// for the base64 inflation overhead in the JSON body. Larger pasted screen-
// shots get rejected with a clear error rather than a confusing 413 later.
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_IMAGES = 4;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

function imageUid(): string {
  return `img-${Math.random().toString(36).slice(2, 9)}`;
}

// Read a File/Blob as a data URL (base64). Wraps the FileReader API so we
// can `await` it cleanly.
async function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unexpected image read result"));
        return;
      }
      resolve(result);
    };
    reader.readAsDataURL(file);
  });
}

export function PasteHero({ onCommitted, firstRun = false }: Props) {
  const { activeBook } = useAuth();
  // Initialise the textarea with the sample tip only when we're mounting
  // into first-run mode. useState's initial-value function runs once, so
  // toggling firstRun later doesn't blow away user-typed content.
  const [text, setText] = useState(() => (firstRun ? SAMPLE_TIP_TEXT : ""));
  // Tracks whether the current textarea contents are still the untouched
  // sample. Bets parsed from this state get flagged source === "sample";
  // any edit (typing, delete, cut, paste-over) clears the flag.
  const [isSampleText, setIsSampleText] = useState<boolean>(firstRun);
  const [images, setImages] = useState<AttachedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // After auto-commit, justAdded holds the IDs of the bets we just wrote
  // so Undo can target them, plus a deadline timestamp that drives the
  // countdown shown in the toast. Replaces the old "review then confirm"
  // step — users were repeatedly forgetting the confirm and losing the
  // whole batch.
  const [justAdded, setJustAdded] = useState<{
    ids: string[];
    count: number;
    expiresAt: number;
  } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  // Brief "Undone" confirmation shown after the user reverses a commit.
  const [undone, setUndone] = useState<number | null>(null);
  // Ref to the hidden file input so the "Attach screenshot" button can
  // open the picker programmatically.
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Image attachment plumbing ──────────────────────────────────────────

  // Accept a flat list of Files (from a paste event or a file picker) and
  // append the valid ones to the attachments list. Surface a single error
  // string if any image was rejected — better than silently dropping.
  const addImages = async (files: File[]) => {
    if (files.length === 0) return;
    const accepted: AttachedImage[] = [];
    const rejected: string[] = [];

    for (const file of files) {
      if (images.length + accepted.length >= MAX_IMAGES) {
        rejected.push(
          `Reached ${MAX_IMAGES}-image limit; "${file.name}" not added`,
        );
        continue;
      }
      if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
        rejected.push(
          `"${file.name}" is ${file.type || "unknown"}; we accept PNG, JPEG, WebP, GIF`,
        );
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        rejected.push(
          `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)}MB; max 4MB`,
        );
        continue;
      }
      try {
        const dataUrl = await fileToDataUrl(file);
        accepted.push({
          id: imageUid(),
          // Pasted images often come through as "image.png" — give them a
          // friendlier label so the UI doesn't repeat the same name.
          name: file.name && file.name !== "image.png" ? file.name : "Screenshot",
          dataUrl,
          mediaType: file.type,
          bytes: file.size,
        });
      } catch (e) {
        rejected.push(
          `Could not read "${file.name}": ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    if (accepted.length > 0) {
      setImages((prev) => [...prev, ...accepted]);
      setError(null);
    }
    if (rejected.length > 0) {
      setError(rejected.join(" · "));
    }
  };

  // Catches paste events anywhere on the hero card so the user doesn't have
  // to click into the textarea first. Image clipboard items get extracted
  // and added; text falls through to the textarea's normal paste handling.
  const onHeroPaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter((it) => it.kind === "file" && it.type.startsWith("image/"));
    if (imageItems.length === 0) return; // textarea handles text paste itself
    e.preventDefault();
    const files = imageItems
      .map((it) => it.getAsFile())
      .filter((f): f is File => f != null);
    await addImages(files);
  };

  const onFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    // Reset the input value so picking the same file twice still fires
    // a change event.
    e.target.value = "";
    await addImages(files);
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  // ── Parse trigger ──────────────────────────────────────────────────────

  // Either text or at least one image is enough to attempt a parse.
  const hasInput = text.trim().length > 0 || images.length > 0;

  const runParse = async () => {
    if (!hasInput) return;
    // Snapshot the "sample" flag at click-time so the source tag we assign
    // reflects what the user actually parsed, not any state change that
    // might happen while the parse call is in flight.
    const wasSample = isSampleText;
    setLoading(true);
    setError(null);
    setJustAdded(null);
    try {
      const res = await authedFetch("/api/bets/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          today: new Date().toISOString().slice(0, 10),
          // Strip the "data:image/...;base64," prefix — Anthropic's API
          // wants the raw base64 plus a separate media_type field.
          images: images.map((img) => ({
            mediaType: img.mediaType,
            data: img.dataUrl.replace(/^data:[^;]+;base64,/, ""),
          })),
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? `HTTP ${res.status}`);
        return;
      }
      const parsed: ParsedBet[] = body.bets ?? [];
      if (parsed.length > 0) {
        // Auto-commit: skip the old review/confirm step that users were
        // forgetting to click. The Undo button in the success toast is
        // the escape hatch for "AI got it wrong".
        commit(parsed, wasSample);
      } else if ((body.issues ?? []).length > 0) {
        // Parser found nothing actionable — surface the issues as an
        // error so the input view isn't silently empty.
        const issues: string[] = body.issues;
        setError(
          `Couldn't extract a bet. ${issues.length} issue${issues.length === 1 ? "" : "s"}: ${issues
            .slice(0, 2)
            .join("; ")}${issues.length > 2 ? "…" : ""}`,
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  // Commit takes the parsed list directly (rather than reading from
  // bets-state) because runParse calls it immediately after a successful
  // parse — auto-commit, no review step. `fromSample` flags this batch
  // as originating from the untouched first-run sample tip so the
  // dashboard can bucket / clear them without touching real bets.
  const commit = (parsed: ParsedBet[], fromSample: boolean = false) => {
    if (parsed.length === 0) return;
    const sourceTag = fromSample ? SAMPLE_SOURCE_TAG : "manual:paste";
    const importedAt = new Date().toISOString();
    const out: ImportedBet[] = parsed.map((p) => {
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
        source: sourceTag,
        importedAt,
        raw: {},
      };
    });
    appendBets(out);
    const n = out.length;
    const ids = out.map((b) => b.id);
    // 30-second undo window — long enough to catch "wait, that's wrong"
    // but short enough not to feel like the bet is still pending.
    setJustAdded({ ids, count: n, expiresAt: Date.now() + 30_000 });
    setText("");
    setImages([]);
    setUndone(null);
    onCommitted?.(n);
  };

  // Undo the most recent auto-commit. Deletes each just-added bet by ID
  // (using the existing store helper, which tombstones + syncs the
  // remote delete). Shows a brief "Undone" confirmation.
  const undo = () => {
    if (!justAdded) return;
    const { ids, count } = justAdded;
    for (const id of ids) {
      deleteBet(id);
    }
    setJustAdded(null);
    setUndone(count);
    // Tell the parent to re-aggregate now that the bets are gone.
    onCommitted?.(0);
    // Hide the "Undone" confirmation after 4s.
    setTimeout(() => setUndone((cur) => (cur === count ? null : cur)), 4_000);
  };

  const reset = () => {
    setError(null);
    setJustAdded(null);
    setUndone(null);
  };

  // Drive the countdown. setInterval ticks every 500ms — enough resolution
  // that the seconds-remaining number never feels stuck, light enough not
  // to thrash. Once expiresAt is reached, clear justAdded so the undo
  // toast hides and the paste input returns.
  useEffect(() => {
    if (!justAdded) return;
    const tick = () => {
      const remainingMs = justAdded.expiresAt - Date.now();
      if (remainingMs <= 0) {
        setSecondsLeft(0);
        setJustAdded(null);
        return;
      }
      setSecondsLeft(Math.ceil(remainingMs / 1000));
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [justAdded]);

  // Fallback matches the first-run mockup — new accounts see "Default
  // book" until they've either used or created a real book.
  const bookName = activeBook?.name ?? "Default book";

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
  // Success state — bets auto-committed, 30s undo window active.

  if (justAdded != null) {
    return (
      <div className="paste-hero paste-hero--success">
        <span className="paste-hero-success-text">
          <span className="paste-hero-success-check">✓</span>
          <span>
            <strong>
              Logged {justAdded.count} bet{justAdded.count === 1 ? "" : "s"}
            </strong>{" "}
            to {bookName}.
            {/* Countdown timer in the toast — sets the expectation that the
                undo window is short, not the whole session. */}
            <span className="paste-hero-undo-timer">
              Undo available for {secondsLeft}s
            </span>
          </span>
        </span>
        <span className="paste-hero-success-actions">
          <button
            type="button"
            className="paste-hero-undo-btn"
            onClick={undo}
            title="Delete the bets I just logged"
          >
            ↺ Undo
          </button>
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
  // Brief "Undone" confirmation after the user reverses a commit.

  if (undone != null) {
    return (
      <div className="paste-hero paste-hero--success">
        <span className="paste-hero-success-text">
          <span className="paste-hero-success-check">↺</span>
          <span>
            <strong>
              Removed {undone} bet{undone === 1 ? "" : "s"}
            </strong>{" "}
            from {bookName}.
          </span>
        </span>
        <span className="paste-hero-success-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={reset}
            style={{ padding: "6px 14px", fontSize: 12.5 }}
          >
            Paste again
          </button>
        </span>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // (Review state removed — bets now auto-commit on parse, with the undo
  // toast above acting as the safety net. The old "Confirm & log" step
  // was being missed too often, leaving parsed bets unsaved.)

  // -------------------------------------------------------------------------
  // Default state — empty textarea ready for paste.
  //
  // onPaste is attached to the WHOLE card (not just the textarea) so an
  // image clipboard event fires even when focus isn't in the textarea.
  // The handler only intercepts image items; text falls through to the
  // textarea's native paste handling.

  return (
    <div className="paste-hero paste-hero--input" onPaste={onHeroPaste}>
      {eyebrow}

      <h2 className="paste-hero-title">
        Paste <em>anything.</em>
      </h2>
      <p className="paste-hero-subtitle">
        X posts, Telegram channels, Substack tips, paper notes, bookmaker
        copy-paste — <strong>or paste a screenshot directly</strong>. AI
        extracts every bet — date, market, odds, stake, result — ready to
        commit.
      </p>

      <textarea
        className="paste-hero-textarea"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          // Any edit invalidates the "this is the untouched sample"
          // flag — bets parsed from here should count as real.
          if (isSampleText) setIsSampleText(false);
        }}
        rows={5}
        placeholder={`Sunday
Barcelona vs Real Madrid · Barcelona -0.75 @ 1.79 · 2u (win)
Milan vs Atalanta · Atalanta +0.25 @ 2.00 · 2u (win)
…
or drop a screenshot of your bet slip / X post / Telegram tip in here.`}
        spellCheck={false}
      />

      {/* Thumbnail strip — only renders when at least one image is attached.
          Each thumb has its own ✕ to detach. Filename + size shown for
          quick "did the right image attach?" verification. */}
      {images.length > 0 && (
        <div className="paste-hero-thumbs">
          {images.map((img) => (
            <div key={img.id} className="paste-hero-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.dataUrl} alt={img.name} />
              <div className="paste-hero-thumb-meta">
                <span className="paste-hero-thumb-name" title={img.name}>
                  {img.name}
                </span>
                <span className="paste-hero-thumb-size">
                  {(img.bytes / 1024).toFixed(0)} KB
                </span>
              </div>
              <button
                type="button"
                className="paste-hero-thumb-x"
                onClick={() => removeImage(img.id)}
                aria-label={`Remove ${img.name}`}
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <div className="paste-hero-error">{error}</div>}

      <div className="paste-hero-footer">
        <span className="paste-hero-footer-actions">
          {/* Hidden file input + visible label/button. The button just
              triggers the input via ref.click() — the standard way to
              style file pickers without losing keyboard/click semantics. */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            style={{ display: "none" }}
            onChange={onFilePicked}
          />
          <button
            type="button"
            className="paste-hero-attach"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || images.length >= MAX_IMAGES}
            title={
              images.length >= MAX_IMAGES
                ? `Limit ${MAX_IMAGES} images`
                : "Attach a screenshot (or just Ctrl+V to paste one)"
            }
          >
            <PaperclipIcon />
            <span>
              {images.length === 0
                ? "Attach screenshot"
                : `${images.length}/${MAX_IMAGES} image${images.length === 1 ? "" : "s"}`}
            </span>
          </button>
          {/* Status line to the left of the Parse button. Reflects the
              auto-commit + 30s undo flow (see PasteHero: auto-commit
              + 30s undo toast commit). The old parlay-tip line was
              replaced when the ghost preview below the card started
              carrying the "here's what your dashboard becomes" nudge
              on its own. */}
          <span className="paste-hero-commit-status">
            Logs instantly — undo within 30 seconds
          </span>
        </span>
        <button
          type="button"
          className={`btn-primary${
            firstRun && isSampleText ? " paste-hero-firstrun-pulse" : ""
          }`}
          onClick={runParse}
          disabled={!hasInput || loading}
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

// Tiny inline paperclip icon for the attach button. Inline SVG so we don't
// pull in a whole icon dep for one glyph.
function PaperclipIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11.5 6.5 7 11a3 3 0 0 1-4.2-4.2l5-5a2 2 0 0 1 2.8 2.8L5.7 9.5a1 1 0 0 1-1.4-1.4l4.2-4.2" />
    </svg>
  );
}
