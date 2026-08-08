// The measurement set a bespoke order is cut from. Lives here rather than in
// the tailoring form because it isn't a form concern: the customer enters
// these, the Tailor dashboard reads them back, and the schema will need the
// same list when the backend arrives.

export const MEASUREMENT_FIELDS = [
  "Chest",
  "Waist",
  "Hips",
  "Shoulder",
  "Arm Length",
  "Length",
  "Bicep",
  "Neck",
  "Front Length",
  "Back Length",
  "Trouser Length",
  "Inseam",
] as const;

export type MeasurementField = (typeof MEASUREMENT_FIELDS)[number];

/** Every measurement is captured in inches; the unit is never per-field. */
export const MEASUREMENT_UNIT = "in";

export type MeasurementSet = Record<string, string>;

/** A bespoke order can't be cut until every field has a value. */
export function isMeasurementSetComplete(measurements: MeasurementSet): boolean {
  return MEASUREMENT_FIELDS.every((field) => measurements[field]?.trim());
}

export function missingMeasurements(measurements: MeasurementSet): MeasurementField[] {
  return MEASUREMENT_FIELDS.filter((field) => !measurements[field]?.trim());
}
