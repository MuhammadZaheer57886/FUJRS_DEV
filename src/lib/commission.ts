// What a vendor earns on a sale they referred. A Super Admin sets the rate per
// vendor — vendors see theirs but never change it. Both dashboards read the
// maths from here so the number never drifts between the two screens.

import { RETURN_WINDOW_DAYS } from "./refunds";

export const COMMISSION_TYPES = ["PERCENT", "FLAT"] as const;
export type CommissionType = (typeof COMMISSION_TYPES)[number];

export interface CommissionRate {
  type: CommissionType;
  /** Percent of the sale price, or a flat PKR amount per sale. */
  value: number;
}

export const COMMISSION_TYPE_LABELS: Record<CommissionType, string> = {
  PERCENT: "Percentage of sale",
  FLAT: "Flat amount per sale",
};

/**
 * Where a commission has got to. Mirrors the `commission_status` enum.
 *
 * It lives here rather than in the data layer because it is a domain fact, not
 * a storage detail: the hold below is what moves a row from PENDING to
 * CREDITED, and a refund is what moves it to REVERSED.
 */
export const COMMISSION_STATUSES = ["PENDING", "CREDITED", "PAID", "REVERSED"] as const;
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];

/**
 * What each state is called on the vendor's own screen.
 *
 * The database words are right for the database and wrong for a person. A
 * vendor looking at their money needs to know that PENDING is a clock running,
 * not a payment that failed.
 */
export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  PENDING: "On hold",
  CREDITED: "Available",
  PAID: "Paid out",
  REVERSED: "Reversed",
};

export const DEFAULT_COMMISSION: CommissionRate = { type: "PERCENT", value: 10 };

/**
 * How long after DELIVERY before commission is the vendor's to draw.
 *
 * Commission is written PENDING and only counts toward a balance once it is
 * CREDITED, because a refund reverses it — paying out on a sale that can still
 * come back is how an affiliate programme loses money.
 *
 * This is the returns window, not an independent number, so it reads the one
 * definition in `src/lib/refunds.ts` rather than restating it: a refund request
 * is only accepted inside that window, and a hold shorter than it would pay a
 * vendor out on a sale that can still come back. Counted from delivery for the
 * same reason: an order placed on the 1st and delivered on the 10th is
 * returnable until the 24th.
 *
 * Changing it means changing three things together: RETURN_WINDOW_DAYS, the
 * `credit_due_commissions` function in the hold_from_delivery migration, and
 * the copy on the returns page.
 */
export const COMMISSION_HOLD_DAYS = RETURN_WINDOW_DAYS;

/** Bounds for the Super Admin's rate input. */
export const MAX_COMMISSION_PERCENT = 100;
export const MAX_COMMISSION_FLAT = 1_000_000;

/** Null when the rate is usable, otherwise the reason to show the Super Admin. */
export function validateCommission(rate: CommissionRate): string | null {
  if (!Number.isFinite(rate.value) || rate.value < 0) {
    return "Commission can't be negative.";
  }
  if (rate.type === "PERCENT" && rate.value > MAX_COMMISSION_PERCENT) {
    return `Percentage can't be above ${MAX_COMMISSION_PERCENT}%.`;
  }
  if (rate.type === "FLAT" && rate.value > MAX_COMMISSION_FLAT) {
    return `Flat commission can't be above PKR ${MAX_COMMISSION_FLAT.toLocaleString()}.`;
  }
  return null;
}

export function calculateCommission(salePrice: number, rate: CommissionRate): number {
  if (salePrice <= 0 || rate.value <= 0) return 0;
  const earned = rate.type === "PERCENT" ? (salePrice * rate.value) / 100 : rate.value;
  // A flat rate on a cheap piece must never pay out more than the sale itself.
  return Math.round(Math.min(earned, salePrice));
}

export function formatCommissionRate(rate: CommissionRate): string {
  return rate.type === "PERCENT" ? `${rate.value}%` : `PKR ${rate.value.toLocaleString()}`;
}
