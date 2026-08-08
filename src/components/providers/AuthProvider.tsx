"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AppRole } from "@/lib/auth/roles";
import type { StoredUser } from "@/lib/auth/session";
import { auth } from "@/lib/data";

type AuthUser = StoredUser;

interface AuthSession {
  user: AuthUser;
}

interface AuthContextValue {
  session: AuthSession | null;

  /**
   * True when the session belongs to a guest rather than a registered account.
   *
   * A guest has a real session — that uuid is what owns their bag, their
   * wishlist and a guest-checkout order — so `session !== null` answers "do we
   * know who this is?", NOT "have they signed in?". Screens that offer to sign
   * someone out, or show them account details they never entered, must check
   * this. Screens that need the shopper's own data (their order, their bag)
   * must not: a guest is entitled to those.
   */
  isGuest: boolean;

  status: "loading" | "authenticated" | "unauthenticated";
  signIn: (email: string, password: string) => Promise<{ error?: string; role?: AppRole }>;
  signUp: (input: { email: string; password: string; name: string }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
  updateName: (newName: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  // Every auth decision goes through the port, so this provider is identical
  // whether the session is a localStorage stub or a real Supabase cookie.
  useEffect(() => {
    let active = true;

    void auth.current().then((user) => {
      if (!active) return;
      setSession(user ? { user } : null);
      setStatus(user ? "authenticated" : "unauthenticated");
    });

    // A token refresh, or a sign-out in another tab, must be reflected here —
    // otherwise the UI shows a signed-in shell over a dead session.
    const unsubscribe = auth.onChange((user) => {
      if (!active) return;
      setSession(user ? { user } : null);
      setStatus(user ? "authenticated" : "unauthenticated");
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isGuest: session?.user.isAnonymous ?? false,
      status,
      async signIn(email, password) {
        const result = await auth.signIn(email, password);
        if (result.error || !result.user) return { error: result.error };
        setSession({ user: result.user });
        setStatus("authenticated");
        return { role: result.user.role };
      },
      async signUp(input) {
        const result = await auth.signUp(input);
        if (result.error || !result.user) return { error: result.error };
        setSession({ user: result.user });
        setStatus("authenticated");
        return {};
      },
      async signOut() {
        await auth.signOut();
        setSession(null);
        setStatus("unauthenticated");
      },
      async updatePassword(newPassword) {
        return auth.updatePassword(newPassword);
      },
      async updateName(newName) {
        const result = await auth.updateName(newName);
        if (result.error || !result.user) return { error: result.error };
        setSession({ user: result.user });
        return {};
      },
    }),
    [session, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
