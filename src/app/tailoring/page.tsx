import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { LinkButton } from "@/components/ui/Button";

const processSteps = [
  {
    icon: "inventory_2",
    title: "1. Select Fabric",
    body: "Choose from our curated collection of luxury unstitched lawn, silk, and velvet.",
  },
  {
    icon: "architecture",
    title: "2. Choose Design",
    body: "Select from our library of contemporary and traditional silhouettes.",
  },
  {
    icon: "straighten",
    title: "3. Enter Measures",
    body: "Input your measurements using our guided digital measurement tool.",
  },
  {
    icon: "content_cut",
    title: "4. Expert Stitching",
    body: "Our master tailors hand-finish every garment to your specifications.",
  },
  {
    icon: "local_shipping",
    title: "5. Global Delivery",
    body: "Beautifully packaged and shipped to your doorstep, worldwide.",
  },
];

const signatureStyles = [
  {
    category: "Necklines",
    title: "The Imperial Collar",
    body: "Over 40 handcrafted collar and neck styles.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBkTjRiampwKtUdWnZ-aohPC9Qc4RDBWXUUrnOEiIpC1fuSGAKqg75ey1pilnew-udREbkQHicC5ril4bZ6hWDMz2p5fXUbLwaZBnz16_U8EQhBtzNJwgfyaQ6vLM5OW98Ac35KPvhv6Ivd2FXPuajSb0TkHRR9ihpIpTMR3VsU_Yjd-RYYp6e_o4rmzb3GCkn-YfFa5u7iIwjqPbhkuECUwFmtOFaT1JAKE_3gdyGZh1qhnjcG4i-pFvQ95mrXAvpE3Qn9iLXmeDg",
  },
  {
    category: "Sleeves",
    title: "Victorian Cuffed",
    body: "Select from bishop, bell, cuffed, and flared designs.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDkoATwQhH9tDl2_ksTiie8dWHz6KzE4cVmHbQF5Stz14T4YWAoE0o4Y5KEPA1Rfy18dU_ydIZTOuVFkji40xxOlMZBgr0d7K7lxchIxjks_Fi5t0sAj-tpSQ7Rr4sYKN3DgpwXQxDpSG6PVzS4RpZAimZCajNLsp9Lbkdu76O4sPUlffycso8wM7QNttzrXycq-XkNKw0zsZpYFfzgxkIvHiSq_SGsrF9qxV7yYZ8b0nmd-aAgOKO-4zpkcRuxVPT9ilI0YXsRUX4",
  },
  {
    category: "Hemlines",
    title: "Hand-Finished Zari",
    body: "Signature finishes including scalloped and laced edges.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBDmEYv0Pnbd1huv0yrS78RMqy5UiwR0OiiOZMDRVt6cNi2VfZqXMJDOiuGqT_puqdphTGqcfuKC-SXVXJfo6Gw-t0QpRpabW1cbSWVKI_STTqB_HUpANoSRYh-0kORoqlwKt74oLxb8XcbKiDVrSwM42deXvkzXAiebC11aN9J9Nacmlpd3hXQhvQDmNRv22s9uh41vN97O6tMjdqDngXWnrXzxXyphwr6R-V3RfZq17SVYkW8t1LxcgFjr9wlnJXIDuaM0ToXm2Y",
  },
];

// Source priced this table in USD ($45-$250); converted to PKR to match
// the rest of the site's currency.
const pricingRows = [
  {
    garment: "2-Piece Suit (Kurta & Trousers)",
    note: "Simple straight cut or modern silhouette",
    standard: "PKR 12,500",
    premium: "PKR 20,900",
    turnaround: "10-14 Days",
  },
  {
    garment: "3-Piece Luxury Suit",
    note: "Includes dupatta finishing & lining",
    standard: "PKR 16,500",
    premium: "PKR 26,500",
    turnaround: "14-18 Days",
  },
  {
    garment: "Formal Saree with Blouse",
    note: "Fall, pico, and custom blouse stitching",
    standard: "PKR 22,000",
    premium: "PKR 33,500",
    turnaround: "18-21 Days",
  },
  {
    garment: "Bridal Wear / Pishwas",
    note: "Heavy flair and detailed canvas finishing",
    standard: "PKR 42,000+",
    premium: "PKR 69,500+",
    turnaround: "25-30 Days",
  },
];

