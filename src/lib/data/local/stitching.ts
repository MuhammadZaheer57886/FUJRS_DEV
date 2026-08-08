// The stitching queue, on the browser-only backend.
//
// There is nothing real to show: a bespoke order placed in this browser has no
// tailor to route it to and no server to hold it. So this serves the dashboard
// fixtures, and TailorView says on screen that they are samples — which is the
// whole convention (CLAUDE.md): show the real UI, never fake success.
//
// Status changes persist to localStorage so the screen behaves consistently
// within a session rather than snapping back on every refresh.

import { DEMO_TAILOR_QUEUE } from "@/lib/auth/demoData";
import type { StitchingStatus } from "@/lib/stitchingStatus";
import type { StitchingStore } from "../ports";
import type { StitchingJob } from "../types";
import { readJSON, writeJSON } from "./storage";

const KEY = "fujrs-stitching-status";

/** Status overrides by job id — the fixtures themselves never change. */
type StatusOverrides = Record<string, StitchingStatus>;

function fixtures(): StitchingJob[] {
  const overrides = readJSON<StatusOverrides>(KEY, {});

  return DEMO_TAILOR_QUEUE.map((item) => ({
    id: item.id,
    // Fixtures predate order numbers, so derive a readable one the same way
    // the UI used to.
    orderNumber: item.orderId.slice(-8).toUpperCase(),
    customer: item.customer,
    garment: item.garment,
    neckline: item.neckline,
    sleeve: item.sleeve,
    hemline: item.hemline,
    notes: item.notes ?? null,
    measurements: item.measurements,
    status: overrides[item.id] ?? (item.status as StitchingStatus),
    claimed: true,
    // Fixtures carry no photos; there is no storage on this backend.
    references: [],
  }));
}

export const localStitching: StitchingStore = {
  async queue() {
    return fixtures();
  },

  async updateStatus(id, status) {
    const overrides = readJSON<StatusOverrides>(KEY, {});
    writeJSON(KEY, { ...overrides, [id]: status });
    return fixtures().find((job) => job.id === id) ?? null;
  },
};
