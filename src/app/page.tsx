"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DashboardData } from "@/lib/data";
import { aggregateFromBets, computeKpis } from "@/lib/aggregate";
import { canUsePersonalDashboardView, personalDashboardBets, type PersonalDashboardView } from "@/lib/personal-dashboard-view";
import { loadBets } from "@/lib/import/store";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { KpiStripCompact } from "@/components/Kpis";
import { SecondaryStats } from "@/components/SecondaryStats";
// Note: RecentSettled and ClvDistribution were removed from the dashboard
// for visual simplification — they're still available in /bets and in the
// analytics page where users can drill in if they want that detail.
import { EquityCurve } from "@/components/EquityCurve";
import { Breakdown } from "@/components/Breakdown";
import { Heatmap } from "@/components/Heatmap";
import { OpenPositions } from "@/components/OpenPositions";
import { PasteHero } from "@/components/PasteHero";
import { SampleBetsBanner } from "@/components/SampleBetsBanner";
import { ThirtyDaySnapshot } from "@/components/ThirtyDaySnapshot";
import { TrackingBadge } from "@/components/TrackingBadge";
import { DemoBetImportBanner } from "@/components/DemoBetImportBanner";
import { GhostPreview } from "@/components/GhostPreview";
import { SAMPLE_SOURCE_TAG } from "@/lib/sample-tip";
import { DashboardEdgeCallout } from "@/components/DashboardEdgeCallout";
import { RangeTabs } from "@/components/RangeTabs";
import { WinRateGauge } from "@/components/WinRateGauge";
import { UnitProvider, type DisplayUnit } from "@/components/UnitContext";
import { APP_VERSION, BRAND } from "@/lib/brand";
import { filterByRange, rangeLabel, type Range } from "@/lib/range";
import type { ImportedBet } from "@/lib/import/types";
import { applyThemeForSignedIn, useSettings } from "@/lib/settings";
import { useAuth } from "@/lib/auth";
import { LandingPage } from "@/components/LandingPage";
import { DashboardLoading } from "@/components/DashboardLoading";
import { HomeStartup } from "@/components/HomeStartup";

// The dashboard exposes a slimmed-down subset of the full RANGES list:
// four buckets the user asked for, ordered from most-recent to widest. All
// downstream sections (KPIs, equity curve, breakdowns) share the same
// `range` state, so this control filters the whole page — it just sits
// directly above the KPI strip where the user can actually see it.
const DASHBOARD_RANGES: Range[] = ["1M", "3M", "12M", "All"];

// "UTC+01:00" style label for the viewer's own clock at time `ms`.
function utcOffsetLabel(ms: number): string {
  const mins = -new Date(ms).getTimezoneOffset();
  const abs = Math.abs(mins);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `UTC${mins >= 0 ? "+" : "−"}${hh}:${mm}`;
}

export default function Dashboard() {
  const { user, loading, accountStatus, activeBook } = useAuth();
  const [cachedScope, setCachedScope] = useState<string | null>(null);
  const scope = user && activeBook?.userId === user.id
    ? `${user.id}:${activeBook.id}`
    : null;

  useEffect(() => {
    // The cache is shared across sessions. Only show it early after the
    // books query has confirmed that this book belongs to the current user.
    const hasCachedBets = scope && loadBets().some((bet) =>
      bet.bookId === activeBook?.id && !bet.id.startsWith("seed-"),
    );
    queueMicrotask(() => setCachedScope(hasCachedBets ? scope : null));
  }, [scope, activeBook?.id]);

  if (loading) return <HomeStartup />;
  if (!user) return <LandingPage />;
  if (accountStatus !== "ready" && (!scope || cachedScope !== scope)) {
    return <DashboardLoading failed={accountStatus === "error"} />;
  }
  return <AccountDashboard key={`${user.id}:${activeBook?.id ?? "none"}`} />;
}

