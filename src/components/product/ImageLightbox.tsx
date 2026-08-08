"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProductImage } from "@/components/ui/ProductImage";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;
/** What a double-click jumps to — close enough to read a weave. */
const QUICK_ZOOM = 2.5;

/**
 * Full-screen viewer for the product gallery: zoom, pan, and step through
 * every photo. Fabric is bought on its texture, so the shopper has to be able
 * to get close to it — the grid on the page can't do that.
 *
 * Zoom is a CSS transform on the image rather than a larger source: `next/image`
 * already serves the full-resolution file here, and scaling it costs no extra
 * request.
 */
export function ImageLightbox({
  images,
  title,
  index,
  onIndexChange,
  onClose,
}: {
  images: string[];
  title: string;
  /** Which photo is showing; the gallery owns it so both stay in step. */
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const zoomed = zoom > MIN_ZOOM;

  const reset = useCallback(() => {
    setZoom(MIN_ZOOM);
    setOffset({ x: 0, y: 0 });
  }, []);

  // A new photo starts fitted — inheriting the last one's pan would open on a
  // corner of an image the shopper hasn't seen yet.
  useEffect(reset, [index, reset]);

  const step = useCallback(
    (delta: number) => {
      if (images.length < 2) return;
      onIndexChange((index + delta + images.length) % images.length);
    },
    [images.length, index, onIndexChange]
  );

  /** Keeps the image from being dragged off its own frame. */
  const clamp = useCallback((next: { x: number; y: number }, scale: number) => {
    const frame = frameRef.current;
    if (!frame) return next;
    // `translate() scale()` translates in unscaled space, so the travel either
    // side is half the overhang.
    const maxX = (frame.clientWidth * (scale - 1)) / 2;
    const maxY = (frame.clientHeight * (scale - 1)) / 2;
    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  }, []);

  const changeZoom = useCallback(
    (next: number) => {
      const scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
      setZoom(scale);
      setOffset((prev) => (scale === MIN_ZOOM ? { x: 0, y: 0 } : clamp(prev, scale)));
    },
    [clamp]
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "+" || e.key === "=") changeZoom(zoom + ZOOM_STEP);
      else if (e.key === "-") changeZoom(zoom - ZOOM_STEP);
      else if (e.key === "0") reset();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, step, changeZoom, reset, zoom]);

  // The page behind must not scroll under the overlay.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  function handlePointerDown(e: React.PointerEvent) {
    if (!zoomed) return;
    dragRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    const start = dragRef.current;
    if (!start) return;
    setOffset(clamp({ x: e.clientX - start.x, y: e.clientY - start.y }, zoom));
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — image ${index + 1} of ${images.length}`}
      className="fixed inset-0 z-[70] flex flex-col bg-primary/95 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-4 px-gutter py-4 text-on-primary">
        <p className="font-label-sm text-label-sm uppercase tracking-widest">
          {index + 1} / {images.length}
        </p>

        <div className="flex items-center gap-1">
          <IconButton
            icon="zoom_out"
            label="Zoom out"
            disabled={zoom <= MIN_ZOOM}
            onClick={() => changeZoom(zoom - ZOOM_STEP)}
          />
          <span className="w-14 text-center font-label-sm text-label-sm tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <IconButton
            icon="zoom_in"
            label="Zoom in"
            disabled={zoom >= MAX_ZOOM}
            onClick={() => changeZoom(zoom + ZOOM_STEP)}
          />
          <IconButton icon="restart_alt" label="Reset zoom" disabled={!zoomed} onClick={reset} />
          <IconButton icon="close" label="Close viewer" onClick={onClose} />
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {/* Clicking the surround closes; clicking the photo does not. */}
        <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

        <div
          ref={frameRef}
          className="pointer-events-none absolute inset-0 flex items-center justify-center p-gutter"
        >
          <div
            className={`pointer-events-auto relative h-full w-full max-w-4xl touch-none select-none transition-transform duration-200 ${
              zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
            }`}
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onDoubleClick={() => changeZoom(zoomed ? MIN_ZOOM : QUICK_ZOOM)}
          >
            <ProductImage
              src={images[index]}
              alt={`${title} — view ${index + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              draggable={false}
            />
          </div>
        </div>

        {images.length > 1 && (
          <>
            <EdgeButton
              icon="chevron_left"
              label="Previous image"
              side="left"
              onClick={() => step(-1)}
            />
            <EdgeButton
              icon="chevron_right"
              label="Next image"
              side="right"
              onClick={() => step(1)}
            />
          </>
        )}
      </div>

      <p className="px-gutter py-4 text-center font-label-sm text-label-sm text-on-primary/60">
        Double-click to zoom · drag to pan · Esc to close
      </p>
    </div>
  );
}

function IconButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-10 w-10 items-center justify-center text-on-primary transition-opacity hover:opacity-70 disabled:pointer-events-none disabled:opacity-30"
    >
      <span aria-hidden="true" className="material-symbols-outlined">
        {icon}
      </span>
    </button>
  );
}

function EdgeButton({
  icon,
  label,
  side,
  onClick,
}: {
  icon: string;
  label: string;
  side: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-on-primary/30 bg-primary/40 text-on-primary transition-colors hover:bg-primary ${
        side === "left" ? "left-4" : "right-4"
      }`}
    >
      <span aria-hidden="true" className="material-symbols-outlined">
        {icon}
      </span>
    </button>
  );
}
