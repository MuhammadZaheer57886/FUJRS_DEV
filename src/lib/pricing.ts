// Order arithmetic. Pure — no I/O, no storage, no React.
//
// It lives here rather than in the bag because the server has to compute the
// same numbers when an order is placed: the client's totals are UX, and a
// browser can post any figures it likes. Two implementations of "what does
// this cost" is how a checkout ends up charging the wrong amount.

/** Flat delivery charge on any non-empty order, in PKR. */
export const SHIPPING_FLAT_PKR = 350;

/** The minimum a line needs before it can be priced. */
export interface PriceableLine {
  price: number;
  qty: number;
  /** Per-unit bespoke stitching charge, when the line is being stitched. */
  stitchingAddOn?: number;
}

export interface OrderTotals {
  fabricTotal: number;
  stitchingTotal: number;
  subtotal: number;
  shipping: number;
  total: number;
}

export function shippingFor(lineCount: number): number {
  return lineCount === 0 ? 0 : SHIPPING_FLAT_PKR;
}

export function orderTotals(lines: PriceableLine[]): OrderTotals {
  const fabricTotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const stitchingTotal = lines.reduce(
    (sum, line) => sum + (line.stitchingAddOn ?? 0) * line.qty,
    0
  );
  const subtotal = fabricTotal + stitchingTotal;
  const shipping = shippingFor(lines.length);

  return { fabricTotal, stitchingTotal, subtotal, shipping, total: subtotal + shipping };
}
