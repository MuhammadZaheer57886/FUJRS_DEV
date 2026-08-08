"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { RevenueTrendChart } from "@/components/dashboard/charts/RevenueTrendChart";
import { CategoryBarChart } from "@/components/dashboard/charts/CategoryBarChart";
import { CatalogManager } from "@/components/dashboard/CatalogManager";
import { TaxonomyManager } from "@/components/dashboard/TaxonomyManager";
import { useToast } from "@/components/ui/Toast";
import { ROLE_LABELS } from "@/lib/auth/roles";

import {
  permissions as permissionStore,
  stats as statsStore,
  users as userStore,
} from "@/lib/data";
import {
  ACCESS_CATEGORIES,
  ACCESS_CATEGORY_LABELS,
  type AccessCategory,
  type AccessGrid,
  type DashboardStats,
  type ManagedUser,
} from "@/lib/data";
import {
  COMMISSION_TYPES,
  DEFAULT_COMMISSION,
  COMMISSION_TYPE_LABELS,
  formatCommissionRate,
  validateCommission,
  type CommissionType,
} from "@/lib/commission";
import type { AppRole } from "@/lib/auth/roles";
import { formatDevice, formatLastSeenAt, formatLocation, type LastSeen } from "@/lib/visits";
import { LoadingRow } from "@/components/ui/Loading";

/**
 * Where and on what someone was last seen.
 *
 * Every part is optional: a bare Node host sends no geo headers, and a
 * user-agent may not identify itself. Each missing piece is simply left out
 * rather than filled with "Unknown" — a row of Unknowns reads as broken.
 */
function LastSeenCell({ lastSeen }: { lastSeen: LastSeen | null }) {
  if (!lastSeen) {
    return <span className="text-label-sm text-text-muted">Not recorded</span>;
  }

  const location = formatLocation(lastSeen.city, lastSeen.country);
  const device = formatDevice(lastSeen);

  return (
    <div className="min-w-[12rem]">
      <p className="text-body-md">
        {location ?? <span className="text-text-muted">Location unavailable</span>}
        {device && <span className="text-text-muted"> · {device}</span>}
      </p>
      <p className="mt-0.5 text-label-sm text-text-muted">
        {formatLastSeenAt(lastSeen.at)}
        {lastSeen.device && ` · ${lastSeen.device}`}
      </p>
    </div>
  );
}

type Section = "OVERVIEW" | "CATALOGUE" | "VENDORS" | "USERS" | "ACCESS";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "OVERVIEW", label: "Overview" },
  { id: "CATALOGUE", label: "Catalogue" },
  { id: "VENDORS", label: "Vendors" },
  { id: "USERS", label: "Users" },
  { id: "ACCESS", label: "Access" },
];

const ASSIGNABLE_ROLES: AppRole[] = ["CUSTOMER", "ADMIN", "VENDOR", "TAILOR", "SUPER_ADMIN"];

const ACCESS_ROLES: AppRole[] = ["ADMIN", "VENDOR", "TAILOR"];

interface UsersResponse {
  // ManagedUser itself, not a narrowed copy — the copy went stale the moment
  // the port grew a field, and re-declaring the shape here is what let that
  // happen silently.
  users: ManagedUser[];
  roleCounts: { role: AppRole; count: number }[];
}

