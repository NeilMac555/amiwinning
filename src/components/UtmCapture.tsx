"use client";

// Thin client wrapper around captureUtmFromUrl. Renders nothing — it
// only exists to run the sessionStorage capture inside a useEffect
// (which is client-only, React 19 purity-safe).
//
// Mount on the landing page (/) and the sign-in page. Every other
// page inherits the captured attribution via sessionStorage, so
// there is no reason to mount it elsewhere.

import { useEffect } from "react";
import { captureUtmFromUrl } from "@/lib/utm";

export function UtmCapture() {
  useEffect(() => {
    captureUtmFromUrl();
  }, []);
  return null;
}
