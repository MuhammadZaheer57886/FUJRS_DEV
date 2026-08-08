"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type ToastTone = "info" | "success" | "soon" | "error";

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  /** Show a transient message. `soon` is the "not built yet" tone. */
  toast: (message: string, tone?: ToastTone) => void;
}

const TOAST_DURATION_MS: Record<ToastTone, number> = {
  info: 4000,
  success: 4000,
  soon: 4000,
  // Failures carry the reason — give them time to be read.
  error: 8000,
};

const TONE_ICON: Record<ToastTone, string> = {
  info: "info",
  success: "check_circle",
  soon: "schedule",
  error: "error",
};

const TONE_ACCENT: Record<ToastTone, string> = {
  info: "border-l-primary",
  success: "border-l-marketplace-bronze",
  soon: "border-l-tertiary-fixed-dim",
  error: "border-l-error",
};

const TONE_ICON_CLASS: Record<ToastTone, string> = {
  info: "text-marketplace-bronze",
  success: "text-marketplace-bronze",
  soon: "text-marketplace-bronze",
  error: "text-error",
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, message, tone }]);
      timers.current.push(setTimeout(() => dismiss(id), TOAST_DURATION_MS[tone]));
    },
    [dismiss]
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-[calc(100vw-3rem)] max-w-sm flex-col gap-3"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : undefined}
            className={`pointer-events-auto flex items-start gap-3 border border-outline-variant border-l-4 ${TONE_ACCENT[t.tone]} bg-surface-container-lowest px-5 py-4 shadow-lg`}
          >
            <span className={`material-symbols-outlined text-xl ${TONE_ICON_CLASS[t.tone]}`}>
              {TONE_ICON[t.tone]}
            </span>
            <p className="flex-1 font-body text-body-md leading-snug">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="text-on-surface-variant hover:text-primary"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
