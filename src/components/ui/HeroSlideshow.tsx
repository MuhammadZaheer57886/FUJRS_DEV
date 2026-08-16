"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export type HeroSlide = {
  src: string;
  alt: string;
};

/** How long each photograph holds before the track moves on. */
const SLIDE_DURATION_MS = 6000;

/**
 * The sliding, auto-advancing photography behind a hero.
 *
 * All the slides sit on one flex track that is translated by whole multiples
 * of its own width, so the movement is a single GPU-composited transform
 * rather than anything that touches layout. The easing is a long
 * decelerating curve — the photograph arrives and settles rather than
 * stopping dead, which is what separates this from a stock carousel.
 *
 * The track walks back through the slides when it wraps from the last to the
 * first. With a short set that reads as a deliberate return; cloning slides to
 * fake an infinite loop costs more than it buys here.
 */
export function HeroSlideshow({
  slides,
  intervalMs = SLIDE_DURATION_MS,
}: {
  slides: HeroSlide[];
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    // One photograph is not a slideshow. And a visitor who has asked their OS
    // to reduce motion should not get a page that moves under them without
    // being touched — they keep whichever frame they chose.
    if (slides.length < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, intervalMs);

    return () => clearInterval(timer);
    // `index` is a dependency so that choosing a dot restarts the clock: a
    // slide picked by hand should get its full time on screen, not the
    // remainder of the previous one's.
  }, [slides.length, intervalMs, paused, index]);

  return (
    <div
      // Deliberately no `z-0` here: a z-index on this wrapper would open a
      // stacking context and seal the dots inside it, painting them behind
      // the hero copy (z-10) and putting them out of reach of the cursor.
      // Without one, the wrapper still sits underneath by document order.
      className="absolute inset-0 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex h-full w-full transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div key={slide.src} className="relative h-full w-full flex-none">
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              // Only the opening frame is the LCP element. Marking the rest
              // priority too would spend the visitor's first bytes racing to
              // fetch a photograph that is still six seconds from view.
              priority={i === 0}
              sizes="100vw"
              quality={85}
              // The off-screen frames are hidden from assistive tech so their
              // alt text is not read out alongside the one actually on screen.
              aria-hidden={i === index ? undefined : true}
              className="object-cover object-center"
            />
          </div>
        ))}
      </div>

      <div className="absolute inset-0 bg-black/20" />

      {slides.length > 1 && (
        <div className="absolute bottom-6 md:bottom-10 left-0 right-0 z-20 flex justify-center">
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1} of ${slides.length}`}
              aria-current={i === index}
              // The dot itself is a 6px detail; the padding is what makes the
              // control big enough to actually hit on a phone.
              className="group px-2 py-4 cursor-pointer"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-500 ease-out ${
                  i === index ? "w-10 bg-white" : "w-1.5 bg-white/50 group-hover:bg-white/90"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