// Only ever rendered for a signed-in user (see Dashboard above), and only
// in the browser: the server render stops at <HomeStartup /> because auth
// is still loading there. An account with no bets gets the first-run
// PasteHero + GhostPreview; everything else on the page is real data.
// (There used to be a generated "demo data" dashboard for signed-out
// visitors. They get the landing page now, so that path was unreachable
// and has been removed.)
function AccountDashboard() {
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [allBets, setAllBets] = useState<ImportedBet[]>([]);
  const [now, setNow] = useState<number>(() => Date.now());
  // Default to All time so the dashboard stats reflect a user's full
  // history out of the box. They can still scope to 7D/1M/3M/6M/YTD/12M
  // via the RangeTabs control below.
  const [range, setRange] = useState<Range>("All");
  const [personalView, setPersonalView] = useState<PersonalDashboardView>("personal");
  const settingsUnit = useSettings().unit;
  const [localBump, setLocalBump] = useState(0);
  const [cleanupDismissed, setCleanupDismissed] = useState(false);
  const { user, betsVersion, activeBook, cleanup, accountStatus } = useAuth();

  // Load bets on mount, and re-read whenever the auth layer signals a fresh
  // pull from Supabase (betsVersion bumps).
  useEffect(() => {
    applyThemeForSignedIn();
    const allRaw = loadBets();
    // Signed-in accounts must not inherit the landing-page seed bets that
    // consumeSeed() drops into localStorage for the signed-out preview.
    // Those seeds have stable ids prefixed "seed-" — filter them out so a
    // fresh signup sees a truly empty ledger and hits the first-run
    // PasteHero. Signed-out preview still sees them because we don't
    // apply this filter there.
    const all = allRaw.filter((b) => !b.id.startsWith("seed-"));
    // Scope to the active book. Bets without a bookId (legacy cache) fall
    // through to the active book so older data still shows up.
    const scoped = activeBook
      ? all.filter((b) => b.bookId === activeBook.id || (accountStatus === "ready" && !b.bookId))
      : all;
    const nextNow = Date.now();
    // Defer setState to next microtask so it's not synchronous in this
    // effect's call stack (React 19 set-state-in-effect rule). Runs before
    // paint, so no visible flash of stale state.
    queueMicrotask(() => {
      setCacheLoaded(true);
      setAllBets(scoped);
      setNow(nextNow);
    });
  }, [betsVersion, user, activeBook, localBump, accountStatus]);

  const showPersonalView = canUsePersonalDashboardView(user?.id, activeBook?.id);
  const isSharpSideView = showPersonalView && personalView === "sharp-side-soccer";
  const viewBets = useMemo(
    () => personalDashboardBets(allBets, isSharpSideView ? "sharp-side-soccer" : "personal"),
    [allBets, isSharpSideView],
  );
  const viewName = isSharpSideView ? "Sharp Side Soccer" : activeBook?.name ?? "Current book";

  // Re-aggregate whenever bets or range change. useMemo (not useEffect)
  // so React 19's no-setState-in-effect rule is satisfied — `data` is
  // pure-derived state.
  const data = useMemo<DashboardData>(() => {
    // Use the captured `now` rather than Date.now() so this memo is pure —
    // React 19 forbids impure calls during render. `now` is bumped when bets
    // are loaded, which is the only moment the window boundary changes.
    const filtered = filterByRange(viewBets, range, now);
    const windowed = aggregateFromBets(filtered);
    // Return on capital is a path-dependent, "across your whole career"
    // metric within the selected dashboard view. Windowing it produces nonsense (a single bad month in a 3M
    // window can render -100%). Always compute it from all bets and override
    // the window-scoped values so it stays stable as the user flips ranges.
    // Only the KPI block is needed for that, so compute just the KPIs
    // rather than running the whole aggregation (heatmap, breakdowns,
    // sport and competition classifiers) a second time over every bet.
    if (viewBets.length > 0) {
      const lifetime = computeKpis(viewBets);
      windowed.kpis.rocPct = lifetime.rocPct;
      windowed.kpis.rocAnnualised = lifetime.rocAnnualised;
      windowed.kpis.peakDrawdown = lifetime.peakDrawdown;
      windowed.kpis.lifetimePl = lifetime.lifetimePl;
    }
    return windowed;
  }, [viewBets, range, now]);

  const importedCount = viewBets.length;
  const milestoneCount = allBets.filter((bet) =>
    bet.status !== "pending" && !bet._pendingDelete &&
    bet.source !== SAMPLE_SOURCE_TAG && !bet.id.startsWith("seed-") &&
    !!activeBook && bet.bookId === activeBook.id
  ).length;

  // Sample-vs-real bet split. The first-run PasteHero pre-fills with a
  // demo tip and tags any bets parsed from that untouched pre-fill with
  // source === "sample". Both counts filter out tombstones that haven't
  // yet been evicted from localStorage.
  const sampleBetCount = useMemo(
    () =>
      allBets.filter(
        (b) => b.source === SAMPLE_SOURCE_TAG && !b._pendingDelete,
      ).length,
    [allBets],
  );
  const realBetCount = useMemo(
    () =>
      allBets.filter(
        (b) => b.source !== SAMPLE_SOURCE_TAG && !b._pendingDelete,
      ).length,
    [allBets],
  );
  // Total committed bets across all sources (sample + real) for the
  // active book — undo-reactive because loadBets() strips tombstoned
  // rows before returning, so the 30s undo path decrements allBets
  // (and therefore this count) as soon as it fires.
  const totalCommittedBets = allBets.length;
  // First-run mode: signed-in user with no real bets yet. Persists across
  // sample-bet commits, only clears once a real (non-sample) bet exists.
  //
  // Dev-only override: `?firstrun=1` forces the first-run PasteHero on
  // regardless of bet count so an account with real history can preview
  // the flow without wiping localStorage. Gated to development so it
  // can't accidentally leak to prod.
  const forceFirstRun =
    process.env.NODE_ENV === "development" &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("firstrun") === "1";
  const isFirstRun = forceFirstRun || realBetCount === 0;
  const showGhost = forceFirstRun || totalCommittedBets === 0;
  const inRangeCount = data.kpis.sampleSize;

  // Shown in the viewer's own time zone, with the matching UTC offset in
  // the footer. (Both used to be pinned to UK summer time, which was an
  // hour out for UK users every winter and wrong for everyone else.)
  const updatedAt = useMemo(() => {
    return new Date(now).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [now]);

  const unit: DisplayUnit = settingsUnit;

  if (!cacheLoaded) return <DashboardLoading />;

  return (
    <UnitProvider unit={unit}>
    <div className="app">
      <Sidebar />
      <div className="main-col">
        <TopBar />

        <div className="page" data-screen-label="Dashboard">
          <div className="page-header">
            <div>
              <h1 className="page-title">Dashboard</h1>
              {showPersonalView && (
                <div className="dashboard-history-view">
                  <label htmlFor="dashboard-history-view">Dashboard view</label>
                  <select id="dashboard-history-view" value={personalView} onChange={(event) => {
                    setPersonalView(event.target.value as PersonalDashboardView);
                    setRange("All");
                  }}>
                    <option value="personal">Personal book</option>
                    <option value="sharp-side-soccer">Sharp Side Soccer</option>
                  </select>
                  <span>{isSharpSideView ? "Since 12 August 2026 · by bet date (UTC)" : "Full personal betting history"}</span>
                </div>
              )}
              {user && activeBook && accountStatus === "ready" && milestoneCount >= 100 && (
                <div className="dashboard-book-milestone"><span>{activeBook.name}</span><TrackingBadge count={milestoneCount} /></div>
              )}
              {/* No subtitle when the book is empty. */}
              {allBets.length > 0 && (
                <div className="page-subtitle">
                  <span className="dot-live"></span>
                  Updated {updatedAt} ·{" "}
                  {`${inRangeCount.toLocaleString()} of ${importedCount.toLocaleString()} bets · ${isSharpSideView && range === "All" ? "since 12 August 2026" : rangeLabel(range, now)}`}
                </div>
              )}
            </div>
          </div>

          {/* PasteHero always renders — it's the primary action for both
              zero-bet and populated dashboards. `firstRun` controls the
              sample-tip pre-fill + pulse (Task A behaviour, preserved). */}
          <div className={!isFirstRun && realBetCount > 0 ? "dashboard-capture-row" : undefined}>
          <PasteHero
            onCommitted={() => setLocalBump((n) => n + 1)}
            firstRun={isFirstRun}
            compact={!isFirstRun && realBetCount > 0}
          />
          {!isFirstRun && realBetCount > 0 && <ThirtyDaySnapshot bets={viewBets} now={now} bookName={viewName} />}
          </div>

          {/* Top-level conditional per spec:
              - totalCommittedBets === 0 → GhostPreview (presentational
                only, opacity + pointer-events wrapper is inside the
                component so the "Sample data" pill and closing line
                stay interactive).
              - Otherwise → the real dashboard block, including the
                amber SampleBetsBanner which sits outside the ghost so
                it's structurally separate. By construction ghost and
                banner never mount at the same time (sample bets > 0
                implies totalCommittedBets > 0).
              Wrapped as a straight ternary so a crossfade wrapper drops
              in later without refactoring the branch structure. */}
          {/* DemoBetImportBanner reads sessionStorage["aiw_demo_bets"]
              set by the landing-page DemoPasteBox's "Sign up to keep
              these" button and imports those bets into the active book.
              Mounted OUTSIDE the showGhost ternary because a fresh
              signup lands with zero committed bets (showGhost=true),
              which would mean the banner would never mount if it lived
              inside the !showGhost branch. Once it fires, onImported
              bumps localBump, aggregation re-runs, showGhost flips
              false, and the real dashboard block below takes over. */}
          <DemoBetImportBanner
            onImported={() => setLocalBump((n) => n + 1)}
          />

          {showGhost ? (
            <GhostPreview />
          ) : (
            <>

          {sampleBetCount > 0 && (
            <SampleBetsBanner
              count={sampleBetCount}
              onCleared={() => setLocalBump((n) => n + 1)}
            />
          )}


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

          <ImportedBanner count={importedCount} />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginTop: 14,
              marginBottom: 6,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-faint)",
              }}
            >
              Metrics · {isSharpSideView ? "Sharp Side Soccer · " : ""}{isSharpSideView && range === "All" ? "Since 12 August 2026" : rangeLabel(range, now)}
            </div>
            <RangeTabs
              value={range}
              onChange={setRange}
              options={DASHBOARD_RANGES}
            />
          </div>

          <KpiStripCompact kpis={data.kpis} sparks={data.sparks} capitalScopeLabel={isSharpSideView ? "Since 12 Aug 2026" : undefined} />
          <SecondaryStats s={data.secondary} />

          {data.kpis.lifetimePl !== undefined && (
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
              <DashboardEdgeCallout bets={viewBets} />
            </div>
          )}

          <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
            <EquityCurve
              data={data.equity}
              weekly={data.weekly}
              lastBetAgo={data.kpis.lastBetAgo}
              mode="cumulative"
              range={range}
            />
          </div>

          <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
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
            <span>{BRAND.name} · v{APP_VERSION}</span>
            <span>
              P/L and yield count settled bets · CLV counts bets with closing odds
            </span>
            <span>{utcOffsetLabel(now)}</span>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
    </UnitProvider>
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
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <span>
        <span style={{ fontWeight: 600, color: "var(--green)" }}>
          {count.toLocaleString()} bets tracked.
        </span>{" "}

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
