import { INITIAL_ORDER_STATUS, canTransition, type OrderStatus } from "@/lib/orderStatus";
import { generateOrderNumber } from "@/lib/orderNumber";
import { STITCHING_STATUSES } from "@/lib/stitchingStatus";
import type { OrderStore } from "../ports";
import type { NewOrderInput, Order } from "../types";
import { localReferrals } from "./referral";
import { makeId, readJSON, writeJSON } from "./storage";

const KEY = "fujrs-orders";

/**
 * Orders written before `orderNumber` existed have none. Deriving one from the
 * id keeps them readable rather than showing a blank reference — the same
 * eight characters the UI used to slice off by hand.
 */
const readAll = (): Order[] =>
  readJSON<Order[]>(KEY, []).map((order) => ({
    ...order,
    orderNumber: order.orderNumber || order.id.slice(-8).toUpperCase(),
  }));

export const localOrders: OrderStore = {
  async list() {
    return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async get(id) {
    return readAll().find((order) => order.id === id) ?? null;
  },

  async create(input: NewOrderInput) {
    // Read here rather than taking it as an argument, so every path that
    // places an order is attributed the same way and no caller can forget.
    const referral = await localReferrals.get();

    const order: Order = {
      id: makeId(),
      orderNumber: generateOrderNumber(),
      createdAt: new Date().toISOString(),
      status: INITIAL_ORDER_STATUS,
      items: input.items.map((item, index) => ({
        id: `${index}-${item.productSlug}`,
        productSlug: item.productSlug,
        title: item.title,
        image: item.image,
        price: item.price,
        qty: item.qty,
        stitchingLabel: item.stitchingLabel ?? null,
        stitchingAddOn: item.stitchingAddOn ?? null,
        stitcherSlug: item.stitcherSlug ?? null,
        stitchingStatus: item.stitchingLabel ? STITCHING_STATUSES[0] : null,
      })),
      fabricTotal: input.fabricTotal,
      stitchingTotal: input.stitchingTotal,
      shipping: input.shipping,
      total: input.total,
      firstName: input.firstName,
      lastName: input.lastName,
      street: input.street,
      city: input.city,
      postalCode: input.postalCode,
      paymentMethod: input.paymentMethod,
      referralCode: referral?.code ?? null,
    };

    writeJSON(KEY, [...readAll(), order]);
    return order;
  },

  async updateStatus(id: string, status: OrderStatus) {
    const orders = readAll();
    const order = orders.find((o) => o.id === id);
    if (!order || !canTransition(order.status, status)) return null;

    const updated = { ...order, status };
    writeJSON(
      KEY,
      orders.map((o) => (o.id === id ? updated : o))
    );
    return updated;
  },
};
