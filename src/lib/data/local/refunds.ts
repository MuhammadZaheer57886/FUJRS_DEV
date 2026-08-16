// Refund requests on the browser-only backend.
//
// The rules are the same ones the database enforces (`src/lib/refunds.ts`),
// re-checked here rather than trusted from the caller, so the demo behaves
// like the real thing: only a delivered order inside the return window can be
// requested, only one request may be open at a time, and approving is what
// moves the order to REFUNDED.
//
// There is no session split to honour here. `local` is one browser, which is
// both the shopper and the staff member, so `list()` returns everything.

import { refundEligibility, validateRefundReason, type RefundRequestStatus } from "@/lib/refunds";
import type { RefundStore } from "../ports";
import { StoreWriteError, type RefundRequest } from "../types";
import { localOrders } from "./orders";
import { makeId, readJSON, writeJSON } from "./storage";

const KEY = "fujrs-refund-requests";

const readAll = (): RefundRequest[] => readJSON<RefundRequest[]>(KEY, []);

const newestFirst = (list: RefundRequest[]) =>
  [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

const latestFor = (orderId: string) =>
  newestFirst(readAll()).find((request) => request.orderId === orderId) ?? null;

export const localRefunds: RefundStore = {
  async list() {
    return newestFirst(readAll());
  },

  async forOrder(orderId) {
    return latestFor(orderId);
  },

  async request({ orderId, reason }) {
    const invalid = validateRefundReason(reason);
    if (invalid) throw new StoreWriteError(invalid);

    const order = await localOrders.get(orderId);
    if (!order) throw new StoreWriteError("We couldn't find that order.");

    const existing = latestFor(orderId);
    const eligibility = refundEligibility({
      status: order.status,
      deliveredAt: order.deliveredAt,
      existingRequest: existing?.status ?? null,
    });
    if (!eligibility.canRequest) throw new StoreWriteError(eligibility.reason);

    const request: RefundRequest = {
      id: makeId(),
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: `${order.firstName} ${order.lastName}`.trim(),
      status: "REQUESTED",
      reason: reason.trim(),
      // Snapshot: the order total as it stands when the customer asks. It is
      // what they are owed, and it must not drift afterwards.
      amount: order.total,
      staffNote: null,
      createdAt: new Date().toISOString(),
      reviewedAt: null,
    };

    writeJSON(KEY, [...readAll(), request]);
    return request;
  },

  async review({ id, decision, note }) {
    const all = readAll();
    const request = all.find((r) => r.id === id);

    // Already-reviewed requests are refused rather than re-ruled: a second
    // approval would try an illegal REFUNDED -> REFUNDED move anyway.
    if (!request || request.status !== "REQUESTED") return null;

    const status: RefundRequestStatus = decision;
    const updated: RefundRequest = {
      ...request,
      status,
      staffNote: note?.trim() || null,
      reviewedAt: new Date().toISOString(),
    };

    // The order moves first. If the transition is refused there is nothing to
    // approve, and leaving the request open is the honest outcome.
    if (status === "APPROVED") {
      const moved = await localOrders.updateStatus(request.orderId, "REFUNDED");
      if (!moved) return null;
    }

    writeJSON(
      KEY,
      all.map((r) => (r.id === id ? updated : r))
    );
    return updated;
  },
};
