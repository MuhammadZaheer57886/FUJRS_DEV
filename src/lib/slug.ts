// URL keys for products. Pure — no I/O.

const MAX_SLUG_LENGTH = 60;

/** "Emerald Silk Set!" → "emerald-silk-set". Never empty. */
export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, MAX_SLUG_LENGTH) || "product"
  );
}

/**
 * A slug not already in `taken`, suffixed `-2`, `-3`, … when it is.
 *
 * Two pieces genuinely can share a name (a colourway re-run), and `slug` is
 * unique in the database — so a collision has to resolve to a new key rather
 * than failing the publish with a constraint error.
 */
export function uniqueSlug(title: string, taken: Iterable<string>): string {
  const base = slugify(title);
  const used = new Set(taken);
  if (!used.has(base)) return base;

  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}
