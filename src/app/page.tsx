"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildAll, NOW, type DashboardData } from "@/lib/data";
import { aggregateFromBets } from "@/lib/aggregate";
import { consumeSeed, loadBets } from "@/lib/import/store";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { Ticker } from "@/components/Ticker";
import { KpiStripCompact } from "@/components/Kpis";
import { SecondaryStats } from "@/components/SecondaryStats";
import { EquityCurve } from "@/components/EquityCurve";
import { RecentSettled } from "@/components/RecentSettled";
import { ClvDistribution } from "@/components/ClvDistribution";
import { Breakdown } from "@/components/Breakdown";
import { Heatmap } from "@/components/Heatmap";
import { OpenPositions } from "@/components/OpenPositions";
import { PasteHero } from "@/components/PasteHero";
import { EmptyDashboard } from "@/components/EmptyDashboard";
import { ProfitPerStake } from "@/components/ProfitPerStake";
import { RangeTabs } from "@/components/RangeTabs";
import { WinRateGauge } from "@/components/WinRateGauge";
import { UnitProvider, type DisplayUnit } from "@/components/UnitContext";
import { BRAND } from "@/lib/brand";
import { filterByRange, rangeLabel, type Range } from "@/lib/range";
import type { ImportedBet } from "@/lib/import/types";
import { applyTheme, useSettings } from "@/lib/settings";
import { useAuth } from "@/lib/auth";
import { LandingPage } from "@/components/LandingPage";

type Source = "mock" | "imported";

