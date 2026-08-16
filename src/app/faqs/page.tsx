"use client";

import { useState } from "react";

const faqs = [
  {
    q: "How do I know my size?",
    a: "Check our Size Guide for a full measurement chart. For custom pieces, our Tailoring service takes your exact measurements for a made-to-measure fit.",
  },
  {
    q: "Can I customize a ready-to-wear piece?",
    a: "Yes, most unstitched fabric pieces can be sent through our Atelier for custom stitching. Look for the 'Get It Stitched' option on the product page, or start directly from the Tailoring page.",
  },
  {
    q: "What is your return policy?",
    a: "Ready-to-wear items can be returned within 7 days if unused and in original packaging. Custom-stitched pieces are final sale. See our Returns & Exchanges page for details.",
  },
  {
    q: "How long does shipping take?",
    a: "Standard shipping takes 4–6 business days nationwide. Express shipping (1–2 business days) is available at checkout.",
  },
  {
    q: "Do you ship internationally?",
    a: "We currently ship within Pakistan. International shipping is on our roadmap. Sign up for our newsletter to be notified.",
  },
  {
    q: "How do I book a tailoring appointment?",
    a: "Head to the Tailoring page, submit your measurements and style preferences, then choose a studio, date, and time that works for you.",
  },
];

export default function FAQsPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="container-luxe py-16">
      <p className="label-caps text-gold">Support</p>
      <h1 className="mt-2 font-display text-headline-md">Frequently Asked Questions</h1>

      <div className="mt-10 max-w-2xl divide-y divide-border-subtle border-y border-border-subtle">
        {faqs.map((faq, i) => (
          <div key={faq.q}>
            <button
              className="flex w-full items-center justify-between py-5 text-left"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              <span className="font-display text-headline-sm">{faq.q}</span>
              <span className="material-symbols-outlined shrink-0 text-[20px]">
                {open === i ? "remove" : "add"}
              </span>
            </button>
            {open === i && <p className="pb-5 text-body-md text-text-muted">{faq.a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
