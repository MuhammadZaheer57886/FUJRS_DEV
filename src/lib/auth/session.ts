// The signed-in user, persisted in the browser.
//
// Only the local adapter uses this. Under Supabase the session lives in a
// cookie and this file is unused — see src/lib/data/supabase/auth.ts.
import type { AppRole } from "@/lib/auth/roles";

const SESSION_KEY = "fujrs-session";

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  assignedStitcherSlug: string | null;
}

export function persistSession(user: StoredUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function readSession(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}
