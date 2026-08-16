"use client";

// The staff side of a refund.
//
// There is no "refund this order" button anywhere in the dashboard, and that
// is the point: a refund starts with the customer asking, so everything that
// can be refunded is sitting in this queue with a reason attached. Approving
// is what moves the order to REFUNDED (`src/lib/refunds.ts`).

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { Loading } from "@/components/ui/Loading";
import { formatOrderNumber } from "@/lib/orderNumber";
import {
  MAX_REFUND_REASON_LENGTH,
  REFUND_REQUEST_STATUS_LABELS,
  isOpenRefundRequest,
  type RefundRequestStatus,
} from "@/lib/refunds";
import { refunds as refundStore } from "@/lib/data";
import type { RefundRequest } from "@/lib/data";

const PKR = (amount: number) => `PKR ${amount.toLocaleString()}`;

type Decision = Exclude<RefundRequestStatus, "REQUESTED">;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function StatusChip({ status }: { status: RefundRequestStatus }) {
  const tone =
    status === "APPROVED"
      ? "border-marketplace-bronze text-marketplace-bronze"
      : status === "DECLINED"
        ? "border-outline-variant text-text-muted"
        : "border-outline-variant text-on-surface";

  return (
    <span className={`border px-3 py-1 text-label-sm uppercase tracking-widest ${tone}`}>
      {REFUND_REQUEST_STATUS_LABELS[status]}
    </span>
  );
}

function RequestCard({
  request,
  onReview,
}: {
  request: RefundRequest;
  onReview: (id: string, decision: Decision, note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<Decision | null>(null);
  const open = isOpenRefundRequest(request.status);

  async function review(decision: Decision) {
    setBusy(decision);
    await onReview(request.id, decision, note);
    setBusy(null);
  }

  return (
    <li className="border border-border-subtle p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-body-md">
            {formatOrderNumber(request.orderNumber)}
            {request.customerName ? ` · ${request.customerName}` : ""}
          </p>
          <p className="mt-1 text-label-sm text-text-muted">
            {PKR(request.amount)} · requested {formatDate(request.createdAt)}
          </p>
        </div>
        <StatusChip status={request.status} />
      </div>

      <p className="mt-4 max-w-prose border-l-2 border-outline-variant pl-4 text-body-md text-text-muted">
        {request.reason}
      </p>

      {open ? (
        <div className="mt-5 max-w-prose">
          <label
            htmlFor={`note-${request.id}`}
            className="text-label-sm uppercase tracking-widest text-text-muted"
          >
            Note for the customer (optional)
          </label>
          <textarea
            id={`note-${request.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={MAX_REFUND_REASON_LENGTH}
            rows={2}
            className="mt-2 w-full border border-outline-variant bg-transparent p-3 text-body-md"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => void review("APPROVED")}
              disabled={busy !== null}
              className="border border-outline-variant px-4 py-2 text-label-sm uppercase tracking-widest transition-colors hover:border-marketplace-bronze hover:text-marketplace-bronze disabled:opacity-40"
            >
              {busy === "APPROVED" ? "Approving" : "Approve Refund"}
            </button>
            <button
              onClick={() => void review("DECLINED")}
              disabled={busy !== null}
              className="border border-outline-variant px-4 py-2 text-label-sm uppercase tracking-widest transition-colors hover:border-error hover:text-error disabled:opacity-40"
            >
              {busy === "DECLINED" ? "Declining" : "Decline"}
            </button>
          </div>

          <p className="mt-3 text-label-sm text-marketplace-bronze">
            Approving refunds the order, returns the stock, and reverses any commission. Moving the
            money back to the customer happens outside the app until a payment provider is wired up.
          </p>
        </div>
      ) : (
        <p className="mt-4 text-label-sm text-text-muted">
          Reviewed {request.reviewedAt ? formatDate(request.reviewedAt) : "-"}
          {request.staffNote ? ` · ${request.staffNote}` : ""}
        </p>
      )}
    </li>
  );
}

/**
 * Open requests first, then the rest newest first. Staff open this section to
 * act on something, not to browse history.
 */
function queueOrder(list: RefundRequest[]): RefundRequest[] {
  return [...list].sort((a, b) => {
    const aOpen = isOpenRefundRequest(a.status);
    const bOpen = isOpenRefundRequest(b.status);
    if (aOpen !== bOpen) return aOpen ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function RefundQueue({ onReviewed }: { onReviewed?: () => void }) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<RefundRequest[] | null>(null);

  const refresh = useCallback(async () => {
    try {
      setRequests(queueOrder(await refundStore.list()));
    } catch {
      setRequests([]);
      toast("Couldn't load refund requests.", "error");
    }
  }, [toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleReview = useCallback(
    async (id: string, decision: Decision, note: string) => {
      const reviewed = await refundStore.review({ id, decision, note });
      if (!reviewed) {
        toast("Couldn't save that decision. Refresh and try again.", "error");
        return;
      }

      await refresh();
      // The order's status changed with it, so whatever else is showing orders
      // needs to hear about it.
      onReviewed?.();
      toast(
        decision === "APPROVED"
          ? `${formatOrderNumber(reviewed.orderNumber)} is refunded.`
          : `Refund declined for ${formatOrderNumber(reviewed.orderNumber)}.`,
        "success"
      );
    },
    [refresh, onReviewed, toast]
  );

  const openCount = requests?.filter((r) => isOpenRefundRequest(r.status)).length ?? 0;

  return (
    <section className="mt-16">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-headline-sm">Refund Requests</h2>
        {openCount > 0 && (
          <span className="text-label-sm uppercase tracking-widest text-marketplace-bronze">
            {openCount} awaiting review
          </span>
        )}
      </div>
      <p className="mt-1 max-w-prose text-label-sm text-marketplace-bronze">
        Customers raise these from their order page after delivery. Approving one is the only way an
        order is refunded, so every refund has a reason behind it.
      </p>

      {!requests ? (
        <div className="mt-6 flex justify-center border border-border-subtle py-10">
          <Loading label="Loading refund requests" />
        </div>
      ) : requests.length === 0 ? (
        <p className="mt-6 border border-border-subtle p-8 text-center text-body-md text-text-muted">
          No refund requests.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} onReview={handleReview} />
          ))}
        </ul>
      )}
    </section>
  );
}
