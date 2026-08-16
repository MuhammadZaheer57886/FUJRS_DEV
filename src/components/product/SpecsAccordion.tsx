import type { CatalogItem } from "@/lib/data";
import { Swatch } from "@/components/ui/OptionPickers";

export function SpecsAccordion({ product }: { product: CatalogItem }) {
  // The dupatta was one string ("2.5 Meters Organza with Border") and is now
  // three columns. Reassembled here for display, so the row reads the same as
  // it always did while the data underneath is filterable.
  const dupatta =
    [
      product.dupattaLength !== null ? `${product.dupattaLength} Meters` : null,
      product.dupattaFabric,
      product.dupattaFinish,
    ]
      .filter(Boolean)
      .join(" ") || null;

  return (
    <div className="border-t border-border-subtle mt-4">
      <details className="group border-b border-border-subtle" open>
        <summary className="flex justify-between items-center py-4 cursor-pointer list-none">
          <span className="font-label-md text-primary uppercase tracking-widest">
            Fabric Specifications
          </span>
          <span className="material-symbols-outlined transition-transform group-open:rotate-180">
            expand_more
          </span>
        </summary>
        <div className="pb-6 space-y-3 font-body-md text-on-surface-variant">
          <div className="flex justify-between border-b border-surface-container pb-2">
            <span>Main Fabric</span>
            {/* Weight is its own column now, so "Raw Silk" and "Raw Silk 80gm"
                are one fabric with a detail rather than two fabrics. */}
            <span className="text-primary font-medium">
              {product.fabric}
              {product.fabricWeightGsm && ` · ${product.fabricWeightGsm}gm`}
            </span>
          </div>
          {product.meters !== null && (
            <div className="flex justify-between border-b border-surface-container pb-2">
              <span>Length</span>
              <span className="text-primary font-medium">
                {product.meters} Meters
                {product.metersNote && ` (${product.metersNote})`}
              </span>
            </div>
          )}
          {product.embroidery.length > 0 && (
            <div className="flex justify-between border-b border-surface-container pb-2">
              <span>Embroidery</span>
              <span className="text-primary font-medium">{product.embroidery.join(", ")}</span>
            </div>
          )}
          {dupatta && (
            <div className="flex justify-between border-b border-surface-container pb-2">
              <span>Dupatta</span>
              <span className="text-primary font-medium">{dupatta}</span>
            </div>
          )}
          {product.colors.length > 0 && (
            <div className="flex justify-between border-b border-surface-container pb-2">
              <span>{product.colors.length > 1 ? "Colors" : "Color"}</span>
              <span className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-primary font-medium">
                {product.colors.map((color) => (
                  <span key={color.id || color.label} className="flex items-center gap-2">
                    <Swatch hex={color.hex} size={16} />
                    {color.label}
                  </span>
                ))}
              </span>
            </div>
          )}
        </div>
      </details>

      {/* Only when there is one. This used to fall back to the description,
          which meant a piece WITH a heritage story showed its description
          nowhere on the page; the panel above owns that copy now. */}
      {product.heritageStory && (
        <details className="group border-b border-border-subtle">
          <summary className="flex justify-between items-center py-4 cursor-pointer list-none">
            <span className="font-label-md text-primary uppercase tracking-widest">
              Heritage Story
            </span>
            <span className="material-symbols-outlined transition-transform group-open:rotate-180">
              expand_more
            </span>
          </summary>
          <div className="pb-6 font-body-md text-on-surface-variant leading-relaxed">
            {product.heritageStory}
          </div>
        </details>
      )}

      <details className="group border-b border-border-subtle">
        <summary className="flex justify-between items-center py-4 cursor-pointer list-none">
          <span className="font-label-md text-primary uppercase tracking-widest">
            Shipping &amp; Returns
          </span>
          <span className="material-symbols-outlined transition-transform group-open:rotate-180">
            expand_more
          </span>
        </summary>
        <div className="pb-6 font-body-md text-on-surface-variant space-y-4">
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-primary">local_shipping</span>
            <p>
              Complimentary express shipping within Pakistan. International shipping calculated at
              checkout.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-primary">cached</span>
            <p>
              14-day hassle-free returns for unstitched items. Stitched items are bespoke and
              non-returnable.
            </p>
          </div>
        </div>
      </details>

      <div className="flex justify-between items-center py-4 opacity-60">
        {["lock", "payments", "verified_user", "support_agent"].map((icon) => (
          <span key={icon} className="material-symbols-outlined text-4xl">
            {icon}
          </span>
        ))}
      </div>
    </div>
  );
}
