// User display preferences. Persists in localStorage so settings survive
// reloads. When Supabase auth lands, this module is the swap-out point.
//
// Theme handling: as of the terminal-theme merge, terminal-dark is the
// ONLY theme. Palette lives in :root in globals.css. The apply*Theme
// helpers no longer set data-theme on <html>; they strip any legacy
// attribute so a stale localStorage value can't override :root.

import { useSyncExternalStore } from "react";
import type { DisplayUnit } from "@/components/UnitContext";

export type Theme = "terminal-dark";

export interface UserSettings {
  unit: DisplayUnit;
  theme: Theme;
}

const KEY = "aiw_settings_v1";

const DEFAULTS: UserSettings = {
  unit: "u",
  theme: "terminal-dark",
};

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
      theme: DEFAULTS.theme,
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
  cachedSnapshot = s;
  snapshotInitialised = true;
  notify();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useSettings(): UserSettings {
  return useSyncExternalStore(subscribe, ensureSnapshot, () => DEFAULTS);
}

/** Strip any legacy data-theme attribute so :root (terminal-dark) wins.
 *  Called from every page effect; safe to invoke on marketing surfaces too. */
export function applyTheme(): void {
  if (typeof window === "undefined") return;
  delete document.documentElement.dataset.theme;
}

/** Alias kept so existing call-sites don't need to change. Same behaviour
 *  as applyTheme() now that terminal-dark is the only theme. */
export function applyThemeForSignedIn(): void {
  applyTheme();
}
