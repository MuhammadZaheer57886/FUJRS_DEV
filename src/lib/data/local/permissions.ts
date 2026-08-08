// The access grid on the browser-only backend.
//
// Seeded least-privilege, matching the `role_permissions` seed exactly — not
// with "everything on", which is what the screen used to assume. A grid that
// starts permissive teaches the wrong thing about what each role needs, and
// the two backends should not disagree about it.

import type { AppRole } from "@/lib/auth/roles";
import type { PermissionStore } from "../ports";
import { ACCESS_CATEGORIES, type AccessCategory, type AccessGrid } from "../types";
import { readJSON, writeJSON } from "./storage";

const KEY = "fujrs-role-permissions";

/** view+edit, view-only, or nothing. */
const rw = { canView: true, canEdit: true };
const ro = { canView: true, canEdit: false };
const no = { canView: false, canEdit: false };

/** Mirrors the seed in the permissions_payouts migration. */
const DEFAULTS: AccessGrid = {
  ADMIN: {
    PRODUCTS: rw,
    ORDERS: rw,
    STITCHING: rw,
    VENDORS: ro,
    REPORTS: ro,
  },
  VENDOR: {
    PRODUCTS: ro,
    ORDERS: no,
    STITCHING: no,
    VENDORS: no,
    REPORTS: no,
  },
  TAILOR: {
    PRODUCTS: no,
    ORDERS: no,
    STITCHING: rw,
    VENDORS: no,
    REPORTS: no,
  },
};

/** Deep copy, so a stored grid can never alias the defaults. */
const clone = (grid: AccessGrid): AccessGrid => JSON.parse(JSON.stringify(grid)) as AccessGrid;

export const localPermissions: PermissionStore = {
  async read() {
    return readJSON<AccessGrid>(KEY, clone(DEFAULTS));
  },

  async set(role: AppRole, category: AccessCategory, grant) {
    const grid = readJSON<AccessGrid>(KEY, clone(DEFAULTS));
    const forRole = grid[role] ?? ({} as NonNullable<AccessGrid[AppRole]>);

    // Same rule as the database adapter: you cannot edit what you cannot see.
    for (const c of ACCESS_CATEGORIES) forRole[c] ??= no;
    forRole[category] = {
      canView: grant.canView,
      canEdit: grant.canView ? grant.canEdit : false,
    };

    const next = { ...grid, [role]: forRole };
    writeJSON(KEY, next);
    return next;
  },
};
