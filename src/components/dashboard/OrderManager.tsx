"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { ORDER_STATUS_LABELS, nextStatuses, type OrderStatus } from "@/lib/orderStatus";
import { formatOrderNumber } from "@/lib/orderNumber";
import { orders as orderStore } from "@/lib/data";
import { RefundQueue } from "@/components/dashboard/RefundQueue";
import type { Order } from "@/lib/data";
import { LoadingRow } from "@/components/ui/Loading";

const PKR = (amount: number) => `PKR ${amount.toLocaleString()}`;

/**
 * REFUNDED is not here on purpose.
 *
 * A refund is customer-initiated (`src/lib/refunds.ts`): the customer raises a
 * request against a delivered order and staff approve it in the queue below,
 * which is what moves the order. A button that refunded an order from this
 * screen recorded money moving with nobody having asked, and the database now
 * refuses that move outright for a delivered order.
 */
type StaffMove = Exclude<OrderStatus, "REFUNDED">;

/** What each move means to the person clicking it. */
const ACTION_LABELS: Record<StaffMove, string> = {
  CONFIRMED: "Confirm",
  PROCESSING: "Mark Processing",
  PAYMENT_RECEIVED: "Mark Payment Received",
  DELIVERED: "Mark Delivered",
  CANCELLED: "Cancel Order",
};

/** The one an admin shouldn't fire by accident. */
const DESTRUCTIVE: StaffMove[] = ["CANCELLED"];

/** Legal moves, minus the one that only a refund request may make. */
function staffMoves(from: OrderStatus): StaffMove[] {
  return nextStatuses(from).filter((status): status is StaffMove => status !== "REFUNDED");
}

/**
 * What staff read instead of buttons once an order has run its course.
 *
 * DELIVERED is not terminal in the database, but it is the end of the road
 * here: the only thing that reopens it is a refund request.
 */
const NO_ACTION_NOTES: Partial<Record<OrderStatus, string>> = {
  DELIVERED:
    "Delivered and complete. It reopens only if the customer requests a refund, which appears in the queue below.",
  CANCELLED: "Cancelled. Nothing further to do here.",
};

