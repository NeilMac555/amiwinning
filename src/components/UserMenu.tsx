"use client";

// UserMenu — the popover behind the sidebar account row.
//
// Neil flagged that three things were buried inside the Settings page:
//   1. Sharing the public profile (the link he wants to drop in his X bio)
//   2. Switching theme (the 6-theme picker, not just light/dark)
//   3. Editing display name + bio
//
// All three live here now, one click from any page. The avatar + handle row
// at the top of the sidebar becomes the menu trigger. Settings is still the
// place for the deep stuff (avatar upload, custom handle, visibility,
// books, data export) — the menu links over there at the bottom.
//
// Implementation notes:
// - The popover is `position: fixed` and anchored to the trigger's
//   bounding rect on open. That avoids any clipping from the sidebar's
//   sticky/fixed positioning context.
// - Bio + display name save inline via updateMyProfile. Theme writes
//   through saveSettings (instant re-skin, no save button).
// - Profile is loaded once on first open and cached for the session.
// - For signed-out users the trigger renders as a normal sign-in link
//   (no menu).

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  DARK_SCHEME_THEMES,
  saveSettings,
  useSettings,
  type Theme,
} from "@/lib/settings";
import {
  loadMyProfile,
  updateMyProfile,
  type Profile,
} from "@/lib/profiles";
import { GeneratedAvatar } from "./GeneratedAvatar";

const SITE = "amiup.io";
const MAX_BIO = 200;
const MAX_NAME = 60;

// Mirrors the Settings page's THEME_OPTIONS exactly. Kept in sync manually
// — both lists live next to the [data-theme] palette blocks in globals.css.
const THEMES: Array<{
  value: Theme;
  label: string;
  swatch: [string, string, string];
}> = [
  { value: "light", label: "Light", swatch: ["#F1F0EB", "#0A0A0A", "#0F6E56"] },
  { value: "dark", label: "Dark", swatch: ["#0A0A09", "#F2F2EE", "#4FB494"] },
  {
    value: "terminal",
    label: "Terminal",
    swatch: ["#050805", "#5FE19E", "#FFB546"],
  },
  {
    value: "newspaper",
    label: "Newspaper",
    swatch: ["#F1E1D0", "#1A1612", "#B92434"],
  },
  { value: "solar", label: "Solar", swatch: ["#FAF3E3", "#2A1F12", "#5A8A3C"] },
  { value: "slate", label: "Slate", swatch: ["#1B1F24", "#E6EBF0", "#4D9DFF"] },
];

