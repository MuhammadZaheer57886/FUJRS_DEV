"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTailoring } from "@/components/tailoring/TailoringContext";
import { MEASUREMENT_FIELDS, isMeasurementSetComplete } from "@/lib/measurements";
import { useCart } from "@/components/cart/CartContext";
import { getStitcherBySlug, stitchers } from "@/data/stitchers";
import { Button } from "@/components/ui/Button";

const styleImages: Record<string, string> = {
  Mandarin:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCRJvqVU-5S_gwtK4RvdllUPEdgU9qvcrq9W31HUkOep_ahB2iIWolJD8AVRxKWJw-WNH-kqEro0gUFsgwKMj-q8AOoIAQe7-Q07L3wnUqWgs6ZPFEaLkQnYKvQCM-nEUP8J70OE4MP2sJELJGM8Vi7yuH_MZqGiVix9T_xs79ntfKSGPT_WW7Fzxdtc26DZgFAXwLxlrg_qr7-xz76l8PmA3wngbqxfbZcAxRDnBdp22kcrqimyIb7ArBLJvkVS0Ei9BfB0NymhlY",
  "Full Length":
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAFrvQu0WlEOjYHG9evoG4-B20y4tjGU3L2rD6sm8c958Fb9TFOw1rpqzR5E-bWXfYwkJkVjXgthGs5wvDNZJmR0Y6IlpUf-Dz9IMQ6JWywPd5A40X1u8OosNvbPgxjDrvSqI1VLvzJ1G4jG95yljahuH2yM0ToLkesoGnC1zCvrVB23ycVRykXaDDCKI8Cmh_8HnQjm01s19rIMrENVkLoNT20PyAo6mxkJvO2lFT74HeK-VC4xagDurtEz0J7YvGTOYLA-i4AbXQ",
  "Scalloped Edge":
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBbp5JuXPsg2gSbWrztBSx9gFcpuLrrKO-keV6xXzrydYeuJiR-K3xdxqTT6GcQwmGSXxZtam4lX5WqLjqqrilZ_KCsfUjwZSX9IdNs-vmwWhjSmtIQw5SNUKmuoGEbEMSlwgx5b1-SMMpWPY7dwgzn9ZUo54QYhwk9dHBy7rI6fkFeBlb6qlfW2bmwh03Uyj6HJ05E5oWdfAo0KuiqNQJE_2jQN1nh-C0k1tmMioEZY0-gcfWJ2W2KtUO-j7hHkZt6PsRMojALLnU",
};

