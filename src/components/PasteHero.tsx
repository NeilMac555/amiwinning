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

import { useRef, useState } from "react";
import Link from "next/link";
import { appendBets } from "@/lib/import/store";
import type { ImportedBet, MarketGuess, Status } from "@/lib/import/types";
import { useAuth } from "@/lib/auth";
import { authedFetch } from "@/lib/authed-fetch";
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

export function PasteHero({ onCommitted }: Props) {
  const { activeBook } = useAuth();
  const unit = useUnit();
  const [text, setText] = useState("");
  const [images, setImages] = useState<AttachedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bets, setBets] = useState<ParsedBet[] | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [justAdded, setJustAdded] = useState<number | null>(null);
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
    setLoading(true);
    setError(null);
    setBets(null);
    setIssues([]);
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
        onChange={(e) => setText(e.target.value)}
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
          <span className="paste-hero-tip">
            Tip: prefix parlays with <code>Double:</code> or{" "}
            <code>Treble:</code>
          </span>
        </span>
        <button
          type="button"
          className="btn-primary"
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
