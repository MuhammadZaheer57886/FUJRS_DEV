"use client";

// Payout requests a vendor has raised, as rows in `payout_requests`.
//
// Nothing here moves money. A request records that the vendor asked; paying it
// needs a payout provider, and the dashboard says so on screen.
//
// There is deliberately no balance column anywhere — the migration is explicit
// about it. The available figure is DERIVED from credited commission minus
// open requests, because a stored balance drifts the first time a write fails
// halfway, and then the vendor's money is wrong.

import {
  INITIAL_PAYOUT_STATUS,
  OPEN_PAYOUT_STATUSES,
  PayoutValidationError,
  payoutStatusFromKey,
  validatePayout,
} from "@/lib/payouts";
import type { PayoutStore } from "../ports";
import { StoreWriteError, type PayoutRequest } from "../types";
import { getBrowserClient } from "./client";
import { requireUserId } from "./identity";

const toPaisa = (pkr: number) => Math.round(pkr * 100);
const toPkr = (paisa: number) => paisa / 100;

/**
 * Commission a vendor may actually draw against.
 *
 * PENDING is excluded on purpose: the dashboard promises a sale counts once
 * the return window has closed, and a refund reverses it. Paying out on a sale
 * that can still come back is how the affiliate programme loses money.
 */
const EARNED_STATUSES = ["CREDITED", "PAID"] as const;

async function listFor(vendorId: string): Promise<PayoutRequest[]> {
  const { data, error } = await getBrowserClient()
    .from("payout_requests")
    .select("id, amount_paisa, status, requested_at")
    .eq("vendor_id", vendorId)
    .order("requested_at", { ascending: false });

  if (error) throw new StoreWriteError("Couldn't load your payout requests.");

  return (data ?? []).map((row) => ({
    id: row.id,
    amount: toPkr(row.amount_paisa),
    requestedAt: row.requested_at,
    status: payoutStatusFromKey(row.status),
  }));
}

export const supabasePayouts: PayoutStore = {
  async list() {
    return listFor(await requireUserId());
  },

  /**
   * `pendingBalance` is ignored here. On `local` it comes from the dashboard
   * fixtures, which have nothing behind them; here the vendor's earnings are a
   * real sum over `commissions`, and preferring a number the caller passed in
   * would let the browser decide what it is owed.
   */
  async availableToRequest() {
    const vendorId = await requireUserId();
    const supabase = getBrowserClient();

    const [{ data: commissions, error }, requests] = await Promise.all([
      supabase
        .from("commissions")
        .select("amount_paisa, status")
        .eq("vendor_id", vendorId)
        .in("status", EARNED_STATUSES),
      listFor(vendorId),
    ]);

    if (error) throw new StoreWriteError("Couldn't work out your balance.");

    const earned = (commissions ?? []).reduce((sum, row) => sum + toPkr(row.amount_paisa), 0);
    const open = requests
      .filter((request) => OPEN_PAYOUT_STATUSES.includes(request.status))
      .reduce((sum, request) => sum + request.amount, 0);

    return Math.max(0, earned - open);
  },

  async request(amount) {
    const vendorId = await requireUserId();

    // Re-derive what's available rather than trusting the argument: the caller
    // computed it from a screen that may be minutes old, and this is money.
    const available = await this.availableToRequest(0);

    const problem = validatePayout(amount, available);
    if (problem) throw new PayoutValidationError(problem);

    const { data, error } = await getBrowserClient()
      .from("payout_requests")
      .insert({ vendor_id: vendorId, amount_paisa: toPaisa(Math.round(amount)) })
      .select("id, amount_paisa, status, requested_at")
      .single();

    if (error || !data) {
      throw new StoreWriteError(
        error?.code === "42501"
          ? "Only a vendor can request a payout."
          : "Couldn't raise that request."
      );
    }

    return {
      id: data.id,
      amount: toPkr(data.amount_paisa),
      requestedAt: data.requested_at,
      status: data.status ? payoutStatusFromKey(data.status) : INITIAL_PAYOUT_STATUS,
    };
  },
};
