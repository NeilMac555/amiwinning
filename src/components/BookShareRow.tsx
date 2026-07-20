"use client";

// Compact per-book "share this publicly" control. Rendered under each
// book in Settings.
//
// Two independent choices, both stored on the books row:
//   1. isPublic         — does this book's data get exposed at all?
//   2. publicSlug        — what URL fragment goes in /u/<handle>/<slug>?
//
// Both must be set for the per-book profile route to serve anything;
// the server component's three-gate check hard-rejects otherwise. See
// getPublicProfileServerByBookSlug in src/lib/profiles.ts.
//
// The component pre-fills the slug from the book name (kebab-cased) on
// first open. Validation mirrors the DB check constraint so users get
// inline errors before any save round-trips.

import { useState } from "react";
import {
  suggestPublicSlug,
  updateBook,
  validatePublicSlug,
  type Book,
} from "@/lib/books";

interface Props {
  book: Book;
  /** The owning profile handle. Used only to render the preview URL
   *  next to the slug input; the URL is not clickable from Settings. */
  handle: string;
  /** True when the owning profile is public. When false, this component
   *  still lets the user pre-configure the book, but shows a note that
   *  the URL won't resolve until the profile itself is switched to
   *  public. Server-side RLS + fetcher enforce this too. */
  profileIsPublic: boolean;
  /** Called after a successful save so the parent can refetch books. */
  onSaved?: () => void;
}

export function BookShareRow({ book, handle, profileIsPublic, onSaved }: Props) {
  const [slugDraft, setSlugDraft] = useState<string>(
    book.publicSlug ?? suggestPublicSlug(book.name),
  );
  const [isPublicDraft, setIsPublicDraft] = useState<boolean>(book.isPublic);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<
    | { kind: "ok"; text: string }
    | { kind: "err"; text: string }
    | null
  >(null);

  const dirty =
    isPublicDraft !== book.isPublic ||
    (slugDraft || null) !== book.publicSlug;

  const inlineSlugError = isPublicDraft
    ? validatePublicSlug(slugDraft)
    : null;

  const onSave = async () => {
    if (saving) return;
    setSaving(true);
    setMsg(null);
    const patch = {
      isPublic: isPublicDraft,
      publicSlug: isPublicDraft ? slugDraft : null,
    };
    const result = await updateBook(book.id, patch);
    setSaving(false);
    if (result.ok) {
      setMsg({ kind: "ok", text: "Saved." });
      onSaved?.();
      setTimeout(() => setMsg(null), 2000);
    } else {
      setMsg({ kind: "err", text: result.error });
    }
  };

  const previewUrl = isPublicDraft && slugDraft && !inlineSlugError
    ? `amiup.io/u/${handle}/${slugDraft}`
    : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "8px 12px 10px",
        borderTop: "var(--border-w) dashed var(--border)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: "var(--text-muted)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={isPublicDraft}
            onChange={(e) => setIsPublicDraft(e.target.checked)}
          />
          <span>Share publicly</span>
        </label>

        {isPublicDraft && (
          <>
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                color: "var(--text-faint)",
              }}
            >
              amiup.io/u/{handle}/
            </span>
            <input
              type="text"
              value={slugDraft}
              onChange={(e) =>
                setSlugDraft(e.target.value.toLowerCase().trimStart())
              }
              placeholder="ylose-soccer"
              maxLength={32}
              style={{
                padding: "4px 8px",
                fontSize: 12,
                fontFamily: "var(--mono)",
                background: "var(--surface)",
                color: "var(--text)",
                border: `var(--border-w) solid ${
                  inlineSlugError ? "var(--red)" : "var(--border-strong)"
                }`,
                borderRadius: 4,
                minWidth: 140,
              }}
            />
          </>
        )}

        <button
          type="button"
          onClick={onSave}
          disabled={!dirty || saving || !!inlineSlugError}
          className="btn-ghost"
          data-active="true"
          style={{
            padding: "4px 10px",
            fontSize: 11,
            marginLeft: "auto",
            opacity: !dirty || !!inlineSlugError ? 0.4 : 1,
            cursor: !dirty || !!inlineSlugError ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving." : "Save"}
        </button>
      </div>

      {inlineSlugError && (
        <div
          style={{
            fontSize: 11,
            color: "var(--red)",
            fontFamily: "var(--mono)",
          }}
        >
          {inlineSlugError}
        </div>
      )}

      {!profileIsPublic && isPublicDraft && (
        <div
          style={{
            fontSize: 11,
            color: "var(--text-faint)",
            fontFamily: "var(--mono)",
          }}
        >
          Requires public profile. The URL will not resolve until your
          profile is set to Public.
        </div>
      )}

      {previewUrl && profileIsPublic && !msg && (
        <div
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            fontFamily: "var(--mono)",
          }}
        >
          shareable: {previewUrl}
        </div>
      )}

      {msg && (
        <div
          style={{
            fontSize: 11,
            color: msg.kind === "ok" ? "var(--green)" : "var(--red)",
            fontFamily: "var(--mono)",
          }}
        >
          {msg.text}
        </div>
      )}
    </div>
  );
}
