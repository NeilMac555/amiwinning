"use client";

import { useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { UnitProvider, type DisplayUnit } from "@/components/UnitContext";
import { useSettings, saveSettings, type Theme, type UserSettings } from "@/lib/settings";
import { clearBets, loadBets } from "@/lib/import/store";
import { useAuth } from "@/lib/auth";
import { createBook, deleteBook, updateBook, type OddsFormat } from "@/lib/books";

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
  const [clearTick, setClearTick] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [newBookName, setNewBookName] = useState("");
  const [creatingBook, setCreatingBook] = useState(false);
  const [confirmDeleteBookId, setConfirmDeleteBookId] = useState<string | null>(
    null,
  );

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

            <Section title="Theme" subtitle="Light is the default. Dark mode swaps the surface, text, and accent tokens.">
              <div style={{ display: "flex", gap: 8 }}>
                {(["light", "dark"] as Theme[]).map((t) => (
                  <button
                    key={t}
                    className="btn-ghost"
                    data-active={settings.theme === t ? "true" : undefined}
                    onClick={() => update({ theme: t })}
                    style={{
                      padding: "8px 16px",
                      fontSize: 13,
                      textTransform: "capitalize",
                    }}
                  >
                    {t}
                  </button>
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

            <Section title="Imported data" subtitle="Bets imported from a spreadsheet, synced to your account.">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 14,
                }}
              >
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {importedCount > 0
                    ? `${importedCount.toLocaleString()} bets currently stored.`
                    : "No imported bets."}
                </span>
                {importedCount > 0 && (
                  <button
                    className="btn-ghost"
                    onClick={onClearData}
                    style={{
                      padding: "6px 14px",
                      fontSize: 12,
                      color: confirmClear ? "var(--red)" : "var(--text-muted)",
                      border: confirmClear ? "var(--border-w) solid var(--red)" : undefined,
                    }}
                  >
                    {confirmClear ? "Click again to confirm" : "Clear all imported data"}
                  </button>
                )}
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
                <li>· Profile: handle, avatar, bio, public toggle</li>
                <li>· Bookmaker accounts and balances</li>
                <li>· CLV preferences (devig method, source priority)</li>
                <li>· Connected accounts (X / Twitter OAuth)</li>
                <li>· Data export (CSV / JSON)</li>
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
