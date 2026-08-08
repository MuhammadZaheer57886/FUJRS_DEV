"use client";

import { useCallback, useEffect, useState } from "react";

interface AsyncState<T> {
  data: T | null;
  /** True until the first result lands. */
  loading: boolean;
  error: Error | null;
  /** Re-runs the loader — use after a write to refresh. */
  reload: () => void;
}

/**
 * Runs an async loader and tracks its result, without every caller
 * re-implementing the unmount guard.
 *
 * That guard matters more than it looks: with a real network, a user who
 * navigates away mid-request would otherwise get a setState on an unmounted
 * component, and — worse — a slow first request can resolve *after* a fast
 * second one and overwrite newer data with older. Ignoring stale runs fixes
 * both.
 *
 * `deps` follows the useEffect convention. Pass a stable loader (useCallback)
 * or list what it closes over.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);

    loader()
      .then((result) => {
        if (!active) return;
        setData(result);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // The loader is intentionally not a dependency — callers describe what it
    // closes over via `deps`, which keeps this from re-running on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { data, loading, error, reload };
}
