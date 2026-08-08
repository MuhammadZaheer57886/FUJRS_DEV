// Payout rules — pure, no I/O. Storage lives in `src/lib/data/`.

/**
 * The least a vendor can withdraw at once. Placeholder until the programme
 * terms are agreed — REQUIREMENTS.md §8.
 */
export const MIN_PAYOUT_PKR = 5_000;

export const PAYOUT_STATUSES = ["Requested", "Processing", "Paid", "Rejected"] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

/** Status every new request starts in. */
export const INITIAL_PAYOUT_STATUS: PayoutStatus = "Requested";

/** A request that is neither settled nor refused still holds the money back. */
export const OPEN_PAYOUT_STATUSES: PayoutStatus[] = ["Requested", "Processing"];

/**
 * The `payout_status` enum values, paired with what the vendor reads.
 *
 * Same reasoning as the stitching statuses: the database stores keys so the
 * wording can change without a migration, and the translation belongs with the
 * rules rather than inside an adapter.
 */
export const PAYOUT_STATUS_KEYS = {
  REQUESTED: "Requested",
  PROCESSING: "Processing",
  PAID: "Paid",
  REJECTED: "Rejected",
} as const satisfies Record<string, PayoutStatus>;

export type PayoutStatusKey = keyof typeof PAYOUT_STATUS_KEYS;

export function payoutStatusFromKey(key: string): PayoutStatus {
  return PAYOUT_STATUS_KEYS[key as PayoutStatusKey] ?? INITIAL_PAYOUT_STATUS;
}

/** Thrown when a payout amount isn't requestable. */
export class PayoutValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayoutValidationError";
  }
}

/** Null when the amount is requestable, otherwise the reason to show the vendor. */
export function validatePayout(amount: number, available: number): string | null {
  if (!Number.isFinite(amount) || amount <= 0) {
    return "Enter how much you'd like to withdraw.";
  }
  if (amount < MIN_PAYOUT_PKR) {
    return `The minimum withdrawal is PKR ${MIN_PAYOUT_PKR.toLocaleString()}.`;
  }
  if (available < MIN_PAYOUT_PKR) {
    return `You need at least PKR ${MIN_PAYOUT_PKR.toLocaleString()} available to withdraw.`;
  }
  if (amount > available) {
    return `You only have PKR ${available.toLocaleString()} available to withdraw.`;
  }
  return null;
}
