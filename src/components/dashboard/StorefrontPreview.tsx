"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import {
  CENTRE_FOCAL,
  MAX_ZOOM,
  MIN_ZOOM,
  ZOOM_STEP,
  clampFocal,
  clampZoom,
  cropStyle,
  cropWindow,
} from "@/lib/productPhoto";
import { photoSrc, type ProductFormPhoto, type ProductGender } from "@/lib/data";

/**
 * The shapes the storefront crops a product photo into.
 *
 * Listed here rather than inferred, because they are layout decisions made in
 * the tiles themselves: `MenProductTile`, `WomenProductTile`, `NewArrivalsGrid`
 * and `EditorialGallery`. Changing a ratio there means changing it here, and
 * the `where` line is what tells whoever is publishing which page they are
 * looking at.
 */
const SHAPES: {
  id: string;
  label: string;
  where: string;
  ratio: string;
  /** Null = every gender sees it. */
  gender: ProductGender | null;
}[] = [
  {
    id: "grid",
    label: "Grid tile · 4:5",
    where: "New Arrivals, Women, Men, and the product page",
    ratio: "4 / 5",
    gender: null,
  },
  {
    id: "women-feature",
    label: "Women feature tile · 16:9",
    where: "The first piece on the Women page",
    ratio: "16 / 9",
    gender: "Women",
  },
  {
    id: "men-feature",
    label: "Men feature tile · 16:10",
    where: "The first piece on the Men page",
    ratio: "16 / 10",
    gender: "Men",
  },
];

/** How tall the photo being adjusted is drawn, in px. */
const SOURCE_HEIGHT = 320;

/** Below this on the short edge, a crop starts to look soft in a large tile. */
const SOFT_CROP_PX = 400;

/**
 * "How will this look in the shop", answered before the product is published.
 *
 * The storefront crops one photo into three ratios, and `object-cover` crops
 * from the centre. On garment photography the centre is the least interesting
 * part of the frame: a portrait shot in the 16:9 women's feature tile keeps the
 * midriff and loses the neckline and the hem. This is the crop tool for that,
 * a focal point to pan and a zoom to tighten, with every shape the photo will
 * land in shown live beside it.
 *
 * Edits are held here and handed back on close. Writing each drag straight to
 * the form would re-render the whole of `ProductForm` on every frame of a
 * slider, which is what made the first version stutter.
 */
