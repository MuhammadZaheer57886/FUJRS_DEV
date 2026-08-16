"use client";

import { useState } from "react";
import { AdminView } from "@/components/dashboard/AdminView";
import { useAuth } from "@/components/providers/AuthProvider";
import { VendorView } from "@/components/dashboard/VendorView";
import { TailorView } from "@/components/dashboard/TailorView";
import { SuperAdminView } from "@/components/dashboard/SuperAdminView";
import { StaffGate } from "@/components/dashboard/StaffGate";
import { ROLE_LABELS } from "@/lib/auth/roles";

type Role = "SUPER_ADMIN" | "ADMIN" | "VENDOR" | "TAILOR";

export default function DashboardPage() {
  return (
    <StaffGate callbackUrl="/dashboard">
      <Dashboard />
    </StaffGate>
  );
}

/** Only mounted once the gate has confirmed a staff session. */
function Dashboard() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<Role | null>(null);

  const userRole = session?.user.role as Role | "CUSTOMER" | undefined;
  const availableRoles: Role[] =
    userRole === "SUPER_ADMIN"
      ? ["SUPER_ADMIN", "ADMIN", "VENDOR", "TAILOR"]
      : userRole === "ADMIN"
        ? ["ADMIN", "VENDOR", "TAILOR"]
        : userRole && userRole !== "CUSTOMER"
          ? [userRole]
          : [];

  // The gate already refused a customer, so this is only reachable if a role
  // is added to AppRole and not to the list above.
  if (availableRoles.length === 0) return null;

  const role = activeTab && availableRoles.includes(activeTab) ? activeTab : availableRoles[0];

  return (
    <div className="container-luxe py-12">
      <p className="label-caps text-gold">Internal Tools</p>
      <h1 className="mt-2 font-display text-headline-md">Dashboard</h1>
      <p className="mt-2 text-body-md text-text-muted">
        Signed in as {session?.user.name}, {ROLE_LABELS[role]}.{" "}
        {process.env.NEXT_PUBLIC_DATA_BACKEND === "supabase"
          ? "Connected to the database, so everything here is live."
          : "Running on browser storage, so nothing here is shared or permanent."}
      </p>

      {availableRoles.length > 1 && (
        <div className="mt-8 flex gap-2 border border-outline-variant p-1 w-fit">
          {availableRoles.map((r) => (
            <button
              key={r}
              onClick={() => setActiveTab(r)}
              className={`px-6 py-2.5 label-caps ${
                role === r ? "bg-primary text-on-primary" : "text-on-surface"
              }`}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      )}

      <div className="mt-10">
        {role === "SUPER_ADMIN" && <SuperAdminView />}
        {role === "ADMIN" && <AdminView />}
        {role === "VENDOR" && <VendorView />}
        {role === "TAILOR" && <TailorView />}
      </div>
    </div>
  );
}
