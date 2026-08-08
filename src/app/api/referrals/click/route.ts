// Referral click recording.
//
// This route is the difference between attribution the vendor dashboard has to
// hedge about and attribution that is a fact. `referral_clicks` has NO client
// policy at all: a browser that could insert here could fabricate traffic, and
// one that could read here could see a competitor's.
//
// It also sets the cookie that carries the code through to checkout. A cookie
// rather than localStorage because the server has to be able to see it — the
// order route re-derives the referral rather than trusting the payload.

import { NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import {
  ATTRIBUTION_WINDOW_DAYS,
  REFERRAL_COOKIE,
  VISITOR_COOKIE,
  isValidReferralCode,
  normaliseReferralCode,
} from "@/lib/referral";
import { createAdminSupabase } from "@/lib/data/supabase/server";

const SECONDS_PER_DAY = 86_400;

/**
 * IPs are hashed, never stored raw: a raw address is personal data under most
 * privacy regimes and the only use here is deduplication, which a hash serves
 * equally well. Salted with the service key so the hashes aren't reversible
 * with a rainbow table of the IPv4 space.
 */
function hashIp(ip: string): string | null {
  if (!ip) return null;
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 64);
}

export async function POST(request: Request) {
  let body: { code?: unknown; productSlug?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ referral: null }, { status: 400 });
  }

  const code = normaliseReferralCode(String(body.code ?? ""));
  const productSlug = typeof body.productSlug === "string" ? body.productSlug : null;

  // Shape first — it costs nothing and keeps junk out of the query.
  if (!isValidReferralCode(code)) {
    return NextResponse.json({ referral: null });
  }

  const admin = await createAdminSupabase();

  const { data: vendor } = await admin
    .from("users")
    .select("id")
    .eq("referral_code", code)
    .eq("role", "VENDOR")
    .maybeSingle();

  // An unknown code is not an error to the shopper — their visit is simply not
  // credited to anyone. Saying more would let someone probe for valid codes.
  if (!vendor) {
    return NextResponse.json({ referral: null });
  }

  const { data: product } = productSlug
    ? await admin.from("products").select("id").eq("slug", productSlug).maybeSingle()
    : { data: null };

  const cookieHeader = request.headers.get("cookie") ?? "";
  const existingVisitor = new RegExp(`(?:^|;\\s*)${VISITOR_COOKIE}=([^;]+)`).exec(
    cookieHeader
  )?.[1];
  const visitorToken = existingVisitor || randomUUID();

  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() ?? "";

  await admin.from("referral_clicks").insert({
    vendor_id: vendor.id,
    product_id: product?.id ?? null,
    visitor_token: visitorToken,
    ip_hash: hashIp(ip),
    user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
  });

  const capturedAt = new Date().toISOString();
  const response = NextResponse.json({
    referral: { code, productSlug, capturedAt },
  });

  // Last touch wins: a later click overwrites the cookie. That is the rule the
  // browser build used and the simplest one to explain to a vendor — worth
  // revisiting only if the programme terms say otherwise (REQUIREMENTS.md §8).
  const maxAge = ATTRIBUTION_WINDOW_DAYS * SECONDS_PER_DAY;
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set(REFERRAL_COOKIE, `${code}|${productSlug ?? ""}|${capturedAt}`, {
    maxAge,
    sameSite: "lax",
    path: "/",
    secure,
    // Deliberately readable by script: the sitewide bar tells the shopper their
    // visit is credited, and it holds nothing sensitive — just a public code.
    httpOnly: false,
  });
  response.cookies.set(VISITOR_COOKIE, visitorToken, {
    maxAge,
    sameSite: "lax",
    path: "/",
    secure,
    httpOnly: true,
  });

  return response;
}
