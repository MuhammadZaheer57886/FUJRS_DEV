import Image from "next/image";
import { LinkButton } from "@/components/ui/Button";

/**
 * From `md` up the section takes the photograph's own aspect ratio — 1376×768,
 * which is exactly 43:24 — so `object-cover` has nothing to crop and the whole
 * frame is visible: the model head to foot, and the arches framing her.
 *
 * Any other shape loses something. A section WIDER than 43:24 scales the image
 * to fit the width and trims the top and bottom, which is what was cutting off
 * her head and shoes. A section TALLER than it scales to fit the height and
 * trims the sides, taking the colonnade with it.
 *
 * Below `md` the ratio is abandoned deliberately: a phone is portrait, and a
 * 43:24 band would be a ~220px sliver with the headline on top of it. There the
 * height is fixed and the sides crop instead — which keeps her full height,
 * since she is centred in the frame.
 */
export function HeroSection() {
  return (
    <section className="relative h-[78vh] min-h-[520px] md:h-auto md:max-h-none md:aspect-[43/24] w-full overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 z-0">
        {/* next/image rather than a CSS background: this is the page's LCP
            element, and `priority` emits a preload hint the browser can act on
            before it has even parsed the stylesheet. A background-image cannot
            be preloaded at all. */}
        <Image
          src="/images/home-hero.webp"
          alt="A woman in a midnight-navy velvet suit with gold zardozi embroidery and a matching embroidered dupatta, standing in a Mughal stone colonnade."
          fill
          priority
          sizes="100vw"
          quality={85}
          className="object-cover object-center"
        />
      </div>
      <div className="relative z-10 text-center text-on-primary px-gutter">
        <span className="font-label-md text-label-md tracking-[0.3em] uppercase mb-4 block">
          This Season
        </span>
        <h1 className="font-display-lg text-[80px] md:text-[120px] leading-none mb-8 tracking-tighter">
          FUJRS UNSTITCHED
        </h1>
        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          <LinkButton href="/new-arrivals" variant="primary" className="!px-12 !py-5">
            Shop Collection
          </LinkButton>
          <LinkButton href="/new-arrivals" variant="inverse" className="!px-12 !py-5">
            View Lookbook
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
