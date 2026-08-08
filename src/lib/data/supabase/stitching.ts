"use client";

// The stitching queue, from `stitching_requests`.
//
// What comes back is decided entirely by RLS: a tailor sees their own jobs
// plus the unclaimed pool, staff see everything, a customer sees only theirs.
// There is no role check in this file on purpose — the database is the one
// that must be right, and duplicating the rule here would let the two drift.
//
// Only ORDERED work appears. A draft somebody is still editing has a null
// `order_item_id`, and nobody should be cutting from it.

import type { MeasurementSet } from "@/lib/measurements";
import { stitchingStatusFromKey, stitchingStatusToKey } from "@/lib/stitchingStatus";
import type { StitchingStore } from "../ports";
import { StoreWriteError, type ReferenceImage, type StitchingJob } from "../types";
import { getBrowserClient } from "./client";
import { requireUserId } from "./identity";

const REFERENCE_BUCKET = "stitching-references";
/** Short-lived: a leaked link to a customer's photo should expire quickly. */
const SIGNED_URL_TTL_SECONDS = 300;

const JOB_SELECT = `
  id, status, garment_type, neckline, sleeve, hemline, notes, measurements,
  assigned_tailor_id, updated_at,
  order_items ( orders ( order_number, ship_first_name, ship_last_name ) ),
  stitching_reference_images ( id, storage_path )
`;

interface JobRow {
  id: string;
  status: string;
  garment_type: string;
  neckline: string | null;
  sleeve: string | null;
  hemline: string | null;
  notes: string | null;
  measurements: Record<string, unknown> | null;
  assigned_tailor_id: string | null;
  order_items: {
    orders: { order_number: string; ship_first_name: string; ship_last_name: string } | null;
  } | null;
  stitching_reference_images: { id: string; storage_path: string }[] | null;
}

function toJob(row: JobRow, references: ReferenceImage[] = []): StitchingJob {
  const order = row.order_items?.orders ?? null;

  // The draft stores prices and the chosen stitcher alongside the twelve
  // fields, namespaced with a leading underscore. The tailor wants
  // measurements, not bookkeeping.
  const measurements: MeasurementSet = Object.fromEntries(
    Object.entries(row.measurements ?? {})
      .filter(([key]) => !key.startsWith("_"))
      .map(([key, value]) => [key, String(value)])
  );

  return {
    id: row.id,
    orderNumber: order?.order_number ?? "",
    customer: order ? `${order.ship_first_name} ${order.ship_last_name}`.trim() : "—",
    garment: row.garment_type,
    neckline: row.neckline ?? "",
    sleeve: row.sleeve ?? "",
    hemline: row.hemline ?? "",
    notes: row.notes,
    measurements,
    status: stitchingStatusFromKey(row.status),
    claimed: row.assigned_tailor_id !== null,
    references,
  };
}

/**
 * Signs every reference photo across the whole queue in one call.
 *
 * The bucket is private — these are pictures of a customer — so the tailor gets
 * short-lived signed URLs rather than anything durable. Signing per job would
 * be a request per garment; signing once here is a request per queue load.
 */
async function signReferences(rows: JobRow[]): Promise<Map<string, ReferenceImage[]>> {
  const paths = rows.flatMap((row) =>
    (row.stitching_reference_images ?? []).map((image) => image.storage_path)
  );
  if (paths.length === 0) return new Map();

  const { data: signed } = await getBrowserClient()
    .storage.from(REFERENCE_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

  const urlByPath = new Map(paths.map((path, i) => [path, signed?.[i]?.signedUrl]));

  return new Map(
    rows.map((row) => [
      row.id,
      (row.stitching_reference_images ?? [])
        .map((image) => {
          const url = urlByPath.get(image.storage_path);
          return url ? { id: image.id, url } : null;
        })
        .filter((image): image is ReferenceImage => image !== null),
    ])
  );
}

export const supabaseStitching: StitchingStore = {
  async queue() {
    const { data, error } = await getBrowserClient()
      .from("stitching_requests")
      .select(JOB_SELECT)
      .not("order_item_id", "is", null)
      .order("updated_at", { ascending: false });

    if (error) throw new StoreWriteError("Couldn't load the stitching queue.");

    const rows = (data as unknown as JobRow[] | null) ?? [];
    const references = await signReferences(rows);
    return rows.map((row) => toJob(row, references.get(row.id) ?? []));
  },

  async updateStatus(id, status) {
    const tailorId = await requireUserId();

    // Claim and progress in one statement. Doing it as two would leave a
    // window where two tailors both think a pooled job is theirs; here the
    // second update simply matches no rows, because the WITH CHECK on the
    // claim policy requires the row to end up assigned to the caller.
    const { data, error } = await getBrowserClient()
      .from("stitching_requests")
      .update({
        assigned_tailor_id: tailorId,
        status: stitchingStatusToKey(status),
      })
      .eq("id", id)
      .select(JOB_SELECT)
      .maybeSingle();

    // No row means RLS refused: the caller isn't a tailor, or somebody else
    // claimed it first. Either way the move didn't happen, which is what the
    // port's null contract says.
    if (error || !data) return null;

    return toJob(data as unknown as JobRow);
  },
};
