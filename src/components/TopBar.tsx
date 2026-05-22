"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ThemeToggle } from "./ThemeToggle";

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();

  // Global "n" shortcut → /bets/new. Plain key (no modifier) avoids
  // hijacking ⌘N which the browser uses for new windows. Ignore the key when
  // the user is typing into a form field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "n" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      const editable =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        t?.isContentEditable;
      if (editable) return;
      if (pathname === "/bets/new") return;
      e.preventDefault();
      router.push("/bets/new");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, pathname]);

  return (
    <div className="topbar">
      <div className="topbar-inner">
        <div
          className="search-trigger"
          role="button"
          style={{ minWidth: 320 }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <circle cx="6" cy="6" r="4" />
            <path d="M9 9l3 3" />
          </svg>
          <span>Search bets, fixtures, books…</span>
          <span style={{ flex: 1 }}></span>
          <span className="kbd">⌘K</span>
        </div>

        <div className="topbar-spacer"></div>

        <div className="topbar-actions">
          <Link
            href="/bets/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "var(--text-muted)",
              textDecoration: "none",
              fontSize: 12.5,
            }}
          >
            <span className="kbd">N</span>
            <span>New bet</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
