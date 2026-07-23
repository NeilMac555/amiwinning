// HMAC-signed unsubscribe tokens.
//
// Design goal: let the /api/unsubscribe/<token> route verify that a
// clicked link is legitimately from us WITHOUT storing a token table.
// The token itself carries (userId + expiry) plus an HMAC signature
// computed with a server-only secret. Verification recomputes the HMAC
// and does a constant-time compare.
//
// Wire format: base64url(userId | ':' | expiryUnixSeconds | ':' | sigHex)
// where sig = HMAC_SHA256(secret, `${userId}:${expiryUnixSeconds}`).
//
// Expiry: tokens live 90 days by default — long enough that a user who
// gets a drip email today can still click the link a month later, short
// enough that a leaked email doesn't remain an unsubscribe oracle forever.
//
// Required env: EMAIL_UNSUBSCRIBE_SECRET (any long random string, kept
// alongside the other Resend / webhook secrets on Railway).

import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days

function b64urlEncode(s: string): string {
  return Buffer.from(s, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(s: string): string {
  const pad = s.length % 4;
  const padded = pad ? s + "=".repeat(4 - pad) : s;
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64")
    .toString("utf8");
}

function sign(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Mint an unsubscribe token for a user, valid for 90 days.
 * Returns a placeholder string when EMAIL_UNSUBSCRIBE_SECRET is not set.
 * The placeholder will fail verification, so links generated without a
 * configured secret are visually valid but won't actually unsubscribe
 * anyone — that's the right dev-time behavior for the preview page.
 * Production must set the env var; the cron will fail-loud without it.
 */
export function mintUnsubscribeToken(userId: string): string {
  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET;
  if (!secret) {
    return "PREVIEW_TOKEN_NOT_CONFIGURED";
  }
  const expiry = Math.floor(Date.now() / 1000) + DEFAULT_TTL_SECONDS;
  const payload = `${userId}:${expiry}`;
  const sig = sign(secret, payload);
  return b64urlEncode(`${payload}:${sig}`);
}

/**
 * Verify a token. Returns userId on success, null on any failure
 * (bad format, expired, bad signature). All failures collapse to null
 * so the caller cannot distinguish reasons — that's deliberate.
 */
export function verifyUnsubscribeToken(token: string): string | null {
  try {
    const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET;
    if (!secret) return null;
    const decoded = b64urlDecode(token);
    const parts = decoded.split(":");
    if (parts.length !== 3) return null;
    const [userId, expiryStr, sigHex] = parts;
    const expiry = Number(expiryStr);
    if (!Number.isFinite(expiry)) return null;
    if (expiry < Math.floor(Date.now() / 1000)) return null;
    const expectedSig = sign(secret, `${userId}:${expiry}`);
    // Constant-time comparison — protects against timing-based signature
    // guessing. Both must be same length or timingSafeEqual throws.
    const a = Buffer.from(sigHex, "hex");
    const b = Buffer.from(expectedSig, "hex");
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
    return userId;
  } catch {
    return null;
  }
}