export function StorefrontPreview({
  open,
  onClose,
  images,
  onChange,
  title,
  price,
  badge,
  gender,
}: {
  open: boolean;
  onClose: () => void;
  images: ProductFormPhoto[];
  onChange: (next: ProductFormPhoto[]) => void;
  title: string;
  /** The raw form value, so a half-typed price still previews. */
  price: string;
  badge: string | null;
  gender: ProductGender;
}) {
  const [draft, setDraft] = useState(images);
  const [active, setActive] = useState(0);
  /**
   * A stored photo is a URL on another host, so its dimensions have to be read
   * off the loaded element. An upload carries its own and never waits.
   */
  const [measured, setMeasured] = useState<{ width: number; height: number } | null>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Opening takes a fresh copy; closing hands the edits back. In between the
  // form is left alone.
  useEffect(() => {
    if (open) {
      setDraft(images);
      setActive(0);
    }
    // `images` deliberately absent: re-copying mid-edit would discard the drag
    // in progress, and the gallery behind the dialog can't be touched anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = useCallback(() => {
    onChange(draft);
    onClose();
  }, [draft, onChange, onClose]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  // Removing photos while the dialog is open must not leave it pointing past
  // the end of the array.
  const index = Math.min(active, Math.max(0, draft.length - 1));
  const image = draft[index];

  const setFocal = useCallback(
    (focalX: number, focalY: number) => {
      setDraft((prev) =>
        prev.map((entry, i) => (i === index ? { ...entry, focalX, focalY } : entry))
      );
    },
    [index]
  );

  /**
   * Only an upload can be zoomed. A stored photo's pixels are on Storage, and
   * pulling them back through a canvas to re-crop them is a different feature
   * with its own CORS problem; the control is disabled and says so rather than
   * silently doing nothing.
   */
  const setZoom = useCallback(
    (zoom: number) => {
      setDraft((prev) =>
        prev.map((entry, i) =>
          i === index && entry.kind === "upload" ? { ...entry, zoom: clampZoom(zoom) } : entry
        )
      );
    },
    [index]
  );

  function focalFromPointer(e: React.PointerEvent<HTMLDivElement>) {
    const box = sourceRef.current?.getBoundingClientRect();
    if (!box || box.width === 0 || box.height === 0) return;
    setFocal(
      clampFocal(((e.clientX - box.left) / box.width) * 100),
      clampFocal(((e.clientY - box.top) / box.height) * 100)
    );
  }

  if (!open || !image) return null;

  const shapes = SHAPES.filter(
    (shape) => shape.gender === null || gender === "Unisex" || shape.gender === gender
  );
  const parsedPrice = Number(price);
  const priceLabel =
    price.trim() && Number.isFinite(parsedPrice) ? `PKR ${parsedPrice.toLocaleString()}` : "PKR -";

  const src = photoSrc(image);
  const zoom = image.kind === "upload" ? image.zoom : MIN_ZOOM;
  const region = cropWindow(image);
  const size = image.kind === "upload" ? { width: image.width, height: image.height } : measured;
  const saved = size && {
    width: Math.max(1, Math.round(size.width * region.width)),
    height: Math.max(1, Math.round(size.height * region.height)),
  };
  const soft = saved !== null && Math.min(saved.width, saved.height) < SOFT_CROP_PX;
  const untouched =
    image.focalX === CENTRE_FOCAL && image.focalY === CENTRE_FOCAL && zoom === MIN_ZOOM;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-gutter">
      <div
        className="fixed inset-0 bg-primary/50 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="storefront-preview-title"
        className="relative my-8 w-full max-w-5xl border border-outline-variant bg-surface-container-lowest p-8 shadow-lg"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="storefront-preview-title" className="font-display text-headline-sm">
              Storefront preview
            </h2>
            <p className="mt-2 max-w-xl font-body text-body-md text-on-surface-variant">
              Each page crops this photo to its own shape. Move the point to choose what stays in
              frame, and zoom to fill more of the tile with the garment. Nothing is saved until the
              product is.
            </p>
          </div>
          <Button ref={closeRef} type="button" variant="secondary" onClick={close}>
            Done
          </Button>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <div>
            <p className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant">
              The photo
            </p>

            {draft.length > 1 && (
              <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {draft.map((entry, i) => (
                  <li key={`${i}-${photoSrc(entry).slice(-16)}`} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      aria-label={`Adjust image ${i + 1} of ${draft.length}`}
                      aria-current={i === index}
                      className={`relative block h-14 w-11 overflow-hidden border transition-colors ${
                        i === index
                          ? "border-primary"
                          : "border-border-subtle opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={photoSrc(entry)}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                        style={cropStyle(entry)}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* The whole frame, with the kept region drawn on top of it. Showing
                the crop here instead would hide what is being thrown away,
                which is the one thing this pane is for. The box is given the
                photo's own ratio, so a pointer position inside it maps straight
                onto the photo with no letterboxing to correct for. */}
            <div
              ref={sourceRef}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                focalFromPointer(e);
              }}
              onPointerMove={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) focalFromPointer(e);
              }}
              style={{
                height: SOURCE_HEIGHT,
                // 4:5 until a stored photo reports its own shape, which is the
                // ratio most of the catalogue is shot at.
                aspectRatio: size ? `${size.width} / ${size.height}` : "4 / 5",
                maxWidth: "100%",
              }}
              className="relative mx-auto mt-4 cursor-crosshair touch-none select-none overflow-hidden border border-outline-variant bg-surface-container-low"
            >
              <Image
                key={src}
                src={src}
                alt=""
                fill
                unoptimized
                className="object-cover"
                onLoad={(e) =>
                  setMeasured({
                    width: e.currentTarget.naturalWidth,
                    height: e.currentTarget.naturalHeight,
                  })
                }
              />

              {/* The kept region, cut out of a dimmed frame. The dimming is a
                  huge spread shadow rather than a second layer, so the box
                  itself stays transparent and shows the photo underneath with
                  nothing to keep in register. */}
              {zoom > MIN_ZOOM && (
                <div
                  aria-hidden="true"
                  style={{
                    left: `${region.left * 100}%`,
                    top: `${region.top * 100}%`,
                    width: `${region.width * 100}%`,
                    height: `${region.height * 100}%`,
                  }}
                  className="pointer-events-none absolute outline outline-2 outline-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
                />
              )}

              <span
                aria-hidden="true"
                style={{ left: `${image.focalX}%`, top: `${image.focalY}%` }}
                className="pointer-events-none absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.6)]"
              />
            </div>

            {/* Dragging is not reachable by keyboard, and the sliders are also
                the only way to place the crop exactly. */}
            <div className="mt-5 space-y-3">
              <CropSlider
                label="Horizontal"
                value={image.focalX}
                min={0}
                max={100}
                step={1}
                format={(value) => `${Math.round(value)}%`}
                onChange={(focalX) => setFocal(focalX, image.focalY)}
              />
              <CropSlider
                label="Vertical"
                value={image.focalY}
                min={0}
                max={100}
                step={1}
                format={(value) => `${Math.round(value)}%`}
                onChange={(focalY) => setFocal(image.focalX, focalY)}
              />
              <CropSlider
                label="Zoom"
                value={zoom}
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={ZOOM_STEP}
                format={(value) => `${value.toFixed(2)}x`}
                disabled={image.kind === "stored"}
                onChange={setZoom}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setFocal(CENTRE_FOCAL, CENTRE_FOCAL);
                  setZoom(MIN_ZOOM);
                }}
                disabled={untouched}
                className="font-label-sm text-label-sm uppercase tracking-widest underline underline-offset-4 transition-colors hover:text-marketplace-bronze disabled:no-underline disabled:opacity-40"
              >
                {untouched ? "Uncropped" : "Reset crop"}
              </button>
              <p
                className={`font-body text-label-sm tabular-nums ${
                  soft ? "text-error" : "text-text-muted"
                }`}
              >
                {image.kind === "stored"
                  ? "Already uploaded, so only the framing can change"
                  : saved
                    ? `Saves at ${saved.width} × ${saved.height} px${
                        soft ? ", soft in a large tile" : ""
                      }`
                    : ""}
              </p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {shapes.map((shape) => (
              <figure key={shape.id}>
                <div
                  style={{ aspectRatio: shape.ratio }}
                  className="relative w-full overflow-hidden bg-surface-container"
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                    style={cropStyle(image)}
                  />
                  {badge && (
                    <span className="absolute left-3 top-3 bg-primary px-2 py-1 font-label-sm text-[10px] uppercase tracking-widest text-on-primary">
                      {badge}
                    </span>
                  )}
                </div>
                <figcaption className="mt-3">
                  <p className="flex items-baseline justify-between gap-3 font-headline-sm text-body-lg">
                    <span className="truncate">{title.trim() || "Untitled piece"}</span>
                    <span className="shrink-0 tabular-nums">{priceLabel}</span>
                  </p>
                  <p className="mt-1 font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                    {shape.label}
                  </p>
                  <p className="mt-0.5 font-body text-label-sm text-text-muted">{shape.where}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CropSlider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  disabled = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-center gap-3 ${disabled ? "opacity-40" : ""}`}>
      <span className="w-20 shrink-0 font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 flex-1 accent-primary"
      />
      <span className="w-12 shrink-0 text-right font-label-sm text-label-sm tabular-nums text-text-muted">
        {format(value)}
      </span>
    </label>
  );
}
