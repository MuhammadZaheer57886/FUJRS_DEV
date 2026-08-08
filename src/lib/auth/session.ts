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

  /**
   * True for a guest — someone with a uuid holding their bag, but no account.
   *
   * They have a real session, so `session` being non-null does NOT mean
   * "signed in". Anything that offers to sign them OUT, or shows them account
   * details they never entered, has to check this first. Always false on the
   * local adapter, which has no anonymous identity.
   */
  isAnonymous: boolean;
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
    const stored = JSON.parse(raw) as StoredUser;
    // Sessions written before `isAnonymous` existed have no such field, and
    // `undefined` is falsy in the wrong direction only by luck. Pin it.
    return { ...stored, isAnonymous: stored.isAnonymous ?? false };
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}
