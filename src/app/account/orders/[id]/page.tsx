"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { LinkButton } from "@/components/ui/Button";
import { StatusScreen } from "@/components/ui/StatusScreen";
import { STITCHING_STATUSES } from "@/lib/stitchingStatus";
import { ORDER_STATUS_LABELS } from "@/lib/orderStatus";
import { RefundRequest } from "@/components/account/RefundRequest";
import { formatOrderNumber } from "@/lib/orderNumber";
import { orders as orderStore } from "@/lib/data";
import type { Order } from "@/lib/data";
import { LoadingScreen } from "@/components/ui/Loading";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { status } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace(`/login?callbackUrl=/account/orders/${id}`);
  }, [status, router, id]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;
    orderStore
      .get(id)
      .then((found) => {
        if (active) setOrder(found);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [status, id]);

  if (!loaded) {
    return <LoadingScreen label="Loading order" />;
  }

  if (!order) {
    return (
      <StatusScreen
        icon="receipt_long"
        title="Order not found"
        body="Orders are stored on this device, so this one may have been placed elsewhere."
        actions={
          <LinkButton href="/account" variant="primary" className="!px-10 !py-4">
            Back to Account
          </LinkButton>
        }
      />
    );
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16">
      <Link
        href="/account"
        className="font-label-sm uppercase tracking-widest text-on-surface-variant hover:text-primary"
      >
        ← Back to Account
      </Link>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-body text-label-sm uppercase tracking-widest text-marketplace-bronze">
            Order {formatOrderNumber(order.orderNumber)}
          </p>
          <h1 className="mt-2 font-display text-headline-md">
            Placed{" "}
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </h1>
        </div>
        <span className="border border-primary px-4 py-2 font-label-sm uppercase tracking-widest">
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      {order.status === "DELIVERED" && (
        <p className="mt-4 font-body text-body-md text-on-surface-variant">
          Completed
          {order.deliveredAt
            ? `, delivered ${new Date(order.deliveredAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}`
            : ""}
          .
        </p>
      )}

      <div className="mt-12 grid grid-cols-1 gap-gutter md:grid-cols-12">
        <div className="md:col-span-7 space-y-6">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-4 border border-outline-variant p-6 sm:flex-row"
            >
              <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-surface-container sm:w-28">
                <Image src={item.image} alt={item.title} fill className="object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm">{item.title}</h3>
                    <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant uppercase">
                      Qty {item.qty}
                    </p>
                  </div>
                  <p className="font-body-md text-body-md">
                    PKR {(item.price * item.qty).toLocaleString()}
                  </p>
                </div>

                {item.stitchingLabel && (
                  <div className="mt-4 border-t border-outline-variant/30 pt-4">
                    <p className="mb-3 font-label-sm text-label-sm uppercase text-on-surface-variant">
                      Bespoke Stitching: {item.stitchingLabel}
                    </p>
                    <ol className="flex flex-wrap gap-2">
                      {STITCHING_STATUSES.map((stage, i) => {
                        const currentIndex = STITCHING_STATUSES.indexOf(
                          item.stitchingStatus ?? STITCHING_STATUSES[0]
                        );
                        const reached = i <= currentIndex;
                        return (
                          <li
                            key={stage}
                            className={`font-label-sm text-label-sm px-3 py-1.5 uppercase tracking-wide ${
                              reached
                                ? "bg-primary text-on-primary"
                                : "border border-outline-variant text-on-surface-variant"
                            }`}
                          >
                            {stage}
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="md:col-span-5 space-y-6">
          <div className="border border-outline-variant p-8">
            <h2 className="font-headline-sm text-headline-sm mb-6">Order Total</h2>
            <div className="space-y-3">
              <div className="flex justify-between font-label-md text-label-md text-on-surface-variant">
                <span>Fabric Total</span>
                <span>PKR {order.fabricTotal.toLocaleString()}</span>
              </div>
              {order.stitchingTotal > 0 && (
                <div className="flex justify-between font-label-md text-label-md text-on-surface-variant">
                  <span>Stitching Total</span>
                  <span>PKR {order.stitchingTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-label-md text-label-md text-on-surface-variant border-b border-outline-variant pb-3">
                <span>Shipping</span>
                <span>PKR {order.shipping.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-headline-sm text-headline-sm pt-1">
                <span>Total</span>
                <span>PKR {order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="border border-outline-variant p-8">
            <h2 className="font-headline-sm text-headline-sm mb-6">Shipping To</h2>
            <p className="font-body-md text-body-md">
              {order.firstName} {order.lastName}
            </p>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              {order.street}
              <br />
              {order.city}, {order.postalCode}
            </p>
            <div className="mt-6 flex items-center justify-between border-t border-outline-variant pt-6">
              <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                Payment Method
              </span>
              <span className="font-label-md text-label-md">
                {order.paymentMethod === "cod" ? "Cash on Delivery" : "Card"}
              </span>
            </div>
            {order.referralCode && (
              <div className="mt-4 flex items-center justify-between border-t border-outline-variant pt-4">
                <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                  Referred By
                </span>
                <span className="font-label-md text-label-md uppercase tracking-widest text-marketplace-bronze">
                  {order.referralCode}
                </span>
              </div>
            )}
          </div>

          <RefundRequest order={order} />
        </div>
      </div>
    </div>
  );
}
