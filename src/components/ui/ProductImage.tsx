"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/**
 * A product photo that degrades instead of breaking.
 *
 * The seeded catalogue still points at the design-tool preview host, which
 * already fails intermittently and will stop serving for good. A broken
 * `next/image` leaves a torn icon and a mis-sized box; this leaves a deliberate
 * placeholder that reads as "no photo yet" rather than as a bug.
 *
 * Replacing that photography with real files in the `product-images` bucket is
 * what makes this component stop appearing — it is a safety net, not a fix.
 */
export function ProductImage({ alt, className = "", ...props }: ImageProps & { alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        // `fill` images are positioned by their parent; matching that keeps the
        // placeholder in the same box the photo would have occupied.
        className={`${props.fill ? "absolute inset-0" : "h-full w-full"} flex flex-col items-center justify-center gap-1 bg-surface-container-low text-text-muted ${className}`}
        role="img"
        aria-label={alt ? `${alt} — image unavailable` : "Image unavailable"}
      >
        <span aria-hidden="true" className="material-symbols-outlined text-2xl opacity-40">
          image_not_supported
        </span>
        <span className="px-2 text-center font-label-sm text-[10px] uppercase tracking-widest opacity-60">
          No image
        </span>
      </div>
    );
  }

  return <Image {...props} alt={alt} className={className} onError={() => setFailed(true)} />;
}
