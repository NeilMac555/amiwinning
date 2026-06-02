"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { isAdminEmail } from "@/lib/admin";
import { useMobileNav } from "@/lib/mobile-nav";
import { BookSwitcher } from "./BookSwitcher";
import { SyncStatus } from "./SyncStatus";
import { UserMenu } from "./UserMenu";

interface ItemProps {
  label: string;
  href?: string;
  count?: string;
  icon: ReactNode;
  active?: boolean;
}

function Item({ label, href, count, icon, active }: ItemProps) {
  const content = (
    <>
      {icon}
      <span>{label}</span>
      {count != null && <span className="sb-count">{count}</span>}
    </>
  );
  const className = "sb-item";
  if (href) {
    return (
      <Link
        href={href}
        className={className}
        data-active={active ? "true" : undefined}
      >
        {content}
      </Link>
    );
  }
  return (
    <div className={className} data-active={active ? "true" : undefined}>
      {content}
    </div>
  );
}

function ic(paths: ReactNode) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      {paths}
    </svg>
  );
}

export function Sidebar() {
  const path = usePathname();
  const is = (p: string) => path === p;
  const { user } = useAuth();
  const { isOpen, close } = useMobileNav();

  return (
    <>
      {/* Backdrop — invisible on desktop, dims the page on mobile when the
          drawer is open. Tapping it closes the drawer. */}
      <div
        className="sb-backdrop"
        data-open={isOpen ? "true" : undefined}
        onClick={close}
        aria-hidden="true"
      />
      <aside className="sidebar" data-mobile-open={isOpen ? "true" : undefined}>
      <div className="sb-brand">
        <div className="brand-mark" aria-hidden="true"></div>
        {BRAND.name}
      </div>

      {/* UserMenu: the clickable account row that opens a popover with
          share link + theme picker + inline name/bio editor. Previously
          all of that was buried in Settings. */}
      <UserMenu />

      <BookSwitcher />

      <div className="sb-section">
        <div className="sb-heading">Workspace</div>
        <Item
          label="Dashboard"
          href="/"
          active={is("/")}
          icon={ic(
            <>
              <rect x="1.5" y="1.5" width="5" height="5" />
              <rect x="7.5" y="1.5" width="5" height="5" />
              <rect x="1.5" y="7.5" width="5" height="5" />
              <rect x="7.5" y="7.5" width="5" height="5" />
            </>,
          )}
        />
        <Item
          label="New bet"
          href="/bets/new"
          active={is("/bets/new")}
          icon={ic(
            <>
              <path d="M7 2.5v9M2.5 7h9" />
            </>,
          )}
        />
        <Item
          label="Bet log"
          href="/bets"
          active={is("/bets") || (path?.startsWith("/bets/") && path !== "/bets/new")}
          icon={ic(
            <>
              <path d="M2 3h10M2 7h10M2 11h10" />
            </>,
          )}
        />
        <Item
          label="Import data"
          href="/import"
          active={is("/import")}
          icon={ic(
            <>
              <path d="M7 1v8M3.5 5.5L7 9l3.5-3.5M2 12h10" />
            </>,
          )}
        />
        <Item
          label="Analytics"
          href="/analytics"
          active={is("/analytics")}
          icon={ic(
            <>
              <path d="M1.5 12V2M1.5 12h11" />
              <path d="M3 9l3-3 3 2 3-5" />
            </>,
          )}
        />
      </div>

      <div className="sb-spacer"></div>
      <div className="sb-section">
        {isAdminEmail(user?.email) && (
          <Item
            label="Admin"
            href="/admin"
            active={is("/admin")}
            icon={ic(
              <>
                <circle cx="7" cy="7" r="5.5" />
                <path d="M7 4v3l2 2" />
              </>,
            )}
          />
        )}
        <Item
          label="Settings"
          href="/settings"
          active={is("/settings")}
          icon={ic(
            <>
              <circle cx="7" cy="7" r="2.5" />
              <path d="M7 .5v2M7 11.5v2M.5 7h2M11.5 7h2M2 2l1.5 1.5M10.5 10.5L12 12M2 12l1.5-1.5M10.5 3.5L12 2" />
            </>,
          )}
        />
      </div>
      <SyncStatus />
      <div className="sb-foot">
        <span>v0.4.5</span>
        <span>UTC+01</span>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          padding: "4px 4px 0",
          fontSize: 10,
          color: "var(--text-faint)",
          fontFamily: "var(--mono)",
          letterSpacing: "0.04em",
        }}
      >
        <Link
          href="/terms"
          style={{ color: "inherit", textDecoration: "none" }}
        >
          Terms
        </Link>
        <Link
          href="/privacy"
          style={{ color: "inherit", textDecoration: "none" }}
        >
          Privacy
        </Link>
      </div>
      </aside>
    </>
  );
}
