// Records where a shopper is visiting from, and on what.
//
// This is a route rather than a client write for two reasons:
//
//   1. The location comes from headers the CDN adds and the browser can't see.
//   2. It is an observation ABOUT the request, so the client must not be the
//      one asserting it. The update grant on the last_seen_* columns is revoked
//      from `authenticated` (see the guest_identity_and_visits migration), so
//      even a hand-written request can't set its own city.
//
// Who the visit belongs to comes from the session cookie, verified server-side.
// Nothing in the body decides identity — there is no body.

import { NextResponse } from "next/server";
import { VISIT_THROTTLE_MS, parseUserAgent } from "@/lib/visits";
import { createAdminSupabase, createServerSupabase } from "@/lib/data/supabase/server";

/**
 * City and country as the platform reports them.
 *
 * Vercel and Cloudflare both add these; a bare Node server adds neither, so
 * local development records the device and leaves the location null. That is
 * the honest outcome — the alternative is sending every visitor's IP to a
 * third-party geolocation service for a line of dashboard text.
 *
 * Vercel percent-encodes the city (it may contain non-ASCII), hence decoding.
 */
function readLocation(request: Request): { city: string | null; country: string | null } {
  const header = (name: string) => request.headers.get(name)?.trim() || null;

  const rawCity = header("x-vercel-ip-city") ?? header("cf-ipcity");
  let city: string | null = null;
  if (rawCity) {
    try {
      city = decodeURIComponent(rawCity);
    } catch {
      // Malformed encoding: keep what was sent rather than dropping the field.
      city = rawCity;
    }
  }

  const country = header("x-vercel-ip-country") ?? header("cf-ipcountry");

  // Cloudflare sends "XX" for anonymised or unknown clients.
  return { city, country: country && country !== "XX" ? country.toUpperCase() : null };
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase();

  // getUser() verifies the token with the auth server. A visit is only
  // recordable against someone we can identify — a visitor with no session
  // (nothing in their bag, nothing saved) has no row to record it on, and
  // creating one here would reintroduce the guest-per-visit problem this
  // endpoint sits alongside.
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth.user) {
    return NextResponse.json({ recorded: false });
  }

  const admin = await createAdminSupabase();

  // Throttled server-side, because the client can't be trusted to and
  // shouldn't have to. Reading first costs one indexed lookup and saves a
  // write on most requests.
  const { data: existing } = await admin
    .from("users")
    .select("last_seen_at")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (existing?.last_seen_at) {
    const elapsed = Date.now() - new Date(existing.last_seen_at).getTime();
    if (elapsed >= 0 && elapsed < VISIT_THROTTLE_MS) {
      return NextResponse.json({ recorded: false });
    }
  }

  const signature = parseUserAgent(request.headers.get("user-agent") ?? "");
  const { city, country } = readLocation(request);

  // Admin client because the column grants are revoked from `authenticated`,
  // and scoped to the id we just verified — never to anything from the request.
  const { error: updateError } = await admin
    .from("users")
    .update({
      last_seen_at: new Date().toISOString(),
      last_seen_city: city,
      last_seen_country: country,
      last_seen_browser: signature.browser,
      last_seen_os: signature.os,
      last_seen_device: signature.device,
    })
    .eq("id", auth.user.id);

  if (updateError) {
    // Not worth failing a page over. The caller ignores the result.
    return NextResponse.json({ recorded: false }, { status: 500 });
  }

  return NextResponse.json({ recorded: true });
}
