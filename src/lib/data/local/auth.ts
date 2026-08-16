// Browser-only "auth": a localStorage session with no passwords.
//
// There is nothing to authenticate against, so sign-in only checks that an
// account with that email was registered on this device; any password is
// accepted. That is fine for a browser-only build and is exactly why the
// Supabase adapter exists.
//
// The first account registered becomes SUPER_ADMIN (see local/profile.ts), so
// there is still a route to the dashboards without the old demo logins.

import { clearSession, persistSession, readSession, type StoredUser } from "@/lib/auth/session";
import type { AuthStore } from "../ports";
import type { Account } from "../types";
import { localProfiles } from "./profile";

const NO_BACKEND_ERROR = "Password changes need the live backend, which is not wired up yet.";
const UNKNOWN_ACCOUNT_ERROR =
  "No account found for that email on this device. Create one, or use a demo login.";

function toUser(account: Account): StoredUser {
  return {
    id: `local-${account.email}`,
    email: account.email,
    name: account.name || account.email,
    role: account.role,
    assignedStitcherSlug: null,
    // The local adapter has no guest identity — you are either registered on
    // this device or you have no session at all.
    isAnonymous: false,
  };
}

export const localAuth: AuthStore = {
  async current() {
    const stored = readSession();
    if (!stored) return null;

    // Profile edits are saved per-email, so re-apply them over the fixture.
    const saved = await localProfiles.find(stored.email);
    return saved?.name ? { ...stored, name: saved.name } : stored;
  },

  async signIn(email) {
    const account = await localProfiles.find(email);
    if (!account) return { error: UNKNOWN_ACCOUNT_ERROR };

    const user = toUser(account);
    persistSession(user);
    return { user };
  },

  async signUp(input) {
    const existing = await localProfiles.find(input.email);
    if (existing) return { error: "An account with that email already exists." };

    const account = await localProfiles.create({ name: input.name, email: input.email });
    const user = toUser(account);
    persistSession(user);
    return { user };
  },

  async signOut() {
    clearSession();
  },

  async updatePassword() {
    return { error: NO_BACKEND_ERROR };
  },

  async updateName(name) {
    const stored = readSession();
    if (!stored) return { error: "Not signed in." };

    await localProfiles.updateName(name);
    const user = { ...stored, name: name.trim() };
    persistSession(user);
    return { user };
  },

  onChange() {
    // Nothing changes a localStorage session from underneath us.
    return () => {};
  },
};
