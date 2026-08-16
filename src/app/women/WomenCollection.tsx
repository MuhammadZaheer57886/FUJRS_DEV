"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CatalogItem } from "@/lib/data";
import { EmptyCatalogue } from "@/components/ui/EmptyCatalogue";
import { Reveal } from "@/components/ui/Reveal";
import { WomenProductTile } from "@/components/product/WomenProductTile";
import { LinkButton } from "@/components/ui/Button";

const fabricTabs = ["Lawn", "Chiffon", "Silk", "Net"];

const shopByFabric = [
  {
    title: "Summer Lawn '24",
    span: "col-span-2 row-span-2",
    label: "Discover Lawn",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBiOZ4Rg6G3HuLNJwIO4S2KveednHaSqu1765ar-4jRCU0ZGNP-4SpHLyjQy3OxIb9RNUQXoxgvordfp8nywrtP9kJE624PLapcaWxjlNZg57Wn2J7fFlTiyWTn8JSKJEhLmJG4O6V6CqigolUnfpNublXSNqnPoQf9azCHUPodd38Gjv2lYpt4aqVoXnbWChmsZRp8vgjymy11y7AjlHytYypg6EweETFgr68f2oJxAoi9nHdMi9dr2KLXCa5nmtQ2WKu2nAHypsg",
  },
  {
    title: "",
    span: "col-span-1 row-span-1",
    label: null,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAeGCtgAgu5JTKvQn6ztCDX_c6ZrduFMk7CIs-5Fd_7VDIX5G8HZn56CsHlhxkK6Uly5JGrfVYlriTTvnqHjkmVzZ_BS0i2N1x_SRN3RllcPq6n6aJiATdw1xben1XqLo6hycKR-wq9oXvBhIZQGOXJj_b7asRf67CbEoONwr9aJI1DNMyJ9S6lU4iVwXfRWiSFI4A3QzVUw1Mh8YEZKI4HFP0_UknlyR-eT8soKHd21p4Cta8pDqESuojQVk7Vmy8oZir4HTcB-0o",
  },
  {
    title: "",
    span: "col-span-1 row-span-1",
    label: null,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCSMrozl-s7Ou65z9018_BSbkStpNR8mUN635-_uzcwfc-68TwHrsRN2KhraFhek4Sc4L5O4bA9kBKOuThOuy-l7LABEkshxgwleDaKybSjoqIwFv4QKAXLIlgqraSRPEyxUFnocxgs_bzTu983_NWPKU6dlQSv8hfk6KmsdYwchYeO5WY-EugrbGBnxgLPKx9eordJALMVGfbx0MSB609BakuLQk5o2mZGCGJywj_4HblCNN1OytujpXvtnySbGLGNfApsYWW200U",
  },
  {
    title: "Pure Silks Collection",
    span: "col-span-2 row-span-1",
    label: "Pure Silks Collection",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBxDuKpiSWClVgeRI5tSCMLbEKUFSkPmFCHT8g3HoL683b0pWLx20ywL-lGBuAtPXmBex19VUWnkefM8ZPG-TkH9DP-q3GVv7-4WFb6oqrRXc4UJKeyKztG6qU19ZSDYVZIorTnGX8LEggb1vZUyiNUkBYF5lBWFhHcEAKLbNNJc9X-zq-iVcBhW54gdIfCGUIUGD0Utroo7YpfmC9Y1mPkKFsR4ZqzSG5bWP54Bk_6ne5i-3radOdPx6amt6eTFucU8lz3FfEciVA",
  },
];

