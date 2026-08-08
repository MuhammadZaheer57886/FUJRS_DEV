// What a bespoke garment can be, and what each choice costs. Pure — no I/O,
// no React, no browser.
//
// This used to live in TailoringContext, which made it unreachable from the
// server: a `"use client"` module cannot be imported by a route handler. That
// mattered, because the bespoke line was the one item in the bag whose price
// the server had to accept on trust. With the options here, POST /api/orders
// recomputes the price from the customer's stored choices exactly the way the
// configurator did — the same numbers, from the same table.

export interface StyleOption {
  label: string;
  /** Material icon shown on the option tile. Presentation only. */
  icon?: string;
  /** Added to the garment base price, in PKR. */
  price: number;
}

export const NECKLINES: StyleOption[] = [
  { label: "Boat Neck", icon: "horizontal_rule", price: 0 },
  { label: "Mandarin", icon: "change_history", price: 0 },
  { label: "Deep V", icon: "keyboard_arrow_down", price: 1500 },
];

export const SLEEVES: StyleOption[] = [
  { label: "Full Length", price: 0 },
  { label: "Bell Cuff", price: 2000 },
  { label: "Quarter", price: 0 },
];

export const HEMLINES: StyleOption[] = [
  { label: "Straight Classic", icon: "remove", price: 0 },
  { label: "Scalloped Edge", icon: "auto_awesome", price: 2500 },
];

export const GARMENT_PRICES: Record<string, number> = {
  "2-Piece Suit (Kurta & Trousers)": 12500,
  "3-Piece Luxury Suit": 16500,
  "Formal Saree Blouse": 22000,
  "Bridal Wear / Pishwas": 42000,
};

export const DEFAULT_GARMENT_TYPE = "3-Piece Luxury Suit";

/** The price of a named option, or 0 when the name isn't one we offer. */
function priceOf(options: StyleOption[], label: string): number {
  return options.find((option) => option.label === label)?.price ?? 0;
}

/**
 * What a bespoke garment costs, derived only from the choices made.
 *
 * Deliberately takes labels rather than a config object carrying prices: a
 * stored price is a number the customer's browser once wrote down, and this
 * has to work when the caller cannot be trusted. Anything unrecognised prices
 * at zero rather than throwing — an unknown neckline is a garment without that
 * upgrade, not a failed checkout.
 */
export function bespokePrice(choices: {
  garmentType: string;
  neckline: string;
  sleeve: string;
  hemline: string;
}): number {
  return (
    (GARMENT_PRICES[choices.garmentType] ?? 0) +
    priceOf(NECKLINES, choices.neckline) +
    priceOf(SLEEVES, choices.sleeve) +
    priceOf(HEMLINES, choices.hemline)
  );
}
