"use client";

// StatusMenu — the inline status control on the bet log.
//
// Renders the familiar status badge as a button. Clicking it opens a small
// menu of the seven statuses; picking one calls onChange and closes. The
// menu is position: fixed and anchored to the badge's bounding rect
// because the bet log table sits inside a card with overflow hidden, so an
// absolutely-positioned popover would be clipped on the last rows.
//
// Every click inside stops propagation: the table row it lives in
// navigates to the edit page on click, and the whole point of this
// control is to avoid that trip.

import { useEffect, useRef, useState } from "react";
import type { Status } from "@/lib/import/types";
import { STATUS_OPTIONS, statusLabel, statusTone } from "@/lib/bet-math";

interface Props {
  value: Status;
  onChange: (next: Status) => void;
  /** Optional accessible label suffix, e.g. the event name. */
  label?: string;
}

export function StatusMenu({ value, onChange, label }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const openMenu = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ top: r.bottom + 4, left: r.left });
    setOpen(true);
  };

  // Close on outside click, Escape, scroll, or resize. Scroll and resize
  // would otherwise leave a fixed-position menu floating away from its
  // badge. On close, focus returns to the badge so keyboard users don't
  // lose their place in the table.
  useEffect(() => {
    if (!open) return;
    // Focus the current status's item so Enter/Space act immediately and
    // arrow keys start from the right place.
    const items = menuRef.current?.querySelectorAll<HTMLButtonElement>("button");
    const current = Array.from(items ?? []).find((el) => el.dataset.active === "true");
    (current ?? items?.[0])?.focus();

    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    const onMove = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  // Arrow-key navigation inside the menu. Home/End jump to the ends;
  // Up/Down wrap. Enter and Space are handled natively by the buttons.
  const onMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [],
    );
    if (items.length === 0) return;
    const i = items.findIndex((el) => el === document.activeElement);
    let next = -1;
    if (e.key === "ArrowDown") next = (i + 1) % items.length;
    else if (e.key === "ArrowUp") next = (i - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next >= 0) {
      e.preventDefault();
      items[next].focus();
    }
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`badge status-pill ${statusTone(value)}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Change status${label ? ` for ${label}` : ""}, currently ${statusLabel(value)}`}
        title="Change status"
        onClick={(e) => {
          e.stopPropagation();
          if (open) setOpen(false);
          else openMenu();
        }}
      >
        {statusLabel(value)}
      </button>
      {open && pos && (
        <div
          ref={menuRef}
          className="status-menu"
          role="menu"
          style={{ top: pos.top, left: pos.left }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={onMenuKeyDown}
        >
          {STATUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              role="menuitemradio"
              aria-checked={o.value === value}
              data-active={o.value === value ? "true" : undefined}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                if (o.value !== value) onChange(o.value);
              }}
            >
              <span className={`dot ${o.tone}`} aria-hidden="true" />
              {o.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
