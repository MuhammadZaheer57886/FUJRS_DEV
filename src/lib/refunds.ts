// Who may ask for their money back, when, and what staff can do about it.
//
// Pure rules, no I/O (CLAUDE.md): the customer's order page, the admin queue,
// the data adapters and the SQL in `20260816000023_refund_requests.sql` all
// have to agree on one definition of "still returnable", and this is it.
//
// The shape of the flow is deliberate. A refund is CUSTOMER-INITIATED: the
// customer raises a request against a delivered order, staff approve or
// decline it, and approving is what moves the order to REFUNDED. Staff have no
// button that refunds an order out of nowhere, because a refund with no
// request behind it has no reason, no date and nobody who asked for it, which
// is exactly what an audit trail is supposed to answer.

import type { OrderStatus } from "./orderStatus";

/**
 * How long after delivery a piece can still be sent back.
 *
 * /returns-exchanges promises 14 days from delivery, and `COMMISSION_HOLD_DAYS`
 * is held to this same number so a vendor is never paid out on a sale that is
 * still returnable. Changing it means changing this constant, the copy on the
 * returns page, and the interval in the refund_requests migration together.
 */
export const RETURN_WINDOW_DAYS = 14;

export const REFUND_REQUEST_STATUSES = ["REQUESTED", "APPROVED", "DECLINED"] as const;

export type RefundRequestStatus = (typeof REFUND_REQUEST_STATUSES)[number];

export const REFUND_REQUEST_STATUS_LABELS: Record<RefundRequestStatus, string> = {
  REQUESTED: "Awaiting Review",
  APPROVED: "Approved",
  DECLINED: "Declined",
};

/** What the customer is told while their request sits in each state. */
export const REFUND_REQUEST_STATUS_NOTES: Record<RefundRequestStatus, string> = {
  REQUESTED: "We have your request and are reviewing it. You will hear from us shortly.",
  APPROVED: "Your refund was approved. Our team will confirm how the money comes back to you.",
  DECLINED:
    "Your request was declined. Reply to your order email if you would like it looked at again.",
};

/** Still waiting on staff. Only one of these may be open per order. */
export function isOpenRefundRequest(status: RefundRequestStatus): boolean {
  return status === "REQUESTED";
}

export const MIN_REFUND_REASON_LENGTH = 10;
export const MAX_REFUND_REASON_LENGTH = 500;

/** Null when the reason is usable, otherwise what to show the customer. */
export function validateRefundReason(reason: string): string | null {
  const trimmed = reason.trim();
  if (trimmed.length < MIN_REFUND_REASON_LENGTH) {
    return `Tell us what went wrong, in at least ${MIN_REFUND_REASON_LENGTH} characters.`;
  }
  if (trimmed.length > MAX_REFUND_REASON_LENGTH) {
    return `Please keep this under ${MAX_REFUND_REASON_LENGTH} characters.`;
  }
  return null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** When the window shuts, counted from delivery rather than from the order. */
export function returnWindowClosesAt(deliveredAt: string): Date {
  return new Date(new Date(deliveredAt).getTime() + RETURN_WINDOW_DAYS * DAY_MS);
}

/** Whole days still on the clock, floored at zero. */
export function returnWindowDaysLeft(deliveredAt: string, now: Date = new Date()): number {
  const remaining = returnWindowClosesAt(deliveredAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(remaining / DAY_MS));
}

export interface RefundEligibilityInput {
  status: OrderStatus;
  /** When the order was marked delivered, or null for orders placed before it was recorded. */
  deliveredAt: string | null;
  /** The latest request against this order, if there is one. */
  existingRequest: RefundRequestStatus | null;
}

export type RefundEligibility = { canRequest: true } | { canRequest: false; reason: string };

/**
 * Whether the customer looking at this order may raise a refund request.
 *
 * This is UX, not the boundary: RLS and a trigger re-check the same rules on
 * the way into the database (CLAUDE.md).
 */
export function refundEligibility(
  input: RefundEligibilityInput,
  now: Date = new Date()
): RefundEligibility {
  const { status, deliveredAt, existingRequest } = input;

  if (existingRequest === "REQUESTED") {
    return { canRequest: false, reason: "Your refund request is already with our team." };
  }
  if (existingRequest === "APPROVED") {
    return { canRequest: false, reason: "This order has already been refunded." };
  }
  if (existingRequest === "DECLINED") {
    return { canRequest: false, reason: "A refund was already reviewed for this order." };
  }

  if (status === "REFUNDED") {
    return { canRequest: false, reason: "This order has already been refunded." };
  }
  if (status === "CANCELLED") {
    return {
      canRequest: false,
      reason: "This order was cancelled, so there is nothing to send back.",
    };
  }
  if (status !== "DELIVERED") {
    return {
      canRequest: false,
      reason: "You can ask for a refund once your order has been delivered.",
    };
  }

  // Orders delivered before the delivery date was recorded have no clock to
  // read. Letting those through is the generous reading, and staff still
  // decide; refusing on missing data would punish the customer for our gap.
  if (deliveredAt && returnWindowDaysLeft(deliveredAt, now) === 0) {
    return {
      canRequest: false,
      reason: `The ${RETURN_WINDOW_DAYS} day return window closed on ${returnWindowClosesAt(
        deliveredAt
      ).toLocaleDateString()}.`,
    };
  }

  return { canRequest: true };
}
