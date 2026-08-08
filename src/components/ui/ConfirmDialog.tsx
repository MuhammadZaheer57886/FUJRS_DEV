"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

/**
 * The one confirmation step in the app. Destructive actions ask before they
 * run, and the dialog owns the "in flight" state so the caller doesn't have to
 * thread a pending flag through the button it came from: `onConfirm` is
 * awaited, the confirm button spins while it runs, and the dialog stays open
 * on failure so the caller's toast lands over the thing it failed to change.
 *
 * Deliberately not `window.confirm` — that blocks the thread, can't show a
 * spinner, and looks nothing like the rest of the storefront.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  pendingLabel = "Working",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Announced while the action runs, e.g. "Removing product". */
  pendingLabel?: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [pending, setPending] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Reopening after a failed attempt must not inherit the old pending state.
  useEffect(() => {
    if (open) setPending(false);
  }, [open]);

  // Escape cancels, but not mid-action — the write is already on its way.
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, pending, onCancel]);

  if (!open) return null;

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-gutter">
      <div
        className="absolute inset-0 bg-primary/50 backdrop-blur-sm"
        onClick={() => !pending && onCancel()}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-md border border-outline-variant bg-surface-container-lowest p-8 shadow-lg"
      >
        <h2 id="confirm-dialog-title" className="font-display text-headline-sm">
          {title}
        </h2>
        <div className="mt-3 font-body text-body-md text-on-surface-variant">{message}</div>

        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <Button
            ref={cancelRef}
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={pending}
            loadingLabel={pendingLabel}
            onClick={() => void handleConfirm()}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
