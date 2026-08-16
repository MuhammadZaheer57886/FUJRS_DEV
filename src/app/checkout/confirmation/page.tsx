"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LinkButton } from "@/components/ui/Button";
import { StatusScreen } from "@/components/ui/StatusScreen";
import { formatOrderNumber } from "@/lib/orderNumber";
import { orders as orderStore } from "@/lib/data";
import type { Order } from "@/lib/data";
import { LoadingScreen } from "@/components/ui/Loading";

const timelineSteps = [
  {
    status: "Completed",
    title: "Order Received",
    body: "Our team has verified your selection and payment details.",
    state: "done",
  },
  {
    status: "In Progress",
    title: "Atelier Assignment",
    body: "Your measurements are being reviewed by the Master Tailor for precision cutting.",
    state: "active",
  },
  {
    status: "Estimated: 5-7 Days",
    title: "Hand-Embroidery Refinement",
    body: "Final touches on the heritage threadwork and artisanal borders.",
    state: "pending",
  },
  {
    status: "Estimated: 10-14 Days",
    title: "Quality Inspection & Despatch",
    body: "FUJRS-standard 12-point quality check before luxury boxing.",
    state: "pending",
  },
];

function OrderConfirmation() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<Order | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!orderId) {
      router.replace("/account");
      return;
    }
    let active = true;
    orderStore
      .get(orderId)
      .then((found) => {
        if (active) setOrder(found);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [orderId, router]);

  if (!loaded) {
    return <LoadingScreen label="Loading your order" />;
  }

  if (!order) {
    return (
      <StatusScreen
        icon="receipt_long"
        title="Order not found"
        body="Orders are stored on this device, so this one may have been placed elsewhere."
        actions={
          <LinkButton href="/account" variant="primary" className="!px-10 !py-4">
            Go to My Account
          </LinkButton>
        }
      />
    );
  }

  const hasStitching = order.items.some((i) => i.stitchingLabel);

  return (
    <main className="pt-12 pb-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
      <section className="text-center mb-20">
        <span className="font-label-md text-label-md text-marketplace-bronze uppercase tracking-[0.3em] mb-4 block">
          Threads of Heritage
        </span>
        <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg mb-6">
          Your Legacy Awaits.
        </h2>
        <div className="flex flex-col items-center gap-2">
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Thank you for choosing FUJRS. Your order{" "}
            <span className="font-bold text-primary">{formatOrderNumber(order.orderNumber)}</span>{" "}
            has been successfully placed and is now being curated by our master artisans.
          </p>
          <div className="mt-8 flex gap-4 flex-wrap justify-center">
            <LinkButton href="/account" variant="primary" className="!px-10 !py-4">
              View in My Account
            </LinkButton>
            <LinkButton href="/dashboard" variant="secondary" className="!px-10 !py-4">
              Go to Dashboard
            </LinkButton>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Order Summary */}
        <div className="md:col-span-7 space-y-gutter">
          <div className="bg-surface-container-lowest p-8 border border-border-subtle">
            <h3 className="font-headline-sm text-headline-sm mb-8 border-b border-border-subtle pb-4">
              Order Summary
            </h3>
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row gap-6 items-start py-6 border-b border-border-subtle last:border-0"
              >
                <div className="w-32 aspect-[4/5] bg-surface-variant shrink-0 relative overflow-hidden">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-label-sm text-label-sm text-marketplace-bronze uppercase mb-1 block">
                        FUJRS
                      </span>
                      <h4 className="font-body-lg text-body-lg font-semibold">{item.title}</h4>
                      <p className="font-label-md text-label-md text-on-surface-variant mt-1">
                        Qty: {item.qty}
                      </p>
                    </div>
                    <span className="font-body-md text-body-md">
                      PKR {(item.price * item.qty).toLocaleString()}
                    </span>
                  </div>
                  {item.stitchingLabel && (
                    <div className="mt-6 p-4 bg-surface-container-low border-l-2 border-tertiary-fixed flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span
                          className="material-symbols-outlined text-tertiary-fixed-dim"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          precision_manufacturing
                        </span>
                        <div>
                          <p className="font-label-md text-label-md uppercase">Stitching Status</p>
                          <p className="font-body-md text-body-md font-medium text-marketplace-bronze italic">
                            Moving to the Atelier
                          </p>
                        </div>
                      </div>
                      <span className="font-label-sm text-label-sm px-2 py-1 bg-tertiary-fixed text-on-tertiary-fixed">
                        MASTER TAILORED
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div className="mt-10 space-y-4">
              <div className="flex justify-between font-label-md text-label-md text-on-surface-variant">
                <span>Subtotal</span>
                <span>PKR {order.fabricTotal.toLocaleString()}</span>
              </div>
              {order.stitchingTotal > 0 && (
                <div className="flex justify-between font-label-md text-label-md text-on-surface-variant">
                  <span>Bespoke Tailoring Fee</span>
                  <span>PKR {order.stitchingTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-label-md text-label-md text-on-surface-variant border-b border-border-subtle pb-4">
                <span>Shipping</span>
                <span>PKR {order.shipping.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-headline-sm text-headline-sm pt-2">
                <span>Total</span>
                <span>PKR {order.total.toLocaleString()}</span>
              </div>
            </div>
            {order.referralCode && (
              <p className="mt-6 border-t border-border-subtle pt-4 font-label-sm text-label-sm text-on-surface-variant">
                Referred by{" "}
                <span className="uppercase tracking-widest text-marketplace-bronze">
                  {order.referralCode}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Timeline & Delivery */}
        <div className="md:col-span-5 space-y-gutter">
          {hasStitching && (
            <div className="bg-primary text-on-primary p-8 flex flex-col h-full">
              <h3 className="font-headline-sm text-headline-sm mb-8 text-on-primary border-b border-on-primary/20 pb-4">
                Artisanal Timeline
              </h3>
              <div className="space-y-10 relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-[1px] bg-on-primary/20" />
                {timelineSteps.map((step) => (
                  <div
                    key={step.title}
                    className={`relative flex gap-6 items-start ${step.state === "pending" ? "opacity-40" : ""}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-4 border-primary z-10 ${
                        step.state === "done"
                          ? "bg-tertiary-fixed"
                          : step.state === "active"
                            ? "bg-white animate-pulse"
                            : "bg-white/20"
                      }`}
                    />
                    <div>
                      <p
                        className={`font-label-md text-label-md uppercase ${
                          step.state === "done" ? "text-tertiary-fixed" : "text-white"
                        }`}
                      >
                        {step.status}
                      </p>
                      <h4 className="font-body-lg text-body-lg font-bold">{step.title}</h4>
                      <p className="font-body-md text-body-md text-on-primary/60 mt-1 text-sm">
                        {step.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-surface-container p-8 border border-border-subtle">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">local_shipping</span>
              <h3 className="font-label-md text-label-md uppercase">Destination</h3>
            </div>
            <p className="font-body-md text-body-md font-semibold">
              {order.firstName} {order.lastName}
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
              {order.street}
              <br />
              {order.city}, {order.postalCode}
              <br />
              Pakistan
            </p>
            <div className="mt-6 pt-6 border-t border-border-subtle flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                Method
              </span>
              <span className="font-label-md text-label-md font-bold">
                {order.paymentMethod === "cod" ? "Cash on Delivery" : "Standard Courier"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-20 py-20 border-t border-primary/10 text-center">
        <h3 className="font-headline-sm text-headline-sm mb-6">Need artisanal assistance?</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-10 max-w-xl mx-auto">
          Our concierge is available to discuss measurement adjustments or tailoring specifics
          within the next 12 hours.
        </p>
        <div className="flex justify-center gap-8">
          <Link
            href="/contact"
            className="flex items-center gap-2 font-label-md text-label-md uppercase hover:text-marketplace-bronze transition-colors"
          >
            <span className="material-symbols-outlined text-xl">chat_bubble_outline</span>
            Contact Concierge
          </Link>
          <Link
            href="/tailoring/review"
            className="flex items-center gap-2 font-label-md text-label-md uppercase hover:text-marketplace-bronze transition-colors"
          >
            <span className="material-symbols-outlined text-xl">straighten</span>
            View Measurements
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<LoadingScreen label="Loading your order" />}>
      <OrderConfirmation />
    </Suspense>
  );
}
