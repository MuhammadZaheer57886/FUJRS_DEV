// Super Admin user management.
//
// This route exists because creating a user requires the service role key,
// which bypasses RLS and must never reach the browser. Everything else in the
// app talks to Supabase directly under RLS; this is the deliberate exception.
//
// SECURITY: the caller's identity comes from their session cookie, verified
// server-side, and their role is read from the database. Nothing in the
// request body decides who the caller is — a client can send any payload.

import { NextResponse } from "next/server";
import type { AppRole } from "@/lib/auth/roles";
import { STAFF_ROLES } from "@/lib/auth/roles";
import { DEFAULT_COMMISSION, validateCommission } from "@/lib/commission";
import { createAdminSupabase, createServerSupabase } from "@/lib/data/supabase/server";

const CREATABLE_ROLES: AppRole[] = ["CUSTOMER", ...STAFF_ROLES];
const MIN_PASSWORD_LENGTH = 8;

/** Matches the ^FJ-[0-9A-Z]{6}$ shape the app validates against. */
function generateReferralCode(): string {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `FJ-${code}`;
}

/**
 * Resolves the caller and confirms they're a Super Admin.
 * Returns null when they aren't — the caller turns that into a 403.
 */
async function requireSuperAdmin() {
  const supabase = await createServerSupabase();

  // getUser() verifies the token with the auth server. getSession() would only
  // decode the cookie, which is forgeable and must never gate access.
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth.user) return null;

  const { data: row } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", auth.user.id)
    .maybeSingle();

  return row?.role === "SUPER_ADMIN" ? row : null;
}

export async function GET() {
  const caller = await requireSuperAdmin();
  if (!caller) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  // Read as the caller, not as admin: RLS still applies, which is a second
  // check that the policies are right rather than a bypass around them.
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, role, is_active, referral_code, commission_type, commission_value")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Couldn't load users." }, { status: 500 });
  }

  return NextResponse.json({
    users: (data ?? []).map((u) => ({
      id: u.id,
      name: u.name ?? "",
      email: u.email ?? "",
      role: u.role,
      isActive: u.is_active,
      referralCode: u.referral_code,
      commission:
        u.commission_type && u.commission_value != null
          ? { type: u.commission_type, value: Number(u.commission_value) }
          : null,
    })),
  });
}

export async function POST(request: Request) {
  const caller = await requireSuperAdmin();
  if (!caller) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  let body: { name?: string; email?: string; password?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const role = body.role as AppRole;

  // Re-validate everything the form already checked. The client check is UX;
  // this is the boundary (CLAUDE.md).
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 }
    );
  }
  if (!CREATABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unknown role." }, { status: 400 });
  }

  const admin = await createAdminSupabase();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    // Staff are created by a Super Admin who already knows who they are, so
    // there's no inbox to confirm.
    email_confirm: true,
    user_metadata: { name },
  });

  if (createError || !created.user) {
    const message = createError?.message ?? "";
    return NextResponse.json(
      {
        error: /already|exists|registered/i.test(message)
          ? "An account with that email already exists."
          : "Couldn't create that user.",
      },
      { status: 400 }
    );
  }

  // The signup trigger has already inserted a public.users row as CUSTOMER.
  // Apply the intended role and the vendor fields on top.
  const patch = {
    name,
    role,
    created_by: caller.id,
    ...(role === "VENDOR"
      ? {
          referral_code: generateReferralCode(),
          commission_type: DEFAULT_COMMISSION.type,
          commission_value: DEFAULT_COMMISSION.value,
        }
      : {}),
  };

  const { data: row, error: updateError } = await admin
    .from("users")
    .update(patch)
    .eq("id", created.user.id)
    .select("id, name, email, role, is_active, referral_code, commission_type, commission_value")
    .single();

  if (updateError || !row) {
    // The auth user exists but has no usable role. Roll it back rather than
    // leaving an account nobody can explain.
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: "Couldn't finish creating that user." }, { status: 500 });
  }

  return NextResponse.json({
    user: {
      id: row.id,
      name: row.name ?? "",
      email: row.email ?? "",
      role: row.role,
      isActive: row.is_active,
      referralCode: row.referral_code,
      commission:
        row.commission_type && row.commission_value != null
          ? { type: row.commission_type, value: Number(row.commission_value) }
          : null,
    },
  });
}

export async function PATCH(request: Request) {
  const caller = await requireSuperAdmin();
  if (!caller) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  let body: { id?: string; commission?: { type?: string; value?: number } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { id, commission } = body;
  if (!id || !commission?.type || typeof commission.value !== "number") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const rate = { type: commission.type as "PERCENT" | "FLAT", value: commission.value };
  const problem = validateCommission(rate);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const admin = await createAdminSupabase();
  const { error } = await admin
    .from("users")
    .update({ commission_type: rate.type, commission_value: rate.value })
    .eq("id", id)
    .eq("role", "VENDOR"); // a rate on a non-vendor would be meaningless

  if (error) {
    return NextResponse.json({ error: "Couldn't update that rate." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
