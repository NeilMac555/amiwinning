"use client";

// Shown on the dashboard when a signed-in user has zero bets logged.
// Without this, the dashboard would render with all-zero KPIs and an empty
// equity curve — looks broken on first sign-in.
//
// Three quick-start paths: paste (the wedge), import (existing tipsters
// with history), or manual single-bet (precision).

import Link from "next/link";
import { BRAND } from "@/lib/brand";

interface Props {
  displayName?: string;
}

export function EmptyDashboard({ displayName }: Props) {
  const greeting = displayName ? `Welcome, ${displayName}.` : `Welcome to ${BRAND.name}.`;
  return (
    <div className="empty-dashboard">
      <header className="empty-dashboard-hero">
        <h1 className="empty-dashboard-title">{greeting}</h1>
        <p className="empty-dashboard-sub">
          Log your first bet to start tracking. Your data syncs across devices and
          is exportable anytime.
        </p>
      </header>

      <div className="empty-dashboard-grid">
        <Link href="/bets/new?mode=paste" className="empty-card">
          <div className="empty-card-num">1</div>
          <div className="empty-card-title">Paste anything</div>
          <p className="empty-card-body">
            X posts, group-chat screenshots, Substack tips, bookmaker copy-paste.
            AI extracts date, market, odds, stake, result.
          </p>
          <span className="empty-card-cta">Open paster →</span>
        </Link>

        <Link href="/import" className="empty-card">
          <div className="empty-card-num">2</div>
          <div className="empty-card-title">Import a spreadsheet</div>
          <p className="empty-card-body">
            Already tracking in Google Sheets, Excel, or bettin.gs? Upload your
            CSV / XLSX. Known formats auto-map; everything else gets a
            guided column picker.
          </p>
          <span className="empty-card-cta">Open importer →</span>
        </Link>

        <Link href="/bets/new" className="empty-card">
          <div className="empty-card-num">3</div>
          <div className="empty-card-title">Log one manually</div>
          <p className="empty-card-body">
            Single-bet form with auto-detect markets, decimal/American odds
            conversion, and instant P/L calc.
          </p>
          <span className="empty-card-cta">Add a bet →</span>
        </Link>
      </div>

      <footer className="empty-dashboard-foot">
        <span>
          Curious what a populated profile looks like?{" "}
          <Link href="/u/neilmac555" style={{ color: "var(--blue)" }}>
            See a sample
          </Link>
          .
        </span>
      </footer>
    </div>
  );
}
