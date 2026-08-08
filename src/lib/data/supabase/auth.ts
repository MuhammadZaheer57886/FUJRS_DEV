"use client";

// Supabase Auth, cookie-backed.
//
// The role is read from `public.users`, never from the JWT or user metadata:
// metadata is client-writable, so trusting it for `role` would make a
// self-assigned SUPER_ADMIN one signup away. RLS policies read the same
// column, so the UI and the database agree on who someone is.

import type { AppRole } from "@/lib/auth/roles";
import type { StoredUser } from "@/lib/auth/session";
import type { AuthStore } from "../ports";
import { getBrowserClient } from "./client";

/** Supabase surfaces these verbatim; they're not phrased for an end user. */
function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "That email and password don't match.";
  if (m.includes("email not confirmed")) return "Check your inbox and confirm your email first.";
  if (m.includes("already registered")) return "An account with that email already exists.";
  if (m.includes("password")) return message;
  return message || "Something went wrong. Please try again.";
}

/**
 * Builds the app's user from the `public.users` row.
 *
 * Returns null when the row is missing — the signup trigger creates it, so a
 * gap means the trigger didn't fire, and inventing a CUSTOMER here would mask
 * that. Better to read as signed-out than to guess at a role.
 */
async function loadUser(id: string, fallbackEmail: string): Promise<StoredUser | null> {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, role, is_anonymous")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email ?? fallbackEmail,
    name: data.name || data.email || "Guest",
    role: data.role as AppRole,
    assignedStitcherSlug: null,
    // From the database column, which the auth trigger mirrors from
    // auth.users.is_anonymous — not from the JWT, for the same reason `role`
    // isn't: the two must agree, and this table is what RLS reads.
    isAnonymous: data.is_anonymous,
  };
}

export const supabaseAuth: AuthStore = {
  async current() {
    const supabase = getBrowserClient();
    // getUser() verifies the token with the auth server. getSession() only
    // decodes the cookie, so it must never be what decides who someone is.
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return loadUser(data.user.id, data.user.email ?? "");
  },

  async signIn(email, password) {
    const supabase = getBrowserClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: friendlyError(error.message) };
    if (!data.user) return { error: "Sign-in failed. Please try again." };

    const user = await loadUser(data.user.id, data.user.email ?? email);
    return user ? { user } : { error: "Your account is missing its profile. Contact support." };
  },

  async signUp(input) {
    const supabase = getBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      // Read by the signup trigger for the display name only. The trigger
      // hard-codes role = CUSTOMER and never reads a role from here.
      options: { data: { name: input.name } },
    });

    if (error) return { error: friendlyError(error.message) };
    if (!data.user) return { error: "Sign-up failed. Please try again." };

    // With email confirmation on, there's no session yet — the user must
    // confirm before they can sign in. Say so rather than appearing to succeed.
    if (!data.session) {
      return { error: "Check your inbox to confirm your email, then sign in." };
    }

    const user = await loadUser(data.user.id, data.user.email ?? input.email);
    return user ? { user } : { error: "Account created, but its profile is missing." };
  },

  async signOut() {
    await getBrowserClient().auth.signOut();
  },

  async updatePassword(newPassword) {
    const { error } = await getBrowserClient().auth.updateUser({ password: newPassword });
    return error ? { error: friendlyError(error.message) } : {};
  },

  async updateName(name) {
    const supabase = getBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return { error: "Not signed in." };

    const trimmed = name.trim();
    const { error } = await supabase.from("users").update({ name: trimmed }).eq("id", auth.user.id);

    if (error) return { error: "Couldn't save your name. Please try again." };

    // Keep auth metadata in step so the name survives a token refresh.
    await supabase.auth.updateUser({ data: { name: trimmed } });

    const user = await loadUser(auth.user.id, auth.user.email ?? "");
    return user ? { user } : { error: "Couldn't reload your profile." };
  },

  onChange(callback) {
    const supabase = getBrowserClient();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        callback(null);
        return;
      }
      void loadUser(session.user.id, session.user.email ?? "").then(callback);
    });
    return () => data.subscription.unsubscribe();
  },
};
