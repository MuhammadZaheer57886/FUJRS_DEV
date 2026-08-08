"use client";

// Super Admin management of the lists the product form picks from.
//
// The product form deliberately cannot accept a value that isn't on a list
// (migration 18), so this screen is the only way a new colour or category comes
// into existence. That makes "archive, never delete" the rule here: published
// products reference these rows, and removing one would either orphan a product
// or rewrite what it says it is.

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Swatch } from "@/components/ui/OptionPickers";
import { productTaxonomy, StoreWriteError } from "@/lib/data";
import type {
  ColorOption,
  NewTaxonomyOption,
  ProductTaxonomy,
  SizeScaleOption,
  TaxonomyKind,
  TaxonomyOption,
} from "@/lib/data";
import {
  COLOR_FAMILIES,
  COLOR_FAMILY_LABELS,
  isValidHex,
  normaliseHex,
  type ColorFamily,
} from "@/lib/productTaxonomy";

const TABS: { kind: TaxonomyKind; label: string; hint: string }[] = [
  {
    kind: "categories",
    label: "Categories",
    hint: "The primary taxonomy. Each one carries the defaults a new product inherits.",
  },
  { kind: "fabrics", label: "Fabrics", hint: "Base fabric only — weight is set per product." },
  { kind: "colors", label: "Colours", hint: "The name shown on the page, plus the family the shop filters on." },
  { kind: "badges", label: "Badges", hint: "Short labels on the product card." },
  { kind: "sizeScales", label: "Size Scales", hint: "Ordered size sets a product chooses from." },
  { kind: "embroideryTechniques", label: "Embroidery", hint: "Ticked per product, many at a time." },
];

const inputClass =
  "border border-outline-variant bg-transparent px-3 py-2 font-body text-body-md focus:border-marketplace-bronze focus:outline-none";

/** The extra fields a colour needs. Everything else is just a name. */
function ColorFields({
  hex,
  family,
  onHex,
  onFamily,
}: {
  hex: string;
  family: ColorFamily;
  onHex: (value: string) => void;
  onFamily: (value: ColorFamily) => void;
}) {
  return (
    <>
      {/* A native colour input alongside the text box: the picker is how people
          actually choose a colour, the text box is how they paste a brand hex. */}
      <input
        type="color"
        value={isValidHex(hex) ? hex : "#808080"}
        onChange={(e) => onHex(e.target.value.toLowerCase())}
        aria-label="Pick a colour"
        className="h-10 w-12 shrink-0 cursor-pointer border border-outline-variant bg-transparent"
      />
      <input
        value={hex}
        onChange={(e) => onHex(e.target.value)}
        placeholder="#1b2a4a"
        aria-label="Hex value"
        className={`${inputClass} w-28`}
      />
      <select
        value={family}
        onChange={(e) => onFamily(e.target.value as ColorFamily)}
        aria-label="Colour family"
        className={inputClass}
      >
        {COLOR_FAMILIES.map((option) => (
          <option key={option} value={option}>
            {COLOR_FAMILY_LABELS[option]}
          </option>
        ))}
      </select>
    </>
  );
}