function OrderDetail({
  order,
  onStatusChange,
}: {
  order: Order;
  onStatusChange: (status: OrderStatus) => void;
}) {
  const moves = staffMoves(order.status);

  return (
    <div className="border-t border-border-subtle bg-surface-container-low p-5">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <p className="text-label-sm uppercase tracking-widest text-text-muted">Items</p>
          <ul className="mt-3 divide-y divide-border-subtle">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 py-3">
                <div>
                  <p className="text-body-md">{item.title}</p>
                  <p className="text-label-sm text-text-muted">
                    Qty {item.qty}
                    {item.stitchingLabel ? ` · ${item.stitchingLabel}` : ""}
                    {item.stitchingStatus ? ` · ${item.stitchingStatus}` : ""}
                  </p>
                </div>
                <p className="whitespace-nowrap text-body-md">{PKR(item.price * item.qty)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-border-subtle pt-4">
            <div className="flex justify-between text-label-sm text-text-muted">
              <dt>Fabric</dt>
              <dd>{PKR(order.fabricTotal)}</dd>
            </div>
            {order.stitchingTotal > 0 && (
              <div className="flex justify-between text-label-sm text-text-muted">
                <dt>Stitching</dt>
                <dd>{PKR(order.stitchingTotal)}</dd>
              </div>
            )}
            <div className="flex justify-between text-label-sm text-text-muted">
              <dt>Shipping</dt>
              <dd>{PKR(order.shipping)}</dd>
            </div>
            <div className="flex justify-between font-display text-body-lg text-on-surface">
              <dt>Total</dt>
              <dd>{PKR(order.total)}</dd>
            </div>
          </dl>
        </div>

        <div>
          <p className="text-label-sm uppercase tracking-widest text-text-muted">Ship To</p>
          <p className="mt-3 text-body-md">
            {order.firstName} {order.lastName}
          </p>
          <p className="text-body-md text-text-muted">
            {order.street}
            <br />
            {order.city}, {order.postalCode}
          </p>

          <div className="mt-6 flex justify-between border-t border-border-subtle pt-4 text-label-sm">
            <span className="uppercase text-text-muted">Payment</span>
            <span>{order.paymentMethod === "cod" ? "Cash on Delivery" : "Card"}</span>
          </div>
          <div className="mt-2 flex justify-between text-label-sm">
            <span className="uppercase text-text-muted">Placed</span>
            <span>{order.createdAt.slice(0, 10)}</span>
          </div>
          <div className="mt-2 flex justify-between text-label-sm">
            <span className="uppercase text-text-muted">Referred By</span>
            <span
              className={
                order.referralCode ? "uppercase tracking-widest text-marketplace-bronze" : ""
              }
            >
              {order.referralCode ?? "Direct"}
            </span>
          </div>

          <p className="mt-6 text-label-sm uppercase tracking-widest text-text-muted">Actions</p>
          {moves.length === 0 ? (
            <p className="mt-3 max-w-prose text-body-md text-text-muted">
              {NO_ACTION_NOTES[order.status] ??
                `${ORDER_STATUS_LABELS[order.status]} is final. Nothing further to do.`}
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {moves.map((status) => (
                <button
                  key={status}
                  onClick={() => onStatusChange(status)}
                  className={`border px-4 py-2 font-label-sm text-label-sm uppercase tracking-widest transition-colors ${
                    DESTRUCTIVE.includes(status)
                      ? "border-outline-variant hover:border-error hover:text-error"
                      : "border-outline-variant hover:border-marketplace-bronze hover:text-marketplace-bronze"
                  }`}
                >
                  {ACTION_LABELS[status]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Order management for Admin and Super Admin. Legal moves come from
 * `nextStatuses()`, so the UI cannot offer an illegal transition — and the
 * database trigger refuses one regardless of what the UI offers.
 */
export function OrderManager() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setOrders(await orderStore.list());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleStatusChange(order: Order, status: OrderStatus) {
    const updated = await orderStore.updateStatus(order.id, status);
    if (!updated) {
      // The store returns null for illegal transitions and for write failures
      // (RLS, trigger errors). Prefer the legal-move message only when the UI
      // somehow offered one that `nextStatuses` would refuse — otherwise say
      // the save failed so staff don't chase a transition rule that is fine.
      const offered = nextStatuses(order.status).includes(status);
      toast(
        offered
          ? "Couldn't update that order. Refresh and try again."
          : `An order that's ${ORDER_STATUS_LABELS[order.status].toLowerCase()} can't move to ${ORDER_STATUS_LABELS[status].toLowerCase()}.`,
        offered ? "error" : "info"
      );
      return;
    }
    await refresh();
    toast(
      `${formatOrderNumber(order.orderNumber)} is now ${ORDER_STATUS_LABELS[status].toLowerCase()}.`,
      "success"
    );
  }

  return (
    <section>
      <h2 className="font-display text-headline-sm">Orders</h2>
      <p className="mt-1 max-w-prose text-label-sm text-marketplace-bronze">
        An order moves confirmed, processing, payment received, delivered. Cancelling is only
        offered before delivery. Once an order is delivered it is complete, and the only way back is
        a refund the customer has asked for.
      </p>

      <div className="mt-4 overflow-x-auto border border-border-subtle">
        <table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-low text-label-sm uppercase text-text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Referred</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {!orders && <LoadingRow colSpan={7} />}

            {orders?.map((order) => {
              const open = openId === order.id;
              return (
                <tr key={order.id}>
                  <td className="px-4 py-3">{formatOrderNumber(order.orderNumber)}</td>
                  <td className="px-4 py-3">
                    {order.firstName} {order.lastName}
                  </td>
                  <td className="px-4 py-3">{order.items.length}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{PKR(order.total)}</td>
                  <td className="px-4 py-3 text-label-sm uppercase tracking-widest text-marketplace-bronze">
                    {order.referralCode ?? <span className="text-text-muted">-</span>}
                  </td>
                  <td className="px-4 py-3 text-label-sm uppercase text-text-muted">
                    {ORDER_STATUS_LABELS[order.status]}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setOpenId(open ? null : order.id)}
                      aria-expanded={open}
                      className="border border-outline-variant px-3 py-1.5 font-label-sm text-label-sm uppercase tracking-widest transition-colors hover:border-marketplace-bronze hover:text-marketplace-bronze"
                    >
                      {open ? "Close" : "Open"}
                    </button>
                  </td>
                </tr>
              );
            })}

            {orders?.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-text-muted" colSpan={7}>
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* The open order's detail sits below the table so it isn't squeezed into a cell. */}
      {orders
        ?.filter((order) => order.id === openId)
        .map((order) => (
          <div key={order.id} className="mt-4 border border-border-subtle">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="font-display text-headline-sm">
                  {formatOrderNumber(order.orderNumber)}
                </p>
                <p className="text-label-sm text-text-muted">
                  {order.firstName} {order.lastName} · {ORDER_STATUS_LABELS[order.status]}
                </p>
              </div>
              <button
                onClick={() => setOpenId(null)}
                className="border border-outline-variant px-4 py-2 font-label-sm text-label-sm uppercase tracking-widest transition-colors hover:border-marketplace-bronze hover:text-marketplace-bronze"
              >
                Close
              </button>
            </div>
            <OrderDetail order={order} onStatusChange={(s) => void handleStatusChange(order, s)} />
          </div>
        ))}

      {/* Approving a request here refunds an order in the table above, so the
          queue tells this component to reload rather than owning its own copy
          of the orders. */}
      <RefundQueue onReviewed={() => void refresh()} />

      {/* A "Sample Orders" fixture table used to sit here, to make the
          dashboard look lived-in. Orders are real now, so it was two tables
          where one of them had to be invented, and a fixture beside real data
          is the kind of thing someone eventually reads as fact. */}
    </section>
  );
}
