"use client";

// The shopper's side of the affiliate system: the code that brought them here.
//
// Unlike the browser build, capturing a code is a server event — it inserts a
// `referral_clicks` row, which is what turns "the dashboard says clicks aren't
// real yet" into a number that means something. The route also validates the
// code against a real vendor, so a made-up code in a URL credits nobody.
//
// The captured code lives in a cookie rather than localStorage so the SERVER
// can see it too: the order route re-derives the referral instead of trusting
// what the browser posts.

import { ATTRIBUTION_WINDOW_DAYS, REFERRAL_COOKIE, isValidReferralCode } from "@/lib/referral";
import type { ReferralStore } from "../ports";
import type { CapturedReferral } from "../types";

const MS_PER_DAY = 86_400_000;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = new RegExp(`(?:^|;\\s*)${name}=([^;]*)`).exec(document.cookie);
  return match ? decodeURIComponent(match[1]) : null;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Max-Age=0; path=/`;
}

function isExpired(capturedAt: string): boolean {
  const age = Date.now() - new Date(capturedAt).getTime();
  return !Number.isFinite(age) || age > ATTRIBUTION_WINDOW_DAYS * MS_PER_DAY;
}

export const supabaseReferrals: ReferralStore = {
  async get() {
    const raw = readCookie(REFERRAL_COOKIE);
    if (!raw) return null;

    const [code, productSlug, capturedAt] = raw.split("|");

    // The cookie has a Max-Age, but a clock change or a hand-edited cookie can
    // outlive it — the window is a rule, not a storage detail.
    if (!code || !isValidReferralCode(code) || !capturedAt || isExpired(capturedAt)) {
      clearCookie(REFERRAL_COOKIE);
      return null;
    }

    return { code, productSlug: productSlug || null, capturedAt };
  },

  async capture(code, productSlug) {
    // Shape-checked here purely to avoid a pointless round trip; the route
    // checks it again, and only the route can say whether a vendor owns it.
    if (!isValidReferralCode(code)) return null;

    try {
      const response = await fetch("/api/referrals/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, productSlug }),
      });

      const payload: { referral?: CapturedReferral | null } = await response.json();
      return payload.referral ?? null;
    } catch {
      // A failed capture just means the visit isn't credited. The shopper's
      // journey is unaffected, so there is nothing to surface.
      return null;
    }
  },

  async clear() {
    clearCookie(REFERRAL_COOKIE);
  },
};
