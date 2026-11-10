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
//
// The API route needs a signed-in user, so pass enabled=false when
// there isn't one: the hook then does nothing and reports "no insight".

import { useEffect, useState } from "react";
import type { Leak } from "@/lib/leaks";
import { authedFetch } from "@/lib/authed-fetch";

const CACHE_PREFIX = "aiw_leak_insight_v2_";
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

// The answer for one fingerprint. Storing the key alongside the result
// means a card whose leak changes never shows the previous leak's text:
// a result only counts while its key matches the current one.
interface Settled {
  key: string;
  insight: string | null;
  error: boolean;
}

export function useLeakInsight(
  leak: Leak,
  tone: Tone,
  enabled = true,
): UseLeakInsightResult {
  const key = fingerprint(leak, tone);
  const body = JSON.stringify({
    dimension: leak.dimension,
    label: leak.label,
    n: leak.n,
    pl: leak.pl,
    yieldPct: leak.yieldPct,
    avgOdds: leak.avgOdds,
    winRate: leak.winRate,
    tone,
  });
  const [settled, setSettled] = useState<Settled | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const settle = (insight: string | null, error: boolean) => {
      if (!cancelled) setSettled({ key, insight, error });
    };
    void (async () => {
      // Cache is read here, not during render, so the server-rendered
      // HTML and the first client render always agree.
      await Promise.resolve();
      const cached = readCache(key);
      if (cached) {
        settle(cached, false);
        return;
      }
      try {
        const r = await authedFetch("/api/leaks/insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = (await r.json()) as { insight?: string };
        if (!data.insight) {
          settle(null, true);
          return;
        }
        writeCache(key, data.insight);
        settle(data.insight, false);
      } catch {
        settle(null, true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, body, enabled]);

  const current = settled && settled.key === key ? settled : null;
  return {
    insight: current?.insight ?? null,
    loading: enabled && !current,
    error: current?.error ?? false,
  };
}
