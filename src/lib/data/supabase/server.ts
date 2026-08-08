import "server-only";

// Server-side Supabase clients. Never imported from a client component —
// `server-only` turns that mistake into a build error rather than a leak.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL, assertConfigured } from "./env";
import type { Database } from "./database.types";

/**
 * Request-scoped client carrying the signed-in user's cookies, so RLS applies
 * exactly as it would in the browser. Use this for anything a user is allowed
 * to see.
 *
 * A new client per request, never a module-level singleton: one shared client
 * would leak one user's session into another user's request.
 */
export async function createServerSupabase() {
  assertConfigured();
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components can't set cookies. That's fine — the middleware
          // refreshes the session on every request, so the token stays fresh
          // without this path succeeding.
        }
      },
    },
  });
}

/**
 * Client for genuinely public data — the catalogue, and nothing else.
 *
 * It carries no cookies, which is the point: reading `cookies()` opts a route
 * out of static rendering, so a product page built with `createServerSupabase`
 * would be re-rendered per request for content identical to every visitor.
 * RLS still applies, as the anonymous role — `products_public_read` is what
 * makes this safe, and it is why this must never be used for a user's own
 * orders, addresses or earnings.
 */
export async function createPublicSupabase() {
  assertConfigured();
  const { createClient } = await import("@supabase/supabase-js");
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Admin client that BYPASSES Row Level Security.
 *
 * Only for work the user genuinely must not be trusted with: recording
 * referral clicks, writing an order with its items and commission atomically,
 * or a Super Admin action that legitimately spans users.
 *
 * Never expose its results wholesale to a caller — with RLS off, filtering is
 * entirely your responsibility. Reach for `createServerSupabase()` first and
 * use this only when RLS is genuinely in the way.
 */
export async function createAdminSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. It is server-only and must never " +
        "carry a NEXT_PUBLIC_ prefix — see BACKEND_SETUP.md §4."
    );
  }
  assertConfigured();

  const { createClient } = await import("@supabase/supabase-js");
  return createClient<Database>(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