export function UserMenu() {
  const { user, configured, signOut } = useAuth();
  const settings = useSettings();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ left: number; top: number } | null>(
    null,
  );

  // Profile data — loaded lazily on first menu open, kept in state for the
  // session. Settings page edits will be visible here only after sign-out/in
  // or refresh; that's fine because the menu is the day-to-day surface and
  // the Settings page is the rare deep-edit case.
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ─ Open / close handling ─────────────────────────────────────────────────

  const openMenu = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      // Position to the right of the sidebar, slightly inset from the
      // trigger's top edge so the popover header lines up nicely. On
      // mobile (sidebar full-width), this still lands on-screen.
      setAnchor({
        left: Math.min(rect.right + 8, window.innerWidth - 360),
        top: Math.max(8, rect.top),
      });
    }
    setOpen(true);
  }, []);

  // Close on click-outside.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (
        popoverRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Lazy-load profile on first open. The synchronous setState is deferred
  // via queueMicrotask so React 19's no-set-state-in-effect rule is happy
  // (same pattern used elsewhere in this codebase — see ProfilePanel).
  useEffect(() => {
    if (!open || profile || loadingProfile || !user) return;
    queueMicrotask(() => setLoadingProfile(true));
    void loadMyProfile().then((p) => {
      if (p) {
        setProfile(p);
        setName(p.displayName ?? "");
        setBio(p.bio ?? "");
      }
      setLoadingProfile(false);
    });
  }, [open, profile, loadingProfile, user]);

  // ─ Signed-out: render a plain sign-in link instead of a menu ─────────────

  if (!user) {
    return (
      <Link
        href="/sign-in"
        className="sb-account sb-account--link"
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <div
          className="avatar"
          style={{
            background: "var(--surface-2)",
            color: "var(--text-muted)",
          }}
        >
          ?
        </div>
        <div className="meta">
          <b>Not signed in</b>
          <span>{configured ? "Sign in to sync" : "Local mode"}</span>
        </div>
        <svg
          className="chev"
          width="12"
          height="12"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <path d="M5 3l4 4-4 4" />
        </svg>
      </Link>
    );
  }

  // ─ Signed-in: the menu trigger + popover ─────────────────────────────────

  const email = user.email ?? "";
  const fallbackHandle = email.split("@")[0] || "you";
  const handle = profile?.handle ?? fallbackHandle;
  const displayLabel = profile?.displayName || handle;
  const initials = (profile?.displayName || handle)
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 2)
    .toUpperCase() || "·";
  const shareUrl =
    profile && profile.isPublic ? `https://${SITE}/u/${profile.handle}` : null;

  const nameDirty = (profile?.displayName ?? "") !== name;
  const bioDirty = (profile?.bio ?? "") !== bio;
  const dirty = nameDirty || bioDirty;

  const onSaveProfile = async () => {
    if (!profile || !dirty || savingProfile) return;
    setSavingProfile(true);
    setSaveError(null);
    const result = await updateMyProfile({
      displayName: nameDirty ? name.trim() || null : undefined,
      bio: bioDirty ? bio.trim() || null : undefined,
    });
    if (result.error) {
      setSaveError(result.error);
    } else if (result.profile) {
      setProfile(result.profile);
    }
    setSavingProfile(false);
  };

  const onCopyShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can be blocked — silently ignore.
    }
  };

  const onPickTheme = (value: Theme) => {
    saveSettings({ ...settings, theme: value });
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="sb-account sb-account--button"
        data-open={open ? "true" : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        title="Open profile menu"
      >
        <div className="avatar" aria-hidden="true">
          {profile?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            initials
          )}
        </div>
        <div className="meta">
          <b>{displayLabel}</b>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            @{handle}
          </span>
        </div>
        <svg
          className="chev"
          width="10"
          height="10"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          style={{
            transform: open ? "rotate(90deg)" : "none",
            transition: "transform 0.12s",
          }}
        >
          <path d="M5 3l4 4-4 4" />
        </svg>
      </button>

      {open && anchor && (
        <div
          ref={popoverRef}
          className="user-menu"
          role="menu"
          style={{ left: anchor.left, top: anchor.top }}
        >
          {/* Header — bigger avatar + name/handle */}
          <div className="user-menu-head">
            <div className="user-menu-avatar">
              {profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : profile ? (
                <GeneratedAvatar
                  handle={profile.handle}
                  displayName={profile.displayName}
                  size={48}
                  style={{ borderRadius: 0 }}
                />
              ) : (
                <span style={{ fontSize: 16, fontWeight: 600 }}>{initials}</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-menu-name">{displayLabel}</div>
              <div className="user-menu-handle">@{handle}</div>
            </div>
          </div>

          {/* Share — the headline action. Big copy button + view link. */}
          <div className="user-menu-section">
            <div className="user-menu-label">Public profile</div>
            {loadingProfile ? (
              <div className="user-menu-loading">Loading…</div>
            ) : profile?.isPublic && shareUrl ? (
              <>
                <div className="user-menu-share">
                  <span className="user-menu-share-url">
                    {shareUrl.replace("https://", "")}
                  </span>
                  <button
                    type="button"
                    onClick={onCopyShare}
                    className="user-menu-copy"
                    title="Copy to clipboard"
                  >
                    {copied ? "Copied ✓" : "Copy link"}
                  </button>
                </div>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="user-menu-row-link"
                >
                  <span>View public profile</span>
                  <ExtIcon />
                </a>
              </>
            ) : (
              <div className="user-menu-hint">
                Your profile is private.{" "}
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  style={{ color: "var(--text)" }}
                >
                  Turn it on in Settings →
                </Link>
              </div>
            )}
          </div>

          {/* Inline edit — display name + bio */}
          <div className="user-menu-section">
            <div className="user-menu-label">Display name & bio</div>
            <input
              type="text"
              value={name}
              maxLength={MAX_NAME}
              onChange={(e) => setName(e.target.value.slice(0, MAX_NAME))}
              placeholder={handle}
              className="user-menu-input"
              spellCheck={false}
            />
            <textarea
              value={bio}
              maxLength={MAX_BIO}
              onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO))}
              placeholder="Tennis CLV-focused. ATP only. Pinnacle close as benchmark."
              className="user-menu-textarea"
              rows={3}
            />
            <div className="user-menu-meta-row">
              <span className="user-menu-counter">
                {bio.length}/{MAX_BIO}
              </span>
              {saveError && (
                <span style={{ color: "var(--red)", fontSize: 11 }}>
                  {saveError}
                </span>
              )}
              <button
                type="button"
                onClick={onSaveProfile}
                disabled={!dirty || savingProfile || !profile}
                className="user-menu-save"
                data-dirty={dirty ? "true" : undefined}
              >
                {savingProfile ? "Saving…" : dirty ? "Save" : "Saved"}
              </button>
            </div>
          </div>

          {/* Theme picker — six swatches, click to apply instantly. */}
          <div className="user-menu-section">
            <div className="user-menu-label">Theme</div>
            <div className="user-menu-themes">
              {THEMES.map((t) => {
                const isActive = settings.theme === t.value;
                const isDark = DARK_SCHEME_THEMES.has(t.value);
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => onPickTheme(t.value)}
                    className="user-menu-theme"
                    data-active={isActive ? "true" : undefined}
                    title={`${t.label}${isDark ? " (dark)" : ""}`}
                  >
                    <span
                      className="user-menu-theme-swatch"
                      aria-hidden="true"
                    >
                      <span style={{ background: t.swatch[0] }} />
                      <span style={{ background: t.swatch[1] }} />
                      <span style={{ background: t.swatch[2] }} />
                    </span>
                    <span className="user-menu-theme-label">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer — link to full Settings + sign out */}
          <div className="user-menu-foot">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="user-menu-foot-link"
            >
              <SettingsIcon />
              <span>Full settings · handle, avatar, books, export</span>
            </Link>
            <div className="user-menu-foot-row">
              <span className="user-menu-email" title={email}>
                {email}
              </span>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void signOut();
                }}
                className="user-menu-signout"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─ Small inline icons ──────────────────────────────────────────────────────

function ExtIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <path d="M5 3H3v8h8V9M8 3h3v3M11 3L6 8" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <circle cx="7" cy="7" r="2.5" />
      <path d="M7 .5v2M7 11.5v2M.5 7h2M11.5 7h2M2 2l1.5 1.5M10.5 10.5L12 12M2 12l1.5-1.5M10.5 3.5L12 2" />
    </svg>
  );
}