export function WomenCollection({ products }: { products: CatalogItem[] }) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const womenProducts = useMemo(() => products.filter((p) => p.gender === "Women"), [products]);

  const filtered = useMemo(() => {
    if (!activeTab) return womenProducts;
    return womenProducts.filter((p) => p.fabric === activeTab);
  }, [activeTab, womenProducts]);

  const quickAddLabels = [
    "Quick Add to Bag",
    "Select Size",
    "Quick Add",
    "View Details",
    "Add to Bag",
  ];

  return (
    <div>
      {/* Hero: from `md` up the section takes the photograph's own 16:9 ratio,
          so `object-cover` has nothing to crop and the whole frame is visible,
          the model and the colonnade included. Below `md` the ratio is dropped:
          a 16:9 band on a phone is a ~220px sliver with the headline on top of
          it, so the height is fixed and the sides crop instead, anchored right
          to keep her in frame. */}
      <section className="relative w-full h-[600px] md:h-auto md:aspect-[16/9] bg-surface-container overflow-hidden group">
        <Image
          src="/images/women-hero.webp"
          alt="A woman in a pastel green embroidered lawn suit with a matching net dupatta, standing in a sunlit white marble colonnade."
          fill
          priority
          sizes="100vw"
          quality={85}
          className="object-cover object-right md:object-center transition-transform duration-1000 group-hover:scale-105"
        />
        {/* Heavier on the left on a phone, where the copy sits over the
            photograph rather than beside it. */}
        <div className="absolute inset-0 bg-gradient-to-r from-surface/75 via-surface/30 to-transparent md:from-surface/50 md:via-surface/10" />
        <div className="relative h-full max-w-container-max mx-auto px-gutter flex flex-col justify-center items-start">
          <div className="max-w-xl">
            <span className="font-label-md text-label-md uppercase tracking-[0.2em] text-primary mb-4 block">
              This Season
            </span>
            <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-8">
              The Jardin
              <br />
              Edit
            </h1>
            <p className="font-body-lg text-body-lg text-secondary mb-10 max-w-md">
              Discover our signature unstitched collection featuring hand-worked embroideries on
              premium Swiss Lawn and Pure Silk.
            </p>
            <div className="flex gap-4">
              <LinkButton href="#collection" variant="primary" className="!px-10 !py-5">
                Shop Collection
              </LinkButton>
              <LinkButton href="/new-arrivals" variant="secondary" className="!px-10 !py-5">
                Explore Lookbook
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section
        id="collection"
        className="sticky top-20 z-40 bg-surface/95 border-b border-outline-variant backdrop-blur-md"
      >
        <div className="max-w-container-max mx-auto px-gutter py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-8 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
            <button
              onClick={() => setActiveTab(null)}
              className={`flex items-center space-x-2 font-label-md text-label-md uppercase tracking-widest shrink-0 ${
                activeTab === null ? "text-primary" : "text-secondary"
              }`}
            >
              <span className="material-symbols-outlined text-xl">tune</span>
              <span>All Filters</span>
            </button>
            <div className="h-4 w-[1px] bg-outline-variant hidden md:block" />
            {fabricTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`font-label-md text-label-md uppercase tracking-widest whitespace-nowrap transition-colors ${
                  activeTab === tab ? "text-primary" : "text-secondary hover:text-primary"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
            <span className="font-label-md text-label-md uppercase text-secondary">
              {filtered.length} Items
            </span>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="max-w-container-max mx-auto px-gutter py-margin-desktop">
        {womenProducts.length === 0 ? (
          // An empty catalogue is not a filter problem — telling someone to
          // change a filter they never set is how a site reads as broken.
          <EmptyCatalogue what="pieces" />
        ) : filtered.length === 0 ? (
          <p className="text-center py-24 text-secondary font-body-md">
            No pieces match this filter yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            {filtered.map((product, i) => (
              <WomenProductTile
                key={product.id}
                product={product}
                span={i === 0 ? "large" : "normal"}
                offset={i > 1}
                quickAddLabel={quickAddLabels[i % quickAddLabels.length]}
                delay={i * 80}
              />
            ))}
          </div>
        )}
      </section>

      {/* Bespoke Stitching CTA */}
      <section className="bg-primary text-on-primary py-24 my-margin-desktop overflow-hidden">
        <div className="max-w-container-max mx-auto px-gutter grid md:grid-cols-2 items-center gap-16">
          <Reveal>
            <span className="font-label-md text-label-md uppercase tracking-[0.3em] text-tertiary-fixed-dim mb-6 block">
              The Atelier Experience
            </span>
            <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg mb-8">
              Bespoke Stitching
              <br />
              for Every Suite
            </h2>
            <p className="font-body-lg text-secondary-fixed mb-10 opacity-80">
              Our master tailors ensure your luxury unstitched fabrics are crafted into the perfect
              silhouette. Choose from signature FUJRS patterns or provide your custom measurements.
            </p>
            <div className="space-y-6 mb-12">
              {[
                { icon: "architecture", label: "Custom Measurement Profiles" },
                { icon: "check_circle", label: "Premium Embellishment Add-ons" },
                { icon: "schedule", label: "14-Day Delivery Guarantee" },
              ].map((item) => (
                <div key={item.label} className="flex items-center space-x-4">
                  <span className="material-symbols-outlined text-tertiary-fixed-dim">
                    {item.icon}
                  </span>
                  <span className="font-label-md text-label-md uppercase tracking-widest">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/tailoring"
              className="inline-block bg-tertiary-fixed-dim text-primary px-12 py-6 font-label-md text-label-md uppercase tracking-widest hover:bg-on-tertiary-fixed-variant hover:text-on-tertiary transition-all"
            >
              Book Stitching Service
            </Link>
          </Reveal>
          <Reveal delay={150} className="relative">
            <div className="aspect-[3/4] bg-surface-container-highest overflow-hidden">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAg8djhn8f2UBGdN-96AdqKY47lecmNluJ6ji2lCctup0nKqhPJJXRzFpa5zG_KOSjN3i0sz5FHtVLRSRrhJvwaqHvZImsGEkHPqOeHuB1GocCb6Mw5fPaez0HQkHw-khUO5kvl9kiXH1LTD64Y1BdJUo79Z8oNgdhow2Bhbv1VhkwnGsj4bcxqtTjDS3pKdYrQldadQZLkUmFLbCUraZeJFGE9C_SGE5HTVJX4IGvSgsODloxHiUeWH6ICPtH8UaFhUqzyNodcgPk')",
                }}
                role="img"
                aria-label="A tailor's hands precisely cutting embroidered fabric with large shears."
              />
            </div>
            <div className="absolute -bottom-8 -left-8 bg-surface p-10 hidden md:block">
              <p className="font-display-lg text-headline-md text-primary italic">
                &ldquo;Crafting perfection in every stitch.&rdquo;
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Shop by Fabric */}
      <section className="max-w-container-max mx-auto px-gutter pb-margin-desktop">
        <Reveal>
          <h2 className="font-display-lg text-headline-md text-primary mb-12 uppercase tracking-tighter">
            Shop by Fabric
          </h2>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-gutter h-[600px]">
          {shopByFabric.map((tile, i) => (
            <Reveal
              key={i}
              delay={i * 80}
              className={`${tile.span} relative group overflow-hidden cursor-pointer`}
            >
              <div
                className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url('${tile.image}')` }}
              />
              {tile.label && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="border border-white text-white px-8 py-4 font-label-md text-label-md uppercase tracking-widest">
                    {tile.label}
                  </span>
                </div>
              )}
              {tile.title && (
                <div className="absolute bottom-6 left-6 text-white">
                  <p className="font-headline-sm text-headline-sm">{tile.title}</p>
                </div>
              )}
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
