"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";

import {
  ACCEPTED_IMAGE_TYPES,
  MAX_EDGE_PX,
  downscaleToDataUrl,
  type ImageShape,
} from "@/lib/downscaleImage";

const SHAPE_CLASS: Record<ImageShape, string> = {
  circle: "h-28 w-28 rounded-full",
  portrait: "h-40 w-32",
};

export function ImageUpload({
  label,
  value,
  onChange,
  shape = "portrait",
  hint,
  alt = "",
}: {
  label: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  shape?: ImageShape;
  hint?: string;
  alt?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose a PNG, JPEG, or WebP image.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      // Avatars are square and rendered at a fixed size, so only the data URL
      // matters here — the dimensions are for product images.
      onChange((await downscaleToDataUrl(file, MAX_EDGE_PX[shape])).dataUrl);
    } catch {
      setError("That image couldn't be processed. Try another file.");
    } finally {
      setBusy(false);
      // Let the same file be picked again after a remove.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <p className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant">
        {label}
      </p>

      <div className="mt-3 flex items-center gap-6">
        <div
          className={`relative shrink-0 overflow-hidden border border-outline-variant bg-surface-container-low ${SHAPE_CLASS[shape]}`}
        >
          {value ? (
            <Image src={value} alt={alt} fill unoptimized className="object-cover" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-3xl text-outline-variant"
              >
                {shape === "circle" ? "person" : "image"}
              </span>
            </span>
          )}
        </div>

        <div className="flex flex-col items-start gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <label
            htmlFor={inputId}
            className="inline-flex cursor-pointer items-center gap-2 border border-primary px-6 py-2.5 font-label-md text-label-md uppercase tracking-widest transition-colors hover:bg-primary hover:text-on-primary focus-within:ring-1 focus-within:ring-marketplace-bronze"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-lg">
              upload
            </span>
            {busy ? "Processing…" : value ? "Replace" : "Upload"}
          </label>

          {value && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setError(null);
              }}
              className="font-label-sm text-label-sm uppercase tracking-widest text-text-muted underline underline-offset-4 hover:text-error"
            >
              Remove
            </button>
          )}

          {error ? (
            <p className="font-label-sm text-label-sm text-error">{error}</p>
          ) : (
            hint && <p className="font-label-sm text-label-sm text-text-muted">{hint}</p>
          )}
        </div>
      </div>
    </div>
  );
}
