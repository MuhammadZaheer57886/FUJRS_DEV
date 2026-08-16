"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { STITCHING_STATUSES, type StitchingStatus } from "@/lib/stitchingStatus";
import { MEASUREMENT_FIELDS, MEASUREMENT_UNIT, missingMeasurements } from "@/lib/measurements";
import { formatOrderNumber } from "@/lib/orderNumber";
import { stitching } from "@/lib/data";
import type { StitchingJob } from "@/lib/data";
import { useToast } from "@/components/ui/Toast";
import { Loading } from "@/components/ui/Loading";

/** The spec sheet a tailor actually cuts from — every measurement, in order. */
function SpecSheet({ item }: { item: StitchingJob }) {
  const missing = missingMeasurements(item.measurements);

  return (
    <div className="border-t border-border-subtle bg-surface-container-low p-5">
      {missing.length > 0 && (
        <p className="mb-4 border border-outline-variant border-l-4 border-l-error p-3 text-label-sm text-error">
          Missing {missing.length} measurement{missing.length === 1 ? "" : "s"}:{" "}
          {missing.join(", ")}. This piece can&apos;t be cut until the customer supplies them.
        </p>
      )}

      <p className="text-label-sm uppercase tracking-widest text-text-muted">
        Measurements ({MEASUREMENT_UNIT})
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
        {MEASUREMENT_FIELDS.map((field) => {
          const value = item.measurements[field]?.trim();
          return (
            <div key={field} className="border-b border-border-subtle pb-2">
              <dt className="text-label-sm text-text-muted">{field}</dt>
              <dd
                className={`font-display text-body-lg ${value ? "text-on-surface" : "text-error"}`}
              >
                {value ? `${value}${MEASUREMENT_UNIT}` : "-"}
              </dd>
            </div>
          );
        })}
      </dl>

      <p className="mt-6 text-label-sm uppercase tracking-widest text-text-muted">
        Cut &amp; Finish
      </p>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3">
        {[
          { label: "Neckline", value: item.neckline },
          { label: "Sleeve", value: item.sleeve },
          { label: "Hemline", value: item.hemline },
        ].map((row) => (
          <div key={row.label} className="border-b border-border-subtle pb-2">
            <dt className="text-label-sm text-text-muted">{row.label}</dt>
            <dd className="text-body-md">{row.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-6 text-label-sm uppercase tracking-widest text-text-muted">Customer Notes</p>
      <p className="mt-2 max-w-prose text-body-md text-on-surface">
        {item.notes ?? <span className="text-text-muted">None left for this piece.</span>}
      </p>

      <p className="mt-6 text-label-sm uppercase tracking-widest text-text-muted">
        Reference Photos
      </p>
      {item.references.length === 0 ? (
        <p className="mt-2 text-body-md text-text-muted">None supplied for this piece.</p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {item.references.map((reference) => (
            <li key={reference.id}>
              {/* Signed and short-lived; the bucket is private because these
                  are the customer's own photos. Opens full size in a new tab
                  for the detail a thumbnail loses. */}
              <a
                href={reference.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative aspect-[4/5] overflow-hidden border border-outline-variant bg-surface-container transition-opacity hover:opacity-90"
              >
                <Image src={reference.url} alt="" fill unoptimized className="object-cover" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function TailorView() {
  const { toast } = useToast();
  const [queue, setQueue] = useState<StitchingJob[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setQueue(await stitching.queue());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function updateStatus(job: StitchingJob, status: StitchingStatus) {
    const updated = await stitching.updateStatus(job.id, status);

    // Null means the database refused — most likely another tailor claimed the
    // piece first. Re-reading is the honest response: the queue they are
    // looking at is out of date, not the move they made.
    if (!updated) {
      toast("That piece was picked up by someone else. Refreshing the queue.", "info");
      await refresh();
      return;
    }

    await refresh();
    toast(`${formatOrderNumber(job.orderNumber)} is now ${status.toLowerCase()}.`, "success");
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STITCHING_STATUSES.slice(0, 4).map((status) => (
          <div key={status} className="border border-border-subtle p-6">
            <p className="text-label-sm uppercase text-text-muted">{status}</p>
            <p className="mt-2 font-display text-headline-sm">
              {queue ? queue.filter((q) => q.status === status).length : "-"}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-headline-sm">Active Measurement Queue</h2>

      {!queue && (
        <div className="mt-6">
          <Loading />
        </div>
      )}
      {queue?.length === 0 && (
        <p className="mt-4 text-text-muted">
          Nothing in the queue yet. Bespoke pieces appear here as customers order them, and any
          piece nobody has claimed is yours to pick up.
        </p>
      )}

      <div className="mt-4 space-y-4">
        {queue?.map((item) => {
          const open = openId === item.id;
          const panelId = `spec-${item.id}`;

          return (
            <div key={item.id} className="border border-border-subtle">
              <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-body-md text-on-surface">
                    {formatOrderNumber(item.orderNumber)} · {item.customer}
                    {!item.claimed && (
                      <span className="ml-2 border border-marketplace-bronze px-2 py-0.5 text-label-sm uppercase tracking-widest text-marketplace-bronze">
                        Unclaimed
                      </span>
                    )}
                  </p>
                  <p className="text-label-sm text-text-muted">
                    {item.garment} ·{" "}
                    {[item.neckline, item.sleeve, item.hemline].filter(Boolean).join(", ")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setOpenId(open ? null : item.id)}
                    aria-expanded={open}
                    aria-controls={panelId}
                    className="border border-outline-variant px-4 py-2 font-label-sm text-label-sm uppercase tracking-widest transition-colors hover:border-marketplace-bronze hover:text-marketplace-bronze"
                  >
                    {open ? "Hide Measurements" : "View Measurements"}
                  </button>
                  <select
                    value={item.status}
                    aria-label={`Stitching status for order ${formatOrderNumber(item.orderNumber)}`}
                    onChange={(e) => void updateStatus(item, e.target.value as StitchingStatus)}
                    className="border border-outline-variant bg-transparent px-4 py-2 text-body-md focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  >
                    {STITCHING_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {open && (
                <div id={panelId}>
                  <SpecSheet item={item} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
