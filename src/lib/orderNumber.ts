// The short code a customer quotes when they get in touch. Pure — no I/O.
//
// It exists as its own value because the database key is a uuid, and
// "a1f3c2e8-…" is not something anyone reads down a phone line. `orders`
// carries it in its own unique column for exactly that reason.

/** Characters a code is built from: no O/0 or I/1, which get misread aloud. */
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const LENGTH = 8;

/**
 * A new order reference, e.g. "2VVS7D5B".
 *
 * Random rather than sequential: a sequence tells anyone who places two orders
 * how many the shop has taken in between. Collisions are caught by the unique
 * index on `orders.order_number`, not assumed away.
 */
export function generateOrderNumber(): string {
  let code = "";
  for (let i = 0; i < LENGTH; i += 1) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

/** How a reference is shown wherever one appears. */
export function formatOrderNumber(orderNumber: string): string {
  return `#${orderNumber}`;
}