export function SuperAdminView() {
  const { toast } = useToast();
  const [section, setSection] = useState<Section>("OVERVIEW");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [managed, setManaged] = useState<ManagedUser[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("CUSTOMER");

  // Loaded, not assumed. The grid used to initialise every role to true for
  // every category, which is the opposite of what the seed grants.
  const [access, setAccess] = useState<AccessGrid | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  const refreshUsers = useCallback(async () => {
    setManaged(await userStore.list());
  }, []);

  useEffect(() => {
    void statsStore.overview().then(setStats);
    void permissionStore.read().then(setAccess);
    void refreshUsers();
  }, [refreshUsers]);

  // Derived, so a created user updates the counts without a second source of
  // truth to keep in step.
  const usersData: UsersResponse | null = managed && {
    users: managed,
    roleCounts: Object.entries(
      managed.reduce<Record<string, number>>((acc, u) => {
        acc[u.role] = (acc[u.role] ?? 0) + 1;
        return acc;
      }, {})
    ).map(([r, count]) => ({ role: r as AppRole, count })),
  };

  const vendors = (managed ?? []).filter((u) => u.role === "VENDOR");

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);

    if (password.length < 8) {
      setCreateError("Password must be at least 8 characters.");
      return;
    }

    setCreating(true);
    const result = await userStore.create({ name, email, password, role });
    setCreating(false);

    if (result.error) {
      setCreateError(result.error);
      return;
    }

    await refreshUsers();
    setName("");
    setEmail("");
    setPassword("");
    setRole("CUSTOMER");
    toast(`${ROLE_LABELS[role]} account created for ${email.toLowerCase()}.`, "success");
  }

  /**
   * Commission is the Super Admin's alone to set — vendors only ever read it.
   * Validation runs here for the user's benefit; the API re-validates, because
   * a client check is not the boundary.
   */
  async function updateCommission(id: string, patch: { type?: CommissionType; value?: number }) {
    const vendor = (managed ?? []).find((v) => v.id === id);
    if (!vendor) return;

    const commission = { ...(vendor.commission ?? DEFAULT_COMMISSION), ...patch };
    const problem = validateCommission(commission);
    if (problem) {
      toast(problem, "info");
      return;
    }

    // Optimistic: the input should respond immediately, and a rejected rate is
    // reverted by the refresh below.
    setManaged((prev) => prev?.map((u) => (u.id === id ? { ...u, commission } : u)) ?? prev);

    const result = await userStore.setCommission(id, commission);
    if (result.error) {
      toast(result.error, "info");
      await refreshUsers();
    }
  }

  async function toggleAccess(r: AppRole, category: AccessCategory, field: "canView" | "canEdit") {
    const current = access?.[r]?.[category] ?? { canView: false, canEdit: false };
    const next = { ...current, [field]: !current[field] };

    try {
      setAccessError(null);
      setAccess(await permissionStore.set(r, category, next));
    } catch (err) {
      // The database refuses a non-Super-Admin. Surface that rather than
      // leaving a checkbox that appears to have worked.
      setAccessError(err instanceof Error ? err.message : "Couldn't save that change.");
      setAccess(await permissionStore.read());
    }
  }

  return (
    <div>
      <div className="mt-4 flex gap-2 border border-outline-variant p-1 w-fit">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`px-6 py-2.5 label-caps ${
              section === s.id ? "bg-primary text-on-primary" : "text-on-surface"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === "OVERVIEW" && (
        <div className="mt-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="border border-border-subtle p-6">
              <p className="text-label-sm uppercase text-text-muted">Total Orders</p>
              <p className="mt-2 font-display text-headline-sm">
                {stats ? stats.totalOrders.toLocaleString() : "—"}
              </p>
            </div>
            <div className="border border-border-subtle p-6">
              <p className="text-label-sm uppercase text-text-muted">Total Revenue</p>
              <p className="mt-2 font-display text-headline-sm">
                {stats ? `PKR ${stats.totalRevenue.toLocaleString()}` : "—"}
              </p>
            </div>
            <div className="border border-border-subtle p-6">
              <p className="text-label-sm uppercase text-text-muted">Total Users</p>
              <p className="mt-2 font-display text-headline-sm">
                {usersData ? usersData.users.length.toLocaleString() : "—"}
              </p>
            </div>
            <div className="border border-border-subtle p-6">
              <p className="text-label-sm uppercase text-text-muted">Staff Accounts</p>
              <p className="mt-2 font-display text-headline-sm">
                {usersData
                  ? usersData.users.filter((u) => u.role !== "CUSTOMER").length.toLocaleString()
                  : "—"}
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="border border-border-subtle p-6">
              <p className="text-label-sm uppercase text-text-muted">
                Revenue, last {stats?.revenueByDay.length ?? 14} days
              </p>
              <div className="mt-4">
                <RevenueTrendChart
                  data={(stats?.revenueByDay ?? []).map((d) => ({
                    label: d.date.slice(5),
                    value: d.revenue,
                  }))}
                  valueFormatter={(v) => `PKR ${v.toLocaleString()}`}
                  emptyMessage="No revenue in this window yet."
                />
              </div>
            </div>
            <div className="border border-border-subtle p-6">
              <p className="text-label-sm uppercase text-text-muted">Users by role</p>
              <div className="mt-4">
                <CategoryBarChart
                  data={(usersData?.roleCounts ?? []).map((rc) => ({
                    label: ROLE_LABELS[rc.role],
                    value: rc.count,
                  }))}
                  emptyMessage="No users yet."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {section === "CATALOGUE" && (
        <div className="mt-8">
          <CatalogManager />
          <TaxonomyManager />
        </div>
      )}

      {section === "VENDORS" && (
        <div className="mt-8">
          <h2 className="font-display text-headline-sm">Vendor Commission</h2>
          <p className="mt-1 max-w-prose text-label-sm text-marketplace-bronze">
            Vendors market products through their referral link and earn on what sells. Only you set
            the rate — changes here update this screen only, they aren&apos;t saved anywhere yet.
          </p>

          <div className="mt-4 overflow-x-auto border border-border-subtle">
            <table className="w-full text-left text-body-md">
              <thead className="bg-surface-container-low text-label-sm uppercase text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Vendor</th>
                  <th className="px-4 py-3 font-medium">Referral Code</th>
                  <th className="px-4 py-3 font-medium">Commission Type</th>
                  <th className="px-4 py-3 font-medium">Rate</th>
                  <th className="px-4 py-3 font-medium">Clicks</th>
                  <th className="px-4 py-3 font-medium">Sales</th>
                  <th className="px-4 py-3 font-medium">Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {vendors.map((vendor) => {
                  const rate = vendor.commission ?? DEFAULT_COMMISSION;
                  return (
                    <tr key={vendor.id} className="align-middle">
                      <td className="px-4 py-3">
                        <p className="font-medium">{vendor.name}</p>
                        <p className="text-label-sm text-text-muted">{vendor.email}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap tracking-widest text-text-muted">
                        {vendor.referralCode}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={rate.type}
                          onChange={(e) =>
                            updateCommission(vendor.id, { type: e.target.value as CommissionType })
                          }
                          aria-label={`Commission type for ${vendor.name}`}
                          className="border border-outline-variant bg-white px-3 py-2 font-body text-body-md focus:border-marketplace-bronze focus:outline-none"
                        >
                          {COMMISSION_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {COMMISSION_TYPE_LABELS[type]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            step={rate.type === "PERCENT" ? 0.5 : 100}
                            value={rate.value}
                            onChange={(e) =>
                              updateCommission(vendor.id, { value: Number(e.target.value) })
                            }
                            aria-label={`Commission rate for ${vendor.name}`}
                            className="w-24 border border-outline-variant bg-transparent px-3 py-2 font-body text-body-md focus:border-marketplace-bronze focus:outline-none"
                          />
                          <span className="text-label-sm text-text-muted">
                            {rate.type === "PERCENT" ? "%" : "PKR"}
                          </span>
                        </div>
                        <p className="mt-1 text-label-sm text-marketplace-bronze">
                          {formatCommissionRate(rate)} per sale
                        </p>
                      </td>
                      {/* Clicks, sales and earnings are each vendor's OWN rows:
                          RLS scopes `commissions` and `referral_clicks` to the
                          vendor, so reading them across vendors needs a server
                          route that doesn't exist yet. An em dash until it
                          does — never an invented number. */}
                      <td className="px-4 py-3 text-text-muted">—</td>
                      <td className="px-4 py-3 text-text-muted">—</td>
                      <td className="px-4 py-3 whitespace-nowrap text-text-muted">—</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-2 max-w-prose text-label-sm text-text-muted">
            Clicks, sales and earnings are sample figures. Crediting a real sale to a vendor needs
            the backend to read the <code className="font-mono">ref</code> code off the incoming
            link.
          </p>
        </div>
      )}

      {section === "USERS" && (
        <div className="mt-8">
          <h2 className="font-display text-headline-sm">Create User</h2>
          <p className="mt-1 text-label-sm text-marketplace-bronze">
            Adds a user to this screen only — not saved anywhere yet.
          </p>
          <form
            onSubmit={(e) => void handleCreateUser(e)}
            className="mt-4 grid gap-4 border border-border-subtle p-6 sm:grid-cols-2 lg:grid-cols-5"
          >
            <input
              required
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-outline-variant bg-transparent px-4 py-3 font-body text-body-md focus:outline-none focus:border-marketplace-bronze"
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-outline-variant bg-transparent px-4 py-3 font-body text-body-md focus:outline-none focus:border-marketplace-bronze"
            />
            <input
              required
              type="password"
              minLength={8}
              placeholder="Temporary password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-outline-variant bg-transparent px-4 py-3 font-body text-body-md focus:outline-none focus:border-marketplace-bronze"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AppRole)}
              className="border border-outline-variant bg-white px-4 py-3 font-body text-body-md focus:outline-none focus:border-marketplace-bronze"
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <Button type="submit" variant="primary" disabled={creating}>
              {creating ? "Creating…" : "Create"}
            </Button>
          </form>

          {createError && (
            <p className="mt-3 max-w-prose text-label-sm text-error" role="alert">
              {createError}
            </p>
          )}

          <h2 className="mt-10 font-display text-headline-sm">All Users</h2>
          <div className="mt-4 overflow-x-auto border border-border-subtle">
            <table className="w-full text-left text-body-md">
              <thead className="bg-surface-container-low text-label-sm uppercase text-text-muted">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Last Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {!usersData && <LoadingRow colSpan={4} />}
                {usersData?.users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      {u.name}
                      {u.isAnonymous && (
                        <span className="ml-2 border border-border-subtle px-2 py-0.5 text-label-sm uppercase text-text-muted">
                          Guest
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.email || <span className="text-text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-label-sm uppercase text-text-muted">
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <LastSeenCell lastSeen={u.lastSeen} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-label-sm text-text-muted">
            Editing an existing user&apos;s role or deactivating an account isn&apos;t wired up yet
            — there&apos;s no status column on profiles for it (see TASKS.md).
          </p>
        </div>
      )}

      {section === "ACCESS" && (
        <div className="mt-8">
          <p className="mb-4 max-w-prose text-label-sm text-marketplace-bronze">
            Saved to the database and enforced there. Super Admin isn&apos;t listed because it
            bypasses this grid entirely — access it can&apos;t lose is access nobody can
            accidentally remove.
          </p>

          {accessError && (
            <p
              role="alert"
              className="mb-4 border border-outline-variant border-l-4 border-l-error p-3 text-label-sm text-error"
            >
              {accessError}
            </p>
          )}

          <div className="overflow-x-auto border border-border-subtle">
            <table className="w-full text-left text-body-md">
              <thead className="bg-surface-container-low text-label-sm uppercase text-text-muted">
                <tr>
                  <th className="px-4 py-3">Role</th>
                  {ACCESS_CATEGORIES.map((c) => (
                    <th key={c} className="px-4 py-3">
                      {ACCESS_CATEGORY_LABELS[c]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {!access && <LoadingRow colSpan={ACCESS_CATEGORIES.length + 1} />}

                {access &&
                  ACCESS_ROLES.map((r) => (
                    <tr key={r}>
                      <td className="px-4 py-3 text-label-sm uppercase text-text-muted">
                        {ROLE_LABELS[r]}
                      </td>
                      {ACCESS_CATEGORIES.map((c) => {
                        const grant = access[r]?.[c] ?? { canView: false, canEdit: false };
                        return (
                          <td key={c} className="px-4 py-3">
                            <div className="flex flex-col gap-1.5">
                              <label className="flex cursor-pointer items-center gap-2 text-label-sm">
                                <input
                                  type="checkbox"
                                  checked={grant.canView}
                                  onChange={() => void toggleAccess(r, c, "canView")}
                                  aria-label={`${ROLE_LABELS[r]} can view ${ACCESS_CATEGORY_LABELS[c]}`}
                                  className="h-4 w-4 accent-marketplace-bronze"
                                />
                                View
                              </label>
                              {/* Editing something you can't see isn't a
                                  coherent grant, so it's disabled rather than
                                  silently ignored. */}
                              <label
                                className={`flex items-center gap-2 text-label-sm ${
                                  grant.canView ? "cursor-pointer" : "cursor-not-allowed opacity-40"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={grant.canEdit}
                                  disabled={!grant.canView}
                                  onChange={() => void toggleAccess(r, c, "canEdit")}
                                  aria-label={`${ROLE_LABELS[r]} can edit ${ACCESS_CATEGORY_LABELS[c]}`}
                                  className="h-4 w-4 accent-marketplace-bronze"
                                />
                                Edit
                              </label>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
