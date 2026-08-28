"use client";

// Orders against `orders` + `order_items`.
//
// Reads go straight to Postgres — RLS (`orders_own_read` / `orders_staff_read`)
// decides whether you see your own or everyone's, so there is no filtering to
// get wrong here.
//
// Writes do NOT. There is deliberately no client insert policy on `orders`, so
// `create` posts to /api/orders, which re-prices the bag from the catalogue
// before writing anything. Status changes go direct: `orders_staff_update`
// restricts who may, and a database trigger rejects an illegal transition.

import type { OrderStatus } from "@/lib/orderStatus";
import { STITCHING_STATUSES } from "@/lib/stitchingStatus";
import type { OrderStore } from "../ports";
import { StoreWriteError, type Order, type PaymentMethod } from "../types";
import { getBrowserClient } from "./client";
import { ensureUserId } from "./identity";

const ORDER_SELECT = `
  id, order_number, status, placed_at, delivered_at,
  fabric_total_paisa, stitching_total_paisa, shipping_paisa, total_paisa,
  ship_first_name, ship_last_name, ship_street, ship_city, ship_postal,
  referral_code,
  order_items ( id, title, image_url, unit_price_paisa, quantity,
                stitching_label, stitching_addon_paisa,
                products ( slug ) )
`;

const toPkr = (paisa: number) => paisa / 100;

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  placed_at: string;
  delivered_at: string | null;
  fabric_total_paisa: number;
  stitching_total_paisa: number;
  shipping_paisa: number;
  total_paisa: number;
  ship_first_name: string;
  ship_last_name: string;
  ship_street: string;
  ship_city: string;
  ship_postal: string;
  referral_code: string | null;
  order_items:
    | {
        id: string;
        title: string;
        image_url: string | null;
        unit_price_paisa: number;
        quantity: number;
        stitching_label: string | null;
        stitching_addon_paisa: number | null;
        /** Null once the product is archived — the line snapshot still stands. */
        products: { slug: string } | null;
      }[]
    | null;
}

/**
 * Cash on Delivery is the only method that completes an order, and there is no
 * `payments` table yet — that migration waits on the provider decision
 * (BACKEND_SETUP.md §5). Until it lands, every stored order is COD by
 * definition rather than by a column.
 */
const STORED_PAYMENT_METHOD: PaymentMethod = "cod";

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    createdAt: row.placed_at,
    status: row.status as OrderStatus,
    deliveredAt: row.delivered_at,
    items: (row.order_items ?? []).map((item) => ({
      id: item.id,
      // Joined, not snapshotted: the slug is only wanted for a link back to
      // the product page. Title, image and price ARE snapshotted on the line,
      // so an archived product still shows correctly in order history — it
      // just stops being linkable, which is the honest outcome.
      productSlug: item.products?.slug ?? "",
      title: item.title,
      image: item.image_url ?? "",
      price: toPkr(item.unit_price_paisa),
      qty: item.quantity,
      stitchingLabel: item.stitching_label,
      stitchingAddOn:
        item.stitching_addon_paisa === null ? null : toPkr(item.stitching_addon_paisa),
      // Assignment lives on stitching_requests, which isn't wired yet.
      stitcherSlug: null,
      stitchingStatus: item.stitching_label ? STITCHING_STATUSES[0] : null,
    })),
    fabricTotal: toPkr(row.fabric_total_paisa),
    stitchingTotal: toPkr(row.stitching_total_paisa),
    shipping: toPkr(row.shipping_paisa),
    total: toPkr(row.total_paisa),
    firstName: row.ship_first_name,
    lastName: row.ship_last_name,
    street: row.ship_street,
    city: row.ship_city,
    postalCode: row.ship_postal,
    paymentMethod: STORED_PAYMENT_METHOD,
    referralCode: row.referral_code,
  };
}

/**
 * Guarantees the shopper has a uuid before an order is written for them.
 *
 * Every read policy on `orders` matches `user_id = auth.uid()`. An order
 * written with `user_id = null` would therefore be invisible to the person who
 * placed it — including on the confirmation screen they're redirected to. So a
 * signed-out shopper is signed in anonymously first: they get a real
 * `auth.users` row, the order belongs to it, and registering later keeps the
 * same uuid, so the history follows them (BACKEND_SETUP.md §7).
 *
 * This goes through the shared `ensureUserId()` rather than calling
 * signInAnonymously() here. A second copy would sit outside that function's
 * de-duplication and could mint a guest alongside the one the bag just created.
 *
 * Requires "Anonymous sign-ins" to be enabled for the project. If it isn't,
 * ensureUserId() throws rather than placing an order nobody can retrieve.
 */
async function ensureIdentity() {
  await ensureUserId();
}

export const supabaseOrders: OrderStore = {
  async list() {
    const { data, error } = await getBrowserClient()
      .from("orders")
      .select(ORDER_SELECT)
      .order("placed_at", { ascending: false });

    if (error) throw new StoreWriteError("Couldn't load orders.");

    return (data as unknown as OrderRow[] | null)?.map(toOrder) ?? [];
  },

  async get(id) {
    const { data, error } = await getBrowserClient()
      .from("orders")
      .select(ORDER_SELECT)
      .eq("id", id)
      .maybeSingle();

    // A row the caller isn't allowed to see comes back as no row, not an
    // error — RLS filters rather than refuses. Null is the honest answer.
    if (error) throw new StoreWriteError("Couldn't load that order.");

    return data ? toOrder(data as unknown as OrderRow) : null;
  },

  async create(input) {
    await ensureIdentity();

    // The referral is read here rather than taken from the caller, so every
    // path that places an order is attributed the same way — but the server
    // re-checks it against a real vendor before crediting anyone.
    //
    // Imported at call time because `../index` imports this module: a static
    // import would be a cycle, and this is the one place a store needs another.
    const { referrals } = await import("../index");
    const referral = await referrals.get();

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, referralCode: referral?.code ?? null }),
    });

    const payload: { order?: Order; error?: string } = await response
      .json()
      .catch(() => ({ error: undefined }));

    if (!response.ok || !payload.order) {
      throw new StoreWriteError(payload.error ?? "We couldn't place your order.");
    }

    return payload.order;
  },

  async updateStatus(id, status) {
    const response = await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) return null;

    const { data, error } = await getBrowserClient()
      .from("orders")
      .select(ORDER_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return toOrder(data as unknown as OrderRow);
  },
};
