"use client";

// Super Admin user management against the API route.
//
// Creating a user needs the service role key, which bypasses RLS and must
// never reach the browser — so this adapter is a thin client over
// /api/admin/users, where the caller's Super Admin role is verified
// server-side. The session travels as a cookie; nothing here sends a token.

import type { UserAdminStore } from "../ports";
import type { ManagedUser } from "../types";

const ENDPOINT = "/api/admin/users";

async function parseError(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    return typeof body?.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

export const supabaseUsers: UserAdminStore = {
  async list() {
    const response = await fetch(ENDPOINT, { cache: "no-store" });
    if (!response.ok) return [];
    const body = await response.json();
    return (body.users ?? []) as ManagedUser[];
  },

  async create(input) {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      return { error: await parseError(response, "Couldn't create that user.") };
    }
    const body = await response.json();
    return { user: body.user as ManagedUser };
  },

  async setCommission(id, rate) {
    const response = await fetch(ENDPOINT, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, commission: rate }),
    });

    if (!response.ok) {
      return { error: await parseError(response, "Couldn't update that rate.") };
    }
    return {};
  },
};
