"use client";

// "Public profile" section on the Settings page. Lets the user:
//  - flip their profile public/private (default public — see migration 0003)
//  - pick a custom handle (auto-generated from email on signup, editable)
//  - set a display name + bio
//  - copy the shareable amiup.io/u/<handle> link
//
// The actual profile row lives in Supabase. Reads + writes go through
// src/lib/profiles.ts.

import { useEffect, useRef, useState } from "react";
import {
  loadMyProfile,
  isHandleAvailable,
  updateMyProfile,
  uploadMyAvatar,
  removeMyAvatar,
  validateHandle,
  type Profile,
} from "@/lib/profiles";
import { useAuth } from "@/lib/auth";
import { GeneratedAvatar } from "./GeneratedAvatar";

const SITE = "amiup.io";
const MAX_BIO = 200;
const MAX_NAME = 60;

export function ProfilePanel() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable mirror of the profile. We keep a local copy so the user can
  // type without firing a save on every keystroke.
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  // Handle availability state: "idle" before the user types, "checking"
  // while the debounced query is in flight, "ok"/"taken"/"invalid"
  // afterwards.
  const [handleState, setHandleState] = useState<
    "idle" | "checking" | "ok" | "taken" | "invalid"
  >("idle");
  const [handleError, setHandleError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );
  const [copied, setCopied] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial load.
  useEffect(() => {
    if (!user) {
      // Defer to next microtask — React 19's no-setState-in-effect rule
      // disallows the synchronous version. Behaviour identical.
      queueMicrotask(() => setLoading(false));
      return;
    }
    let cancelled = false;
    (async () => {
      const p = await loadMyProfile();
      if (cancelled) return;
      if (p) {
        setProfile(p);
        setHandle(p.handle);
        setDisplayName(p.displayName ?? "");
        setBio(p.bio ?? "");
        setIsPublic(p.isPublic);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Debounced handle-availability check. Runs whenever the typed handle
  // differs from the saved one. All sync setState defers via
  // queueMicrotask so React 19's set-state-in-effect rule is satisfied.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!profile) return;
    if (handle === profile.handle) {
      queueMicrotask(() => {
        setHandleState("idle");
        setHandleError(null);
      });
      return;
    }
    const validationError = validateHandle(handle);
    if (validationError) {
      queueMicrotask(() => {
        setHandleState("invalid");
        setHandleError(validationError);
      });
      return;
    }
    queueMicrotask(() => {
      setHandleState("checking");
      setHandleError(null);
    });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const ok = await isHandleAvailable(handle, profile.userId);
      setHandleState(ok ? "ok" : "taken");
      setHandleError(ok ? null : "Already taken.");
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [handle, profile]);

  // The dirty flag — true if any local field differs from the saved profile.
  const dirty =
    profile != null &&
    (handle !== profile.handle ||
      displayName !== (profile.displayName ?? "") ||
      bio !== (profile.bio ?? "") ||
      isPublic !== profile.isPublic);

  const canSave =
    dirty &&
    !saving &&
    (handleState === "idle" || handleState === "ok") &&
    handleError == null;

  const onSave = async () => {
    if (!profile || !canSave) return;
    setSaving(true);
    setSaveMsg(null);
    const patch = {
      handle: handle !== profile.handle ? handle : undefined,
      isPublic: isPublic !== profile.isPublic ? isPublic : undefined,
      displayName:
        displayName !== (profile.displayName ?? "")
          ? displayName.trim() || null
          : undefined,
      bio: bio !== (profile.bio ?? "") ? bio.trim() || null : undefined,
    };
    const result = await updateMyProfile(patch);
    if (result.error) {
      setSaveMsg({ kind: "err", text: result.error });
    } else if (result.profile) {
      setProfile(result.profile);
      setSaveMsg({ kind: "ok", text: "Saved." });
      setTimeout(() => setSaveMsg(null), 1500);
    }
    setSaving(false);
  };

  const onPickAvatar = () => fileInputRef.current?.click();

  const onAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so picking the same file again still fires
    if (!file || !profile) return;
    setAvatarBusy(true);
    setAvatarError(null);
    const result = await uploadMyAvatar(file);
    if (result.error) {
      setAvatarError(result.error);
    } else if (result.url) {
      setProfile({ ...profile, avatarUrl: result.url });
    }
    setAvatarBusy(false);
  };

  const onRemoveAvatar = async () => {
    if (!profile) return;
    setAvatarBusy(true);
    setAvatarError(null);
    const result = await removeMyAvatar();
    if (result.error) {
      setAvatarError(result.error);
    } else {
      setProfile({ ...profile, avatarUrl: null });
    }
    setAvatarBusy(false);
  };

  const shareUrl =
    profile && profile.isPublic ? `https://${SITE}/u/${profile.handle}` : null;

  const onCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be blocked; ignore.
    }
  };

  if (!user) {
    return (
      <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
        Sign in to set up your public profile.
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ fontSize: 12, color: "var(--text-faint)" }}>
        Loading profile…
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ fontSize: 12.5, color: "var(--red)" }}>
        Profile row missing. Try signing out and back in.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Avatar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "8px 0",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 10,
            overflow: "hidden",
            position: "relative",
            border: "var(--border-w) solid var(--border)",
            background: "var(--surface)",
            flexShrink: 0,
          }}
        >
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <GeneratedAvatar
              handle={profile.handle}
              displayName={profile.displayName}
              size={72}
              style={{ borderRadius: 0 }}
            />
          )}
          {avatarBusy && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                color: "white",
                fontSize: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              …
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={onPickAvatar}
              disabled={avatarBusy}
              className="btn-ghost"
              style={{ padding: "6px 12px", fontSize: 12 }}
            >
              {profile.avatarUrl ? "Change photo" : "Upload photo"}
            </button>
            {profile.avatarUrl && (
              <button
                type="button"
                onClick={onRemoveAvatar}
                disabled={avatarBusy}
                className="btn-ghost"
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                Remove
              </button>
            )}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>
            JPG, PNG, or WebP. Resized to 512×512 on upload.
          </div>
          {avatarError && (
            <div style={{ fontSize: 11.5, color: "var(--red)" }}>
              {avatarError}
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onAvatarFile}
          style={{ display: "none" }}
        />
      </div>

      {/* Public toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 12px",
          borderRadius: 6,
          border: "var(--border-w) solid var(--border)",
          background: isPublic ? "var(--green-bg)" : "var(--surface)",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {isPublic ? "Profile is public" : "Profile is private"}
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: "var(--text-muted)",
              marginTop: 2,
            }}
          >
            {isPublic
              ? "Anyone with the link can see your lifetime stats and equity curve. Individual bets are never shared."
              : "Only you can see your stats. The shareable link returns 404."}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsPublic((v) => !v)}
          style={{
            width: 40,
            height: 22,
            borderRadius: 11,
            background: isPublic ? "var(--green)" : "var(--border-strong)",
            border: 0,
            position: "relative",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          aria-label="Toggle profile visibility"
        >
          <span
            style={{
              position: "absolute",
              top: 2,
              left: isPublic ? 20 : 2,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "white",
              transition: "left 0.15s",
              boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
            }}
          />
        </button>
      </div>

      {/* Handle */}
      <Field
        label="Handle"
        hint={`The end of your shareable URL: ${SITE}/u/<handle>. Lowercase letters, digits, underscores. 2–32 chars.`}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            border: `var(--border-w) solid ${
              handleState === "taken" || handleState === "invalid"
                ? "var(--red)"
                : "var(--border)"
            }`,
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <span
            style={{
              padding: "9px 10px 9px 12px",
              fontFamily: "var(--mono)",
              fontSize: 12,
              color: "var(--text-faint)",
              background: "var(--surface-2)",
              borderRight: "var(--border-w) solid var(--border)",
            }}
          >
            {SITE}/u/
          </span>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase())}
            style={{
              flex: 1,
              padding: "9px 12px",
              fontSize: 13,
              fontFamily: "var(--mono)",
              background: "transparent",
              border: 0,
              outline: "none",
            }}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
          <span style={{ paddingRight: 10, fontSize: 11 }}>
            {handleState === "checking" && (
              <span style={{ color: "var(--text-faint)" }}>checking…</span>
            )}
            {handleState === "ok" && (
              <span style={{ color: "var(--green)" }}>✓ available</span>
            )}
          </span>
        </div>
        {handleError && (
          <div
            style={{
              fontSize: 11,
              color: "var(--red)",
              marginTop: 4,
            }}
          >
            {handleError}
          </div>
        )}
      </Field>

      {/* Display name */}
      <Field
        label="Display name"
        hint="Optional. Shown above your stats on the public page. Defaults to your handle."
      >
        <input
          value={displayName}
          onChange={(e) =>
            setDisplayName(e.target.value.slice(0, MAX_NAME))
          }
          placeholder={profile.handle}
          style={inputStyle}
        />
      </Field>

      {/* Bio */}
      <Field
        label="Bio"
        hint={`Optional. ${MAX_BIO} characters max.`}
      >
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO))}
          placeholder="Tennis CLV-focused. ATP only. Pinnacle close as benchmark."
          rows={3}
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.45 }}
        />
        <div
          style={{
            textAlign: "right",
            fontSize: 10.5,
            color: "var(--text-faint)",
            fontFamily: "var(--mono)",
            marginTop: 2,
          }}
        >
          {bio.length}/{MAX_BIO}
        </div>
      </Field>

      {/* Save + share row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          marginTop: 4,
        }}
      >
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="btn-primary"
          style={{
            padding: "8px 16px",
            fontSize: 13,
            opacity: canSave ? 1 : 0.5,
            cursor: canSave ? "pointer" : "not-allowed",
          }}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>

        {shareUrl && (
          <>
            <button
              type="button"
              onClick={onCopy}
              className="btn-ghost"
              style={{ padding: "8px 14px", fontSize: 12.5 }}
            >
              {copied ? "Copied ✓" : "Copy share link"}
            </button>
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 11.5,
                color: "var(--text-muted)",
                fontFamily: "var(--mono)",
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              {shareUrl.replace("https://", "")}
            </a>
          </>
        )}

        {saveMsg && (
          <span
            style={{
              fontSize: 11.5,
              color: saveMsg.kind === "ok" ? "var(--green)" : "var(--red)",
              marginLeft: "auto",
            }}
          >
            {saveMsg.text}
          </span>
        )}
      </div>
    </div>
  );
}

// ─ Local building blocks ──────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  fontSize: 13,
  border: "var(--border-w) solid var(--border)",
  borderRadius: 6,
  background: "var(--surface)",
  color: "var(--text)",
  outline: "none",
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
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
        }}
      >
        {label}
      </span>
      {hint && (
        <span style={{ fontSize: 11.5, color: "var(--text-faint)" }}>
          {hint}
        </span>
      )}
      {children}
    </label>
  );
}
