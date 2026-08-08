// Dashboard figures on the browser-only backend.
//
// Real orders placed in this browser are counted; the fixture totals stand in
// for the history a fresh browser has no way to have. AdminView labels the
// whole panel as sample data, so nothing here is presented as fact.

import { DEMO_STATS } from "@/lib/auth/demoData";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orderStatus";
import type { StatsStore } from "../ports";
import type { DashboardStats } from "../types";
import { localOrders } from "./orders";

const RECENT_ORDERS = 5;

export const localStats: StatsStore = {
  async overview(): Promise<DashboardStats> {
    const orders = await localOrders.list();

    // No orders in this browser yet — show the fixtures rather than an empty
    // dashboard that looks broken on a first visit.
    if (orders.length === 0) {
      return {
        totalOrders: DEMO_STATS.totalOrders,
        totalRevenue: DEMO_STATS.totalRevenue,
        revenueByDay: DEMO_STATS.revenueByDay,
        ordersByStatus: DEMO_STATS.ordersByStatus.map((entry) => ({
          status: entry.status as OrderStatus,
          count: entry.count,
        })),
        recentOrders: DEMO_STATS.recentOrders.map((order) => ({
          id: order.id,
          orderNumber: order.id.slice(-8).toUpperCase(),
          customer: order.customer,
          total: order.total,
          status: order.status as OrderStatus,
          itemCount: order.itemCount,
        })),
      };
    }

    const counts = new Map<OrderStatus, number>(ORDER_STATUSES.map((status) => [status, 0]));
    for (const order of orders) counts.set(order.status, (counts.get(order.status) ?? 0) + 1);

    const byDate = new Map<string, number>();
    for (const order of orders) {
      const day = order.createdAt.slice(0, 10);
      byDate.set(day, (byDate.get(day) ?? 0) + order.total);
    }

    return {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
      revenueByDay: [...byDate.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, revenue]) => ({ date, revenue })),
      ordersByStatus: ORDER_STATUSES.map((status) => ({
        status,
        count: counts.get(status) ?? 0,
      })),
      recentOrders: orders.slice(0, RECENT_ORDERS).map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: `${order.firstName} ${order.lastName}`.trim(),
        total: order.total,
        status: order.status,
        itemCount: order.items.length,
      })),
    };
  },
};