export default function Dashboard() {
  // First render: mock data so SSR/client hydration match. After mount, we
  // check localStorage and swap to imported aggregates when present.
  const [source, setSource] = useState<Source>("mock");
  const [allBets, setAllBets] = useState<ImportedBet[]>([]);
  const [now, setNow] = useState<number>(NOW);
  const [range, setRange] = useState<Range>("12M");
  const settingsUnit = useSettings().unit;
  const [localBump, setLocalBump] = useState(0);
  const [cleanupDismissed, setCleanupDismissed] = useState(false);
  const { user, betsVersion, activeBook, cleanup } = useAuth();

  // Load bets on mount, and re-read whenever the auth layer signals a fresh
  // pull from Supabase (betsVersion bumps).
  useEffect(() => {
    applyTheme();
    if (!user) consumeSeed();
    const all = loadBets();
    // Scope to the active book. Bets without a bookId (legacy cache) fall
    // through to the active book so older data still shows up.
    const scoped = activeBook
      ? all.filter((b) => !b.bookId || b.bookId === activeBook.id)
      : all;
    const nextNow = Date.now();
    // Defer setState to next microtask so it's not synchronous in this
    // effect's call stack (React 19 set-state-in-effect rule). Runs before
    // paint, so no visible flash of stale state.
    queueMicrotask(() => {
      if (scoped.length > 0) {
        setSource("imported");
        setAllBets(scoped);
        setNow(nextNow);
      } else {
        setSource("mock");
        setAllBets([]);
      }
    });
  }, [betsVersion, user, activeBook, localBump]);

  // Re-aggregate whenever bets or range change. useMemo (not useEffect)
  // so React 19's no-setState-in-effect rule is satisfied — `data` is
  // pure-derived state.
  const data = useMemo<DashboardData>(() => {
    if (source !== "imported") return buildAll("mixed");
    // Use the captured `now` rather than Date.now() so this memo is pure —
    // React 19 forbids impure calls during render. `now` is bumped when bets
    // are loaded, which is the only moment the window boundary changes.
    const filtered = filterByRange(allBets, range, now);
    const windowed = aggregateFromBets(filtered);
    // Return on capital is a path-dependent, "across your whole career"
    // metric. Windowing it produces nonsense (a single bad month in a 3M
    // window can render -100%). Always compute it from all bets and override
    // the window-scoped values so it stays stable as the user flips ranges.
    if (allBets.length > 0) {
      const lifetime = aggregateFromBets(allBets);
      windowed.kpis.rocPct = lifetime.kpis.rocPct;
      windowed.kpis.rocAnnualised = lifetime.kpis.rocAnnualised;
      windowed.kpis.peakDrawdown = lifetime.kpis.peakDrawdown;
      windowed.kpis.lifetimePl = lifetime.kpis.lifetimePl;
    }
    return windowed;
  }, [allBets, range, source, now]);

  const importedCount = allBets.length;
  const inRangeCount = useMemo(
    () => (source === "imported" ? data.kpis.sampleSize : 0),
    [source, data.kpis.sampleSize],
  );

  // Span of the user's entire career — earliest to latest bet, in years.
  // Drives the "per year" line on the stake-scaler card.
  const lifetimeYears = useMemo(() => {
    if (allBets.length === 0) return undefined;
    let minMs = Infinity;
    let maxMs = -Infinity;
    for (const b of allBets) {
      const t = new Date(b.kickoff).getTime();
      if (t < minMs) minMs = t;
      if (t > maxMs) maxMs = t;
    }
    if (!isFinite(minMs) || !isFinite(maxMs)) return undefined;
    const yrs = (maxMs - minMs) / (365.25 * 86400000);
    return yrs > 0 ? yrs : undefined;
  }, [allBets]);

  const updatedAt = useMemo(() => {
    return new Date(now).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/London",
    });
  }, [now]);

  // For imported data: respect the user's setting. For the demo: keep $ since
  // the mock bankroll is dollar-denominated.
  const unit: DisplayUnit = source === "imported" ? settingsUnit : "$";

  // Signed-out visitors see the marketing landing page instead of the
  // sample dashboard. They came here from an X share, an OG card link,
  // or word of mouth — not to look at someone else's seed bets.
  if (!user) return <LandingPage />;

  return (
    <UnitProvider unit={unit}>
    <div className="app">
      <Sidebar />
      <div className="main-col">
        <TopBar />
        {/* Hide the recent-bets ticker for empty users — otherwise they
            see mock fixtures scrolling at the top of a brand-new
            dashboard, which is exactly what we just removed from the
            body. */}
        {allBets.length > 0 && <Ticker items={data.ticker} />}

        <div className="page" data-screen-label="Dashboard">
          <div className="page-header">
            <div>
              <h1 className="page-title">Dashboard</h1>
              {/* No subtitle / no range tabs when the user is empty:
                  shows the mock subtitle "Soccer (EPL, UCL) · Pinnacle"
                  otherwise, which is misleading on a fresh signup. */}
              {allBets.length > 0 && (
                <div className="page-subtitle">
                  <span className="dot-live"></span>
                  Updated {updatedAt} ·{" "}
                  {source === "imported"
                    ? `${inRangeCount.toLocaleString()} of ${importedCount.toLocaleString()} bets · ${rangeLabel(range, now)} · CLV pending`
                    : "Soccer (EPL, UCL) · Pinnacle & 4 others"}
                </div>
              )}
            </div>
            {allBets.length > 0 && (
              <RangeTabs value={range} onChange={setRange} />
            )}
          </div>

          {!user && allBets.length > 0 && <SampleDataBanner />}

          {/* Signed-in but no bets yet: show the welcome / get-started
              cards instead of mock charts. Bail out of the full layout. */}
          {user && allBets.length === 0 ? (
            <EmptyDashboard
              displayName={user.email?.split("@")[0]}
            />
          ) : (
            <>

          <PasteHero onCommitted={() => setLocalBump((n) => n + 1)} />

          {cleanup &&
            cleanup.status === "done" &&
            (cleanup.sportReclassified > 0 || cleanup.datesFixed > 0) &&
            !cleanupDismissed && (
              <CleanupBanner
                sport={cleanup.sportReclassified}
                dates={cleanup.datesFixed}
                onDismiss={() => setCleanupDismissed(true)}
              />
            )}

          {source === "mock" && <MockBanner />}
          {source === "imported" && <ImportedBanner count={importedCount} />}

          <KpiStripCompact kpis={data.kpis} sparks={data.sparks} />
          <SecondaryStats s={data.secondary} />

          {source === "imported" && data.kpis.lifetimePl !== undefined && (
            <div
              className="grid"
              style={{ gridTemplateColumns: "1fr 1fr", marginTop: 14 }}
            >
              <WinRateGauge
                winRatePct={data.secondary.winRate}
                wins={data.secondary.wins ?? 0}
                settledCount={data.secondary.settledCount ?? 0}
                avgOdds={data.secondary.avgOdds}
              />
              <ProfitPerStake
                lifetimePlUnits={data.kpis.lifetimePl}
                totalBets={data.kpis.sampleSize}
                yearsSpan={lifetimeYears}
              />
            </div>
          )}

          <div className="grid curve-row">
            <EquityCurve
              data={data.equity}
              weekly={data.weekly}
              lastBetAgo={data.kpis.lastBetAgo}
              mode={source === "imported" ? "cumulative" : "bankroll"}
              range={range}
              onRangeChange={source === "imported" ? setRange : undefined}
            />
            <RecentSettled bets={data.settled} now={now} />
          </div>

          <div className="dense-grid row-3">
            <ClvDistribution dist={data.clvDist} mean={data.kpis.clvPct} />
            <Breakdown title="By market" rows={data.marketBd} />
            <Breakdown title="By odds range" rows={data.oddsBd} />
          </div>

          <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
            <Heatmap data={data.heatmap} />
          </div>

          <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
            <OpenPositions
              positions={data.open}
              density="comfortable"
              now={now}
            />
          </div>

          <div className="footer-line">
            <span>{BRAND.name} · v0.4.2</span>
            <span>
              {source === "imported"
                ? "Imported data · stakes shown as units · CLV not yet captured for historical bets"
                : "Data delayed ≤ 30s · Closing-line sourced from Pinnacle"}
            </span>
            <span>UTC+01:00</span>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
    </UnitProvider>
  );
}

function MockBanner() {
  return (
    <div
      style={{
        marginTop: 14,
        padding: "10px 16px",
        background: "var(--surface-2)",
        border: "var(--border-w) solid var(--border)",
        borderRadius: 8,
        fontSize: 12,
        color: "var(--text-muted)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <span>
        <span style={{ fontWeight: 600, color: "var(--text)" }}>Demo data.</span>{" "}
        Import your own to see real numbers.
      </span>
      <Link
        href="/import"
        className="btn-ghost"
        data-active="true"
        style={{ padding: "4px 10px", fontSize: 12 }}
      >
        Import data →
      </Link>
    </div>
  );
}

function SampleDataBanner() {
  return (
    <div
      style={{
        marginTop: 14,
        padding: "12px 18px",
        background:
          "linear-gradient(90deg, rgba(15, 110, 86, 0.10) 0%, rgba(15, 110, 86, 0.03) 100%)",
        border: "var(--border-w) solid var(--green-tint)",
        borderRadius: 10,
        fontSize: 13,
        color: "var(--text)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        position: "relative",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: -1,
          left: 18,
          background: "var(--bg)",
          color: "var(--green)",
          fontFamily: "var(--mono)",
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          padding: "0 6px",
          borderRadius: 3,
        }}
      >
        Sample
      </span>
      <span style={{ paddingLeft: 4 }}>
        <span style={{ fontWeight: 600, color: "var(--green)" }}>
          You&rsquo;re viewing sample data.
        </span>{" "}
        <span style={{ color: "var(--text-muted)" }}>
          Every chart, KPI and bet on this page is illustrative.
          Sign in to start tracking your own.
        </span>
      </span>
      <Link
        href="/sign-in"
        className="btn-ghost"
        data-active="true"
        style={{
          padding: "6px 14px",
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        Sign in →
      </Link>
    </div>
  );
}

function CleanupBanner({
  sport,
  dates,
  onDismiss,
}: {
  sport: number;
  dates: number;
  onDismiss: () => void;
}) {
  const parts: string[] = [];
  if (sport > 0) {
    parts.push(`re-classified ${sport.toLocaleString()} bet${sport === 1 ? "" : "s"} to the correct sport`);
  }
  if (dates > 0) {
    parts.push(`fixed ${dates.toLocaleString()} future-dated kickoff${dates === 1 ? "" : "s"}`);
  }
  const headline = parts.join(" · ");
  return (
    <div
      style={{
        marginTop: 14,
        padding: "10px 16px",
        background: "var(--blue-tint)",
        border: "var(--border-w) solid var(--blue-tint)",
        borderRadius: 8,
        fontSize: 12,
        color: "var(--text-muted)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <span>
        <span style={{ fontWeight: 600, color: "var(--blue)" }}>
          Data cleanup ran.
        </span>{" "}
        We {headline}. Changes synced to Supabase.
      </span>
      <button
        type="button"
        className="btn-ghost"
        onClick={onDismiss}
        style={{ padding: "4px 10px", fontSize: 12 }}
      >
        Dismiss
      </button>
    </div>
  );
}

function ImportedBanner({ count }: { count: number }) {
  return (
    <div
      style={{
        marginTop: 14,
        padding: "10px 16px",
        background: "var(--green-bg)",
        border: "var(--border-w) solid var(--green-tint)",
        borderRadius: 8,
        fontSize: 12,
        color: "var(--text-muted)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <span>
        <span style={{ fontWeight: 600, color: "var(--green)" }}>
          {count.toLocaleString()} bets tracked.
        </span>{" "}
        Synced to your account · daily cloud backups · access from any device. CLV starts populating once you log bets pre-kickoff.
      </span>
      <Link
        href="/import"
        className="btn-ghost"
        style={{ padding: "4px 10px", fontSize: 12 }}
      >
        Import more →
      </Link>
    </div>
  );
}
