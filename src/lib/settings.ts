// User display preferences. Persists in localStorage so settings survive
// reloads. When Supabase auth lands, this module is the swap-out point.

import { useSyncExternalStore } from "react";
import type { DisplayUnit } from "@/components/UnitContext";

export type Theme =
  | "light"
  | "dark"
  | "terminal"
  | "newspaper"
  | "solar"
  | "slate";

/** Themes whose color-scheme is dark (light text on dark background).
 *  Used by ThemeToggle so its sun/moon icon and toggle target stay correct
 *  even when the user picks Terminal or Slate via the Settings picker. */
export const DARK_SCHEME_THEMES: ReadonlySet<Theme> = new Set([
  "dark",
  "terminal",
  "slate",
]);

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
 */
export function applyTheme(): void {
  if (typeof window === "undefined") return;
  const s = loadSettings();
  document.documentElement.dataset.theme = s.theme;
}
