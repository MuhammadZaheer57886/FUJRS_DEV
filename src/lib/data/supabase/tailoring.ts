"use client";

// The in-progress bespoke configuration, as a `stitching_requests` row.
//
// That table allows `order_item_id` to be null precisely so a request can
// exist before an order does — which is exactly what this draft is. One open
// draft per user: the configurator edits a single configuration, so a second
// row would only ever be an orphan.
//
// Prices (base and the neckline/sleeve/hemline add-ons) are NOT stored. They
// belong to the style options in TailoringContext, and a stored price would go
// stale the moment those change. The draft records the choices; the price is
// derived from them.

import type { MeasurementSet } from "@/lib/measurements";
import { INITIAL_STITCHING_STATUS_KEY } from "@/lib/stitchingStatus";
import { DEFAULT_GARMENT_TYPE } from "@/lib/tailoringOptions";
import type { TailoringStore } from "../ports";
import { StoreWriteError, type ReferenceImage, type TailoringConfig } from "../types";
import { getBrowserClient } from "./client";
import { currentUserId, ensureUserId } from "./identity";

/**
 * The parts of a configuration the table has no column for.
 *
 * `garment_type`, `neckline`, `sleeve` and `hemline` are real columns; the
 * prices and the chosen stitcher are carried inside `measurements` alongside
 * the twelve fields rather than adding columns for values that are derived or
 * provisional. Namespaced with a leading underscore so they can never collide
 * with a measurement field.
 */
interface DraftExtras {
  _basePrice?: number;
  _necklinePrice?: number;
  _sleevePrice?: number;
  _hemlinePrice?: number;
  _stitcherSlug?: string;
}

const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : 0);

const REFERENCE_BUCKET = "stitching-references";

/**
 * How long a signed reference-image URL stays valid.
 *
 * Short on purpose: the bucket is private because these are photos of a
 * customer, and a link that leaks should stop working long before anyone
 * passes it on. The gallery re-signs on every read.
 */
const SIGNED_URL_TTL_SECONDS = 300;

