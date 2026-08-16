import { Reveal } from "@/components/ui/Reveal";
import { LinkButton } from "@/components/ui/Button";

const craftsmanship = [
  {
    title: "Zardozi Hand-Work",
    body: "The ancient art of metal embroidery, where gold and silver threads are woven into intricate floral motifs on velvet and silk.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDU_SkkDBGAU5ACFbT7Cy3xyWk0BrT7pT9UC_Qo8nauc5LW9Xwm5lkiMFuLhvsKkZxF-6BLQvitbKRKDc07e4TS8l8b6bNTWgHMP0-DhFkLHVCdTPc3e6Ns9pJ3RCKMnl89yT6pm7WtMSx-inEiYylYu_4JHvSL9ZVKgZHU0SwxCCYvHOuAPxPVmGEGyh0CQOW_Ss4wfOVbFa4BmikLg_sA0mAkJ1eFzr82dtZk9l1xG5tPcgyeGfsHF0oOy7k_eHZxo6-FCqp8vlA",
    delay: 0,
    offset: false,
  },
  {
    title: "Natural Indigo Dyeing",
    body: "Small-batch dyeing using organic pigments extracted from the earth, ensuring every meter of fabric has a unique, living soul.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB4XqgWIcND1NXWVF3xdHcVczPFu9Dyre8TeQn_jBp-uxC4HPdrwtHAVGVk6LYOJO33MWyzFs0U-3qfeZt7qeXi4_GwS3RviJIbeoQzd4pyGvghluKK3lw9Ah0kmYdLo3A0dJPubSxyceRjsGEeHppBYPjea9eg7qSIZ9OIFb1K_CKEkRB7_P7dvqtQd9VBHwdrtlzP8pe_H8EXuYKNtL9sPI7qkedt1qpppg-lp5t8K9Erq9leZmrCow4jVaPp8rvNGXvKkG9wRIg",
    delay: 150,
    offset: true,
  },
  {
    title: "Hand-Loomed Purity",
    body: "Rejecting mass-production in favor of the rhythmic, human pace of the hand-loom, resulting in fabrics of unparalleled softness.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC5G6GXDfEbKs-LgUHPn6gkJ7-SQJS3ZmeFzwZhnmsATphsJFTj5orj3kDFkSEkWDykSbm05YSz-fi2SZwo9Jk0yBuzek_I31Evf93LbigJAQoLzKj4PEybwdRTjQfnSCt_2S08PbwUxwg7-FmNGZeJb7hG5DV9KuOFByoxhRfEhnc9lp1Em7We7KKRaYgABTWcUlA1mVXTL3qV9cADOMN0hnNRn1T2rDPqOSyjVSTJ_6jSa75VJFtkPQ9C3sRsHeYnptuh0nsuPOQ",
    delay: 300,
    offset: false,
  },
];

