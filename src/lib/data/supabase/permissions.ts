"use client";

// The role × category access grid, from `role_permissions`.
//
// Every signed-in user may READ the grid — the dashboard needs it to decide
// what to render. Only a Super Admin may change it, and that is enforced by
// `role_permissions_write`, not by this file hiding a checkbox.
//
// SUPER_ADMIN deliberately has no rows: it bypasses the grid entirely rather
// than depending on rows that could be edited away.

import type { AppRole } from "@/lib/auth/roles";
import type { PermissionStore } from "../ports";
import { StoreWriteError, type AccessCategory, type AccessGrid } from "../types";
import { getBrowserClient } from "./client";

async function readGrid(): Promise<AccessGrid> {
  const { data, error } = await getBrowserClient()
    .from("role_permissions")
    .select("role, category, can_view, can_edit");

  if (error) throw new StoreWriteError("Couldn't load the access grid.");

  const grid: AccessGrid = {};
  for (const row of data ?? []) {
    const role = row.role as AppRole;
    const category = row.category as AccessCategory;
    grid[role] ??= {} as NonNullable<AccessGrid[AppRole]>;
    grid[role]![category] = { canView: row.can_view, canEdit: row.can_edit };
  }
  return grid;
}

export const supabasePermissions: PermissionStore = {
  read: readGrid,

  async set(role, category, grant) {
    // Editing something you cannot see is not a coherent grant, and a grid
    // that can express it will eventually be read as if it meant something.
    const canEdit = grant.canView ? grant.canEdit : false;

    const { error } = await getBrowserClient().from("role_permissions").upsert(
      {
        role,
        category,
        can_view: grant.canView,
        can_edit: canEdit,
      },
      { onConflict: "role,category" }
    );

    if (error) {
      throw new StoreWriteError(
        error.code === "42501"
          ? "Only a Super Admin can change access."
          : "Couldn't save that change."
      );
    }

    return readGrid();
  },
};
