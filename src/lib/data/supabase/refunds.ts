"use client";

// Refund requests against `refund_requests`.
//
// Who sees what is RLS's job, exactly as it is for orders: a customer's select
// matches their own rows, staff match everything, so there is no filtering to
// get wrong here.
//
// Two things this adapter deliberately does NOT do. It never writes
// `orders.status`: approving a request is what refunds the order, and the
// database does that move itself (`refund_order_on_approval`), so an approved
// request and an un-refunded order cannot drift apart. And it never sends
// reviewed_by or reviewed_at, which a trigger stamps from the verified
// session, because a client-supplied reviewer is a claim rather than a fact.

import { type RefundRequestStatus, validateRefundReason } from "@/lib/refunds";
import type { RefundStore } from "../ports";
import { StoreWriteError, type RefundRequest } from "../types";
import { getBrowserClient } from "./client";
import { requireUserId } from "./identity";

const REQUEST_SELECT = `
  id, order_id, status, reason, amount_paisa, staff_note, created_at, reviewed_at,
  orders ( order_number, ship_first_name, ship_last_name )
`;

const toPkr = (paisa: number) => paisa / 100;

interface RequestRow {
  id: string;
  order_id: string;
  status: string;
  reason: string;
  amount_paisa: number;
  staff_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  /** Null only if the order was removed underneath the request. */
  orders: {
    order_number: string;
    ship_first_name: string;
    ship_last_name: string;
  } | null;
}

function toRefundRequest(row: RequestRow): RefundRequest {
  return {
    id: row.id,
    orderId: row.order_id,
    orderNumber: row.orders?.order_number ?? "",
    customerName: row.orders
      ? `${row.orders.ship_first_name} ${row.orders.ship_last_name}`.trim()
      : "",
    status: row.status as RefundRequestStatus,
    reason: row.reason,
    amount: toPkr(row.amount_paisa),
    staffNote: row.staff_note,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

/**
 * Turns the database's refusal into something the person reading it can act
 * on. 23505 is the one-request-per-order index losing a race; 42501 is RLS
 * deciding the order isn't theirs, isn't delivered, is out of the return
 * window, or already carries a request.
 */
function requestError(code: string | undefined): string {
  if (code === "23505") return "You already have a refund request on this order.";
  if (code === "42501") {
    return "This order can't be refunded. It may be outside the return window, or already have a request against it.";
  }
  return "Couldn't send your refund request.";
}

export const supabaseRefunds: RefundStore = {
  async list() {
    const { data, error } = await getBrowserClient()
      .from("refund_requests")
      .select(REQUEST_SELECT)
      .order("created_at", { ascending: false });

    if (error) throw new StoreWriteError("Couldn't load refund requests.");

    return ((data as unknown as RequestRow[] | null) ?? []).map(toRefundRequest);
  },

  async forOrder(orderId) {
    const { data, error } = await getBrowserClient()
      .from("refund_requests")
      .select(REQUEST_SELECT)
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // A row the caller may not see comes back as no row rather than an error.
    if (error) throw new StoreWriteError("Couldn't load the refund status for this order.");

    return data ? toRefundRequest(data as unknown as RequestRow) : null;
  },

  async request({ orderId, reason }) {
    const invalid = validateRefundReason(reason);
    if (invalid) throw new StoreWriteError(invalid);

    const userId = await requireUserId();
    const supabase = getBrowserClient();

    // The amount comes from the order row, not from the caller: a client that
    // could name its own refund total is a client that can ask for more than
    // it paid. RLS means a total that reads back is one this user's order has.
    const { data: order } = await supabase
      .from("orders")
      .select("total_paisa")
      .eq("id", orderId)
      .maybeSingle();

    if (!order) throw new StoreWriteError("We couldn't find that order.");

    const { data, error } = await supabase
      .from("refund_requests")
      .insert({
        order_id: orderId,
        user_id: userId,
        reason: reason.trim(),
        amount_paisa: order.total_paisa,
      })
      .select(REQUEST_SELECT)
      .single();

    if (error || !data) throw new StoreWriteError(requestError(error?.code));

    return toRefundRequest(data as unknown as RequestRow);
  },

  async review({ id, decision, note }) {
    const { data, error } = await getBrowserClient()
      .from("refund_requests")
      .update({ status: decision, staff_note: note?.trim() || null })
      // Only an open request may be ruled on. Narrowing the update here means
      // a second click finds no row instead of racing the trigger's guard.
      .eq("id", id)
      .eq("status", "REQUESTED")
      .select(REQUEST_SELECT)
      .maybeSingle();

    // Both failures mean the same thing to the caller: the ruling didn't
    // happen. The port's contract is null, not a thrown error.
    if (error || !data) return null;

    return toRefundRequest(data as unknown as RequestRow);
  },
};
