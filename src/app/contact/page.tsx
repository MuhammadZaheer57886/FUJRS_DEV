"use client";

import { useState } from "react";
import { messages } from "@/lib/data";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only marks the form as sent once the message is actually stored. It used
  // to flip on submit, which showed "Message Sent" for a message that went
  // nowhere — the one thing the coming-soon convention exists to prevent.
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const text = (key: string) => String(form.get(key) ?? "").trim();

    setSending(true);
    setError(null);
    try {
      await messages.sendContact({
        name: text("name"),
        email: text("email"),
        phone: text("phone") || null,
        subject: text("subject") || null,
        message: text("message"),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't send that message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="max-w-container-max mx-auto px-margin-desktop mb-24 pt-16 text-center">
        <span className="font-body text-label-md uppercase tracking-[0.3em] text-marketplace-bronze mb-4 block">
          Connect With Us
        </span>
        <h2 className="font-display text-display-lg mb-8">Elegance in Every Inquiry</h2>
        <p className="max-w-2xl mx-auto font-body text-body-lg text-on-surface-variant leading-relaxed">
          Whether you seek bespoke tailoring, wholesale partnerships, or general assistance, our
          concierge team is dedicated to providing a seamless luxury experience.
        </p>
      </section>

      {/* Main Grid */}
      <section className="max-w-container-max mx-auto px-margin-desktop mb-32 grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <div className="lg:col-span-7 bg-white p-8 md:p-12 border border-black/5">
          <h3 className="font-display text-headline-md mb-12">General Inquiry</h3>
          {sent ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-marketplace-bronze">
                check_circle
              </span>
              <p className="mt-4 font-display text-headline-sm">Message Sent</p>
              <p className="mt-2 font-body text-body-md text-on-surface-variant">
                Our concierge team will respond within 24 hours.
              </p>
            </div>
          ) : (
            <form className="space-y-10" onSubmit={(e) => void handleSubmit(e)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant mb-2 block"
                  >
                    Full Name
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    required
                    className="w-full bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body text-body-md focus:outline-none focus:border-marketplace-bronze transition-colors"
                    placeholder="e.g. Zoya Malik"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant mb-2 block"
                  >
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    required
                    type="email"
                    className="w-full bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body text-body-md focus:outline-none focus:border-marketplace-bronze transition-colors"
                    placeholder="zoya@example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <label
                    htmlFor="contact-subject"
                    className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant mb-2 block"
                  >
                    Subject
                  </label>
                  <select
                    id="contact-subject"
                    name="subject"
                    className="w-full bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body text-body-md focus:outline-none focus:border-marketplace-bronze transition-colors"
                  >
                    <option>Order Status</option>
                    <option>Tailoring Appointment</option>
                    <option>Product Feedback</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="contact-phone"
                    className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant mb-2 block"
                  >
                    Phone Number
                  </label>
                  <input
                    id="contact-phone"
                    name="phone"
                    className="w-full bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body text-body-md focus:outline-none focus:border-marketplace-bronze transition-colors"
                    placeholder="+92 300 1234567"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="contact-message"
                  className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant mb-2 block"
                >
                  Your Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={4}
                  className="w-full bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body text-body-md focus:outline-none focus:border-marketplace-bronze transition-colors resize-none"
                  placeholder="How may we assist you today?"
                />
              </div>
              {error && (
                <p role="alert" className="font-label-sm text-label-sm text-error">
                  {error}
                </p>
              )}
              <Button type="submit" variant="primary" className="w-full !py-5" disabled={sending}>
                {sending ? "Sending…" : "Send Message"}
              </Button>
            </form>
          )}
        </div>

        <div className="lg:col-span-5 space-y-gutter">
          <div className="bg-surface-container-lowest p-10 border border-outline-variant/30">
            <h3 className="font-display text-headline-sm mb-6">Our Flagship Studio</h3>
            <div className="space-y-6 font-body text-body-md text-on-surface-variant">
              <div className="flex gap-4">
                <span className="material-symbols-outlined text-marketplace-bronze">
                  location_on
                </span>
                <p>
                  Suite 302, Park Towers, Clifton Block 5,
                  <br />
                  Karachi, Pakistan
                </p>
              </div>
              <div className="flex gap-4">
                <span className="material-symbols-outlined text-marketplace-bronze">call</span>
                <p>+92 21 3583 2525</p>
              </div>
              <div className="flex gap-4">
                <span className="material-symbols-outlined text-marketplace-bronze">mail</span>
                <p>care@fujrs.com</p>
              </div>
            </div>
          </div>

          <div className="aspect-square w-full bg-surface-container-high relative group overflow-hidden">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFZSrzPbAYvVgsX3UP3htJaRsb5SqEAbRIikqQGC7bEQuD72WRNQchpx5VEX4muy3N4Je0iBXSN1bCbSWIO73xyRjApzmochMgpyX7EsgTV8ZMwsdM-g5ztN7QjY0ZtNBY2ySPZ-pBTZ-tB6g_HY7wQ5mB2A1_tX0xukoaaV70qAcfOWMnQhq8N3Dk5BVLXuIxTJMPOMwlw7vjHxHvqIfpuzTM71IOKSMiYfhHnfc9sceOrVLoZc6KMapVXPMT4RzxMQpeZNMN2V4"
              alt="Map of Karachi's Clifton area, marking the FUJRS flagship store"
              fill
              className="object-cover grayscale brightness-105 group-hover:grayscale-0 transition-all duration-700"
            />
          </div>
        </div>
      </section>

      {/* Secondary Inquiries */}
      <section className="bg-surface-container-low py-24">
        <div className="max-w-container-max mx-auto px-margin-desktop grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="space-y-6">
            <h4 className="font-display text-headline-md">Wholesale Inquiries</h4>
            <p className="font-body text-body-md text-on-surface-variant leading-relaxed">
              Partner with us to bring FUJRS&apos;s signature elegance to your retail space. We
              offer exclusive collections and curated fabric bundles for global stockists.
            </p>
            <a
              href="mailto:wholesale@fujrs.com"
              className="inline-flex items-center gap-2 font-body text-label-md text-marketplace-bronze uppercase tracking-widest group"
            >
              wholesale@fujrs.com
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </a>
          </div>
          <div className="space-y-6">
            <h4 className="font-display text-headline-md">Press &amp; Media</h4>
            <p className="font-body text-body-md text-on-surface-variant leading-relaxed">
              For lookbooks, high-resolution campaign imagery, and interview requests regarding our
              latest collections or craft initiatives.
            </p>
            <a
              href="mailto:press@fujrs.com"
              className="inline-flex items-center gap-2 font-body text-label-md text-marketplace-bronze uppercase tracking-widest group"
            >
              press@fujrs.com
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Atmospheric Image */}
      <section className="h-[50vh] relative overflow-hidden">
        <Image
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAV6KFFrjrm4NemDSKzju-SN8TCgXOId0TuP8VpXq1p1R9FXpS-Wl36ORB-u8OOQYB3l-JhYbkTQxabrSYVlDuhYzDZjOU5aX8Lok00diEbt_fUfwZysqxQ_DyRL6izwUOVAsJBlfg7hs5XkHiBeVeQBgWICt-8umBeRdDt72um9fPpozTj0KY3UJ9Rfs2wS2KWIBfDIam_lwT6Iu18cy8Kv2Ifjb0L2U8Dps2Wrd6L_kVeQOmq7Jv-w0OOQizpy_ShsU7kx1gDo_M"
          alt="A sun-drenched FUJRS atelier with rolls of silk and unstitched fabric"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-primary/20" />
      </section>
    </div>
  );
}
