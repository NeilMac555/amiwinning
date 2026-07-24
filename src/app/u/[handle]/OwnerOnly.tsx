"use client";

// OwnerOnly — renders children only when the signed-in viewer is the
// profile owner. Used to keep leak/edge-adjacent breakdown tables
// (by sport, market, odds, competition) private on public profile
// pages. Signed-out visitors and signed-in strangers both see
// nothing where the block would render.
//
// Silent rather than showing a "private" placeholder — telling
// strangers "there's data here you can't see" is louder than just
// omitting the block. If we ever want to invite the owner's viewers
// to sign up for their own analytics, that's a separate CTA, not
// something to layer into this component.

import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";

interface Props {
  ownerUserId: string | undefined;
  /** Profile handle — used solely to exempt `/u/sample`, the marketing
   *  demo page, from the owner-only check. That page is a public tour
   *  of what a full profile looks like; it must render for everyone. */
  handle?: string;
  children: ReactNode;
}

export function OwnerOnly({ ownerUserId, handle, children }: Props) {
  const { user, loading } = useAuth();
  // Sample profile bypass — matches the same exemption in ProfileGate
  // so the two components stay in sync about which handles are public.
  if (handle === "sample") return <>{children}</>;
  // While auth is resolving, render nothing to avoid a flash of
  // owner-content to non-owners on a slow connection.
  if (loading) return null;
  if (!user || !ownerUserId || user.id !== ownerUserId) return null;
  return <>{children}</>;
}
