// Colour families and swatch rules. Pure — no I/O (CLAUDE.md).
//
// A colour has two parts, and they do different jobs:
//
//   label   the marketing name on the product page — "Midnight Blue"
//   family  the fixed axis the storefront filters on — BLUE
//
// The catalogue already held "Deep Navy", "Midnight Blue" and "Pastel Blue" as
// three separate filter rows, and four different off-whites. Filtering on the
// family instead means that list stays sixteen rows however many colours get
// added, which is what every large apparel catalogue does.

/**
 * The filter axis. MUST stay in step with the `color_family` enum in migration
 * 18 — the database rejects anything else, and these are the keys it stores.
 *
 * Order is display order: neutrals, then the spectrum, then metallics, then the
 * catch-all. Do not sort this alphabetically; "Beige, Black, Blue, Brown" reads
 * as noise next to a row of swatches.
 */
export const COLOR_FAMILIES = [
  "BLACK",
  "WHITE",
  "CREAM",
  "BEIGE",
  "BROWN",
  "GREY",
  "RED",
  "PINK",
  "ORANGE",
  "YELLOW",
  "GREEN",
  "BLUE",
  "PURPLE",
  "GOLD",
  "SILVER",
  "MULTI",
] as const;

export type ColorFamily = (typeof COLOR_FAMILIES)[number];

/**
 * Wording on screen, kept apart from the stored key for the same reason the
 * status enums are: renaming "Grey" to "Gray" must not need a migration.
 */
export const COLOR_FAMILY_LABELS: Record<ColorFamily, string> = {
  BLACK: "Black",
  WHITE: "White",
  CREAM: "Cream",
  BEIGE: "Beige",
  BROWN: "Brown",
  GREY: "Grey",
  RED: "Red",
  PINK: "Pink",
  ORANGE: "Orange",
  YELLOW: "Yellow",
  GREEN: "Green",
  BLUE: "Blue",
  PURPLE: "Purple",
  GOLD: "Gold",
  SILVER: "Silver",
  MULTI: "Multi",
};

/**
 * The swatch shown for a whole family, on the storefront filter where there is
 * no single product colour to draw. Representative, not authoritative — an
 * individual colour always renders its own hex.
 */
export const COLOR_FAMILY_SWATCHES: Record<ColorFamily, string> = {
  BLACK: "#111111",
  WHITE: "#ffffff",
  CREAM: "#f3e9d2",
  BEIGE: "#d9c7a7",
  BROWN: "#6f4e37",
  GREY: "#8a8a8a",
  RED: "#b3241f",
  PINK: "#e8a0b4",
  ORANGE: "#d1671a",
  YELLOW: "#e3c018",
  GREEN: "#1b6b45",
  BLUE: "#1f4e8c",
  PURPLE: "#6b3fa0",
  GOLD: "#c9a227",
  SILVER: "#c0c0c0",
  MULTI: "#808080",
};

export const isColorFamily = (value: string): value is ColorFamily =>
  (COLOR_FAMILIES as readonly string[]).includes(value);

/** Lower-case `#rrggbb`, matching the CHECK constraint on `colors.hex`. */
const HEX_PATTERN = /^#[0-9a-f]{6}$/;

export const isValidHex = (value: string) => HEX_PATTERN.test(value.trim().toLowerCase());

/** `#FFF` → `#ffffff`. Returns null when it isn't a colour at all. */
export function normaliseHex(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  const expanded = /^#[0-9a-f]{3}$/.test(trimmed)
    ? `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`
    : trimmed;
  return HEX_PATTERN.test(expanded) ? expanded : null;
}

/**
 * Perceived lightness, 0 (black) to 1 (white).
 *
 * The sRGB coefficients, not a plain mean: the eye reads green as far brighter
 * than blue, so averaging the channels calls #0000ff light and #00ff00 dark —
 * both backwards.
 */
export function hexLightness(hex: string): number {
  const value = normaliseHex(hex);
  if (!value) return 0;
  const r = parseInt(value.slice(1, 3), 16) / 255;
  const g = parseInt(value.slice(3, 5), 16) / 255;
  const b = parseInt(value.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Whether a swatch needs a visible border.
 *
 * Ivory and Signature White are real, distinct colours that vanish completely
 * on a white page. Every swatch in the app gets its outline from this, so a
 * pale colour is never an invisible gap in a row.
 */
export const swatchNeedsRing = (hex: string) => hexLightness(hex) > 0.82;

/**
 * A readable foreground for a tick or label drawn ON a swatch. Same reason as
 * above: a white checkmark on Ivory is not a checkmark.
 */
export const swatchForeground = (hex: string) => (hexLightness(hex) > 0.5 ? "#111111" : "#ffffff");
