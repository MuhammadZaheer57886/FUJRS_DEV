export const STITCHING_STATUSES = [
  "Awaiting Measurements",
  "In Progress",
  "Quality Check",
  "Ready for Fitting",
  "Delivered",
] as const;

export type StitchingStatus = (typeof STITCHING_STATUSES)[number];

/** Status a request starts in, before any measurements are submitted. */
export const INITIAL_STITCHING_STATUS: StitchingStatus = STITCHING_STATUSES[0];

/**
 * The `stitching_status` enum values, paired with what the UI shows.
 *
 * The database stores keys, not prose: renaming "Quality Check" to something
 * the client prefers must not require a migration, and an enum of English
 * sentences is awkward to query. The translation lives here, with the rest of
 * the status rules, so the adapter has nothing to invent.
 */
export const STITCHING_STATUS_KEYS = {
  AWAITING_MEASUREMENTS: "Awaiting Measurements",
  IN_PROGRESS: "In Progress",
  QUALITY_CHECK: "Quality Check",
  READY_FOR_FITTING: "Ready for Fitting",
  DELIVERED: "Delivered",
} as const satisfies Record<string, StitchingStatus>;

export type StitchingStatusKey = keyof typeof STITCHING_STATUS_KEYS;

export const INITIAL_STITCHING_STATUS_KEY: StitchingStatusKey = "AWAITING_MEASUREMENTS";

/** Database key → what the customer and the tailor read. */
export function stitchingStatusFromKey(key: string): StitchingStatus {
  return STITCHING_STATUS_KEYS[key as StitchingStatusKey] ?? INITIAL_STITCHING_STATUS;
}

/** What the UI shows → the database key. */
export function stitchingStatusToKey(status: StitchingStatus): StitchingStatusKey {
  const found = (Object.keys(STITCHING_STATUS_KEYS) as StitchingStatusKey[]).find(
    (key) => STITCHING_STATUS_KEYS[key] === status
  );
  return found ?? INITIAL_STITCHING_STATUS_KEY;
}
