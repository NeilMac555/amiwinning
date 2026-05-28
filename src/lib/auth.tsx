"use client";

// Auth context. Subscribes to Supabase auth state changes and exposes a
// useAuth() hook returning { user, loading, signInWithEmail, signOut }.
//
// When Supabase isn't configured, useAuth returns a stable "no user" state
// and signInWithEmail returns an error — but the rest of the app still
// works in localStorage-only mode.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./supabase";
import { migrateLocalToSupabase, type MigrationResult } from "./migration";
import { pullFromSupabase } from "./bet-sync";
import { runDataCleanup, type CleanupResult } from "./data-cleanup";
import { setCurrentUserId } from "./import/store";
import {
  ensureDefaultBook,
  loadActiveBookId,
  saveActiveBookId,
  type Book,
} from "./books";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  configured: boolean;
  migration: MigrationResult | null;
  /** Result of the one-shot data cleanup pass (sport reclassification +
   *  future-kickoff fixes). Null until the user is signed in and cleanup
   *  has run. */
  cleanup: CleanupResult | null;
  /** Increments whenever the local bet cache is refreshed from Supabase.
   *  Pages depend on this so their data re-reads after a pull. */
  betsVersion: number;
  /** All books owned by the signed-in user. Empty array when signed out. */
  books: Book[];
  /** The currently active book (whose bets the UI is scoped to). */
  activeBook: Book | null;
  setActiveBook: (id: string) => void;
  /** Re-fetch the books list — call after creating/renaming/deleting a book. */
  refreshBooks: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const noop = async () => {};

const Ctx = createContext<AuthContextValue>({
  user: null,
  loading: true,
  configured: false,
  migration: null,
  cleanup: null,
  betsVersion: 0,
  books: [],
  activeBook: null,
  setActiveBook: () => {},
  refreshBooks: async () => {},
  signInWithEmail: async () => ({ error: "Supabase not configured" }),
  signOut: noop,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // If Supabase isn't configured, there's no async work to wait for — start
  // out of the loading state so the UI doesn't sit on a spinner forever.
  const [loading, setLoading] = useState(() => Boolean(supabase));
  const [migration, setMigration] = useState<MigrationResult | null>(null);
  const [cleanup, setCleanup] = useState<CleanupResult | null>(null);
  const [betsVersion, setBetsVersion] = useState(0);
  const [books, setBooks] = useState<Book[]>([]);
  const [activeBookId, setActiveBookIdState] = useState<string | null>(null);

  const refreshBooks = useCallback(async (): Promise<void> => {
    if (!user) {
      setBooks([]);
      return;
    }
    const list = await ensureDefaultBook(user.id);
    setBooks(list);
    // If no active book set, or the saved one isn't in the list anymore,
    // fall back to the first book.
    const savedId = loadActiveBookId();
    const valid = list.find((b) => b.id === savedId);
    const next = valid ?? list[0] ?? null;
    if (next && next.id !== savedId) saveActiveBookId(next.id);
    setActiveBookIdState(next?.id ?? null);
  }, [user]);

  const setActiveBook = useCallback((id: string) => {
    saveActiveBookId(id);
    setActiveBookIdState(id);
    // Bump betsVersion so all pages re-render with the new book filter.
    setBetsVersion((v) => v + 1);
  }, []);

  const activeBook = useMemo(
    () => books.find((b) => b.id === activeBookId) ?? null,
    [books, activeBookId],
  );

  useEffect(() => {
    // No-supabase early return — `loading` was already initialised to false
    // above based on the same condition, so there's nothing to set here.
    if (!supabase) return;
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setUser(session?.user ?? null);
      },
    );
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Plumb the current user ID into the store module so writes know whether
  // to also push to Supabase. Cleared when user signs out.
  useEffect(() => {
    setCurrentUserId(user?.id ?? null);
  }, [user]);

  // On sign-in: load books, migrate any localStorage bets up, then pull the
  // canonical state back down. Bump betsVersion so any mounted pages re-read.
  // On sign-out (user becomes null): clear book state. Cleanup is deferred
  // via queueMicrotask to satisfy React 19's no-synchronous-setState rule.
  useEffect(() => {
    if (!user) {
      queueMicrotask(() => {
        setBooks([]);
        setActiveBookIdState(null);
      });
      return;
    }
    let cancelled = false;
    (async () => {
      // 1. Make sure the user has at least one book; pick an active one.
      await refreshBooks();
      if (cancelled) return;
      // 2. Push any local bets up (they'll already have bookId from the
      //    backfill or from when they were created post-books).
      const result = await migrateLocalToSupabase(user.id);
      if (cancelled) return;
      setMigration(result);
      if (result.status === "error") {
         
        console.error("[aiw] bet migration failed:", result.error);
      } else if (result.status === "done" && (result.count ?? 0) > 0) {
         
        console.info(`[aiw] migrated ${result.count} bets to Supabase`);
      }
      // 3. Pull canonical state back into the local cache.
      const pulled = await pullFromSupabase();
      if (cancelled) return;
      if (pulled >= 0) {
         
        console.info(`[aiw] pulled ${pulled} bets from Supabase`);
        setBetsVersion((v) => v + 1);
      }
      // 4. One-shot data cleanup — reclassify sports + clamp future-dated
      //    settled kickoffs. Runs after the pull so it operates on the
      //    canonical post-Supabase data, and pushes its changes back up.
      const cleanupResult = await runDataCleanup({ userId: user.id });
      if (cancelled) return;
      setCleanup(cleanupResult);
      if (cleanupResult.status === "done") {
        const fixed =
          cleanupResult.sportReclassified + cleanupResult.datesFixed;
        if (fixed > 0) {
           
          console.info(
            `[aiw] cleanup: reclassified ${cleanupResult.sportReclassified} sports, fixed ${cleanupResult.datesFixed} dates`,
          );
          setBetsVersion((v) => v + 1);
        }
      } else if (cleanupResult.status === "error") {
         
        console.error("[aiw] cleanup failed:", cleanupResult.error);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const signInWithEmail = useCallback(async (email: string) => {
    if (!supabase) return { error: "Supabase not configured" };
    const trimmed = email.trim();
    if (!trimmed) return { error: "Email is required" };
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured: isSupabaseConfigured,
      migration,
      cleanup,
      betsVersion,
      books,
      activeBook,
      setActiveBook,
      refreshBooks,
      signInWithEmail,
      signOut,
    }),
    [
      user,
      loading,
      migration,
      cleanup,
      betsVersion,
      books,
      activeBook,
      setActiveBook,
      refreshBooks,
      signInWithEmail,
      signOut,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
