// Where a photo gets cropped. Pure rules, no I/O.
//
// The storefront renders the same product photo into several shapes: a 4:5
// grid tile on Men, Women and New Arrivals, a 16:9 feature tile at the top of
// the Women grid, a 16:10 one at the top of the Men grid. `object-cover`
// centres what it crops, so a portrait shot dropped into a wide tile lost the
// top and bottom of the garment, and a landscape one lost its sides.
//
// A focal point per photo fixes that without asking for one file per shape:
// the person publishing the product says which part has to stay in frame, and
// every shape crops around it.

/** Dead centre, which is what `object-cover` does on its own. */
export const CENTRE_FOCAL = 50;

/** The two coordinates, carried by both an upload and a stored photo. */
export interface FocalPoint {
  /** 0-100, left to right. */
  focalX: number;
  /** 0-100, top to bottom. */
  focalY: number;
}

export const CENTRED: FocalPoint = { focalX: CENTRE_FOCAL, focalY: CENTRE_FOCAL };

/**
 * A percentage the CSS can be trusted with: whole, inside 0-100, and centred
 * rather than NaN when the value came from a row written before focal points
 * existed.
 */
export function clampFocal(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return CENTRE_FOCAL;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** The `object-position` an `object-cover` image needs to honour the point. */
export function focalPosition(focal: Partial<FocalPoint> | null | undefined): string {
  return `${clampFocal(focal?.focalX)}% ${clampFocal(focal?.focalY)}%`;
}

// --- Zoom -------------------------------------------------------------------
//
// A focal point says WHERE to crop; zoom says HOW MUCH. Together they are a
// crop tool: the point pans, the zoom tightens. Without zoom a piece shot from
// three metres away is a small garment in the middle of a large tile, and no
// amount of panning fixes that.
//
// Unlike the focal point, zoom is NOT a column. It is applied to the pixels
// when the product is saved (`cropToDataUrl`), so the shop serves the tight
// crop as a smaller file instead of downloading the whole frame and scaling it
// up in CSS. That also keeps it out of the tiles' hover transforms.

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;
export const ZOOM_STEP = 0.05;

/** A focal point plus how far in it is cropped. */
export interface PhotoCrop extends FocalPoint {
  /** 1 is the whole frame. 2 keeps half the width and half the height. */
  zoom: number;
}

export function clampZoom(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return MIN_ZOOM;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

/**
 * The region of the photo a crop keeps, as fractions of the whole frame.
 *
 * This is the definition both renderings answer to: the canvas that bakes the
 * crop cuts exactly this rectangle out, and the CSS in `cropStyle` produces
 * exactly the same rectangle. They are proved equal rather than eyeballed,
 * which is what stops the preview from lying about the result.
 */
export function cropWindow(crop: Partial<PhotoCrop> | null | undefined): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  const zoom = clampZoom(crop?.zoom);
  const size = 1 / zoom;
  return {
    left: (clampFocal(crop?.focalX) / 100) * (1 - size),
    top: (clampFocal(crop?.focalY) / 100) * (1 - size),
    width: size,
    height: size,
  };
}

/**
 * The CSS that renders a crop on an `object-cover` image.
 *
 * `object-position` at the focal point puts that point at the same percentage
 * of the element box whatever the box's ratio, so scaling the element about
 * the same percentage holds the point still and opens out `cropWindow` around
 * it. One image, two properties, no wrapper elements.
 *
 * Only for the editing screens. Published photos are already cropped, and an
 * inline transform here would override the tiles' hover scale.
 */
export function cropStyle(crop: Partial<PhotoCrop> | null | undefined) {
  const position = focalPosition(crop);
  return {
    objectPosition: position,
    transform: `scale(${clampZoom(crop?.zoom)})`,
    transformOrigin: position,
  };
}
