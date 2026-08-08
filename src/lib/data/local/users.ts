// Super Admin user management, browser-only.
//
// Accounts created here are written to the same store the sign-in path reads,
// so a user the Super Admin creates can actually sign in — otherwise the
// screen would appear to work and produce nothing usable.
//
// These accounts live in this browser and disappear when site data is cleared.
// The dashboard says so on screen.

import { DEFAULT_COMMISSION, validateCommission, type CommissionRate } from "@/lib/commission";
import { referralCodeFor } from "@/lib/referral";
import type { UserAdminStore } from "../ports";
import type { Account, ManagedUser } from "../types";
import { normaliseEmail, readJSON, writeJSON } from "./storage";
import { localProfiles } from "./profile";

const ACCOUNTS_KEY = "fujrs-accounts";
const RATES_KEY = "fujrs-vendor-rates";

/** Commission lives beside the account rather than on it — vendors only. */
type RatesByEmail = Record<string, CommissionRate>;

const readAccounts = (): Account[] => readJSON<Account[]>(ACCOUNTS_KEY, []);
const readRates = (): RatesByEmail => readJSON<RatesByEmail>(RATES_KEY, {});

function toManaged(account: Account, rates: RatesByEmail): ManagedUser {
  const isVendor = account.role === "VENDOR";
  return {
    // The email IS the identity key in the local build; Supabase uses users.id.
    id: account.email,
    name: account.name || account.email,
    email: account.email,
    role: account.role,
    isActive: true,
    // The local build has no anonymous identity — an account here was
    // registered on this device.
    isAnonymous: false,
    referralCode: isVendor ? referralCodeFor(account.email) : null,
    commission: isVendor ? (rates[account.email] ?? DEFAULT_COMMISSION) : null,
    // Visits are a server-side observation about a request, and there is no
    // server here. The dashboard renders this as "Not recorded".
    lastSeen: null,
  };
}

export const localUsers: UserAdminStore = {
  async list() {
    const rates = readRates();
    return readAccounts().map((account) => toManaged(account, rates));
  },

  async create(input) {
    const email = normaliseEmail(input.email);
    if (await localProfiles.find(email)) {
      return { error: "An account with that email already exists." };
    }

    // Goes through the profile store so the account is immediately usable at
    // sign-in, with the role the Super Admin chose.
    const account = await localProfiles.create({
      name: input.name,
      email,
      role: input.role,
    });

    return { user: toManaged(account, readRates()) };
  },

  async setCommission(id, rate) {
    const problem = validateCommission(rate);
    if (problem) return { error: problem };

    writeJSON(RATES_KEY, { ...readRates(), [normaliseEmail(id)]: rate });
    return {};
  },
};