/** The open draft's id, creating nothing — reference photos need one to exist. */
async function openDraftId(userId: string): Promise<string | null> {
  const { data } = await getBrowserClient()
    .from("stitching_requests")
    .select("id")
    .eq("user_id", userId)
    .is("order_item_id", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

function dataUrlToBlob(dataUrl: string): Blob | null {
  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) return null;

  const [, mimeType, base64] = match;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

export const supabaseTailoring: TailoringStore = {
  async read() {
    const userId = await currentUserId();
    if (!userId) return null;

    const { data, error } = await getBrowserClient()
      .from("stitching_requests")
      .select("garment_type, neckline, sleeve, hemline, measurements")
      .eq("user_id", userId)
      .is("order_item_id", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new StoreWriteError("Couldn't load your measurements.");
    if (!data) return null;

    const stored = (data.measurements ?? {}) as Record<string, unknown>;
    const extras = stored as DraftExtras;

    // Strip the namespaced extras back out so the component only ever sees
    // measurement fields.
    const measurements: MeasurementSet = Object.fromEntries(
      Object.entries(stored)
        .filter(([key]) => !key.startsWith("_"))
        .map(([key, value]) => [key, String(value)])
    );

    return {
      measurements,
      garmentType: data.garment_type,
      neckline: data.neckline ?? "",
      sleeve: data.sleeve ?? "",
      hemline: data.hemline ?? "",
      basePrice: num(extras._basePrice),
      necklinePrice: num(extras._necklinePrice),
      sleevePrice: num(extras._sleevePrice),
      hemlinePrice: num(extras._hemlinePrice),
      stitcherSlug: String(extras._stitcherSlug ?? ""),
    };
  },

  async write(config: TailoringConfig) {
    const userId = await ensureUserId();
    const supabase = getBrowserClient();

    const payload = {
      user_id: userId,
      status: INITIAL_STITCHING_STATUS_KEY,
      garment_type: config.garmentType,
      neckline: config.neckline,
      sleeve: config.sleeve,
      hemline: config.hemline,
      measurements: {
        ...config.measurements,
        _basePrice: config.basePrice,
        _necklinePrice: config.necklinePrice,
        _sleevePrice: config.sleevePrice,
        _hemlinePrice: config.hemlinePrice,
        _stitcherSlug: config.stitcherSlug,
      },
    };

    // One open draft, updated in place. The configurator saves on every field
    // change, so inserting each time would bury the user in abandoned rows.
    const { data: existing } = await supabase
      .from("stitching_requests")
      .select("id")
      .eq("user_id", userId)
      .is("order_item_id", null)
      .maybeSingle();

    const { error } = existing
      ? await supabase.from("stitching_requests").update(payload).eq("id", existing.id)
      : await supabase.from("stitching_requests").insert(payload);

    if (error) throw new StoreWriteError("Couldn't save your measurements.");
  },

  async listReferences() {
    const userId = await currentUserId();
    if (!userId) return [];

    const draftId = await openDraftId(userId);
    if (!draftId) return [];

    const supabase = getBrowserClient();
    const { data, error } = await supabase
      .from("stitching_reference_images")
      .select("id, storage_path")
      .eq("stitching_request_id", draftId)
      .order("uploaded_at", { ascending: true });

    if (error) throw new StoreWriteError("Couldn't load your reference photos.");
    if (!data || data.length === 0) return [];

    // One round trip for every URL rather than one per image.
    const { data: signed } = await supabase.storage.from(REFERENCE_BUCKET).createSignedUrls(
      data.map((row) => row.storage_path),
      SIGNED_URL_TTL_SECONDS
    );

    return data
      .map((row, index): ReferenceImage | null => {
        const url = signed?.[index]?.signedUrl;
        return url ? { id: row.id, url } : null;
      })
      .filter((image): image is ReferenceImage => image !== null);
  },

  async addReferences(images) {
    const userId = await ensureUserId();

    // Photos belong to a request. Writing the draft first means the customer
    // can add a photo before filling in every measurement, which is the order
    // people actually work in.
    let draftId = await openDraftId(userId);
    if (!draftId) {
      const { data, error } = await getBrowserClient()
        .from("stitching_requests")
        .insert({
          user_id: userId,
          status: INITIAL_STITCHING_STATUS_KEY,
          garment_type: DEFAULT_GARMENT_TYPE,
        })
        .select("id")
        .single();

      if (error || !data) throw new StoreWriteError("Couldn't start your bespoke request.");
      draftId = data.id;
    }

    const supabase = getBrowserClient();

    for (const image of images) {
      const blob = dataUrlToBlob(image.dataUrl);
      if (!blob) continue;

      // Path convention from the storage migration:
      //   <user_id>/<stitching_request_id>/<uuid>.<ext>
      // The policies read those first two segments, so the shape is load-bearing.
      const path = `${userId}/${draftId}/${crypto.randomUUID()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from(REFERENCE_BUCKET)
        .upload(path, blob, { contentType: blob.type });

      if (uploadError) continue;

      await supabase.from("stitching_reference_images").insert({
        stitching_request_id: draftId,
        storage_path: path,
        width: image.width,
        height: image.height,
        bytes: blob.size,
        mime_type: blob.type,
      });
    }

    return this.listReferences();
  },

  async removeReference(id) {
    const supabase = getBrowserClient();

    const { data: row } = await supabase
      .from("stitching_reference_images")
      .select("storage_path")
      .eq("id", id)
      .maybeSingle();

    // Row first, then the object: a deleted row with a stranded file is
    // recoverable housekeeping, a live row pointing at nothing is a broken UI.
    const { error } = await supabase.from("stitching_reference_images").delete().eq("id", id);
    if (error) throw new StoreWriteError("Couldn't remove that photo.");

    if (row?.storage_path) {
      await supabase.storage.from(REFERENCE_BUCKET).remove([row.storage_path]);
    }
  },
};
