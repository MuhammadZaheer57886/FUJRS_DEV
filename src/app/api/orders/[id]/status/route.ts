import { NextResponse } from "next/server";
import { notifyOrderStatus } from "@/lib/discord";
import { type OrderStatus } from "@/lib/orderStatus";
import { createServerSupabase } from "@/lib/data/supabase/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: staff } = await supabase
    .from("users")
    .select("role, name, email")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (!staff || !["ADMIN", "SUPER_ADMIN"].includes(staff.role)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { status?: unknown };
  const status = body.status as OrderStatus;
  if (!status) return NextResponse.json({ error: "A status is required." }, { status: 400 });

  const { id } = await params;
  const { data: before } = await supabase
    .from("orders")
    .select("id, order_number, status")
    .eq("id", id)
    .maybeSingle();
  if (!before) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const { data: updated, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select("id, order_number, status")
    .maybeSingle();
  if (error || !updated)
    return NextResponse.json({ error: "Couldn't update that order." }, { status: 409 });

  if (before.status !== updated.status) {
    await notifyOrderStatus({
      id: updated.id,
      orderNumber: updated.order_number,
      from: before.status as OrderStatus,
      to: updated.status as OrderStatus,
      changedBy: staff.name || staff.email || auth.user.email || auth.user.id,
    });
  }

  return NextResponse.json({ status: updated.status });
}
