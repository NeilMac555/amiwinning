"use client";

// Tiny sync indicator. Sits at the bottom of the sidebar.
//
// Three states:
//   - "synced" (default) — green dot, "Synced"
//   - "pending" — amber dot, "{n} bet(s) pending"  with hover tooltip
//   - "offline" — grey dot, "Offline · saved locally"
//
// Polls the local cache for the _pending count every 5s; also listens
// to online/offline events. The flush worker in auth.tsx is what
// actually pushes pending writes — this component is read-only.

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { countPendingSyncs } from "@/lib/bet-sync";

function readOnlineState(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export function SyncStatus() {
  const { user, betsVersion } = useAuth();
  const [pending, setPending] = useState(0);
  const [online, setOnline] = useState(true);

  // Recompute pending count every 5s while signed in. Cheap — just reads
  // localStorage and filters. Skip when signed out (nothing to sync).
  useEffect(() => {
    if (!user) {
      queueMicrotask(() => setPending(0));
      return;
    }
    const tick = () => setPending(countPendingSyncs());
    queueMicrotask(tick);
    const id = window.setInterval(tick, 5_000);
    return () => window.clearInterval(id);
    // betsVersion in deps so the count updates instantly after an
    // auth-context flush (no need to wait for the next 5s tick).
  }, [user, betsVersion]);

  useEffect(() => {
    const update = () => setOnline(readOnlineState());
    queueMicrotask(update);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!user) return null;

  let dot: string;
  let label: string;
  let tip: string;
  if (!online) {
    dot = "var(--text-faint)";
    label = "Offline";
    tip = "Network unavailable — bets are still being saved locally and will sync when you reconnect.";
  } else if (pending > 0) {
    dot = "#D8A93A"; // amber
    label = `${pending} pending`;
    tip = `${pending} bet${pending === 1 ? "" : "s"} not yet synced to the cloud. Retrying automatically.`;
  } else {
    dot = "var(--green)";
    label = "Synced";
    tip = "All bets are safely backed up to the cloud.";
  }

  return (
    <div
      title={tip}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--mono)",
        fontSize: 10,
        color: "var(--text-faint)",
        letterSpacing: "0.04em",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: dot,
          flexShrink: 0,
        }}
      />
      <span>{label}</span>
    </div>
  );
}
