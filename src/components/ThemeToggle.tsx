"use client";

import { useEffect, useState } from "react";
import { loadSettings, saveSettings, type Theme } from "@/lib/settings";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  // Read once on mount. Avoids a hydration mismatch — the server can't know
  // the user's saved preference.
  useEffect(() => {
    setTheme(loadSettings().theme);
  }, []);

  const toggle = () => {
    if (theme == null) return;
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    saveSettings({ ...loadSettings(), theme: next });
  };

  // Render a placeholder of the right size on first paint to avoid layout shift.
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      title={theme == null ? "Theme" : `Switch to ${isDark ? "light" : "dark"} mode`}
      aria-label="Toggle theme"
      style={{
        width: 26,
        height: 26,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 5,
        color: "var(--text-muted)",
        border: "var(--border-w) solid transparent",
        background: "transparent",
        transition: "background 0.1s, color 0.1s, border-color 0.1s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--surface-2)";
        e.currentTarget.style.color = "var(--text)";
        e.currentTarget.style.borderColor = "var(--border-strong)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--text-muted)";
        e.currentTarget.style.borderColor = "transparent";
      }}
    >
      {theme == null ? null : isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <circle cx="7" cy="7" r="2.5" />
      <path d="M7 .8v1.6M7 11.6v1.6M.8 7h1.6M11.6 7h1.6M2.6 2.6l1.1 1.1M10.3 10.3l1.1 1.1M2.6 11.4l1.1-1.1M10.3 3.7l1.1-1.1" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    >
      <path d="M12 8.4A5 5 0 1 1 5.6 2a4.2 4.2 0 0 0 6.4 6.4z" />
    </svg>
  );
}
