// User display preferences. Persists in localStorage so settings survive
// reloads. When Supabase auth lands, this module is the swap-out point.

import type { DisplayUnit } from "@/components/UnitContext";

export type Theme = "light" | "dark";

export interface UserSettings {
  unit: DisplayUnit;
  theme: Theme;
}

const KEY = "aiw_settings_v1";

const DEFAULTS: UserSettings = {
  unit: "u",
  theme: "light",
};

export function loadSettings(): UserSettings {
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

export function saveSettings(s: UserSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
  // Apply theme immediately so it works across pages without a reload.
  document.documentElement.dataset.theme = s.theme;
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
