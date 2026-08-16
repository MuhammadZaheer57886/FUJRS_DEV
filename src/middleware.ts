import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/data/supabase/env";

/**
 * Refreshes the Supabase auth cookie on every request.
 *
 * Access tokens are short-lived. Without this, a user who leaves a tab open
 * comes back signed out, and server components see a stale token. The
 * middleware is the only place that can write a refreshed cookie *before* the
 * page renders — Server Components can't set cookies.
 */
export async function middleware(request: NextRequest) {
  if (!supabaseConfigured || process.env.NEXT_PUBLIC_DATA_BACKEND !== "supabase") {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        // Rebuild the response so it carries the updated request cookies, then
        // mirror them onto the outgoing response.
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Do not put anything between creating the client and this call. getUser()
  // is what actually revalidates the token and triggers setAll above; skipping
  // it, or using getSession() instead, silently stops the refresh. getSession()
  // reads the cookie without verifying it, so it must never gate access.
  await supabase.auth.getUser();

  // Must return THIS response object. Returning a fresh NextResponse would
  // drop the refreshed cookies and log the user out on the next request.
  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and images — those never carry a session
     * and running auth on them would just add latency to every file.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
