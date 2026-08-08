// The in-progress bespoke configuration: measurements and style choices.
// Extracted from TailoringContext.
//
// These become `stitching_requests` rows once the backend lands — the table
// allows a request to exist before an order does, which is exactly what this
// draft state is.

import type { TailoringStore } from "../ports";
import type { ReferenceImage, TailoringConfig } from "../types";
import { makeId, readJSON, writeJSON } from "./storage";

const KEY = "fujrs-tailoring-config";
const REFERENCES_KEY = "fujrs-tailoring-references";

export const localTailoring: TailoringStore = {
  async read() {
    return readJSON<TailoringConfig | null>(KEY, null);
  },

  async write(config) {
    writeJSON(KEY, config);
  },

  // Reference photos are data URLs here. That is what makes them work with no
  // object storage, and also why the gallery is capped — several phone photos
  // as base64 will hit the ~5MB localStorage quota on their own.
  async listReferences() {
    return readJSON<ReferenceImage[]>(REFERENCES_KEY, []);
  },

  async addReferences(images) {
    const existing = readJSON<ReferenceImage[]>(REFERENCES_KEY, []);
    const next = [...existing, ...images.map((image) => ({ id: makeId(), url: image.dataUrl }))];
    writeJSON(REFERENCES_KEY, next);
    return next;
  },

  async removeReference(id) {
    writeJSON(
      REFERENCES_KEY,
      readJSON<ReferenceImage[]>(REFERENCES_KEY, []).filter((image) => image.id !== id)
    );
  },
};
