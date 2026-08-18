// The products a vendor is marketing, keyed by vendor email.
//
// Click and sale tracking is deliberately absent: attributing a sale to a
// referral needs a server that sees the traffic. The dashboard says so on
// screen rather than showing invented numbers.

import { readSession } from "@/lib/auth/session";
import { referralCodeFor } from "@/lib/referral";
import { DEMO_REFERRED_SALES, DEMO_VENDORS } from "@/lib/auth/demoData";
import { DEFAULT_COMMISSION, calculateCommission } from "@/lib/commission";
import type { AffiliateStore } from "../ports";
import type { AffiliateLink } from "../types";
import { makeId, normaliseEmail, readJSON, writeJSON } from "./storage";

const KEY = "fujrs-affiliate-links";

type LinksByVendor = Record<string, AffiliateLink[]>;

const readAll = (): LinksByVendor => readJSON<LinksByVendor>(KEY, {});

/** Whose links these are. The port carries no email — see ports.ts. */
function currentEmail(): string {
  const stored = readSession();
  if (!stored) throw new Error("Not signed in.");
  return normaliseEmail(stored.email);
}

export const localAffiliate: AffiliateStore = {
  async listLinks() {
    const mine = readAll()[currentEmail()] ?? [];
    return [...mine].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async addLink(product) {
    const key = currentEmail();
    const all = readAll();
    const existing = (all[key] ?? []).find((link) => link.productSlug === product.slug);

    const link: AffiliateLink = {
      // Keep the original id so a re-taken link stays the same row.
      id: existing?.id ?? makeId(),
      productSlug: product.slug,
      productTitle: product.title,
      productPrice: product.price,
      createdAt: new Date().toISOString(),
    };

    const rest = (all[key] ?? []).filter((l) => l.productSlug !== product.slug);
    writeJSON(KEY, { ...all, [key]: [...rest, link] });
    return link;
  },

  async removeLink(id) {
    const key = currentEmail();
    const all = readAll();
    writeJSON(KEY, { ...all, [key]: (all[key] ?? []).filter((link) => link.id !== id) });
  },

  /**
   * Fixtures, because a browser cannot see traffic. Attributing a click or a
   * sale is a fact about what the SERVER observed; anything counted here would
   * be a guess presented as a number, which is exactly what the dashboard's
   * on-screen caveat exists to avoid.
   */
  async performance() {
    const vendor = DEMO_VENDORS.find((v) => v.email === currentEmail());
    if (!vendor) {
      return {
        clicks: 0,
        sales: 0,
        earned: 0,
        pending: 0,
        commission: DEFAULT_COMMISSION,
        referralCode: referralCodeFor(currentEmail()),
      };
    }

    return {
      clicks: vendor.clicks,
      sales: vendor.sales,
      earned: vendor.earned,
      pending: vendor.pendingPayout,
      commission: vendor.commission,
      // Derived from the email on this backend — there is no issuing server.
      referralCode: vendor.referralCode,
    };
  },

  async referredSales() {
    // Read once rather than per row: every fixture sale belongs to the same
    // signed-in vendor, so looking it up inside the map would ask the same
    // question for each of them.
    const rate =
      DEMO_VENDORS.find((v) => v.email === currentEmail())?.commission ?? DEFAULT_COMMISSION;

    return DEMO_REFERRED_SALES.map((sale) => ({
      id: sale.id,
      orderNumber: sale.orderId.slice(-8).toUpperCase(),
      product: sale.product,
      salePrice: sale.salePrice,
      date: sale.date,
      // Fixtures have no hold clock behind them, so they show as credited
      // rather than inventing a return window this backend cannot run.
      status: "CREDITED" as const,
      // Derived at render on this backend — there is no commission record to
      // read back, so the current rate is the only figure available. That also
      // makes the rate below the current one rather than a real snapshot,
      // which is the honest answer here: a fixture has no history to preserve.
      commission: calculateCommission(sale.salePrice, rate),
      rate,
    }));
  },
};
