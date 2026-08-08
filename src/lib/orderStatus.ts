export const ORDER_STATUSES = [
  "CONFIRMED",
  "PROCESSING",
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
 */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["DELIVERED", "CANCELLED"],
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
