// User display preferences. Persists in localStorage so settings survive
// reloads. When Supabase auth lands, this module is the swap-out point.

import { useSyncExternalStore } from "react";
import type { DisplayUnit } from "@/components/UnitContext";

export type Theme =
  | "light"
  | "dark"
  | "terminal"
  | "terminal-dark"
  | "newspaper"
  | "solar"
  | "slate";

/** Themes whose color-scheme is dark (light text on dark background).
 *  Used by ThemeToggle so its sun/moon icon and toggle target stay correct
 *  even when the user picks Terminal or Slate via the Settings picker. */
export const DARK_SCHEME_THEMES: ReadonlySet<Theme> = new Set([
  "dark",
  "terminal",
  "terminal-dark",
  "slate",
]);

/** Identifier of the theme that new signed-in surfaces default to
 *  when the user has no explicit saved preference. Legacy themes and
 *  the marketing / signed-out surfaces are unaffected. */
export const SIGNED_IN_DEFAULT_THEME: Theme = "terminal-dark";

export interface UserSettings {
  unit: DisplayUnit;
  theme: Theme;
}

const KEY = "aiw_settings_v1";

const DEFAULTS: UserSettings = {
  unit: "u",
  theme: "light",
};

// In-memory mirror of what's in localStorage. Used as the stable snapshot
// for useSyncExternalStore — without this, getSnapshot() would allocate a
// fresh object every render and React would think the value changed.
let cachedSnapshot: UserSettings = DEFAULTS;
let snapshotInitialised = false;

const listeners = new Set<() => void>();

function readFromStorage(): UserSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return {
      unit: parsed.unit ?? DEFAULTS.unit,
      theme: parsed.theme ?? DEFAULTS.theme,
    };
  } catch {
    return DEFAULTS;
  }
}

function ensureSnapshot(): UserSettings {
  if (!snapshotInitialised && typeof window !== "undefined") {
    cachedSnapshot = readFromStorage();
    snapshotInitialised = true;
  }
  return cachedSnapshot;
}

function notify(): void {
  for (const cb of listeners) cb();
}

export function loadSettings(): UserSettings {
  return ensureSnapshot();
}

export function saveSettings(s: UserSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
  // Apply theme immediately so it works across pages without a reload.
  document.documentElement.dataset.theme = s.theme;
  // Update the in-memory snapshot + wake every subscriber so useSettings()
  // returns the new value on the next render.
  cachedSnapshot = s;
  snapshotInitialised = true;
  notify();
}

// useSyncExternalStore subscription. Called whenever a consumer mounts.
function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

// React 19's preferred way to consume a client-only store. The third argument
// (server snapshot) ensures SSR renders the same defaults the client uses on
// first paint, so hydration matches and no setState-in-effect is needed.
//
// Use this from any component that needs the current unit / theme. Updates
// are pushed automatically when saveSettings() is called from anywhere.
export function useSettings(): UserSettings {
  return useSyncExternalStore(subscribe, ensureSnapshot, () => DEFAULTS);
}

/**
 * Apply persisted theme to the document. Call from a client effect on every
 * page that should respect the setting.
 *
 * Used by signed-out and marketing pages (sign-in, terms, learn, compare).
 * The default fallback (when no explicit preference is saved) is "light",
 * matching the historical behaviour so those surfaces keep their cream
 * appearance regardless of the terminal-dark rollout.
 */
export function applyTheme(): void {
  if (typeof window === "undefined") return;
  const s = loadSettings();
  document.documentElement.dataset.theme = s.theme;
}

/**
 * Apply the theme for a signed-in surface (dashboard, bet log, analytics,
 * pending futures, settings, import, admin).
 *
 * If the user has an explicit saved theme, honour it — a user who picked
 * Newspaper stays on Newspaper. Otherwise fall back to
 * SIGNED_IN_DEFAULT_THEME ("terminal-dark") rather than the historical
 * "light" default.
 *
 * Detects "explicit saved theme" by inspecting the raw localStorage entry
 * so we can distinguish "no settings saved" from "settings saved without a
 * theme key" — both are treated as no-preference and take the new default.
 */
export function applyThemeForSignedIn(): void {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(KEY);
  let explicit: Theme | undefined;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<UserSettings>;
      if (parsed.theme) explicit = parsed.theme;
    } catch {
      // Fall through — malformed JSON is treated as no saved theme.
    }
  }
  document.documentElement.dataset.theme =
    explicit ?? SIGNED_IN_DEFAULT_THEME;
}
