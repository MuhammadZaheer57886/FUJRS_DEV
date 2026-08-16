// Shrinking a picked image before it's stored.
//
// Shared by the single-image and gallery uploaders so the size limits and
// encoding live in one place. Browser-only, it needs canvas.

import { CENTRE_FOCAL, MIN_ZOOM, cropWindow, type PhotoCrop } from "@/lib/productPhoto";

/**
 * Images are held as data URLs in localStorage until file storage takes over,
 * so they're downscaled hard on the way in: a raw phone photo would blow the
 * ~5MB quota on its own, and several would blow it instantly.
 */
export const MAX_EDGE_PX = {
  /** Avatars — never rendered large. */
  circle: 320,
  /** Product photography. */
  portrait: 800,
} as const;

export type ImageShape = keyof typeof MAX_EDGE_PX;

const JPEG_QUALITY = 0.8;

/** What the file inputs accept. HEIC is excluded: canvas can't decode it. */
export const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp";

export class ImageDecodeError extends Error {
  constructor(readonly fileName: string) {
    super(`Could not process ${fileName}`);
    this.name = "ImageDecodeError";
  }
}

/**
 * A processed image plus the size it actually came out at.
 *
 * The dimensions are carried rather than assumed because `next/image` needs
 * them to reserve space before the file loads, and `product_images.width` /
 * `.height` are NOT NULL for that reason. Guessing them is what produces a
 * grid that reflows as each photo arrives.
 *
 * The crop starts centred and un-zoomed and is only moved if someone moves it
 * in the storefront preview, so an upload that needs no attention needs no
 * clicks. `zoom` never leaves the form: `cropToDataUrl` bakes it into the
 * pixels on save, and the focal point carries on to the database.
 */
export interface UploadedImage extends PhotoCrop {
  dataUrl: string;
  width: number;
  height: number;
}

export function downscaleToDataUrl(file: File, maxEdge: number): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new ImageDecodeError(file.name));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new ImageDecodeError(file.name));
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new ImageDecodeError(file.name));

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve({
          dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY),
          width: canvas.width,
          height: canvas.height,
          focalX: CENTRE_FOCAL,
          focalY: CENTRE_FOCAL,
          zoom: MIN_ZOOM,
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Processes a batch, keeping what worked. One unreadable file among several
 * shouldn't discard the rest of a multi-select — the caller reports the
 * failures and keeps the successes.
 */
export async function downscaleMany(
  files: File[],
  maxEdge: number
): Promise<{ images: UploadedImage[]; failed: string[] }> {
  const images: UploadedImage[] = [];
  const failed: string[] = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      failed.push(file.name);
      continue;
    }
    try {
      images.push(await downscaleToDataUrl(file, maxEdge));
    } catch {
      failed.push(file.name);
    }
  }

  return { images, failed };
}

/**
 * Cuts `cropWindow` out of an image, so the file that gets stored is the crop
 * the preview showed.
 *
 * Done at save time rather than on every drag of the zoom slider, which would
 * re-encode the photo sixty times a second for a value the user is still
 * choosing. An un-zoomed image is returned untouched: re-encoding a JPEG that
 * nobody cropped would only lose quality.
 *
 * The focal point survives the crop unchanged, and it has to: the shop still
 * renders this file into three different tile ratios. `cropWindow` is
 * positioned so the focal point sits at the same fraction of the result as it
 * did of the original, which is what makes that true.
 */
export function cropToDataUrl(image: UploadedImage): Promise<UploadedImage> {
  if (image.zoom <= MIN_ZOOM) return Promise.resolve({ ...image, zoom: MIN_ZOOM });

  return new Promise((resolve, reject) => {
    const source = new window.Image();
    source.onerror = () => reject(new ImageDecodeError("the cropped image"));
    source.onload = () => {
      const region = cropWindow(image);
      // At least one pixel each way: a 3x zoom on a thumbnail must not round
      // down to a zero-sized canvas, which throws.
      const width = Math.max(1, Math.round(image.width * region.width));
      const height = Math.max(1, Math.round(image.height * region.height));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new ImageDecodeError("the cropped image"));

      ctx.drawImage(
        source,
        Math.round(image.width * region.left),
        Math.round(image.height * region.top),
        width,
        height,
        0,
        0,
        width,
        height
      );

      resolve({
        ...image,
        dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY),
        width,
        height,
        zoom: MIN_ZOOM,
      });
    };
    source.src = image.dataUrl;
  });
}
