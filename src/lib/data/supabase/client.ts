"use client";

// Browser-side Supabase client.
//
// Sessions live in COOKIES, not localStorage — that's what `@supabase/ssr`
// gives us over the plain client, and it's the reason a server component or
// middleware can read who the user is. A localStorage session is invisible to
// the server, which means no SSR of signed-in content and a flash of logged-out
// UI on every page load.

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, assertConfigured } from "./env";
import type { Database } from "./database.types";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * One client per browser tab. Creating a second would open a second auth
 * listener and the two would race on token refresh.
 */
export function getBrowserClient() {
  assertConfigured();
  client ??= createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}
