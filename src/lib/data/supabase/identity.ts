"use client";

// Who "me" is, for the adapters whose ports carry no identity argument.
//
// Every one of these goes through getUser(), which verifies the token with the
// auth server. getSession() only decodes the cookie, which is forgeable, so it
// must never be what decides whose data gets read or written.

import { StoreWriteError } from "../types";
import { getBrowserClient } from "./client";

/** The signed-in user's uuid, or null when nobody is signed in. */
export async function currentUserId(): Promise<string | null> {
  const { data, error } = await getBrowserClient().auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

/** Same, but for writes that cannot sensibly proceed without an owner. */
export async function requireUserId(): Promise<string> {
  const id = await currentUserId();
  if (!id) throw new StoreWriteError("You need to be signed in to do that.");
  return id;
}

/**
 * The single in-flight anonymous sign-in, shared by every concurrent caller.
 *
 * The bag, the wishlist and the bespoke draft each call ensureUserId(), and on
 * a page load they call it in the same tick. Without this, all three miss the
 * cookie, all three sign in, and the visitor ends up with three guest rows —
 * two of them orphaned the moment the last sign-in overwrites the cookie. That
 * is what filled `users` with a fresh guest on every visit.
 *
 * A promise rather than a boolean flag: latecomers have to WAIT for the uuid,
 * not merely be told that someone else is fetching it.
 */
let pendingGuest: Promise<string> | null = null;

/**
 * A uuid for the shopper, creating an anonymous one if they have no session.
 *
 * The bag, the wishlist and a bespoke draft all belong to a `users` row, and a
 * guest has to be able to use them. Anonymous sign-in gives them a real uuid
 * that survives registration unchanged, so nothing has to be merged later
 * (BACKEND_SETUP.md §7).
 *
 * Call this only when the shopper has actually done something worth persisting.
 * A guest row is a real row in `auth.users` and `public.users`; creating one
 * for someone who is only browsing is how the table fills with rows that hold
 * nothing.
 */
export async function ensureUserId(): Promise<string> {
  const existing = await currentUserId();
  if (existing) return existing;

  pendingGuest ??= (async () => {
    // Re-check inside the critical section: a caller may have been waiting on
    // the currentUserId() round trip while another one signed in.
    const raced = await currentUserId();
    if (raced) return raced;

    const { data, error } = await getBrowserClient().auth.signInAnonymously();
    if (error || !data.user) {
      throw new StoreWriteError(
        "We couldn't start a guest session. Please sign in and try again, or enable " +
          "anonymous sign-ins for this project."
      );
    }
    void fetch("/api/notifications/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "guest_created" }),
    }).catch(() => undefined);
    return data.user.id;
  })();

  try {
    return await pendingGuest;
  } finally {
    // Cleared either way. On success the cookie now short-circuits this
    // function; on failure a later attempt must be allowed to retry rather
    // than resolve forever against the same rejected promise.
    pendingGuest = null;
  }
}
