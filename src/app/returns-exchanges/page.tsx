"use client";

import { useState } from "react";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { LinkButton } from "@/components/ui/Button";

const steps = [
  {
    n: "01",
    title: "Request Auth",
    body: "Submit your request via our portal and receive a Return Authorization (RA) number.",
  },
  {
    n: "02",
    title: "Pack & Label",
    body: "Place items in original packaging and attach the pre-paid shipping label provided.",
  },
  {
    n: "03",
    title: "Courier Pickup",
    body: "Schedule a pickup or drop off at any authorized FUJRS logistics partner.",
  },
  {
    n: "04",
    title: "Refund Process",
    body: "Once inspected (approx. 5 days), your refund will be processed to the original payment method.",
  },
];

const faqs = [
  {
    q: "Can I exchange an unstitched suit after it has been cut?",
    a: "No, unstitched fabric must be in its original, uncut, and unwashed state to be eligible for return or exchange.",
  },
  {
    q: "Who pays for the return shipping?",
    a: "For all domestic Pakistani orders, FUJRS offers complimentary return shipping. International returns may incur a nominal fee.",
  },
  {
    q: "How long do alterations take for stitched items?",
    a: "Alterations typically take 7-10 business days from the date our workshop receives the garment.",
  },
];

export default function ReturnsExchangesPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [found, setFound] = useState<string | null>(null);

  function handleFindOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber.trim() || !email.trim()) return;
    setFound(
      "Order lookup isn't available yet. Please reach our concierge team directly and they'll pull up your order for you."
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 md:py-32 border-b border-outline-variant overflow-hidden">
        <div className="max-w-container-max mx-auto px-margin-desktop grid grid-cols-1 md:grid-cols-2 gap-gutter items-center">
          <div>
            <span className="font-body text-label-md uppercase tracking-widest text-marketplace-bronze mb-4 block">
              Concierge Services
            </span>
            <h1 className="font-display text-display-lg-mobile md:text-display-lg italic mb-6">
              Returns &amp; Exchanges
            </h1>
            <p className="font-body text-body-lg text-text-muted max-w-lg mb-8">
              Our commitment to your satisfaction is as meticulous as our craftsmanship. We offer a
              seamless return process designed for the modern luxury experience.
            </p>
            <LinkButton href="#portal" variant="primary" className="!px-10 !py-4">
              Start a Return
            </LinkButton>
          </div>
          <div className="relative group hidden md:block">
            <div className="aspect-[4/5] overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgrAA9QE1qKJFdG574fxkuVkv6fTEmKY8VDusOtXq3ASKZwNM9iaV2Bl2iMSK9Y5EYAd6j2GYvavofJEbpu41H1uYwBx_ZYv5viWgaKBTvkyJKeVgUQKpLFafgJgCCmDe80w9zh0yDxHq5Mdh9Dyo4Qf30MmayawzRYnmjd7fqLSCutPW7jhkrGKqFTdd53nQKHM2010VSrkPt7CyTsDohdS8QrciwDsmbm5-fVUDC7hb8HeHs9NnRJ0nvO4BQtI8lJZ0oU36V6WA"
                alt="A woman draped in white silk fabric in a minimalist marble courtyard"
                width={600}
                height={750}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-8 -left-8 bg-surface-container p-8 border border-black max-w-xs">
              <p className="font-body text-label-sm italic text-primary">
                &ldquo;The fit is the final thread of the design. We ensure every piece meets our
                standard of perfection.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Policy Highlights */}
      <section className="py-20 bg-surface">
        <div className="max-w-container-max mx-auto px-margin-desktop">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <div className="md:col-span-2 bg-white p-12 border border-black/5 flex flex-col justify-between min-h-[400px]">
              <div>
                <span className="material-symbols-outlined text-marketplace-bronze text-4xl mb-6 block">
                  calendar_month
                </span>
                <h3 className="font-display text-headline-md mb-4">The 14-Day Guarantee</h3>
                <p className="font-body text-body-md text-text-muted max-w-md">
                  Items must be returned within 14 days of delivery. All garments must be in their
                  original condition, unworn, unwashed, and with all tags intact within original
                  FUJRS packaging.
                </p>
              </div>
              <div className="mt-8 pt-8 border-t border-outline-variant flex justify-between items-center">
                <span className="font-body text-label-sm uppercase tracking-widest text-primary">
                  Standard Policy
                </span>
                <span className="material-symbols-outlined text-primary">arrow_forward</span>
              </div>
            </div>
            <div className="bg-tertiary-container text-white p-12 flex flex-col justify-center">
              <h4 className="font-display text-headline-sm mb-6 text-tertiary-fixed">
                Hassle-Free Pickup
              </h4>
              <p className="font-body text-body-md opacity-80 mb-8">
                We arrange complimentary return shipping for all orders within major metropolitan
                areas. Our courier will collect the parcel from your doorstep at your convenience.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter mt-gutter">
            <div className="border border-black p-12 group hover:bg-black hover:text-white transition-colors duration-500">
              <h4 className="font-display text-headline-sm mb-4">Ready-to-Wear</h4>
              <p className="font-body text-body-md mb-6 opacity-70">
                Fully returnable for a store credit or full refund to the original payment method,
                provided the hygiene seal remains untampered.
              </p>
              <div className="flex items-center gap-2 text-marketplace-bronze font-body">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <span>Full Refund Eligible</span>
              </div>
            </div>
            <div className="border border-outline-variant p-12 bg-surface-container-low">
              <h4 className="font-display text-headline-sm mb-4">Custom Stitched</h4>
              <p className="font-body text-body-md mb-6 text-text-muted">
                Due to the bespoke nature, stitched items are non-returnable. However, they are
                eligible for our &apos;Fit Guarantee&apos; alteration service.
              </p>
              <div className="flex items-center gap-2 text-primary font-body">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  architecture
                </span>
                <span>Complimentary Alterations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Return Portal */}
      <section className="py-32 bg-white" id="portal">
        <div className="max-w-xl mx-auto px-margin-mobile text-center">
          <h2 className="font-display text-headline-md mb-4">Initiate Your Return</h2>
          <p className="font-body text-body-md text-text-muted mb-12">
            Enter your details below to track your order status or request a return authorization.
          </p>
          <form className="space-y-6 text-left" onSubmit={handleFindOrder}>
            <div className="space-y-2">
              <label
                htmlFor="returns-order-number"
                className="font-body text-label-md uppercase tracking-widest text-primary"
              >
                Order Number
              </label>
              <input
                id="returns-order-number"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full border-b border-black py-4 px-0 bg-transparent focus:outline-none focus:border-marketplace-bronze font-body text-body-md transition-colors placeholder:text-outline-variant"
                placeholder="e.g. FJ-123456"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="returns-email"
                className="font-body text-label-md uppercase tracking-widest text-primary"
              >
                Email Address
              </label>
              <input
                id="returns-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-b border-black py-4 px-0 bg-transparent focus:outline-none focus:border-marketplace-bronze font-body text-body-md transition-colors placeholder:text-outline-variant"
                placeholder="email@example.com"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-black text-white py-6 font-body text-label-md uppercase tracking-[0.2em] hover:bg-marketplace-bronze transition-colors duration-300 mt-8"
            >
              Find My Order
            </button>
            {found && <p className="text-label-sm text-marketplace-bronze pt-2">{found}</p>}
          </form>
        </div>
      </section>

      {/* Process */}
      <section className="py-24 border-y border-outline-variant">
        <div className="max-w-container-max mx-auto px-margin-desktop">
          <h2 className="font-display text-headline-md mb-16 text-center italic">The Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {steps.map((step) => (
              <Reveal key={step.n} className="space-y-6">
                <span className="font-display text-headline-sm text-marketplace-bronze/30">
                  {step.n}
                </span>
                <h5 className="font-body text-label-md uppercase tracking-wider">{step.title}</h5>
                <p className="font-body text-body-md text-text-muted">{step.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-32">
        <div className="max-w-3xl mx-auto px-margin-mobile">
          <h3 className="font-display text-headline-md mb-12 text-center">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={faq.q} className="border-b border-outline-variant pb-6">
                <button
                  className="flex justify-between items-center w-full text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <h6 className="font-body text-label-md uppercase tracking-wide">{faq.q}</h6>
                  <span
                    className={`material-symbols-outlined transition-transform ${
                      openFaq === i ? "rotate-45" : ""
                    }`}
                  >
                    add
                  </span>
                </button>
                {openFaq === i && (
                  <p className="font-body text-body-md text-text-muted mt-4">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual CTA */}
      <section className="h-[50vh] relative overflow-hidden flex items-center justify-center">
        <Image
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxQMWAHO_27sXnz6mxACbhevmyyAIiMPmTWV3JEKku2hc-4IXODE5pq5Xy7Ok_wICFx7eg8ljHgk99748oOo9FJgrje5nbpM9rJ0dLXHYOQEjPTYWLqGHio2Nr2IYRAvWjv6zBBJ1h84ChoRHDhm9n3KNrviddvBU_gD4eXKz8SKo8dX6YIYRV6SH02LiHC403TCGGfBkD1Vh7jKt7bmyV6xU88hbHXhBmeRe4IouzbxgH2PuNWaj4rpHNNB4Rt016rgNcTakC7Ao"
          alt="A luxury fashion warehouse with racks of garments organized by color"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center text-white px-margin-mobile">
          <h2 className="font-display text-headline-md md:text-display-lg-mobile italic mb-8">
            Refining Elegance, Every Day
          </h2>
          <a
            href="/contact"
            className="inline-block font-body text-label-md uppercase tracking-widest border border-white px-12 py-5 hover:bg-white hover:text-black transition-all duration-500"
          >
            Contact Specialist
          </a>
        </div>
      </section>
    </div>
  );
}
