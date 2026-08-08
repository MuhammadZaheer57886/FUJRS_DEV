"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CatalogItem } from "@/lib/data";
import { EmptyCatalogue } from "@/components/ui/EmptyCatalogue";
import { Reveal } from "@/components/ui/Reveal";
import { MenProductTile } from "@/components/product/MenProductTile";
import { LinkButton } from "@/components/ui/Button";
import { SlidingUnderline, useSlidingUnderline } from "@/components/ui/SlidingUnderline";

const fabricTabs = ["All Fabrics", "Egyptian Cotton", "Latha", "Karandi", "Wash & Wear"];

const fabricGuide = [
  {
    title: "Long Staple Cotton",
    description: "Ultra-durable fibers that create a smoother, softer surface with every wash.",
  },
  {
    title: "Seasonal Selection",
    description: "From breathable summer Latha to insulating winter Karandi blends.",
  },
  {
    title: "Heritage Weaving",
    description: "Traditional techniques merged with modern finishing for a superior hand-feel.",
  },
];

export function MenCollection({ products }: { products: CatalogItem[] }) {
  const [activeTab, setActiveTab] = useState("All Fabrics");
  const tabIndicator = useSlidingUnderline(activeTab);
  const menProducts = useMemo(() => products.filter((p) => p.gender === "Men"), [products]);

  const filtered = useMemo(() => {
    if (activeTab === "All Fabrics") return menProducts;
    if (activeTab === "Wash & Wear") return menProducts.filter((p) => p.fabric === "Wash & Wear");
    return menProducts.filter((p) => p.fabric.includes(activeTab.split(" ")[0]));
  }, [activeTab, menProducts]);

  return (
    <div>
      {/* Hero — same reasoning as the homepage: from `md` up the section takes
          the photograph's own 43:24 ratio so nothing is cropped and the model
          is visible head to foot. A fixed 700px was wider than that at desktop
          widths, which trimmed the top and bottom off. */}
      <section className="relative h-[600px] md:h-auto md:aspect-[43/24] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* See the note on the homepage hero — this is the LCP element, so
              next/image with priority rather than a CSS background, which the
              browser cannot preload. */}
          <Image
            src="/images/men-hero.webp"
            alt="A man in a cream sherwani and matching trousers walking through a sunlit stone arcade."
            fill
            priority
            sizes="100vw"
            quality={85}
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="relative z-10 max-w-container-max mx-auto px-gutter w-full">
          <div className="max-w-2xl text-white">
            <span className="font-label-md text-label-md uppercase tracking-[0.3em] mb-4 block">
              This Season
            </span>
            <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg mb-8 leading-none italic">
              The Men&apos;s
              <br />
              Atelier
            </h1>
            <p className="font-body-lg text-body-lg mb-10 text-white/90 max-w-md">
              Curated unstitched fabrics from the finest Egyptian Cotton to hand-loomed Karandi.
              Precision craftsmanship meets heritage textures.
            </p>
            <Link
              href="#collection"
              className="inline-block bg-white text-black px-12 py-4 font-label-md text-label-md uppercase tracking-widest hover:bg-tertiary-fixed transition-colors"
            >
              Shop All Fabrics
            </Link>
          </div>
        </div>
      </section>

      {/* Collection & Filters */}
      <section id="collection" className="py-16 md:py-24 max-w-container-max mx-auto px-gutter">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-outline-variant pb-8 mb-16">
          <div
            ref={tabIndicator.containerRef}
            className="relative flex gap-8 overflow-x-auto w-full md:w-auto"
          >
            {fabricTabs.map((tab) => (
              <button
                key={tab}
                ref={tabIndicator.setItemRef(tab)}
                onClick={() => setActiveTab(tab)}
                aria-pressed={activeTab === tab}
                className={`font-label-md text-label-md uppercase tracking-widest pb-2 whitespace-nowrap transition-colors ${
                  activeTab === tab ? "text-primary" : "text-secondary hover:text-primary"
                }`}
              >
                {tab}
              </button>
            ))}
            <SlidingUnderline
              indicator={tabIndicator.indicator}
              animate={tabIndicator.animate}
              className="bottom-0 bg-primary"
            />
          </div>
          <p className="font-label-md text-label-md uppercase text-secondary shrink-0">
            {filtered.length} {filtered.length === 1 ? "Fabric" : "Fabrics"}
          </p>
        </div>

        {menProducts.length === 0 ? (
          // An empty catalogue is not a filter problem — telling someone to
          // change a filter they never set is how a site reads as broken.
          <EmptyCatalogue what="fabrics" />
        ) : filtered.length === 0 ? (
          <p className="text-center py-24 text-secondary font-body-md">
            No fabrics match this filter yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            {filtered.map((product, i) => (
              <MenProductTile
                key={product.id}
                product={product}
                size={i === 0 ? "large" : "small"}
                delay={i * 80}
              />
            ))}
          </div>
        )}
      </section>

      {/* Masterful Tailoring CTA */}
      <section className="bg-surface-container-low py-24">
        <div className="max-w-container-max mx-auto px-gutter grid grid-cols-1 md:grid-cols-2 items-center gap-16">
          <Reveal className="relative">
            <div className="aspect-square bg-surface-variant overflow-hidden">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDAek7JNz0GZPglpROd0rpMNIps2mprJSVabOg6317k7MI91Cl2FqYBQM6B8TPy6JhKhJBmX3CUXm-BeLMYDW1x6FD_AgveY-8XYSM5WBr2V9hoG61tbKpxicBol01YNHcj35xgebaZK3mm-MCIyDfBRdTwShHChVcITgvtRH-eCLTgQko29P6wnt-ZgFOepihjqp2Its3Wq-2seCv267n_zwX5jCzyckbb7xcK3v8aJQydaeHl5jAiUQSwrb4FDjs7fKm9RWluPfs')",
                }}
                role="img"
                aria-label="A master tailor's workspace with a sewing machine and a partially stitched kurta."
              />
            </div>
            <div className="absolute -bottom-8 -right-8 bg-white p-8 border border-outline-variant hidden md:block">
              <p className="font-display-lg text-headline-md italic">
                &ldquo;Precision in every stitch.&rdquo;
              </p>
            </div>
          </Reveal>
          <Reveal delay={150} className="space-y-8">
            <span className="text-on-tertiary-container font-label-md text-label-md uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-8 h-[1px] bg-on-tertiary-container" />
              Bespoke Tailoring
            </span>
            <h2 className="font-display-lg text-headline-md md:text-display-lg leading-tight">
              Masterful Tailoring for the Modern Man
            </h2>
            <p className="text-secondary font-body-lg">
              Elevate your unstitched fabric into a masterpiece. Our in-house masters offer custom
              measurements and traditional hand-finishing for the perfect fit.
            </p>
            <ul className="space-y-4">
              {[
                "Guaranteed Fit or Free Adjustment",
                "Premium Trimmings & Buttons",
                "7-Day Express Delivery",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 font-label-md text-label-md uppercase tracking-widest text-primary"
                >
                  <span className="material-symbols-outlined text-gold">check_circle</span>
                  {item}
                </li>
              ))}
            </ul>
            <LinkButton href="/tailoring" variant="secondary" className="!px-12 !py-4">
              Explore Stitching Options
            </LinkButton>
          </Reveal>
        </div>
      </section>

      {/* Fabric Guide */}
      <section className="py-24 max-w-container-max mx-auto px-gutter">
        <Reveal className="text-center mb-20">
          <h2 className="font-display-lg text-headline-md mb-4 uppercase tracking-tighter">
            The Fabric Guide
          </h2>
          <p className="text-secondary max-w-xl mx-auto">
            Understanding the weight, weave, and origin of our premium fibers.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {fabricGuide.map((item, i) => (
            <Reveal key={item.title} delay={i * 100} className="text-center">
              <h4 className="font-label-md text-label-md font-bold uppercase tracking-widest mb-2">
                {item.title}
              </h4>
              <p className="text-secondary text-sm">{item.description}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
