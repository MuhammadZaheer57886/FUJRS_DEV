"use client";

// Pings /api/visits once per page load so the Super Admin screen can show when
// someone was last here and from where.
//
// Renders nothing. It lives in the layout rather than in a page so it covers
// the whole site, and it fires only when there IS a session — a visitor with no
// identity has no row to record against, and asking the server on their behalf
// would be a round trip that can only answer "nobody".
//
// Everything about the visit is derived server-side from the request. This
// component deliberately sends no body: a client that could describe its own
// visit could describe someone else's.

import { useEffect } from "react";
import { useAuth } from "./AuthProvider";

/**
 * Module scope, not a ref: this must be once per page load, and React 18's
 * StrictMode mounts effects twice in development. A ref would reset with the
 * component and report again on every remount.
 */
let reported = false;

export function VisitReporter() {
  const { session, status } = useAuth();
  const userId = session?.user.id;

  useEffect(() => {
    if (status === "loading" || !userId || reported) return;
    reported = true;

    // Fire and forget. A failed visit record is not worth surfacing to a
    // shopper, and must never block or delay the page they came for.
    void fetch("/api/visits", { method: "POST", cache: "no-store" }).catch(() => {});
  }, [status, userId]);

  return null;
}
