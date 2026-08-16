"use client";

import { useState } from "react";
import { ProductImage } from "@/components/ui/ProductImage";
import { ImageLightbox } from "@/components/product/ImageLightbox";
import type { ProductPhoto } from "@/lib/data";

/**
 * The product gallery: one large image with every other photo as a thumbnail
 * beside it, and a click into the full-screen viewer.
 *
 * The previous layout was a fixed three-image collage, which quietly dropped
 * the fourth photo onwards — an admin who uploaded six saw three. A rail shows
 * however many the piece has.
 */
export function EditorialGallery({ images, title }: { images: ProductPhoto[]; title: string }) {
  const [active, setActive] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);

  if (images.length === 0) {
    return (
      <div className="lg:col-span-7">
        <div className="relative aspect-[4/5] overflow-hidden bg-surface-container">
          {/* An empty src throws in next/image, so the placeholder is rendered
              directly rather than through a photo that can't load. */}
          <div
            role="img"
            aria-label={`${title}: no photography yet`}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-surface-container-low text-text-muted"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-3xl opacity-40">
              image_not_supported
            </span>
            <span className="font-label-sm text-[10px] uppercase tracking-widest opacity-60">
              No image
            </span>
          </div>
        </div>
      </div>
    );
  }

  const stepTo = (next: number) => setActive((next + images.length) % images.length);

  return (
    <div className="lg:col-span-7">
      <div className="flex flex-col-reverse gap-4 md:flex-row">
        {images.length > 1 && (
          <ul className="flex shrink-0 gap-3 overflow-x-auto md:w-20 md:flex-col md:overflow-x-visible md:overflow-y-auto">
            {images.map((photo, i) => (
              <li key={`${photo.url}-${i}`} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Show image ${i + 1} of ${images.length}`}
                  aria-current={i === active}
                  className={`relative block h-24 w-20 overflow-hidden border transition-colors ${
                    i === active
                      ? "border-primary"
                      : "border-border-subtle opacity-70 hover:opacity-100"
                  }`}
                >
                  <ProductImage
                    src={photo.url}
                    focal={photo}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setViewerOpen(true)}
            aria-label={`Open ${title} image ${active + 1} full screen`}
            className="group relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden bg-surface-container"
          >
            <ProductImage
              src={images[active].url}
              focal={images[active]}
              alt={`${title}, view ${active + 1}`}
              fill
              priority={active === 0}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <span
              aria-hidden="true"
              className="material-symbols-outlined absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center bg-surface/90 text-primary opacity-0 transition-opacity group-hover:opacity-100"
            >
              zoom_in
            </span>
          </button>

          {images.length > 1 && (
            <>
              <ArrowButton side="left" label="Previous image" onClick={() => stepTo(active - 1)} />
              <ArrowButton side="right" label="Next image" onClick={() => stepTo(active + 1)} />
              <p className="absolute left-4 top-4 bg-surface/90 px-2 py-1 font-label-sm text-label-sm tabular-nums text-primary">
                {active + 1} / {images.length}
              </p>
            </>
          )}
        </div>
      </div>

      {viewerOpen && (
        <ImageLightbox
          images={images}
          title={title}
          index={active}
          onIndexChange={setActive}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}

function ArrowButton({
  side,
  label,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-surface/90 text-primary transition-colors hover:bg-surface ${
        side === "left" ? "left-4" : "right-4"
      }`}
    >
      <span aria-hidden="true" className="material-symbols-outlined">
        {side === "left" ? "chevron_left" : "chevron_right"}
      </span>
    </button>
  );
}
