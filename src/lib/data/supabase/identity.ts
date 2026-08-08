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
 * A uuid for the shopper, creating an anonymous one if they have no session.
 *
 * The bag, the wishlist and a bespoke draft all belong to a `users` row, and a
 * guest has to be able to use them. Anonymous sign-in gives them a real uuid
 * that survives registration unchanged, so nothing has to be merged later
 * (BACKEND_SETUP.md §7).
 */
export async function ensureUserId(): Promise<string> {
  const existing = await currentUserId();
  if (existing) return existing;

  const { data, error } = await getBrowserClient().auth.signInAnonymously();
  if (error || !data.user) {
    throw new StoreWriteError(
      "We couldn't start a guest session. Please sign in and try again, or enable " +
        "anonymous sign-ins for this project."
    );
  }
  return data.user.id;
}
