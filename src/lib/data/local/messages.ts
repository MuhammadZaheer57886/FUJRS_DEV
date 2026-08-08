// Contact enquiries and newsletter signups on the browser-only backend.
//
// Kept so the forms behave the same way — submit, get a confirmation — without
// pretending a message left the building. The dashboard has no inbox on this
// backend either, so this is where they stop.

import type { MessageStore } from "../ports";
import type { ContactMessage } from "../types";
import { readJSON, writeJSON } from "./storage";

const CONTACT_KEY = "fujrs-contact-messages";
const NEWSLETTER_KEY = "fujrs-newsletter";

export const localMessages: MessageStore = {
  async sendContact(input: ContactMessage) {
    const all = readJSON<(ContactMessage & { sentAt: string })[]>(CONTACT_KEY, []);
    writeJSON(CONTACT_KEY, [...all, { ...input, sentAt: new Date().toISOString() }]);
  },

  async subscribe(email) {
    const all = readJSON<string[]>(NEWSLETTER_KEY, []);
    const normalised = email.trim().toLowerCase();
    if (!all.includes(normalised)) writeJSON(NEWSLETTER_KEY, [...all, normalised]);
  },
};
