import { notFound } from "next/navigation";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { getStitcherBySlug, stitchers } from "@/data/stitchers";
import { LinkButton } from "@/components/ui/Button";
import type { Metadata } from "next";
import { siteOrigin } from "@/lib/seo";

export function generateStaticParams() {
  return stitchers.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const stitcher = getStitcherBySlug((await params).slug);
  if (!stitcher) return {};

  return {
    title: `${stitcher.name}, FUJRS Master Tailor`,
    description: stitcher.bio,
    alternates: siteOrigin
      ? { canonical: `/tailoring/stitchers/${stitcher.slug}` }
      : undefined,
  };
}

const spanClass: Record<string, string> = {
  large: "md:col-span-8",
  medium: "md:col-span-4",
  wide: "md:col-span-8 aspect-[16/9]",
  square: "md:col-span-4 aspect-[1/1]",
};

export default async function StitcherProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const stitcher = getStitcherBySlug(resolvedParams.slug);
  if (!stitcher) notFound();

  const hasFullProfile = !!stitcher.portfolio;

  return (
    <main>
      {/* Hero */}
      <section className="relative bg-surface-bright py-20 lg:py-32 overflow-hidden">
        <div className="max-w-container-max mx-auto px-margin-desktop grid grid-cols-1 lg:grid-cols-12 gap-gutter relative z-10">
          <div className="lg:col-span-5 space-y-8 self-center">
            <div className="inline-flex items-center gap-3 py-2 px-4 border border-marketplace-bronze/30 bg-marketplace-bronze/5">
              <span
                className="material-symbols-outlined text-marketplace-bronze"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
              <span className="font-label-sm text-label-sm text-marketplace-bronze uppercase tracking-widest">
                FUJRS Master Tailor
              </span>
            </div>
            <div>
              <h1 className="font-display-lg text-display-lg leading-none mb-4">{stitcher.name}</h1>
              <p className="font-headline-sm text-headline-sm text-text-muted italic">
                {stitcher.workshopNote ? stitcher.workshopNote.split(". ")[0] : stitcher.specialty}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 border-y border-black/10 py-8">
              <div>
                <p className="font-label-sm text-label-sm uppercase text-text-muted mb-1">
                  Experience
                </p>
                <p className="font-headline-sm text-headline-sm">
                  {stitcher.experience ?? "Master Level"}
                </p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm uppercase text-text-muted mb-1">
                  Expertise
                </p>
                <p className="font-headline-sm text-headline-sm">{stitcher.specialty}</p>
              </div>
            </div>
            <div className="space-y-6">
              <p className="text-body-lg font-body-lg text-on-surface-variant max-w-md">
                {stitcher.workshopNote ?? stitcher.bio}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <LinkButton href="/tailoring/configure" variant="primary" className="!py-5 !px-10">
                  Start Stitching Project
                </LinkButton>
                <LinkButton href="/contact" variant="secondary" className="!py-5 !px-10">
                  Message Artisan
                </LinkButton>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7 flex justify-end items-center mt-12 lg:mt-0">
            <div className="relative w-full aspect-[4/5] max-w-[500px]">
              <div className="absolute inset-0 border border-marketplace-bronze translate-x-4 translate-y-4" />
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url('${stitcher.image}')` }}
                role="img"
                aria-label={`Portrait of ${stitcher.name}`}
              />
              {stitcher.location && (
                <div className="absolute bottom-12 -left-12 bg-white p-8 border border-black max-w-xs hidden md:block">
                  <p className="font-label-sm text-label-sm uppercase tracking-widest text-marketplace-bronze mb-2">
                    Location
                  </p>
                  <p className="font-headline-sm text-headline-sm leading-tight">
                    {stitcher.location}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {hasFullProfile ? (
        <>
          {/* Portfolio */}
          <section className="py-24 bg-white">
            <div className="max-w-container-max mx-auto px-margin-desktop">
              <div className="flex justify-between items-end mb-16">
                <div>
                  <p className="font-label-md text-label-md uppercase text-marketplace-bronze tracking-[0.3em] mb-4">
                    Portfolio
                  </p>
                  <h2 className="font-display-lg text-display-lg leading-none">
                    The Artisan&apos;s Archive
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
                {stitcher.portfolio!.map((item) => (
                  <div
                    key={item.title}
                    className={`${spanClass[item.span]} group cursor-pointer overflow-hidden`}
                  >
                    <div
                      className={`relative overflow-hidden mb-6 ${item.span === "wide" || item.span === "square" ? "" : "aspect-[4/5]"}`}
                    >
                      <div
                        className={`w-full ${item.span === "wide" ? "aspect-[16/9]" : item.span === "square" ? "aspect-[1/1]" : "aspect-[4/5]"} bg-cover bg-center transition-transform duration-700 group-hover:scale-105`}
                        style={{ backgroundImage: `url('${item.image}')` }}
                      />
                      <div className="absolute bottom-0 left-0 w-full bg-black/80 text-white p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                        <p className="font-label-sm text-label-sm uppercase tracking-widest">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm">{item.title}</h3>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Philosophy & Testimonials */}
          <section className="py-24 bg-surface-container-low border-y border-black/5">
            <div className="max-w-container-max mx-auto px-margin-desktop grid grid-cols-1 lg:grid-cols-2 gap-24">
              <Reveal>
                <h2 className="font-display-lg text-display-lg-mobile lg:text-display-lg mb-12">
                  The Stitching Philosophy
                </h2>
                <div className="space-y-12">
                  {stitcher.philosophy!.map((item, i) => (
                    <div key={item.title} className="flex gap-6">
                      <span className="font-headline-md text-headline-md text-marketplace-bronze/40 italic">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h4 className="font-headline-sm text-headline-sm mb-2">{item.title}</h4>
                        <p className="text-on-surface-variant leading-relaxed">{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
              <Reveal
                delay={150}
                className="relative bg-white border border-black p-12 lg:p-20 self-start"
              >
                <h4 className="font-headline-md text-headline-md mb-8">Client Testimonials</h4>
                <div className="space-y-12">
                  {stitcher.testimonials!.map((t, i) => (
                    <blockquote
                      key={t.author}
                      className={i > 0 ? "relative pt-12 border-t border-black/5" : "relative"}
                    >
                      <p className="font-body-lg italic text-on-surface mb-4">
                        &ldquo;{t.quote}&rdquo;
                      </p>
                      <cite className="font-label-md text-label-md uppercase tracking-widest text-marketplace-bronze not-italic">
                        {t.author}
                      </cite>
                    </blockquote>
                  ))}
                </div>
              </Reveal>
            </div>
          </section>
        </>
      ) : (
        <section className="py-24 max-w-container-max mx-auto px-margin-desktop">
          <Reveal className="max-w-2xl">
            <h2 className="font-headline-md text-headline-md mb-6">About {stitcher.name}</h2>
            <p className="text-on-surface-variant leading-relaxed text-body-lg">{stitcher.bio}</p>
          </Reveal>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-32 bg-primary text-white text-center relative overflow-hidden">
        <div className="max-w-2xl mx-auto px-margin-mobile relative z-10">
          <p className="font-label-md text-label-md uppercase tracking-[0.4em] text-tertiary-fixed-dim mb-6">
            Commission a Piece
          </p>
          <h2 className="font-display-lg text-display-lg-mobile lg:text-display-lg mb-10">
            Begin Your Bespoke Journey
          </h2>
          <p className="text-body-lg font-body-lg opacity-80 mb-12">
            Limited monthly slots available for custom bridal and formal projects. Secure your
            consultation today.
          </p>
          <Link
            href="/tailoring/configure"
            className="inline-block bg-white text-black font-label-md text-label-md uppercase py-6 px-16 tracking-[0.2em] hover:bg-marketplace-bronze hover:text-white transition-all duration-500"
          >
            Start Stitching Project
          </Link>
        </div>
      </section>
    </main>
  );
}