const commitments = [
  {
    icon: "eco",
    title: "Sustainable Sourcing",
    body: "We partner exclusively with ethical suppliers who prioritize the environment and the longevity of their local ecosystems.",
  },
  {
    icon: "handshake",
    title: "Fair Trade Ethics",
    body: "100% of our artisans are paid a living wage, with a portion of every sale reinvested into the education of their children.",
  },
  {
    icon: "verified_user",
    title: "Authenticity Guaranteed",
    body: "Every unstitched piece comes with a certificate of origin, detailing the specific cluster of artisans who crafted it.",
  },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDmh2I6H_7iCy_NIAlU8fdp2hHVmTyp17mM1Wp5fRoroLCF2ChnBrZmTAKc_pwyFmGAhzAYob3WMXFQ6tWKZHKuVcnzCk9j_Tn96dUcJ2pGQ5PG_BFWWgyIYcs83n1KWhBtBmaPdy9l9fUHA6oA3YpwJfh9TXJDztI8qTRvcq6WTYbbDHvs1oCgxwarc5j-9ramOfmdeQdojietb5sAb-bydhBxhBMFHkl97MVR0TIYe8bU3Xw0-92Au861Gn4pvLhOiq7I1OkSmYw')",
            }}
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="relative z-10 px-margin-desktop max-w-container-max mx-auto w-full text-white">
          <p className="font-body text-label-md uppercase tracking-[0.3em] mb-4">Est. 1994</p>
          <h1 className="font-display text-display-lg leading-none mb-8">
            Threads of
            <br />
            <i className="font-normal">Heritage.</i>
          </h1>
          <div className="w-24 h-[1px] bg-white" />
        </div>
      </section>

      {/* Intro */}
      <section className="py-24 px-margin-desktop max-w-container-max mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          <Reveal className="md:col-start-2 md:col-span-5">
            <h2 className="font-display text-headline-md mb-8">
              Redefining the loom of modern luxury through the lens of timeless tradition.
            </h2>
          </Reveal>
          <Reveal delay={150} className="md:col-start-8 md:col-span-4">
            <p className="font-body text-body-lg text-on-surface-variant leading-relaxed">
              FUJRS was born from a desire to preserve the vanishing arts of the Indus Valley while
              tailoring them for the contemporary global stage. We believe that a garment is more
              than just attire; it is a canvas of cultural identity.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Heritage */}
      <section className="py-24 bg-surface-container-low">
        <div className="max-w-container-max mx-auto px-margin-desktop">
          <div className="flex items-baseline justify-between mb-16 border-b border-outline-variant pb-8">
            <h3 className="font-display text-display-lg-mobile md:text-headline-md">
              The Heritage
            </h3>
            <span className="font-body text-label-md uppercase tracking-widest text-on-surface-variant">
              01 · Origins
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            <Reveal className="md:col-span-7 h-[600px]">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAXg6vFyEE9z0Th6DDN6N8dRJE6nx8W6Mbkovkdv1ut5ZZ6KB-rFRJj-2GUe4DRjJm-lFp-4NKRZJPRP-PhQPFtvv2hPi9tVMz4Xqa_NiTnDkUykB2wnyObs3M5SBGQC6t2DGu7Vf1nO4G6lCkfET2lkMtWXBJHZYzgl_QXs6xMMumYZvqtfb3AUyyCPAwxAtP4BViiHLt8n68tI6H1WTos-X_w8nWmCgy_LG8W__BebrUCrTk8-PraiICXVIAbSxqwo9zG17rM0bo')",
                }}
              />
            </Reveal>
            <Reveal
              delay={150}
              className="md:col-span-5 flex flex-col justify-center px-8 md:px-12"
            >
              <h4 className="font-display text-headline-sm mb-6">A Legacy in Every Knot</h4>
              <p className="font-body text-body-md text-on-surface-variant mb-8">
                From the bustling bazaars of Lahore to the remote weaving villages of Sindh, we
                source techniques that have remained unchanged for centuries. Our heritage is not
                just in our archives; it&apos;s in the muscle memory of our artisans.
              </p>
              <div className="p-8 border border-primary/10 bg-surface">
                <p className="font-display italic text-headline-sm text-primary">
                  &ldquo;To understand our future, we must look at the threads of our past.&rdquo;
                </p>
                <p className="font-body text-label-sm mt-4 uppercase">
                  Khadija S., Creative Director
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Artisanal Excellence */}
      <section className="py-32 px-margin-desktop max-w-container-max mx-auto">
        <Reveal className="text-center mb-24">
          <span className="font-body text-label-md text-marketplace-bronze uppercase tracking-[0.2em]">
            Craftsmanship
          </span>
          <h3 className="font-display text-display-lg-mobile md:text-display-lg mt-4">
            Artisanal Excellence
          </h3>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {craftsmanship.map((item) => (
            <Reveal
              key={item.title}
              delay={item.delay}
              className={`space-y-6 ${item.offset ? "md:mt-16" : ""}`}
            >
              <div
                className="aspect-[4/5] bg-cover bg-center overflow-hidden"
                style={{ backgroundImage: `url('${item.image}')` }}
              />
              <h5 className="font-display text-headline-sm">{item.title}</h5>
              <p className="font-body text-body-md text-on-surface-variant">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Commitment */}
      <section className="bg-primary text-on-primary py-32">
        <div className="max-w-container-max mx-auto px-margin-desktop grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
          <Reveal>
            <span className="font-body text-label-md text-surface-variant uppercase tracking-[0.2em] mb-6 block">
              The Promise
            </span>
            <h3 className="font-display text-display-lg-mobile md:text-display-lg mb-12">
              Our Commitment
            </h3>
            <div className="space-y-12">
              {commitments.map((item) => (
                <div key={item.title} className="flex gap-6">
                  <span className="material-symbols-outlined text-marketplace-bronze text-4xl">
                    {item.icon}
                  </span>
                  <div>
                    <h6 className="font-body text-label-md uppercase tracking-widest mb-2">
                      {item.title}
                    </h6>
                    <p className="font-body text-body-md text-on-primary-container">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={150} className="relative h-[700px] hidden md:block">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDA_rGYKrjSyXcUyaCxtlT9g6Rgey4Pzi5_mt-HsHMYL3hjHrQ5vAs-F_KXDYqYdyni7Gx789sWKsViE24aVxu-si0YJaXnDS2wXimRPrjf_JZUI3DjRp6RqaRKYbCu2sQNI8rjIUmbLczOyacCpBOQS_AGTrlu0m1PHpkZxn9pp2JZT67H9vH164cbqFaCTrX2DnkM7PgQAqlw0YHlb2B3aCu0FPU6S-pA9m6cCz6tN1WroOtwR3_HN7R_qkXC-_7gKvqpIVeRehY')",
              }}
            />
            <div className="absolute -bottom-10 -left-10 w-64 h-64 border-8 border-marketplace-bronze -z-10" />
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 text-center px-margin-mobile">
        <Reveal className="max-w-2xl mx-auto">
          <h2 className="font-display text-display-lg-mobile md:text-headline-md mb-8">
            Wear the Story
          </h2>
          <p className="font-body text-body-lg text-on-surface-variant mb-12 leading-relaxed">
            Explore our latest unstitched collections and discover the heritage woven into every
            fiber.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-6">
            <LinkButton href="/new-arrivals" variant="primary" className="!px-12 !py-5">
              View Collections
            </LinkButton>
            <LinkButton href="/tailoring/configure" variant="secondary" className="!px-12 !py-5">
              Book A Tailor
            </LinkButton>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
