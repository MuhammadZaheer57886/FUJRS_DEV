"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_EDGE_PX,
  downscaleMany,
  type ImageShape,
  type UploadedImage,
} from "@/lib/downscaleImage";
import { Loading } from "@/components/ui/Loading";

/** More than this and the product gallery stops being useful. */
export const MAX_PRODUCT_IMAGES = 6;

/**
 * An ordered set of product photos.
 *
 * Order is meaningful — the first image is what every listing and card shows —
 * so it's directly manipulable: drag a tile, or use the arrows. Removing one
 * closes the gap rather than leaving a hole, which is why this is an array and
 * not six independent slots.
 */
export function ImageGalleryUpload({
  images,
  onChange,
  max = MAX_PRODUCT_IMAGES,
  shape = "portrait",
}: {
  images: UploadedImage[];
  onChange: (next: UploadedImage[]) => void;
  max?: number;
  shape?: ImageShape;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const remaining = max - images.length;
  const full = remaining <= 0;

  async function addFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;

    setError(null);

    // Take only what fits, and say so rather than silently dropping the rest.
    const accepted = files.slice(0, remaining);
    const overflow = files.length - accepted.length;

    setBusy(true);
    try {
      const { images: added, failed } = await downscaleMany(accepted, MAX_EDGE_PX[shape]);
      if (added.length > 0) onChange([...images, ...added]);

      const problems: string[] = [];
      if (failed.length > 0) {
        problems.push(
          `${failed.length} file${failed.length === 1 ? "" : "s"} couldn't be read (${failed.join(", ")}).`
        );
      }
      if (overflow > 0) {
        problems.push(`${overflow} more skipped — the limit is ${max} images.`);
      }
      setError(problems.join(" ") || null);
    } finally {
      setBusy(false);
      // Let the same files be picked again after a removal.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    onChange(images.filter((_, i) => i !== index));
    setError(null);
  }

  function moveTo(from: number, to: number) {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant">
          Product Images
        </p>
        <p className="font-label-sm text-label-sm text-text-muted">
          {images.length} of {max}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => (
          <figure
            key={`${index}-${image.dataUrl.slice(-24)}`}
            draggable
            onDragStart={() => setDraggingIndex(index)}
            onDragEnd={() => setDraggingIndex(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (draggingIndex !== null) moveTo(draggingIndex, index);
              setDraggingIndex(null);
            }}
            className={`group relative cursor-grab overflow-hidden border bg-surface-container-low active:cursor-grabbing ${
              draggingIndex === index
                ? "border-marketplace-bronze opacity-50"
                : "border-outline-variant"
            }`}
          >
            <div className="relative aspect-[4/5]">
              <Image src={image.dataUrl} alt="" fill unoptimized className="object-cover" />
            </div>

            {index === 0 && (
              <figcaption className="absolute left-0 top-0 bg-primary px-2 py-1 font-label-sm text-label-sm uppercase tracking-widest text-on-primary">
                Main
              </figcaption>
            )}

            <button
              type="button"
              onClick={() => removeAt(index)}
              aria-label={`Remove image ${index + 1}`}
              className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center bg-surface/90 text-on-surface opacity-0 transition-opacity hover:text-error focus:opacity-100 group-hover:opacity-100"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-lg">
                close
              </span>
            </button>

            {/* Arrows as well as dragging — dragging is not reachable by
                keyboard, and this is the only way to set the main image. */}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-surface/90 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => moveTo(index, index - 1)}
                disabled={index === 0}
                aria-label={`Move image ${index + 1} earlier`}
                className="flex-1 py-1.5 font-label-sm text-label-sm transition-colors hover:text-marketplace-bronze disabled:opacity-25"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => moveTo(index, index + 1)}
                disabled={index === images.length - 1}
                aria-label={`Move image ${index + 1} later`}
                className="flex-1 py-1.5 font-label-sm text-label-sm transition-colors hover:text-marketplace-bronze disabled:opacity-25"
              >
                →
              </button>
            </div>
          </figure>
        ))}

        {!full && (
          <label
            htmlFor={inputId}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              // Ignore a tile being reordered onto the add-tile.
              if (draggingIndex === null) void addFiles(e.dataTransfer.files);
            }}
            className={`flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-2 border border-dashed p-4 text-center transition-colors ${
              dragOver
                ? "border-marketplace-bronze bg-surface-container-low"
                : "border-outline-variant hover:border-marketplace-bronze"
            }`}
          >
            {busy ? (
              <Loading label="Processing images" />
            ) : (
              <>
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-3xl text-outline-variant"
                >
                  add_photo_alternate
                </span>
                <span className="font-label-sm text-label-sm uppercase tracking-widest">
                  {images.length === 0 ? "Add images" : "Add more"}
                </span>
                <span className="font-body text-label-sm text-text-muted">
                  Drop files or click — {remaining} left
                </span>
              </>
            )}
          </label>
        )}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple
        accept={ACCEPTED_IMAGE_TYPES}
        className="sr-only"
        onChange={(e) => void addFiles(e.target.files)}
      />

      {error ? (
        <p className="mt-3 font-label-sm text-label-sm text-error" role="alert">
          {error}
        </p>
      ) : (
        <p className="mt-3 font-body text-label-sm text-text-muted">
          Select several at once. The first image is the main one shown in listings — drag a tile or
          use the arrows to reorder. Portrait 4:5 works best; PNG, JPEG or WebP, resized
          automatically.
        </p>
      )}
    </div>
  );
}