export default function TailoringPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative h-[700px] md:h-[850px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center grayscale-[0.2]"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDAj5OCWogbAVVNFYbdauNt8bNZVOu15-XJKqafB4PuXMFwEBKmQvIqraiXXmXeNFKGPGf2_cxg6HkG5_REVLKdoosXZoQKukwEDXRhts3-JKHs5xcngCn4oMkQpn84YsQ0NygM_XY-B8gKwYeBwjeIh-BWYgTWE_6ApPvq4rjlnw1poQ56RXxPOxClh8MlFF2InMha1xb6tC1XkCINZcId8AMvIYyaC7PWdwXbrbqwYajXiLFdicMs2OAYmISFtvts4_wlWKFb1c8')",
            }}
            role="img"
            aria-label="Master tailor at work in the FUJRS atelier"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        <div className="relative z-10 px-gutter max-w-container-max mx-auto w-full text-white">
          <div className="max-w-2xl">
            <span className="font-label-md text-label-md uppercase tracking-[0.3em] mb-6 block text-tertiary-fixed-dim">
              The Atelier Experience
            </span>
            <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg mb-8 leading-none">
              From Fabric
              <br />
              to Masterpiece.
            </h2>
            <p className="font-body-lg text-body-lg mb-12 opacity-90 max-w-lg">
              Experience the pinnacle of bespoke craftsmanship. Our master stitchers transform your
              selected unstitched fabrics into impeccably tailored garments, delivered to your door
              with global precision.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                href="/tailoring/configure"
                className="bg-white text-black px-12 py-5 font-label-md text-label-md uppercase tracking-widest hover:bg-tertiary-fixed transition-all duration-300"
              >
                Start Your Design
              </Link>
              <LinkButton href="/new-arrivals" variant="inverse" className="!px-12 !py-5">
                View Catalog
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      {/* The atelier workflow behind bespoke stitching is not built yet: the
          screens below are the finished design, so the page says so up front
          rather than taking an order it cannot fulfil. */}
      <section className="bg-primary text-white">
        <div className="px-gutter max-w-container-max mx-auto py-16 flex flex-col md:flex-row items-start gap-8">
          <span className="material-symbols-outlined text-5xl text-tertiary-fixed-dim shrink-0">
            schedule
          </span>
          <div>
            <p className="font-label-md text-label-md uppercase tracking-[0.3em] text-tertiary-fixed-dim mb-4">
              Coming soon
            </p>
            <h3 className="font-headline-md text-headline-md mb-6">
              Bespoke tailoring is not open for orders yet.
            </h3>
            <p className="font-body-lg text-body-lg opacity-90 max-w-2xl">
              Everything below is the atelier experience we are building: the process, the signature
              styles, and the pricing we will charge. Stitching goes live once our master tailors
              are onboarded, so no stitching charge is added to any order today.
            </p>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-margin-desktop bg-surface">
        <div className="px-gutter max-w-container-max mx-auto">
          <Reveal className="text-center mb-20">
            <h3 className="font-headline-md text-headline-md mb-4">The Stitching Journey</h3>
            <div className="w-24 h-[1px] bg-primary mx-auto" />
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-10 right-10 h-[1px] bg-outline-variant z-0" />
            {processSteps.map((step, i) => (
              <Reveal key={step.title} delay={i * 100} className="relative z-10 text-center group">
                <div className="w-24 h-24 bg-white border border-outline-variant flex items-center justify-center mx-auto mb-6 transition-all duration-500 group-hover:border-primary group-hover:bg-primary group-hover:text-white">
                  <span className="material-symbols-outlined text-4xl">{step.icon}</span>
                </div>
                <h4 className="font-label-md text-label-md uppercase mb-2">{step.title}</h4>
                <p className="font-body-md text-body-md text-on-surface-variant">{step.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Signature Styles */}
      <section className="py-margin-desktop bg-white overflow-hidden">
        <div className="px-gutter max-w-container-max mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-xl">
              <h3 className="font-headline-md text-headline-md mb-6">Signature Styles</h3>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Explore our library of curated design elements. From contemporary necklines to
                intricate hemlines, customize every detail of your garment.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {signatureStyles.map((style, i) => (
              <Reveal key={style.title} delay={i * 100} className="group cursor-pointer">
                <div className="aspect-[4/5] overflow-hidden mb-6 relative">
                  <div
                    className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url('${style.image}')` }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                    <p className="font-label-sm text-label-sm uppercase">{style.category}</p>
                    <h5 className="font-headline-sm text-headline-sm">{style.title}</h5>
                  </div>
                </div>
                <h4 className="font-label-md text-label-md uppercase mb-1">{style.category}</h4>
                <p className="font-body-md text-body-md text-on-surface-variant">{style.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Measurement Guide Preview */}
      <section className="py-margin-desktop bg-surface-container-low">
        <div className="px-gutter max-w-container-max mx-auto flex flex-col md:flex-row items-center gap-16">
          <Reveal className="flex-1">
            <div className="bg-white p-12 border border-outline-variant relative overflow-hidden">
              <span className="font-label-md text-label-md text-marketplace-bronze uppercase tracking-widest mb-4 block">
                Precision Tool
              </span>
              <h3 className="font-headline-md text-headline-md mb-8">Guided Measurements</h3>
              <div className="space-y-8">
                {[
                  {
                    n: 1,
                    title: "Digital Blueprint",
                    body: "Our smart tool asks for 12 key points to create your unique digital mannequin.",
                  },
                  {
                    n: 2,
                    title: "Video Tutorials",
                    body: "Step-by-step visual guides ensure you measure exactly like a professional tailor.",
                  },
                  {
                    n: 3,
                    title: "Tailor Check",
                    body: "Every measurement is reviewed by our master tailors for logical consistency.",
                  },
                ].map((item) => (
                  <div key={item.n} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">
                      {item.n}
                    </div>
                    <div>
                      <h5 className="font-label-md text-label-md mb-1">{item.title}</h5>
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        {item.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <LinkButton
                href="/tailoring/configure"
                variant="primary"
                className="mt-12 w-full !py-5"
              >
                Open Measurement Tool
              </LinkButton>
            </div>
          </Reveal>
          <Reveal delay={150} className="flex-1 w-full">
            <div
              className="w-full aspect-[4/5] bg-white bg-contain bg-center bg-no-repeat"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAP4xBH9xI5y2cG9LHx4iqY41gBWa-QEUHLU_o1G1-JKW7EJecka-U9V5eav438v75U8sEjL1HZtzRik0ihe8ty3uqCsh2bjRJIP8Pj6_9qEchEZsAoJktsZC3M1y6lgSpjQBIZ7C3RKQpK_VqgCXHK9-q2n4kIFdTeCRdQd814nK0uAxyFZ43gGiZkFLqTrDGB-KRyipNT9Ijr49XAbeMxLgn_DZe0BlfdcJgcCNOqwa7CA4AvNZVLHYAUaGMMizgCZ5sRQIIG0Ag')",
              }}
            />
          </Reveal>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-margin-desktop bg-white">
        <div className="px-gutter max-w-container-max mx-auto">
          <Reveal className="text-center mb-16">
            <h3 className="font-headline-md text-headline-md mb-4">Investment in Fit</h3>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Transparent pricing for unparalleled quality. All prices include linings and standard
              finishing.
            </p>
          </Reveal>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-primary">
                  <th className="py-8 px-6 text-left font-label-md text-label-md uppercase tracking-wider">
                    Garment Type
                  </th>
                  <th className="py-8 px-6 text-left font-label-md text-label-md uppercase tracking-wider">
                    Standard Stitching
                  </th>
                  <th className="py-8 px-6 text-left font-label-md text-label-md uppercase tracking-wider">
                    Premium Embellished
                  </th>
                  <th className="py-8 px-6 text-left font-label-md text-label-md uppercase tracking-wider">
                    Turnaround
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {pricingRows.map((row) => (
                  <tr
                    key={row.garment}
                    className="hover:bg-surface-container-low transition-colors"
                  >
                    <td className="py-10 px-6">
                      <h5 className="font-label-md text-label-md">{row.garment}</h5>
                      <p className="text-xs text-on-surface-variant mt-1">{row.note}</p>
                    </td>
                    <td className="py-10 px-6 font-body-lg text-body-lg">{row.standard}</td>
                    <td className="py-10 px-6 font-body-lg text-body-lg">{row.premium}</td>
                    <td className="py-10 px-6 font-body-md text-body-md">{row.turnaround}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-24 text-white text-center">
        <div className="px-gutter max-w-2xl mx-auto">
          <h2 className="font-display-lg text-display-lg-mobile md:text-headline-md mb-8">
            Ready to wear your perfect fit?
          </h2>
          <p className="font-body-lg text-body-lg opacity-80 mb-12">
            Join thousands of global clients who trust FUJRS for their custom tailoring needs.
            Quality guaranteed, or we&apos;ll make it right.
          </p>
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <Link
              href="/tailoring/configure"
              className="bg-white text-black px-12 py-5 font-label-md text-label-md uppercase tracking-widest hover:bg-tertiary-fixed transition-all"
            >
              Start Your Order
            </Link>
            <Link
              href="/tailoring/stitchers"
              className="border border-white/30 text-white px-12 py-5 font-label-md text-label-md uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              Meet Our Master Stitchers
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
