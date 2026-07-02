"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { UnitProvider, type DisplayUnit } from "@/components/UnitContext";
import {
  applyThemeForSignedIn,
  useSettings,
  saveSettings,
  type UserSettings,
} from "@/lib/settings";
import { clearBets, loadBets } from "@/lib/import/store";
import { useAuth } from "@/lib/auth";
import { createBook, deleteBook, updateBook, type OddsFormat } from "@/lib/books";
import { downloadBetsCsv } from "@/lib/export";
import { ProfilePanel } from "@/components/ProfilePanel";

const UNIT_OPTIONS: Array<{ value: DisplayUnit; label: string; sublabel: string }> = [
  { value: "u", label: "Units (u)", sublabel: "Stake-to-bankroll ratio. Used by most pro bettors and trackers like bettin.gs / Track-A-Bet." },
  { value: "$", label: "US Dollar ($)", sublabel: "Real money tracking in USD." },
  { value: "£", label: "Pound Sterling (£)", sublabel: "Real money tracking in GBP." },
  { value: "€", label: "Euro (€)", sublabel: "Real money tracking in EUR." },
];

export default function SettingsPage() {
  const { user, books, activeBook, setActiveBook, refreshBooks, betsVersion } =
    useAuth();
  // Settings come from the reactive store hook — SSR-safe, no effect needed.
  const settings = useSettings();
  // Settings is a signed-in surface — apply the terminal-dark default
  // on mount so a fresh user hitting this page directly still gets
  // the new palette while previewing swatches.
  useEffect(() => {
    applyThemeForSignedIn();
  }, []);
  const [clearTick, setClearTick] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [newBookName, setNewBookName] = useState("");
  const [creatingBook, setCreatingBook] = useState(false);
  const [confirmDeleteBookId, setConfirmDeleteBookId] = useState<string | null>(
    null,
  );
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  const onExport = async () => {
    if (exporting) return;
    setExporting(true);
    setExportMsg(null);
    const count = await downloadBetsCsv();
    if (count == null) {
      setExportMsg("Export failed. Try again, or refresh and retry.");
    } else if (count === 0) {
      setExportMsg("Nothing to export — no bets yet.");
    } else {
      setExportMsg(`Downloaded ${count.toLocaleString()} bets.`);
    }
    setExporting(false);
    setTimeout(() => setExportMsg(null), 4000);
  };

  // Derive the bet count on every render — keyed by the auth context's
  // betsVersion so it re-runs after a Supabase pull, plus a local tick
  // bumped after "Clear all bets" so the count updates immediately.
  const importedCount = useMemo(() => {
    if (typeof window === "undefined") return 0;
    return loadBets().length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [betsVersion, clearTick]);

  const onCreateBook = async () => {
    if (!user || !newBookName.trim() || creatingBook) return;
    setCreatingBook(true);
    const book = await createBook(user.id, newBookName.trim());
    if (book) {
      setNewBookName("");
      await refreshBooks();
      setActiveBook(book.id);
    }
    setCreatingBook(false);
  };

  const onDeleteBook = async (bookId: string) => {
    if (confirmDeleteBookId !== bookId) {
      setConfirmDeleteBookId(bookId);
      return;
    }
    await deleteBook(bookId);
    setConfirmDeleteBookId(null);
    await refreshBooks();
  };

  const onChangeOddsFormat = async (bookId: string, format: OddsFormat) => {
    await updateBook(bookId, { oddsFormat: format });
    await refreshBooks();
  };

  const update = (patch: Partial<UserSettings>) => {
    const next = { ...settings, ...patch };
    // saveSettings notifies subscribers; useSettings() picks up the change.
    saveSettings(next);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1200);
  };

  const onClearData = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearBets();
    setClearTick((t) => t + 1);
    setConfirmClear(false);
  };

  return (
    <UnitProvider unit={settings.unit}>
      <div className="app">
        <Sidebar />
        <div className="main-col">
          <TopBar />
          <div className="page">
            <div className="page-header">
              <div>
                <h1 className="page-title">Settings</h1>
                <div className="page-subtitle">
                  Preferences and books. Synced to your account across devices.
                </div>
              </div>
              {savedNotice && (
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    color: "var(--green)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  ✓ Saved
                </span>
              )}
            </div>

            <Section
              title="Public profile"
              subtitle="Share your lifetime stats with a single link. Stats only — individual bets are never shown publicly."
            >
              <ProfilePanel />
            </Section>

            <Section title="Display unit" subtitle="How stakes and P/L are shown across the app.">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {UNIT_OPTIONS.map((opt) => (
                  <Radio
                    key={opt.value}
                    label={opt.label}
                    sublabel={opt.sublabel}
                    checked={settings.unit === opt.value}
                    onChange={() => update({ unit: opt.value })}
                  />
                ))}
              </div>
            </Section>

            <Section
              title="Books"
              subtitle="Each book has its own bet log, dashboard, and stats. Switch between them in the sidebar."
            >
              {user ? (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {books.map((b) => {
                      const isActive = b.id === activeBook?.id;
                      const isConfirming = confirmDeleteBookId === b.id;
                      return (
                        <div
                          key={b.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "10px 12px",
                            borderRadius: 6,
                            border: `var(--border-w) solid ${isActive ? "var(--text)" : "var(--border)"}`,
                            background: isActive
                              ? "var(--surface-2)"
                              : "var(--surface)",
                          }}
                        >
                          <span
                            style={{
                              flex: 1,
                              fontSize: 13,
                              fontWeight: isActive ? 600 : 500,
                            }}
                          >
                            {b.name}
                            {isActive && (
                              <span
                                style={{
                                  fontSize: 10,
                                  marginLeft: 8,
                                  fontFamily: "var(--mono)",
                                  color: "var(--text-faint)",
                                  letterSpacing: "0.04em",
                                  textTransform: "uppercase",
                                }}
                              >
                                Active
                              </span>
                            )}
                          </span>
                          <select
                            value={b.oddsFormat}
                            onChange={(e) =>
                              onChangeOddsFormat(
                                b.id,
                                e.target.value as OddsFormat,
                              )
                            }
                            title="Odds display format"
                            style={{
                              padding: "4px 6px",
                              fontSize: 11.5,
                              fontFamily: "var(--mono)",
                              background: "var(--surface)",
                              color: "var(--text-muted)",
                              border: "var(--border-w) solid var(--border-strong)",
                              borderRadius: 4,
                            }}
                          >
                            <option value="decimal">Decimal · 1.85</option>
                            <option value="american">American · −110</option>
                            <option value="fractional">Fractional · 5/6</option>
                          </select>
                          {!isActive && (
                            <button
                              onClick={() => setActiveBook(b.id)}
                              style={{
                                padding: "4px 10px",
                                fontSize: 11,
                                color: "var(--text-muted)",
                                background: "transparent",
                                border: "var(--border-w) solid var(--border)",
                                borderRadius: 4,
                                cursor: "pointer",
                              }}
                            >
                              Switch
                            </button>
                          )}
                          {books.length > 1 && (
                            <button
                              onClick={() => onDeleteBook(b.id)}
                              onBlur={() => setConfirmDeleteBookId(null)}
                              title="Delete book and all its bets"
                              style={{
                                padding: "4px 10px",
                                fontSize: 11,
                                color: isConfirming
                                  ? "var(--red)"
                                  : "var(--text-faint)",
                                background: "transparent",
                                border: `var(--border-w) solid ${isConfirming ? "var(--red)" : "transparent"}`,
                                borderRadius: 4,
                                cursor: "pointer",
                              }}
                            >
                              {isConfirming ? "Confirm?" : "Delete"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 14,
                      paddingTop: 14,
                      borderTop: "var(--border-w) solid var(--border)",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="New book name (e.g. Ylose Tennis)"
                      value={newBookName}
                      onChange={(e) => setNewBookName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onCreateBook();
                      }}
                      style={{
                        flex: 1,
                        padding: "8px 10px",
                        fontSize: 13,
                        fontFamily: "var(--sans)",
                        background: "var(--surface)",
                        border: "var(--border-w) solid var(--border-strong)",
                        borderRadius: 5,
                        color: "var(--text)",
                      }}
                    />
                    <button
                      onClick={onCreateBook}
                      disabled={!newBookName.trim() || creatingBook}
                      className="btn-ghost"
                      data-active="true"
                      style={{
                        padding: "8px 16px",
                        fontSize: 13,
                        opacity: newBookName.trim() && !creatingBook ? 1 : 0.4,
                        cursor:
                          newBookName.trim() && !creatingBook
                            ? "pointer"
                            : "not-allowed",
                      }}
                    >
                      {creatingBook ? "Creating…" : "Create"}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                  Sign in to manage books.
                </div>
              )}
            </Section>

            <Section
              title="Your data"
              subtitle="Where it lives, how it's protected, and how to take it with you."
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {/* Architecture explainer */}
                <ul
                  style={{
                    margin: 0,
                    padding: 0,
                    listStyle: "none",
                    fontSize: 12.5,
                    color: "var(--text-muted)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <li>
                    <strong style={{ color: "var(--text)" }}>
                      Stored in the cloud.
                    </strong>{" "}
                    Your bets live in a managed Postgres database (Supabase).
                    The browser keeps a fast local copy for speed, but the
                    cloud is the source of truth.
                  </li>
                  <li>
                    <strong style={{ color: "var(--text)" }}>
                      Daily backups.
                    </strong>{" "}
                    Automatic snapshots with 7-day point-in-time recovery
                    via Supabase Pro. You don&rsquo;t need to do anything.
                  </li>
                  <li>
                    <strong style={{ color: "var(--text)" }}>
                      Locked to you.
                    </strong>{" "}
                    Row-Level Security means nobody else (signed in or not)
                    can see your private books or bets.
                  </li>
                  <li>
                    <strong style={{ color: "var(--text)" }}>
                      Exportable anytime.
                    </strong>{" "}
                    Download a CSV of every bet you&rsquo;ve ever logged
                    below.
                  </li>
                </ul>

                {/* Export + count + clear */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    gap: 10,
                    paddingTop: 10,
                    borderTop: "var(--border-w) solid var(--border)",
                  }}
                >
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    {importedCount > 0
                      ? `${importedCount.toLocaleString()} bets in this browser's cache.`
                      : "No bets cached locally yet."}
                  </span>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={onExport}
                      disabled={exporting}
                      style={{
                        padding: "6px 14px",
                        fontSize: 12,
                        cursor: exporting ? "wait" : "pointer",
                      }}
                    >
                      {exporting ? "Preparing…" : "Export to CSV"}
                    </button>
                    {importedCount > 0 && (
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={onClearData}
                        style={{
                          padding: "6px 14px",
                          fontSize: 12,
                          color: confirmClear
                            ? "var(--red)"
                            : "var(--text-muted)",
                          border: confirmClear
                            ? "var(--border-w) solid var(--red)"
                            : undefined,
                        }}
                      >
                        {confirmClear
                          ? "Click again to confirm"
                          : "Clear local cache"}
                      </button>
                    )}
                  </div>
                </div>
                {exportMsg && (
                  <div
                    style={{
                      fontSize: 11.5,
                      color: exportMsg.startsWith("Downloaded")
                        ? "var(--green)"
                        : "var(--text-muted)",
                      fontFamily: "var(--mono)",
                    }}
                  >
                    {exportMsg}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-faint)",
                    fontFamily: "var(--mono)",
                  }}
                >
                  Clearing the local cache only wipes the copy in your browser.
                  Your cloud data stays intact and will re-sync on next sign-in.
                </div>
              </div>
            </Section>

            <Section title="Coming soon" subtitle="On the roadmap.">
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                  fontSize: 13,
                  color: "var(--text-muted)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <li>· Bookmaker accounts and balances</li>
                <li>· CLV preferences (devig method, source priority)</li>
                <li>· Connected accounts (X / Twitter OAuth)</li>
                <li>· Pending-sync retry queue (durability)</li>
                <li>· Account deletion</li>
              </ul>
            </Section>
          </div>
        </div>
      </div>
    </UnitProvider>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ padding: 20, marginTop: 14 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.005em" }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function Radio({
  label,
  sublabel,
  checked,
  onChange,
}: {
  label: string;
  sublabel?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      onClick={onChange}
      style={{
        display: "flex",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 6,
        border: `var(--border-w) solid ${checked ? "var(--text)" : "var(--border)"}`,
        background: checked ? "var(--surface-2)" : "var(--surface)",
        cursor: "pointer",
        alignItems: "flex-start",
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          border: `1.5px solid ${checked ? "var(--text)" : "var(--border-strong)"}`,
          marginTop: 2,
          flexShrink: 0,
          position: "relative",
        }}
      >
        {checked && (
          <span
            style={{
              position: "absolute",
              top: 2,
              left: 2,
              right: 2,
              bottom: 2,
              borderRadius: "50%",
              background: "var(--text)",
            }}
          />
        )}
      </span>
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 500 }}>{label}</span>
        {sublabel && (
          <span
            style={{
              display: "block",
              fontSize: 12,
              color: "var(--text-muted)",
              marginTop: 2,
            }}
          >
            {sublabel}
          </span>
        )}
      </span>
    </label>
  );
}
