"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export function BookSwitcher() {
  const { user, books, activeBook, setActiveBook } = useAuth();
  const [open, setOpen] = useState(false);

  // Hide entirely when signed out — books only make sense for authed users.
  if (!user || books.length === 0) return null;

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 10px",
          borderRadius: 7,
          background: "var(--surface)",
          border: "var(--border-w) solid var(--border)",
          cursor: "pointer",
          textAlign: "left",
          color: "var(--text)",
          fontSize: 12.5,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-faint)",
            flexShrink: 0,
          }}
        >
          Book
        </span>
        <span
          style={{
            flex: 1,
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {activeBook?.name ?? "—"}
        </span>
        <svg
          width="11"
          height="11"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          style={{
            color: "var(--text-faint)",
            transform: open ? "rotate(180deg)" : undefined,
            transition: "transform 0.12s",
          }}
        >
          <path d="M3 5l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 40,
            background: "var(--surface)",
            border: "var(--border-w) solid var(--border-strong)",
            borderRadius: 8,
            boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
            padding: 4,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {books.map((b) => {
            const isActive = b.id === activeBook?.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  setActiveBook(b.id);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 5,
                  border: 0,
                  background: isActive ? "var(--surface-2)" : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 12.5,
                  color: "var(--text)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = "var(--surface-2)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ flex: 1, fontWeight: isActive ? 600 : 500 }}>
                  {b.name}
                </span>
                {isActive && (
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  >
                    <path d="M3 7l3 3 5-6" />
                  </svg>
                )}
              </button>
            );
          })}
          <div
            style={{
              height: 1,
              background: "var(--border)",
              margin: "2px 0",
            }}
          />
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              borderRadius: 5,
              fontSize: 12,
              color: "var(--text-muted)",
              textDecoration: "none",
            }}
          >
            <span style={{ fontSize: 13, lineHeight: 1, color: "var(--text-faint)" }}>
              +
            </span>
            <span>New book</span>
          </Link>
        </div>
      )}
    </div>
  );
}
