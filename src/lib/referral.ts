// Referral code rules — pure, no I/O.
//
// Split from the storage module on purpose: these rules are the same whether a
// code is read from localStorage, Postgres, or an HTTP API, so they must not
// depend on any of them. `src/lib/data/` does the reading and writing.

const REFERRAL_PREFIX = "FJ";
const REFERRAL_CODE_LENGTH = 6;

/** Query parameter a referral link carries. */
export const REFERRAL_PARAM = "ref";

/**
 * Cookie holding the credited code, as `code|productSlug|capturedAt`.
 *
 * A cookie rather than localStorage because the SERVER has to read it: the
 * order route re-derives the referral instead of trusting what the browser
 * posts. Deliberately script-readable — the sitewide bar shows it, and a
 * public vendor code is not a secret.
 */
export const REFERRAL_COOKIE = "fujrs_ref";

/** Anonymous per-visitor identifier for deduplicating clicks. Not a user id. */
export const VISITOR_COOKIE = "fujrs_vid";

/**
 * How long a referral stays credited to the vendor after the click.
 * Placeholder until the programme terms are agreed — REQUIREMENTS.md §8.
 */
export const ATTRIBUTION_WINDOW_DAYS = 30;

const REFERRAL_CODE_PATTERN = new RegExp(`^${REFERRAL_PREFIX}-[0-9A-Z]{${REFERRAL_CODE_LENGTH}}$`);

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * A stable code per vendor, derived from their email so it survives a page
 * reload without needing to be stored.
 *
 * The real one is issued and stored by the backend (`users.referral_code`) —
 * deriving it means a vendor can never change their email without losing their
 * code. This exists only so the browser-only build is self-consistent.
 */
export function referralCodeFor(email: string): string {
  const normalised = normaliseEmail(email);
  let hash = 0;
  for (let i = 0; i < normalised.length; i += 1) {
    hash = (hash * 31 + normalised.charCodeAt(i)) | 0;
  }
  const code = Math.abs(hash).toString(36).toUpperCase().padStart(REFERRAL_CODE_LENGTH, "0");
  return `${REFERRAL_PREFIX}-${code.slice(0, REFERRAL_CODE_LENGTH)}`;
}

/** Codes arrive from a URL, so they're untrusted until they match the issued shape. */
export function normaliseReferralCode(code: string): string {
  return code.trim().toUpperCase();
}

export function isValidReferralCode(code: string): boolean {
  return REFERRAL_CODE_PATTERN.test(normaliseReferralCode(code));
}

/** The vendor a code belongs to, or null when no vendor claims it. */
export function vendorEmailForCode(code: string, vendorEmails: string[]): string | null {
  const target = normaliseReferralCode(code);
  return vendorEmails.find((email) => referralCodeFor(email) === target) ?? null;
}

export function buildReferralUrl(origin: string, productSlug: string, code: string): string {
  return `${origin}/products/${productSlug}?${REFERRAL_PARAM}=${code}`;
}
