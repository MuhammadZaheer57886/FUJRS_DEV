"use client";

// The signed-in user's own profile: name, avatar and default address.
//
// `users` holds the name and the avatar path; `addresses` holds the address.
// Both are RLS-scoped to the owner, and every method here resolves the owner
// from the verified session rather than from an argument — see ports.ts.

import type { AppRole } from "@/lib/auth/roles";
import type { ProfileStore } from "../ports";
import { StoreWriteError, type Account, type SavedAddress } from "../types";
import { getBrowserClient } from "./client";
import { requireUserId } from "./identity";

const AVATAR_BUCKET = "avatars";

/** Where a user's avatar lives. One path per user, overwritten on change. */
const avatarPath = (userId: string) => `${userId}/avatar.jpg`;

/** The admin form and the avatar picker both produce a data URL. */
function dataUrlToBlob(dataUrl: string): Blob | null {
  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) return null;

  const [, mimeType, base64] = match;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

/** The whole account, assembled from both tables. */
async function readAccount(userId: string): Promise<Account> {
  const supabase = getBrowserClient();

  const [{ data: user }, { data: address }] = await Promise.all([
    supabase.from("users").select("email, name, role, avatar_path").eq("id", userId).maybeSingle(),
    supabase
      .from("addresses")
      .select("street, city, postal_code")
      .eq("user_id", userId)
      .eq("is_default", true)
      .maybeSingle(),
  ]);

  return {
    email: user?.email ?? "",
    name: user?.name ?? "",
    role: (user?.role ?? "CUSTOMER") as AppRole,
    address: address
      ? { street: address.street, city: address.city, postalCode: address.postal_code }
      : null,
    avatar: user?.avatar_path
      ? supabase.storage.from(AVATAR_BUCKET).getPublicUrl(user.avatar_path).data.publicUrl
      : null,
  };
}

export const supabaseProfiles: ProfileStore = {
  async find(email) {
    // Only the local adapter's sign-in needs to look someone up by email; on
    // Supabase, auth owns that and RLS wouldn't return another user's row
    // anyway. Answering honestly for the signed-in user and null otherwise
    // beats pretending this can search.
    const userId = await requireUserId();
    const account = await readAccount(userId);
    return account.email === email.trim().toLowerCase() ? account : null;
  },

  async create() {
    // Accounts are created by Supabase Auth (sign-up) or by the Super Admin
    // route. A second path that inserts `users` rows directly would be a way
    // to self-assign a role, which is exactly what the signup trigger prevents.
    throw new StoreWriteError("Accounts are created through sign-up, not here.");
  },

  async updateName(name) {
    const userId = await requireUserId();
    const { error } = await getBrowserClient()
      .from("users")
      .update({ name: name.trim() })
      .eq("id", userId);

    if (error) throw new StoreWriteError("Couldn't save that name.");
    return readAccount(userId);
  },

  async getAvatar() {
    return (await readAccount(await requireUserId())).avatar;
  },

  async updateAvatar(avatar) {
    const userId = await requireUserId();
    const supabase = getBrowserClient();
    const path = avatarPath(userId);

    if (avatar === null) {
      await supabase.storage.from(AVATAR_BUCKET).remove([path]);
      const { error } = await supabase.from("users").update({ avatar_path: null }).eq("id", userId);
      if (error) throw new StoreWriteError("Couldn't remove that picture.");
      return readAccount(userId);
    }

    const blob = dataUrlToBlob(avatar);
    if (!blob) throw new StoreWriteError("That image couldn't be read.");

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, blob, { contentType: blob.type, upsert: true });

    if (uploadError) throw new StoreWriteError("Couldn't upload that picture.");

    // The row stores the PATH, not a URL — same portability reasoning as
    // product_images.storage_path.
    const { error } = await supabase.from("users").update({ avatar_path: path }).eq("id", userId);
    if (error) throw new StoreWriteError("Couldn't save that picture.");

    return readAccount(userId);
  },

  async getAddress() {
    return (await readAccount(await requireUserId())).address;
  },

  async updateAddress(address: SavedAddress) {
    const userId = await requireUserId();
    const supabase = getBrowserClient();

    // One default address, replaced rather than accumulated: the settings
    // screen edits "my address", it doesn't manage an address book. When it
    // does, this becomes an insert and is_default moves to the chosen row.
    const { data: existing } = await supabase
      .from("addresses")
      .select("id")
      .eq("user_id", userId)
      .eq("is_default", true)
      .maybeSingle();

    const row = {
      user_id: userId,
      street: address.street.trim(),
      city: address.city.trim(),
      postal_code: address.postalCode.trim(),
      is_default: true,
    };

    const { error } = existing
      ? await supabase.from("addresses").update(row).eq("id", existing.id)
      : await supabase.from("addresses").insert(row);

    if (error) throw new StoreWriteError("Couldn't save that address.");
    return readAccount(userId);
  },
};
