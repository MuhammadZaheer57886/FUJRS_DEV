// The shopper's side of the affiliate system: the code that brought them here,
// held for the attribution window and attached to any order they place.
//
// Attribution is provisional until the backend exists — a browser store can't
// see traffic, and anyone can put any code in the URL. The server has to be
// what decides a sale really belongs to a vendor.

import {
  ATTRIBUTION_WINDOW_DAYS,
  isValidReferralCode,
  normaliseReferralCode,
} from "@/lib/referral";
import type { ReferralStore } from "../ports";
import type { CapturedReferral } from "../types";
import { readJSON, removeKey, writeJSON } from "./storage";

const KEY = "fujrs-referral";
const MS_PER_DAY = 86_400_000;

function isExpired(referral: CapturedReferral): boolean {
  const age = Date.now() - new Date(referral.capturedAt).getTime();
  return !Number.isFinite(age) || age > ATTRIBUTION_WINDOW_DAYS * MS_PER_DAY;
}

export const localReferrals: ReferralStore = {
  async get() {
    const referral = readJSON<CapturedReferral | null>(KEY, null);
    if (!referral) return null;

    if (!isValidReferralCode(referral.code) || isExpired(referral)) {
      removeKey(KEY);
      return null;
    }
    return referral;
  },

  /**
   * A later click overwrites an earlier one — last touch wins, which is the
   * simplest rule to explain to vendors and the one the backend should keep
   * unless the programme terms say otherwise.
   */
  async capture(code, productSlug) {
    if (!isValidReferralCode(code)) return null;

    const referral: CapturedReferral = {
      code: normaliseReferralCode(code),
      productSlug,
      capturedAt: new Date().toISOString(),
    };

    try {
      writeJSON(KEY, referral);
    } catch {
      // A failed write just means the referral isn't remembered. The shopper's
      // journey is unaffected, so there's nothing to surface.
      return null;
    }
    return referral;
  },

  async clear() {
    removeKey(KEY);
  },
};
