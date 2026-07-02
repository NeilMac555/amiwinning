"use client";

// /admin — operator console. Lists every signed-up user with their
// activity stats. Access is gated server-side by the email allow-list;
// non-admins hitting this page see a 403 from the API and a "no access"
// message in the UI.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { UnitProvider } from "@/components/UnitContext";
import { useAuth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { supabase } from "@/lib/supabase";
import { applyThemeForSignedIn, useSettings } from "@/lib/settings";

interface UserRow {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  bets: number;
  books: number;
  hasLoggedABet: boolean;
  activeLast7d: boolean;
}

interface Totals {
  users: number;
  withABet: number;
  activeLast7d: number;
  totalBets: number;
}

type SortKey = "createdAt" | "lastSignInAt" | "bets" | "books" | "email";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

function fmtRelative(iso: string | null): string {
  if (!iso) return "never";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return fmtDate(iso);
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const unit = useSettings().unit;
  const [rows, setRows] = useState<UserRow[] | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    applyThemeForSignedIn();
  }, []);

  const canSeeAdmin =
    !authLoading && user != null && isAdminEmail(user.email);

  const fetchUsers = useCallback(async () => {
    if (!user || !supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError("No access token — try signing out and back in.");
        return;
      }
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? `HTTP ${res.status}`);
        return;
      }
      setRows(body.rows);
      setTotals(body.totals);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Kick off the user fetch once admin access is confirmed. fetchUsers
  // itself calls setLoading/setRows; we defer the call so those don't fire
  // synchronously inside this effect's body (React 19 rule).
  useEffect(() => {
    if (!canSeeAdmin) return;
    queueMicrotask(() => {
      void fetchUsers();
    });
  }, [canSeeAdmin, fetchUsers]);

  const sorted = useMemo(() => {
    if (!rows) return [];
    const arr = [...rows];
    arr.sort((a, b) => {
      let av: number | string = 0;
      let bv: number | string = 0;
      switch (sortKey) {
        case "createdAt":
          av = new Date(a.createdAt).getTime();
          bv = new Date(b.createdAt).getTime();
          break;
        case "lastSignInAt":
          av = a.lastSignInAt ? new Date(a.lastSignInAt).getTime() : 0;
          bv = b.lastSignInAt ? new Date(b.lastSignInAt).getTime() : 0;
          break;
        case "bets":
          av = a.bets;
          bv = b.bets;
          break;
        case "books":
          av = a.books;
          bv = b.books;
          break;
        case "email":
          av = a.email;
          bv = b.email;
          break;
      }
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc"
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number);
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  const onSort = (k: SortKey) => {
    if (k === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir(k === "email" ? "asc" : "desc");
    }
  };

  const arrow = (k: SortKey) =>
    sortKey === k ? (
      <span className="sort-arrow">{sortDir === "asc" ? "↑" : "↓"}</span>
    ) : null;

  // ─ Render ────────────────────────────────────────────────────────────

  if (!authLoading && !canSeeAdmin) {
    return (
      <UnitProvider unit={unit}>
        <div className="app">
          <Sidebar />
          <div className="main-col">
            <TopBar />
            <div className="page">
              <div className="page-header">
                <div>
                  <h1 className="page-title">Admin</h1>
                  <div className="page-subtitle">
                    You don&rsquo;t have access to this page.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UnitProvider>
    );
  }

  return (
    <UnitProvider unit={unit}>
      <div className="app">
        <Sidebar />
        <div className="main-col">
          <TopBar />
          <div className="page">
            <div className="page-header">
              <div>
                <h1 className="page-title">Admin</h1>
                <div className="page-subtitle">
                  Every signed-up user, what they&rsquo;ve done so far.
                </div>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={fetchUsers}
                disabled={loading}
                style={{ padding: "6px 14px", fontSize: 12 }}
              >
                {loading ? "Refreshing…" : "Refresh"}
              </button>
            </div>

            {error && (
              <div
                style={{
                  marginTop: 14,
                  padding: "10px 16px",
                  background: "var(--red-bg)",
                  border: "var(--border-w) solid var(--red)",
                  borderRadius: 8,
                  fontSize: 12.5,
                  color: "var(--red)",
                }}
              >
                {error}
              </div>
            )}

            {totals && (
              <div className="kpi-strip" style={{ marginTop: 14, gridTemplateColumns: "repeat(4, 1fr)" }}>
                <div className="kpi">
                  <div className="kpi-label">Users</div>
                  <div className="kpi-value mono">
                    {totals.users.toLocaleString()}
                  </div>
                  <div className="kpi-foot">
                    <div className="kpi-meta">
                      <span style={{ color: "var(--text-faint)" }}>
                        signed up total
                      </span>
                    </div>
                  </div>
                </div>
                <div className="kpi">
                  <div className="kpi-label">Active 7d</div>
                  <div className="kpi-value mono num-pos">
                    {totals.activeLast7d.toLocaleString()}
                  </div>
                  <div className="kpi-foot">
                    <div className="kpi-meta">
                      <span style={{ color: "var(--text-faint)" }}>
                        signed in this week
                      </span>
                    </div>
                  </div>
                </div>
                <div className="kpi">
                  <div className="kpi-label">Engaged</div>
                  <div className="kpi-value mono">
                    {totals.withABet.toLocaleString()}
                  </div>
                  <div className="kpi-foot">
                    <div className="kpi-meta">
                      <span style={{ color: "var(--text-faint)" }}>
                        logged at least 1 bet
                      </span>
                    </div>
                  </div>
                </div>
                <div className="kpi">
                  <div className="kpi-label">Total bets</div>
                  <div className="kpi-value mono">
                    {totals.totalBets.toLocaleString()}
                  </div>
                  <div className="kpi-foot">
                    <div className="kpi-meta">
                      <span style={{ color: "var(--text-faint)" }}>
                        across all users
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div
              className="card"
              style={{ marginTop: 14, padding: 0, overflow: "hidden" }}
            >
              <table className="tbl" data-density="dense">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => onSort("email")}>
                      Email {arrow("email")}
                    </th>
                    <th
                      className="sortable"
                      onClick={() => onSort("createdAt")}
                    >
                      Signed up {arrow("createdAt")}
                    </th>
                    <th
                      className="sortable"
                      onClick={() => onSort("lastSignInAt")}
                    >
                      Last sign-in {arrow("lastSignInAt")}
                    </th>
                    <th className="num sortable" onClick={() => onSort("books")}>
                      Books {arrow("books")}
                    </th>
                    <th className="num sortable" onClick={() => onSort("bets")}>
                      Bets {arrow("bets")}
                    </th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && !rows && (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          padding: 28,
                          textAlign: "center",
                          color: "var(--text-faint)",
                          fontSize: 12,
                        }}
                      >
                        Loading users…
                      </td>
                    </tr>
                  )}
                  {!loading && rows && rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          padding: 28,
                          textAlign: "center",
                          color: "var(--text-faint)",
                          fontSize: 12,
                        }}
                      >
                        No users yet. Once people sign up they&rsquo;ll show up here.
                      </td>
                    </tr>
                  )}
                  {sorted.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontFamily: "var(--mono)", fontSize: 11.5 }}>
                        {u.email}
                      </td>
                      <td className="mono" style={{ fontSize: 11 }}>
                        {fmtDate(u.createdAt)}
                      </td>
                      <td className="mono" style={{ fontSize: 11 }}>
                        {fmtRelative(u.lastSignInAt)}
                      </td>
                      <td className="num mono" style={{ fontSize: 11 }}>
                        {u.books}
                      </td>
                      <td className="num mono" style={{ fontSize: 11 }}>
                        {u.bets.toLocaleString()}
                      </td>
                      <td>
                        {u.activeLast7d ? (
                          <span className="badge win">active</span>
                        ) : u.hasLoggedABet ? (
                          <span className="badge">engaged</span>
                        ) : (
                          <span className="badge void">signed up</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                marginTop: 12,
                fontSize: 11,
                color: "var(--text-faint)",
                fontFamily: "var(--mono)",
              }}
            >
              Data sourced live from Supabase. Refresh to re-poll.
            </div>
          </div>
        </div>
      </div>
    </UnitProvider>
  );
}
