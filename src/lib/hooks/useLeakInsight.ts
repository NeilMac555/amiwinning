"use client";

// useLeakInsight — fetches an AI one-line insight for a single leak
// or edge card on /analytics/leaks. Cached in localStorage so tab-
// re-renders + subsequent visits don't re-call the API for the same
// leak. Cache is keyed by a stable fingerprint of the leak numbers
// (dimension + label + n + rounded pl/yield) so an insight regenerates
// when a slice's numbers meaningfully change.
//
// States: loading | insight ready | error. Cards decide how to
// render each — typically loading = subtle placeholder, error =
// hide the insight row entirely.

import { useEffect, useState } from "react";
import type { Leak } from "@/lib/leaks";

const CACHE_PREFIX = "aiw_leak_insight_v1_";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type Tone = "leak" | "strength";

interface CacheEntry {
  insight: string;
  ts: number;
}

/**
 * Build a stable cache key for a leak. Numbers are rounded so tiny
 * fluctuations (e.g. one new losing bet nudging P/L from -19.74 to
 * -20.15) don't invalidate the cache — the insight would still read
 * essentially the same. Rounding buckets: pl to nearest unit, yield
 * to nearest 0.5%.
 */
function fingerprint(leak: Leak, tone: Tone): string {
  const plBucket = Math.round(leak.pl);
  const yieldBucket = Math.round(leak.yieldPct * 2) / 2;
  return `${CACHE_PREFIX}${tone}|${leak.dimension}|${leak.label}|n=${leak.n}|pl=${plBucket}|y=${yieldBucket}`;
}

function readCache(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (!parsed?.insight || !parsed?.ts) return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.insight;
  } catch {
    return null;
  }
}

function writeCache(key: string, insight: string): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry = { insight, ts: Date.now() };
    window.localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage full / disabled — silent. The insight still
    // rendered this session; next session it'll re-fetch. Acceptable.
  }
}

export interface UseLeakInsightResult {
  insight: string | null;
  loading: boolean;
  error: boolean;
}

export function useLeakInsight(leak: Leak, tone: Tone): UseLeakInsightResult {
  const key = fingerprint(leak, tone);
  const cached = readCache(key);
  const [insight, setInsight] = useState<string | null>(cached);
  const [loading, setLoading] = useState<boolean>(!cached);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (cached) return; // Already resolved from cache, no fetch needed.
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch("/api/leaks/insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dimension: leak.dimension,
        label: leak.label,
        n: leak.n,
        pl: leak.pl,
        yieldPct: leak.yieldPct,
        avgOdds: leak.avgOdds,
        winRate: leak.winRate,
        tone,
      }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: { insight?: string }) => {
        if (cancelled) return;
        if (!data.insight) {
          setError(true);
          setLoading(false);
          return;
        }
        setInsight(data.insight);
        setLoading(false);
        writeCache(key, data.insight);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { insight, loading, error };
}