export default function ReviewPage() {
  const router = useRouter();
  const { config, total, mounted } = useTailoring();
  const { addCustomItem } = useCart();
  const [placed, setPlaced] = useState(false);

  const stitcher = getStitcherBySlug(config.stitcherSlug) ?? stitchers[stitchers.length - 1];

  useEffect(() => {
    if (!mounted) return;
    if (!isMeasurementSetComplete(config.measurements)) router.replace("/tailoring/configure");
  }, [mounted, config, router]);

  if (!mounted) return null;

  function handleProceed() {
    addCustomItem({
      id: `bespoke-${Date.now()}`,
      slug: "bespoke-stitching-project",
      title: `Bespoke ${config.garmentType}: ${config.neckline}, ${config.sleeve}`,
      image: styleImages[config.neckline] ?? styleImages.Mandarin,
      price: total,
      stitching: { label: `${config.neckline}, ${config.sleeve}, ${config.hemline}`, addOn: 0 },
      stitcherSlug: config.stitcherSlug,
    });
    setPlaced(true);
    setTimeout(() => router.push("/cart"), 900);
  }

  return (
    <main className="pt-12 pb-24 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
      <header className="mb-16">
        <p className="text-label-sm uppercase tracking-widest text-secondary mb-4">
          Bespoke Tailoring Journey
        </p>
        <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary">
          Review Your Bespoke Specifications
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left: Artisan & Style */}
        <div className="lg:col-span-7 space-y-12">
          <section className="bg-white p-8 md:p-12 border border-black/5">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="w-32 h-32 flex-shrink-0 rounded-full overflow-hidden">
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url('${stitcher.image}')` }}
                />
              </div>
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <span className="bg-marketplace-bronze text-white text-[10px] px-2 py-1 uppercase tracking-tighter">
                    Master Tailor
                  </span>
                  <span className="text-label-sm text-secondary uppercase tracking-widest">
                    Atelier Select
                  </span>
                </div>
                <h2 className="font-headline-md text-primary mb-1">{stitcher.name}</h2>
                <p className="text-secondary italic font-body-md">
                  The FUJRS Atelier{" "}
                  {stitcher.experience && `• ${stitcher.experience} of Craftsmanship`}
                </p>
                <p className="text-on-surface-variant text-label-sm mt-4 max-w-md">
                  {stitcher.bio}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-headline-sm text-primary mb-8 uppercase tracking-widest border-b border-black/10 pb-4">
              Style Architecture
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: "Neckline", value: config.neckline },
                { label: "Sleeve Artistry", value: config.sleeve },
                { label: "Hemline Finish", value: config.hemline },
              ].map((item) => (
                <div key={item.label} className="space-y-4">
                  <p className="text-label-sm text-secondary uppercase tracking-widest">
                    {item.label}
                  </p>
                  <div className="relative">
                    <div
                      className="w-full aspect-[4/5] object-cover bg-surface bg-cover bg-center"
                      style={{
                        backgroundImage: `url('${styleImages[item.value] ?? styleImages.Mandarin}')`,
                      }}
                    />
                    <div className="mt-4">
                      <h4 className="font-label-md text-primary uppercase">{item.value}</h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right: Measurements & CTAs */}
        <aside className="lg:col-span-5 space-y-8 lg:sticky lg:top-32">
          <div className="bg-surface p-8 md:p-10 border border-black/5">
            <h3 className="font-headline-sm text-primary mb-8 uppercase tracking-widest border-b border-black/10 pb-4 flex justify-between items-center">
              Measurements
              <span className="text-label-sm text-secondary lowercase font-normal">(inches)</span>
            </h3>
            <div className="grid grid-cols-2 gap-y-6 gap-x-12">
              {MEASUREMENT_FIELDS.map((field) => (
                <div
                  key={field}
                  className="flex justify-between items-end border-b border-black/5 pb-2"
                >
                  <span className="text-label-sm text-secondary uppercase">{field}</span>
                  <span className="font-label-md text-primary">
                    {config.measurements[field] ?? "-"}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-white p-6 border-l-4 border-primary">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-primary">schedule</span>
                <div>
                  <h4 className="font-label-md text-primary uppercase mb-1">Stitching Timeline</h4>
                  <p className="text-body-md text-primary font-bold">
                    Estimated Completion: 14-21 Business Days
                  </p>
                  <p className="text-label-sm text-secondary mt-1 italic">
                    Includes master artisan review, pattern drafting, hand-stitching, and final
                    quality audit.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center border-t border-black/10 pt-6">
              <span className="font-label-sm text-text-muted uppercase">Configuration Total</span>
              <span className="font-headline-sm text-2xl text-primary">
                PKR {total.toLocaleString()}
              </span>
            </div>

            <div className="mt-8 space-y-4">
              <Button
                onClick={handleProceed}
                disabled={placed}
                variant="primary"
                className="w-full !py-5 !px-8"
              >
                {placed ? "Added to Bag…" : "Proceed to Shopping Bag"}
              </Button>
              <Link
                href="/tailoring/configure"
                className="block text-center text-label-sm uppercase tracking-widest text-secondary hover:text-primary transition-colors py-2"
              >
                Edit Specifications
              </Link>
            </div>
          </div>

          <div className="p-8 border border-black/10 flex items-center gap-6">
            <div className="bg-marketplace-bronze/10 p-3">
              <span className="material-symbols-outlined text-marketplace-bronze">
                verified_user
              </span>
            </div>
            <div>
              <h4 className="font-label-md text-primary uppercase">The Perfect Fit Guarantee</h4>
              <p className="text-label-sm text-secondary">
                Our artisans review every measurement. If we spot an anomaly, we&apos;ll reach out
                for a re-verification before cutting the fabric.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
