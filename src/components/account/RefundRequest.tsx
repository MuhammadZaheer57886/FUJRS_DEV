"use client";

// The customer's half of a refund: asking for one, and seeing where it got to.
//
// This is the only place a refund can start. Staff have no button that refunds
// an order out of nowhere, so what a customer writes here is the reason that
// ends up on the record (`src/lib/refunds.ts`).

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { Loading } from "@/components/ui/Loading";
import {
  MAX_REFUND_REASON_LENGTH,
  REFUND_REQUEST_STATUS_LABELS,
  REFUND_REQUEST_STATUS_NOTES,
  RETURN_WINDOW_DAYS,
  refundEligibility,
  returnWindowDaysLeft,
  validateRefundReason,
} from "@/lib/refunds";
import { refunds as refundStore, StoreWriteError } from "@/lib/data";
import type { Order, RefundRequest as RefundRequestRecord } from "@/lib/data";

const PKR = (amount: number) => `PKR ${amount.toLocaleString()}`;

/** How much of the window is left, in the plainest words available. */
function windowNote(deliveredAt: string | null): string {
  if (!deliveredAt) {
    return `Pieces can be returned within ${RETURN_WINDOW_DAYS} days of delivery.`;
  }

  const left = returnWindowDaysLeft(deliveredAt);
  if (left === 1) return "The last day to return this order is today.";
  return `You have ${left} days left to return this order.`;
}

export function RefundRequest({ order }: { order: Order }) {
  const { toast } = useToast();
  const [request, setRequest] = useState<RefundRequestRecord | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setRequest(await refundStore.forOrder(order.id));
    } catch {
      // A refund panel that can't load is not worth an error screen over the
      // order itself. The eligibility check below simply sees no request.
      setRequest(null);
    } finally {
      setLoaded(true);
    }
  }, [order.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    const invalid = validateRefundReason(reason);
    if (invalid) {
      setError(invalid);
      return;
    }

    setError(undefined);
    setSaving(true);
    try {
      const created = await refundStore.request({ orderId: order.id, reason });
      setRequest(created);
      setReason("");
      toast("Refund request sent. We will be in touch shortly.", "success");
    } catch (cause) {
      const message =
        cause instanceof StoreWriteError ? cause.message : "Couldn't send your refund request.";
      setError(message);
      toast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <div className="flex justify-center border border-outline-variant p-8">
        <Loading label="Loading refund status" />
      </div>
    );
  }

  // An existing request replaces the form: there is one per order, and what
  // the customer wants to know at this point is where theirs got to.
  if (request) {
    return (
      <div className="border border-outline-variant p-8">
        <h2 className="font-headline-sm text-headline-sm mb-4">Refund</h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="border border-primary px-3 py-1 font-label-sm text-label-sm uppercase tracking-widest">
            {REFUND_REQUEST_STATUS_LABELS[request.status]}
          </span>
          <span className="font-label-md text-label-md">{PKR(request.amount)}</span>
        </div>

        <p className="mt-4 font-body text-body-md text-on-surface-variant">
          {REFUND_REQUEST_STATUS_NOTES[request.status]}
        </p>

        <p className="mt-4 border-l-2 border-outline-variant pl-4 font-body text-body-md text-on-surface-variant">
          {request.reason}
        </p>

        {request.staffNote && (
          <p className="mt-4 font-label-sm text-label-sm text-marketplace-bronze">
            {request.staffNote}
          </p>
        )}
      </div>
    );
  }

  const eligibility = refundEligibility({
    status: order.status,
    deliveredAt: order.deliveredAt,
    existingRequest: null,
  });

  if (!eligibility.canRequest) {
    // Only worth saying once the order is finished. Telling someone waiting on
    // a delivery that they cannot refund it yet is noise.
    if (order.status !== "DELIVERED") return null;

    return (
      <div className="border border-outline-variant p-8">
        <h2 className="font-headline-sm text-headline-sm mb-4">Refund</h2>
        <p className="font-body text-body-md text-on-surface-variant">{eligibility.reason}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="border border-outline-variant p-8">
      <h2 className="font-headline-sm text-headline-sm mb-2">Need a refund?</h2>
      <p className="font-body text-body-md text-on-surface-variant">
        {windowNote(order.deliveredAt)} Tell us what went wrong and our team will review it.
      </p>

      <div className="mt-6">
        <TextAreaField
          label="Reason for your refund"
          rows={4}
          value={reason}
          error={error}
          maxLength={MAX_REFUND_REASON_LENGTH}
          onChange={(e) => setReason(e.target.value)}
          placeholder="The fabric arrived with a flaw along the hem."
          hint={`${reason.trim().length}/${MAX_REFUND_REASON_LENGTH}`}
        />
      </div>

      <Button
        type="submit"
        variant="secondary"
        loading={saving}
        loadingLabel="Sending your request"
        className="mt-6 w-full"
      >
        Request Refund
      </Button>
    </form>
  );
}
