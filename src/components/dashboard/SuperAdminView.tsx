"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { RevenueTrendChart } from "@/components/dashboard/charts/RevenueTrendChart";
import { CategoryBarChart } from "@/components/dashboard/charts/CategoryBarChart";
import { CatalogManager } from "@/components/dashboard/CatalogManager";
import { TaxonomyManager } from "@/components/dashboard/TaxonomyManager";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
  type CommissionRate,
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

  /**
   * Vendor rows part-way through a rate edit, keyed by vendor id.
   *
   * The number is held as the raw string so a half-typed field stays half
   * typed. A row with no entry here is showing the stored rate.
   */
  const [rateDrafts, setRateDrafts] = useState<
    Record<string, { type: CommissionType; value: string }>
  >({});

  /**
   * The rate change the confirmation dialog is asking about; null when closed.
   *
   * Carries the vendor's name and both rates so the dialog can say what is
   * actually changing rather than "are you sure?". Rates are money owed to
   * someone, and the number is typed a digit at a time: 1 is on its way to 15
   * and must not be saved on the way past.
   */
  const [pendingRate, setPendingRate] = useState<{
    id: string;
    name: string;
    from: CommissionRate;
    to: CommissionRate;
  } | null>(null);

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

  function savedRate(id: string): CommissionRate {
    return (managed ?? []).find((v) => v.id === id)?.commission ?? DEFAULT_COMMISSION;
  }

  /**
   * Commission is the Super Admin's alone to set — vendors only ever read it.
   * Validation runs here for the user's benefit; the API re-validates, because
   * a client check is not the boundary.
   */
  async function saveCommission(id: string, commission: CommissionRate) {
    // Optimistic: the input should respond immediately, and a rejected rate is
    // reverted by the refresh below. The draft goes with it, so the row reads
    // from the stored rate again rather than from what was typed.
    setManaged((prev) => prev?.map((u) => (u.id === id ? { ...u, commission } : u)) ?? prev);
    setRateDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    const result = await userStore.setCommission(id, commission);
    if (result.error) {
      toast(result.error, "info");
      await refreshUsers();
    }
  }

  /**
   * Switching the basis CLEARS the number rather than carrying it over.
   *
   * The two fields only mean anything together: 100 as a percentage is the
   * whole sale, 100 as a flat fee is PKR 100 on a sale of any size. Reusing
   * the old number across a switch is how a vendor silently ends up on a rate
   * nobody chose. Nothing is saved here either, because a basis on its own is
   * half a rate: the write waits for the new number.
   */
  function changeCommissionType(id: string, type: CommissionType) {
    setRateDrafts((prev) => {
      const next = { ...prev };
      if (type === savedRate(id).type) {
        // Back to what is stored, so there is nothing left half-edited.
        delete next[id];
      } else {
        next[id] = { type, value: "" };
      }
      return next;
    });
  }

  /**
   * Typing only ever moves the draft. The write happens once, from the dialog,
   * so an empty field is someone part-way through typing rather than a rate of
   * zero, and no vendor is briefly put on a rate that was only ever a keystroke
   * on the way to another one.
   */
  function changeCommissionValue(id: string, raw: string) {
    const type = rateDrafts[id]?.type ?? savedRate(id).type;
    setRateDrafts((prev) => ({ ...prev, [id]: { type, value: raw } }));
  }

  function discardRateDraft(id: string) {
    setRateDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function handleConfirmRate() {
    if (!pendingRate) return;
    await saveCommission(pendingRate.id, pendingRate.to);
    setPendingRate(null);
    toast(
      `${pendingRate.name} now earns ${formatCommissionRate(pendingRate.to)} per sale.`,
      "success"
    );
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
                {stats ? stats.totalOrders.toLocaleString() : "-"}
              </p>
            </div>
            <div className="border border-border-subtle p-6">
              <p className="text-label-sm uppercase text-text-muted">Total Revenue</p>
              <p className="mt-2 font-display text-headline-sm">
                {stats ? `PKR ${stats.totalRevenue.toLocaleString()}` : "-"}
              </p>
            </div>
            <div className="border border-border-subtle p-6">
              <p className="text-label-sm uppercase text-text-muted">Total Users</p>
              <p className="mt-2 font-display text-headline-sm">
                {usersData ? usersData.users.length.toLocaleString() : "-"}
              </p>
            </div>
            <div className="border border-border-subtle p-6">
              <p className="text-label-sm uppercase text-text-muted">Staff Accounts</p>
              <p className="mt-2 font-display text-headline-sm">
                {usersData
                  ? usersData.users.filter((u) => u.role !== "CUSTOMER").length.toLocaleString()
                  : "-"}
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
            the rate. Editing a row changes nothing until you save it and confirm, and a saved rate
            applies to every sale placed after it; sales already recorded keep the rate they were
            settled at.
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
                  const saved = vendor.commission ?? DEFAULT_COMMISSION;
                  const draft = rateDrafts[vendor.id];
                  const type = draft?.type ?? saved.type;
                  const value = draft ? draft.value : String(saved.value);
                  const typed = Number(value);
                  // What the row would pay at what is currently in the fields,
                  // which is the stored rate unless an edit is in flight.
                  const entered: CommissionRate | null =
                    value.trim() === "" || !Number.isFinite(typed) ? null : { type, value: typed };
                  const problem = entered ? validateCommission(entered) : null;
                  // Only a real difference is offered for saving. Retyping the
                  // rate a vendor is already on is not a change to confirm.
                  const changed =
                    entered !== null &&
                    (entered.type !== saved.type || entered.value !== saved.value);
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
                          value={type}
                          onChange={(e) =>
                            changeCommissionType(vendor.id, e.target.value as CommissionType)
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
                            step={type === "PERCENT" ? 0.5 : 100}
                            value={value}
                            onChange={(e) => changeCommissionValue(vendor.id, e.target.value)}
                            aria-label={`Commission rate for ${vendor.name}`}
                            className="w-24 border border-outline-variant bg-transparent px-3 py-2 font-body text-body-md focus:border-marketplace-bronze focus:outline-none"
                          />
                          <span className="text-label-sm text-text-muted">
                            {type === "PERCENT" ? "%" : "PKR"}
                          </span>
                        </div>
                        {problem ? (
                          <p className="mt-1 text-label-sm text-error">{problem}</p>
                        ) : !entered ? (
                          <p className="mt-1 text-label-sm text-text-muted">
                            Enter a {type === "PERCENT" ? "percentage" : "flat amount"}. Still on{" "}
                            {formatCommissionRate(saved)} until you do.
                          </p>
                        ) : changed ? (
                          <p className="mt-1 text-label-sm text-text-muted">
                            Was {formatCommissionRate(saved)}. Not saved yet.
                          </p>
                        ) : (
                          <p className="mt-1 text-label-sm text-marketplace-bronze">
                            {formatCommissionRate(entered)} per sale
                          </p>
                        )}

                        {/* Shown only when there is something to save, so the
                            row is a plain readout until it is being edited. */}
                        {draft && (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={!changed || problem !== null}
                              onClick={() =>
                                entered &&
                                setPendingRate({
                                  id: vendor.id,
                                  name: vendor.name,
                                  from: saved,
                                  to: entered,
                                })
                              }
                              className="border border-outline-variant px-3 py-1.5 font-label-sm text-label-sm uppercase tracking-widest transition-colors hover:border-marketplace-bronze hover:text-marketplace-bronze disabled:opacity-40 disabled:pointer-events-none"
                            >
                              Save Rate
                            </button>
                            <button
                              type="button"
                              onClick={() => discardRateDraft(vendor.id)}
                              className="font-label-sm text-label-sm uppercase tracking-widest text-text-muted underline underline-offset-4 transition-colors hover:text-on-surface"
                            >
                              Discard
                            </button>
                          </div>
                        )}
                      </td>
                      {/* Clicks, sales and earnings are each vendor's OWN rows:
                          RLS scopes `commissions` and `referral_clicks` to the
                          vendor, so reading them across vendors needs a server
                          route that doesn't exist yet. An em dash until it
                          does, never an invented number. */}
                      <td className="px-4 py-3 text-text-muted">-</td>
                      <td className="px-4 py-3 text-text-muted">-</td>
                      <td className="px-4 py-3 whitespace-nowrap text-text-muted">-</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-2 max-w-prose text-label-sm text-text-muted">
            Clicks, sales and earnings are each vendor&apos;s own records and are readable only by
            them, so they show as - here until there is a server route that can read them across
            vendors. Every vendor sees their own figures on their dashboard.
          </p>
        </div>
      )}

      {section === "USERS" && (
        <div className="mt-8">
          <h2 className="font-display text-headline-sm">Create User</h2>
          <p className="mt-1 text-label-sm text-marketplace-bronze">
            Creates a real account with a working sign-in. The role is set here, never chosen by the
            person signing in.
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
                      {u.email || <span className="text-text-muted">-</span>}
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
            Editing an existing user&apos;s role or deactivating an account isn&apos;t wired up yet,
            because there&apos;s no status column on profiles for it (see TASKS.md).
          </p>
        </div>
      )}

      {section === "ACCESS" && (
        <div className="mt-8">
          <p className="mb-4 max-w-prose text-label-sm text-marketplace-bronze">
            Saved to the database and enforced there. Super Admin isn&apos;t listed because it
            bypasses this grid entirely, because access it can&apos;t lose is access nobody can
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

      <ConfirmDialog
        open={pendingRate !== null}
        title="Update this vendor's rate?"
        message={
          <>
            {pendingRate?.name} will earn {pendingRate && formatCommissionRate(pendingRate.to)} on
            every referred sale from now on, instead of{" "}
            {pendingRate && formatCommissionRate(pendingRate.from)}. Sales already recorded keep the
            rate they were settled at, so nothing they have earned changes.
          </>
        }
        confirmLabel="Update Rate"
        pendingLabel="Updating rate"
        onConfirm={handleConfirmRate}
        onCancel={() => setPendingRate(null)}
      />
    </div>
  );
}
