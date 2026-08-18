"use client";

// The Admin and Super Admin overview, aggregated from `orders`.
//
// Computed in the browser from the rows RLS already lets staff read, rather
// than in SQL. That is a deliberate trade: it keeps the shape in one place and
// needs no view or function to maintain, and a single-brand storefront's order
// count is small. If this ever gets slow, the fix is a database view behind
// the same port — no component changes.

import { ORDER_STATUSES, type OrderStatus } from "@/lib/orderStatus";
import type { StatsStore } from "../ports";
import { StoreWriteError, type DashboardStats } from "../types";
import { getBrowserClient } from "./client";

/** How much of the revenue trend the chart draws. */
const REVENUE_DAYS = 14;
const RECENT_ORDERS = 5;

const toPkr = (paisa: number) => paisa / 100;

/** Revenue that has been cancelled or refunded is not revenue. */
const EARNING_STATUSES: OrderStatus[] = [
  "CONFIRMED",
  "PROCESSING",
  "PAYMENT_RECEIVED",
  "DELIVERED",
];

/** Every day in the window, so a quiet day is a zero rather than a gap. */
function emptySeries(): { date: string; revenue: number }[] {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return Array.from({ length: REVENUE_DAYS }, (_, i) => {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() - (REVENUE_DAYS - 1 - i));
    return { date: day.toISOString().slice(0, 10), revenue: 0 };
  });
}

export const supabaseStats: StatsStore = {
  async overview(): Promise<DashboardStats> {
    const { data, error } = await getBrowserClient()
      .from("orders")
      .select(
        "id, order_number, status, total_paisa, placed_at, ship_first_name, ship_last_name, order_items(id)"
      )
      .order("placed_at", { ascending: false });

    if (error) throw new StoreWriteError("Couldn't load the dashboard figures.");

    const rows = (data ?? []) as unknown as {
      id: string;
      order_number: string;
      status: OrderStatus;
      total_paisa: number;
      placed_at: string;
      ship_first_name: string;
      ship_last_name: string;
      order_items: { id: string }[] | null;
    }[];

    const earning = rows.filter((row) => EARNING_STATUSES.includes(row.status));

    const series = emptySeries();
    const byDate = new Map(series.map((point) => [point.date, point]));
    for (const row of earning) {
      const point = byDate.get(row.placed_at.slice(0, 10));
      if (point) point.revenue += toPkr(row.total_paisa);
    }

    // Every status the app knows, in its canonical order — a status with no
    // orders shows as zero rather than vanishing from the chart.
    const counts = new Map<OrderStatus, number>(ORDER_STATUSES.map((status) => [status, 0]));
    for (const row of rows) counts.set(row.status, (counts.get(row.status) ?? 0) + 1);

    return {
      totalOrders: rows.length,
      totalRevenue: earning.reduce((sum, row) => sum + toPkr(row.total_paisa), 0),
      revenueByDay: series,
      ordersByStatus: ORDER_STATUSES.map((status) => ({
        status,
        count: counts.get(status) ?? 0,
      })),
      recentOrders: rows.slice(0, RECENT_ORDERS).map((row) => ({
        id: row.id,
        orderNumber: row.order_number,
        customer: `${row.ship_first_name} ${row.ship_last_name}`.trim(),
        total: toPkr(row.total_paisa),
        status: row.status,
        itemCount: row.order_items?.length ?? 0,
      })),
    };
  },
};
