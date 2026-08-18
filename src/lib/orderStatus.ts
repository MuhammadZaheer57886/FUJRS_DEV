export const ORDER_STATUSES = [
  "CONFIRMED",
  "PROCESSING",
  "PAYMENT_RECEIVED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Status every newly placed order starts in. */
export const INITIAL_ORDER_STATUS: OrderStatus = "CONFIRMED";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  PAYMENT_RECEIVED: "Payment Received",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

/** Nothing further happens to an order in one of these. */
export const TERMINAL_ORDER_STATUSES: OrderStatus[] = ["REFUNDED"];

/**
 * Where an order can go from where it is. Cancelling is only honest before the
 * piece is delivered; afterwards the money has to come back as a refund
 * instead. Kept here rather than in the dashboard so the storefront and every
 * future API route agree on what a legal move is.
 *
 * PAYMENT_RECEIVED sits between PROCESSING and DELIVERED because Cash on
 * Delivery is the only method that completes an order: the money is collected
 * by hand, and staff need to record that it arrived as its own step rather
 * than have "delivered" quietly stand for both. It is still cancellable, since
 * nothing has left the building until the piece is handed over, and a
 * cancellation there is what a refund of the collected cash hangs off.
 */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PAYMENT_RECEIVED", "CANCELLED"],
  PAYMENT_RECEIVED: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: ["REFUNDED"],
  REFUNDED: [],
};

export function nextStatuses(from: OrderStatus): OrderStatus[] {
  return TRANSITIONS[from];
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function isTerminalStatus(status: OrderStatus): boolean {
  return TERMINAL_ORDER_STATUSES.includes(status);
}
