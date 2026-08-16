export type AppRole = "CUSTOMER" | "ADMIN" | "VENDOR" | "TAILOR" | "SUPER_ADMIN";

export const ROLE_LABELS: Record<AppRole, string> = {
  CUSTOMER: "Customer",
  ADMIN: "Admin",
  VENDOR: "Vendor",
  TAILOR: "Tailor",
  SUPER_ADMIN: "Super Admin",
};

export type StaffRole = Exclude<AppRole, "CUSTOMER">;

export const STAFF_ROLES: StaffRole[] = ["ADMIN", "VENDOR", "TAILOR", "SUPER_ADMIN"];

export function isStaffRole(role: AppRole | null | undefined): role is StaffRole {
  return !!role && STAFF_ROLES.includes(role as StaffRole);
}

export function canAccessDashboard(role: AppRole | null | undefined): boolean {
  return isStaffRole(role);
}

/**
 * What each staff role is responsible for. Drives the staff account screen —
 * customers get order history instead, which means nothing to these roles.
 */
export const ROLE_WORKSPACE: Record<StaffRole, { summary: string; duties: string[] }> = {
  SUPER_ADMIN: {
    summary:
      "Full access across FUJRS. You manage who else gets in, and what they're allowed to see.",
    duties: [
      "Create and manage dashboard users",
      "Assign roles and access permissions",
      "Review store-wide revenue and orders",
    ],
  },
  ADMIN: {
    summary: "Day-to-day running of the store: orders, catalogue submissions, and performance.",
    duties: [
      "Review orders and revenue",
      "Approve or reject vendor product drafts",
      "Monitor the bespoke stitching pipeline",
    ],
  },
  VENDOR: {
    summary:
      "Market FUJRS pieces through your own channels and earn commission on everything that sells through your links.",
    duties: [
      "Take a referral link for any piece in the catalogue",
      "Share it across your social channels",
      "Track referred sales and commission earned",
    ],
  },
  TAILOR: {
    summary: "Your bespoke queue: every made-to-measure order assigned to your atelier.",
    duties: [
      "Work through the measurement queue",
      "Update stitching status as each piece progresses",
      "Flag pieces ready for fitting",
    ],
  },
};