export function TaxonomyManager() {
  const { toast } = useToast();
  const [taxonomy, setTaxonomy] = useState<ProductTaxonomy | null>(null);
  const [kind, setKind] = useState<TaxonomyKind>("categories");
  const [showArchived, setShowArchived] = useState(false);
  const [busy, setBusy] = useState(false);

  const [label, setLabel] = useState("");
  const [hex, setHex] = useState("#808080");
  const [family, setFamily] = useState<ColorFamily>("MULTI");
  const [values, setValues] = useState("");

  useEffect(() => {
    productTaxonomy
      .read()
      .then(setTaxonomy)
      .catch(() => toast("Couldn't load the product lists.", "info"));
  }, [toast]);

  /** Every mutation returns the whole taxonomy, so the screen never goes stale. */
  async function run(action: () => Promise<ProductTaxonomy>, success: string) {
    setBusy(true);
    try {
      setTaxonomy(await action());
      toast(success, "success");
      return true;
    } catch (err) {
      toast(
        err instanceof StoreWriteError ? err.message : "Couldn't update that list.",
        "info"
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !label.trim()) return;

    const input: NewTaxonomyOption = { label };

    if (kind === "colors") {
      const clean = normaliseHex(hex);
      if (!clean) {
        toast("Enter a colour as #rrggbb.", "info");
        return;
      }
      input.hex = clean;
      input.family = family;
    }

    if (kind === "sizeScales") {
      const parsed = values
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      if (parsed.length === 0) {
        toast("List the sizes, separated by commas.", "info");
        return;
      }
      input.values = parsed;
    }

    const ok = await run(() => productTaxonomy.add(kind, input), `“${label.trim()}” added.`);
    if (ok) {
      setLabel("");
      setValues("");
    }
  }

  const active = TABS.find((tab) => tab.kind === kind)!;
  const all = taxonomy?.[kind] ?? [];
  const visible = (all as TaxonomyOption[]).filter((option) => showArchived || !option.archived);
  const archivedCount = (all as TaxonomyOption[]).filter((option) => option.archived).length;

  return (
    <section className="mt-12">
      <h2 className="font-display text-headline-sm">Product Lists</h2>
      <p className="mt-1 text-label-sm text-marketplace-bronze">
        What the product form offers. Options are archived, never deleted — published products
        reference them.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.kind}
            type="button"
            aria-pressed={tab.kind === kind}
            onClick={() => setKind(tab.kind)}
            className={`border px-4 py-2 font-label-sm text-label-sm uppercase tracking-widest transition-colors ${
              tab.kind === kind
                ? "border-primary bg-primary text-on-primary"
                : "border-outline-variant text-on-surface-variant hover:border-marketplace-bronze"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="mt-4 font-body text-body-md text-text-muted">{active.hint}</p>

      <form onSubmit={(e) => void handleAdd(e)} className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={`New ${active.label.replace(/s$/, "").toLowerCase()} name`}
          aria-label={`New ${active.label} name`}
          className={`${inputClass} min-w-[200px] flex-1`}
        />
        {kind === "colors" && (
          <ColorFields hex={hex} family={family} onHex={setHex} onFamily={setFamily} />
        )}
        {kind === "sizeScales" && (
          <input
            value={values}
            onChange={(e) => setValues(e.target.value)}
            placeholder="XS, S, M, L, XL"
            aria-label="Sizes, comma separated"
            className={`${inputClass} min-w-[220px] flex-1`}
          />
        )}
        <Button type="submit" variant="primary" disabled={busy || !label.trim()}>
          Add
        </Button>
      </form>

      {kind === "categories" && (
        // The defaults are set in SQL for the seeded categories. Saying so beats
        // a form that silently creates a category with no defaults at all.
        <p className="mt-3 font-label-sm text-label-sm text-text-muted">
          A category added here starts with no defaults. Set its stitching charge, size scale and
          meterage in the database until that form is built.
        </p>
      )}

      {archivedCount > 0 && (
        <label className="mt-4 flex cursor-pointer items-center gap-2 font-body text-body-md">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Show {archivedCount} archived
        </label>
      )}

      <ul className="mt-4 divide-y divide-outline-variant border border-outline-variant">
        {visible.length === 0 && (
          <li className="px-4 py-3 font-body text-body-md text-text-muted">Nothing on this list.</li>
        )}
        {visible.map((option) => (
          <li key={option.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            {kind === "colors" && <Swatch hex={(option as ColorOption).hex} size={24} />}
            <span className="flex-1 font-body text-body-md">
              {option.label}
              {kind === "colors" && (
                <span className="text-text-muted">
                  {" "}
                  · {COLOR_FAMILY_LABELS[(option as ColorOption).family]}
                </span>
              )}
              {kind === "sizeScales" && (
                <span className="text-text-muted"> · {(option as SizeScaleOption).values.join(", ")}</span>
              )}
              {option.archived && (
                <span className="ml-2 border border-outline-variant px-2 py-0.5 font-label-sm text-label-sm uppercase text-text-muted">
                  Archived
                </span>
              )}
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(
                  () => productTaxonomy.setArchived(kind, option.id, !option.archived),
                  option.archived ? `“${option.label}” restored.` : `“${option.label}” archived.`
                )
              }
              className="border border-outline-variant px-3 py-1.5 font-label-sm text-label-sm uppercase tracking-widest transition-colors hover:border-marketplace-bronze disabled:opacity-40"
            >
              {option.archived ? "Restore" : "Archive"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
