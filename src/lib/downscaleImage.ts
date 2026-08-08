// Shrinking a picked image before it's stored.
//
// Shared by the single-image and gallery uploaders so the size limits and
// encoding live in one place. Browser-only — it needs canvas.

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
 */
export interface UploadedImage {
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
