// The only place in the app that touches localStorage.
//
// Every local adapter goes through these three functions, so quota handling,
// JSON parsing and the server-side guard exist once rather than nine times.

import { StoreWriteError } from "../types";

/** True on the server, where there is no browser storage to read. */
const unavailable = () => typeof window === "undefined";

export function readJSON<T>(key: string, fallback: T): T {
  if (unavailable()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return (parsed ?? fallback) as T;
  } catch {
    // Corrupt or unparseable data behaves as absent rather than crashing the
    // page — the user can always re-enter it.
    return fallback;
  }
}

/**
 * Throws `StoreWriteError` when the browser refuses the write, which in
 * practice means the ~5MB quota. Callers that store images (catalogue,
 * avatars) must handle it; the rest are far too small to hit it.
 */
export function writeJSON(key: string, value: unknown): void {
  if (unavailable()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new StoreWriteError(
      "Browser storage is full. Remove an older item or use a smaller image.",
      true
    );
  }
}

export function removeKey(key: string): void {
  if (unavailable()) return;
  window.localStorage.removeItem(key);
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Short, unique enough for a browser store. Not a real database id. */
export function makeId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}
