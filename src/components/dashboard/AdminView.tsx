"use client";

import { useEffect, useState } from "react";
import { RevenueTrendChart } from "@/components/dashboard/charts/RevenueTrendChart";
import { CategoryBarChart } from "@/components/dashboard/charts/CategoryBarChart";
import { CatalogManager } from "@/components/dashboard/CatalogManager";
import { OrderManager } from "@/components/dashboard/OrderManager";
import { catalog, stats as statsStore, users as userStore } from "@/lib/data";
import type { DashboardStats } from "@/lib/data";

export function AdminView() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [vendorCount, setVendorCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      const [overview, products] = await Promise.all([statsStore.overview(), catalog.list()]);
      if (!active) return;
      setData(overview);
      setProductCount(products.length);
    })();

    // Listing users is Super-Admin-only, so an Admin gets nothing back. An em
    // dash is the honest answer there — better than a count they can't see.
    void userStore
      .list()
      .then((all) => {
        if (active) setVendorCount(all.filter((u) => u.role === "VENDOR").length);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const stats = [
    { label: "Total Orders", value: data ? data.totalOrders.toLocaleString() : "—" },
    { label: "Total Revenue", value: data ? `PKR ${data.totalRevenue.toLocaleString()}` : "—" },
    { label: "Catalogue Products", value: productCount === null ? "—" : String(productCount) },
    { label: "Active Vendors", value: vendorCount === null ? "—" : String(vendorCount) },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-border-subtle p-6">
            <p className="text-label-sm uppercase text-text-muted">{stat.label}</p>
            <p className="mt-2 font-display text-headline-sm">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <p className="label-caps text-gold">Operations</p>
        <h2 className="mt-2 font-display text-headline-sm">Revenue &amp; Orders</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="border border-border-subtle p-6">
            <p className="text-label-sm uppercase text-text-muted">
              Revenue, last {data?.revenueByDay.length ?? 14} days
            </p>
            <div className="mt-4">
              <RevenueTrendChart
                data={(data?.revenueByDay ?? []).map((d) => ({
                  label: d.date.slice(5),
                  value: d.revenue,
                }))}
                valueFormatter={(v) => `PKR ${v.toLocaleString()}`}
                emptyMessage="No revenue in this window yet."
              />
            </div>
          </div>
          <div className="border border-border-subtle p-6">
            <p className="text-label-sm uppercase text-text-muted">Orders by status</p>
            <div className="mt-4">
              <CategoryBarChart
                data={(data?.ordersByStatus ?? []).map((s) => ({
                  label: s.status,
                  value: s.count,
                }))}
                emptyMessage="No orders placed yet."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <OrderManager />
      </div>

      <div className="mt-10">
        <CatalogManager />
      </div>
    </div>
  );
}
