import { NextResponse } from "next/server";
import { notifyAccountCreated, notifyGuestCreated } from "@/lib/discord";
import { createServerSupabase } from "@/lib/data/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { event?: unknown };
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: user } = await supabase
    .from("users")
    .select("id, name, email, is_anonymous")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!user) return NextResponse.json({ error: "User profile not found." }, { status: 404 });

  if (body.event === "guest_created" && user.is_anonymous) {
    await notifyGuestCreated({ id: user.id, createdAt: auth.user.created_at });
  } else if (body.event === "account_created" && !user.is_anonymous) {
    await notifyAccountCreated({ id: user.id, name: user.name ?? "", email: user.email ?? "" });
  } else {
    return NextResponse.json({ error: "Invalid user event." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
