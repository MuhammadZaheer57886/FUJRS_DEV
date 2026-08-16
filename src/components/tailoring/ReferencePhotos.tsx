"use client";

// Reference photos on a bespoke request — "make it like this".
//
// The bucket is PRIVATE and the URLs here are signed and short-lived, because
// these are pictures a customer took of themselves or of a garment they own.
// That is also why the list is re-read after every change rather than patched
// in memory: a stale signed URL is a broken image.

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ImageGalleryUpload } from "@/components/ui/ImageGalleryUpload";
import { Loading } from "@/components/ui/Loading";
import { tailoring } from "@/lib/data";
import type { ReferenceImage, UploadedImage } from "@/lib/data";

/** More than this and it stops being reference and starts being an album. */
const MAX_REFERENCES = 4;

export function ReferencePhotos() {
  const [images, setImages] = useState<ReferenceImage[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setImages(await tailoring.listReferences());
    } catch {
      setImages([]);
      setError("Couldn't load your reference photos.");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleAdd(picked: UploadedImage[]) {
    // The uploader hands back the whole gallery each time; only the new tail
    // needs uploading, since everything before it is already stored.
    const added = picked.slice(images?.length ?? 0);
    if (added.length === 0) return;

    setBusy(true);
    setError(null);
    try {
      setImages(await tailoring.addReferences(added));
    } catch {
      setError("Couldn't upload that photo. Please try again.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id: string) {
    setBusy(true);
    try {
      await tailoring.removeReference(id);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const remaining = MAX_REFERENCES - (images?.length ?? 0);

  return (
    <section className="border border-border-subtle bg-surface-container-low p-8">
      <h2 className="font-headline-sm text-headline-sm uppercase">Reference Photos</h2>
      <p className="mt-1 font-label-sm text-marketplace-bronze">PHASE 02: WHAT YOU HAVE IN MIND</p>
      <p className="mt-4 max-w-prose font-body text-body-md text-on-surface-variant">
        Optional. A photo of a piece you own, or a style you want copied, tells the Master Tailor
        more than a paragraph can. Only you and the tailor working on your garment can see these.
      </p>

      {!images ? (
        <div className="mt-6">
          <Loading label="Loading your photos" />
        </div>
      ) : (
        <>
          {images.length > 0 && (
            <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {images.map((image) => (
                <li key={image.id} className="group relative">
                  <div className="relative aspect-[4/5] overflow-hidden border border-outline-variant bg-surface-container">
                    {/* unoptimized: the URL is signed and expires, so there is
                        nothing stable for the image optimizer to cache. */}
                    <Image src={image.url} alt="" fill unoptimized className="object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleRemove(image.id)}
                    disabled={busy}
                    aria-label="Remove this reference photo"
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center bg-surface/90 text-on-surface opacity-0 transition-opacity hover:text-error focus:opacity-100 group-hover:opacity-100 disabled:opacity-30"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-lg">
                      close
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {remaining > 0 && (
            <div className="mt-6">
              {/* The gallery speaks the product form's photo union, where a
                  photo can already be on the record. Nothing here is: these
                  are always fresh uploads, so the stored case is dropped. */}
              <ImageGalleryUpload
                images={[]}
                onChange={(picked) =>
                  void handleAdd(
                    picked.flatMap((photo) => (photo.kind === "upload" ? [photo] : []))
                  )
                }
                max={remaining}
              />
            </div>
          )}
        </>
      )}

      {error && (
        <p role="alert" className="mt-3 font-label-sm text-label-sm text-error">
          {error}
        </p>
      )}
    </section>
  );
}
