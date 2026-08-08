"use client";

// Contact enquiries and newsletter signups.
//
// Insert-only from the browser: `contact_messages_public_insert` lets anyone
// send, and only staff can read. Reading is what would matter if it leaked —
// it is every email address that ever touched the site.

import type { MessageStore } from "../ports";
import { StoreWriteError } from "../types";
import { getBrowserClient } from "./client";
import { currentUserId } from "./identity";

export const supabaseMessages: MessageStore = {
  async sendContact(input) {
    // Attached when they happen to be signed in, so staff can see their orders
    // beside the enquiry. Never required — most enquiries have no account.
    const userId = await currentUserId();

    const { error } = await getBrowserClient().from("contact_messages").insert({
      name: input.name,
      email: input.email,
      phone: input.phone,
      subject: input.subject,
      message: input.message,
      user_id: userId,
    });

    if (error) throw new StoreWriteError("We couldn't send that message. Please try again.");
  },

  async subscribe(email) {
    // Already subscribed is not an error to the person typing: telling them
    // "that address is already on the list" confirms who is on it.
    const { error } = await getBrowserClient()
      .from("newsletter_subscribers")
      .upsert({ email }, { onConflict: "email", ignoreDuplicates: true });

    if (error) throw new StoreWriteError("We couldn't sign you up. Please try again.");
  },
};
