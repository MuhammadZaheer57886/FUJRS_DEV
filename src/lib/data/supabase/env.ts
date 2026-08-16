// Supabase connection settings, read once.
//
// These must be referenced as literal `process.env.NEXT_PUBLIC_*` member
// accesses — Next.js inlines them at build time by static analysis, so a
// dynamic lookup like process.env[name] would silently produce undefined in
// the browser bundle.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * False when the keys haven't been filled in yet. Everything Supabase-shaped
 * checks this first and no-ops, so a half-configured `.env.local` leaves the
 * app running on the local adapter instead of crashing at import time.
 */
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Throws with something actionable rather than a driver-level error. */
export function assertConfigured(): void {
  if (supabaseConfigured) return;
  throw new Error(
    "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local. See BACKEND_SETUP.md §4."
  );
}
