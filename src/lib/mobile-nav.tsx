"use client";

// Mobile-nav state. The sidebar collapses into a slide-in drawer below the
// mobile breakpoint (see globals.css ~900px). This context owns the open/
// closed state, exposes a toggle for the TopBar's hamburger, and closes the
// drawer automatically on route change so taps on nav items "just work."

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";

interface MobileNavValue {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const Ctx = createContext<MobileNavValue>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
});

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  const close = useCallback(() => setIsOpen(false), []);

  // Close the drawer whenever the route changes. The user just tapped a nav
  // item — they want to see the page they landed on, not the drawer still
  // covering it. queueMicrotask defers the setState past the effect body
  // so React 19's set-state-in-effect rule is satisfied.
  useEffect(() => {
    queueMicrotask(() => setIsOpen(false));
  }, [pathname]);

  // Disable body scroll while the drawer is open. Without this, scrolling
  // the drawer also scrolls the underlying page on iOS.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  const value = useMemo(() => ({ isOpen, toggle, close }), [isOpen, toggle, close]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMobileNav() {
  return useContext(Ctx);
}
