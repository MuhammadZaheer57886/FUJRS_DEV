import Link from "next/link";

const features = [
  { icon: "straighten", label: "Virtual Measurements & Digital Fitting" },
  { icon: "brush", label: "Bespoke Design Customization" },
  { icon: "local_shipping", label: "Global 14-Day Delivery" },
];

export function AtelierPromo() {
  return (
    <section className="py-margin-desktop overflow-hidden">
      <div className="max-w-container-max mx-auto px-gutter">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-20">
          <div className="relative">
            <div className="aspect-square bg-surface-container p-12 relative z-10">
              <div
                className="w-full h-full bg-cover bg-center grayscale brightness-75 hover:grayscale-0 transition-all duration-1000"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAKkiBRlMgtm2lLIr8EDEz8VChnmT1w13gPaXYE3N16cxCLP6nOiYUYAionZnfVacqbFIneccA6SbEMNbDqr78KLa-f8CrXWJoVTOQB3APNn43_OzFaXpfE1x3jXvB_or5MHHzWEvcF6X6BXSKyVRCK60M9U809AISMc15A7tJkWBKwt5hhV_52PTCdESMYXZvySBe1fzhbzyYD6DlsaruqHdaIAg5Z08sVLx1mg8ieEi19bEngZtHhUmRq7B6WkxGIC_9yUpjXxqQ')",
                }}
                role="img"
                aria-label="A macro photograph of a professional tailor's hands precisely sewing a gold trim onto a black velvet garment using a vintage sewing machine."
              />
            </div>
            <div className="absolute -top-10 -right-10 w-64 h-64 border border-tertiary-fixed-dim -z-0" />
            <div className="absolute -bottom-6 -left-6 bg-surface-container-lowest px-6 py-4 z-20">
              <p className="font-label-md text-label-md text-primary uppercase">
                Elite Craftsmanship
              </p>
            </div>
          </div>
          <div>
            <span className="font-label-md text-label-md text-marketplace-bronze uppercase tracking-[0.3em] mb-6 block">
              The Atelier
            </span>
            <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg mb-8">
              CUSTOM STITCHING SERVICES
            </h2>
            <p className="font-body-lg text-on-surface-variant mb-10 max-w-xl">
              Transform your unstitched fabrics into a masterpiece with our concierge tailoring
              service. From heritage patterns to modern silhouettes, our master artisans ensure a
              fit that is as unique as you are.
            </p>
            <div className="space-y-6 mb-12">
              {features.map((feature) => (
                <div key={feature.label} className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-marketplace-bronze">
                    {feature.icon}
                  </span>
                  <span className="font-label-md text-label-md">{feature.label}</span>
                </div>
              ))}
            </div>
            <Link
              href="/tailoring"
              className="inline-block px-12 py-5 bg-tertiary-fixed-dim text-primary font-label-md text-label-md uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all duration-300"
            >
              Book A Consultation
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
