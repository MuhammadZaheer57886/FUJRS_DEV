"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField, SelectField } from "@/components/ui/Field";
import { ChipMultiSelect, ColorSwatchPicker, OptionSelect } from "@/components/ui/OptionPickers";
import { ImageGalleryUpload } from "@/components/ui/ImageGalleryUpload";
import { StorefrontPreview } from "@/components/dashboard/StorefrontPreview";
import { useToast } from "@/components/ui/Toast";
import { cropToDataUrl } from "@/lib/downscaleImage";
import { productTaxonomy } from "@/lib/data";
import {
  PRODUCT_GENDERS,
  type CatalogItem,
  type CategoryOption,
  type ProductFormPhoto,
  type ProductGender,
  type ProductInput,
  type ProductTaxonomy,
} from "@/lib/data";

const MIN_DESCRIPTION_LENGTH = 10;

const emptyForm = {
  title: "",
  price: "",
  compareAtPrice: "",
  gender: "Women" as ProductGender,

  categoryId: null as string | null,
  fabricId: null as string | null,
  fabricWeightGsm: "",
  colorIds: [] as string[],
  badgeId: null as string | null,

  sizeScaleId: null as string | null,
  sizes: [] as string[],

  stock: "",
  sku: "",
  description: "",
  isNewArrival: false,
  stitchingEligible: false,
  stitchingAddOn: "",

  meters: "",
  metersNote: "",
  embroideryIds: [] as string[],
  dupattaLength: "",
  dupattaFabricId: null as string | null,
  dupattaFinish: "",
  heritageStory: "",
};

type Form = typeof emptyForm;
type FormErrors = Partial<Record<keyof Form, string>>;

/** An optional text field: empty means "not set", not an empty string. */
const optional = (value: string) => value.trim() || null;

/** An optional number field. Blank is absent; anything unparseable is absent too. */
function optionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/** A number field as the form holds it: a string, blank when there's no value. */
const numberField = (value: number | null) => (value === null ? "" : String(value));

/**
 * An existing product, back in the shape the form edits.
 *
 * Needs the taxonomy because a `CatalogItem` carries embroidery as LABELS and
 * the form works in IDS. A technique that has since been deleted resolves to
 * nothing and is dropped rather than silently re-submitted as a label the
 * junction table has no row for.
 */
function formFromItem(item: CatalogItem, lists: ProductTaxonomy): Form {
  return {
    title: item.title,
    price: String(item.price),
    compareAtPrice: numberField(item.compareAtPrice),
    gender: item.gender,

    categoryId: item.categoryId || null,
    fabricId: item.fabricId || null,
    fabricWeightGsm: numberField(item.fabricWeightGsm),
    colorIds: item.colors.map((color) => color.id).filter(Boolean),
    badgeId: item.badgeId,

    sizeScaleId: item.sizeScaleId,
    sizes: item.sizes,

    stock: String(item.stock),
    sku: item.sku ?? "",
    description: item.description,
    isNewArrival: item.isNewArrival,
    stitchingEligible: item.stitchingEligible,
    stitchingAddOn: numberField(item.stitchingAddOn),

    meters: numberField(item.meters),
    metersNote: item.metersNote ?? "",
    embroideryIds: item.embroidery
      .map((label) => lists.embroideryTechniques.find((option) => option.label === label)?.id)
      .filter((id): id is string => Boolean(id)),
    dupattaLength: numberField(item.dupattaLength),
    dupattaFabricId: item.dupattaFabricId,
    dupattaFinish: item.dupattaFinish ?? "",
    heritageStory: item.heritageStory ?? "",
  };
}

function validate(form: Form, category: CategoryOption | null): FormErrors {
  const errors: FormErrors = {};
  if (!form.title.trim()) errors.title = "Give the piece a name.";

  const price = Number(form.price);
  if (!form.price.trim()) errors.price = "Enter a price.";
  else if (!Number.isFinite(price) || price <= 0) errors.price = "Price must be above zero.";

  // The database enforces compare_at >= price; catching it here explains why.
  if (form.compareAtPrice.trim()) {
    const compareAt = Number(form.compareAtPrice);
    if (!Number.isFinite(compareAt) || compareAt <= 0) {
      errors.compareAtPrice = "Enter a number, or leave it blank.";
    } else if (Number.isFinite(price) && compareAt <= price) {
      errors.compareAtPrice = "The was-price has to be higher than the price.";
    }
  }

  // These three are NOT NULL columns, so the database would refuse the insert
  // anyway — catching them here says which field rather than showing a driver
  // error the person filling the form can do nothing with.
  if (!form.categoryId) errors.categoryId = "Choose a category.";
  if (!form.fabricId) errors.fabricId = "Choose a fabric.";
  if (form.colorIds.length === 0) {
    errors.colorIds = "Choose at least one colour, because the shop filters on it.";
  }

  if (form.fabricWeightGsm.trim()) {
    const weight = Number(form.fabricWeightGsm);
    if (!Number.isInteger(weight) || weight <= 0) {
      errors.fabricWeightGsm = "A whole number of grams, or leave it blank.";
    }
  }

  if (form.sizes.length === 0) errors.sizes = "Tick at least one size.";

  const stock = Number(form.stock);
  if (!form.stock.trim()) errors.stock = "Enter the stock count (0 is fine).";
  else if (!Number.isInteger(stock) || stock < 0) errors.stock = "A whole number, zero or more.";

  if (form.stitchingEligible) {
    const addOn = Number(form.stitchingAddOn);
    if (!form.stitchingAddOn.trim()) errors.stitchingAddOn = "Enter the stitching charge.";
    else if (!Number.isFinite(addOn) || addOn < 0) errors.stitchingAddOn = "Zero or more.";
  }

  if (form.meters.trim()) {
    const meters = Number(form.meters);
    if (!Number.isFinite(meters) || meters <= 0) errors.meters = "A number above zero.";
  }

  if (category?.hasDupatta && form.dupattaLength.trim()) {
    const length = Number(form.dupattaLength);
    if (!Number.isFinite(length) || length <= 0) errors.dupattaLength = "A number above zero.";
  }

  if (form.description.trim().length < MIN_DESCRIPTION_LENGTH) {
    errors.description = `At least ${MIN_DESCRIPTION_LENGTH} characters.`;
  }
  return errors;
}

/** A labelled group inside the form — the form itself owns the outer border. */
function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="mt-8 border-t border-outline-variant pt-6">
      <legend className="sr-only">{title}</legend>
      <p className="font-body text-label-sm uppercase tracking-widest text-marketplace-bronze">
        {title}
      </p>
      {hint && <p className="mt-1 font-body text-label-sm text-text-muted">{hint}</p>}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function CheckboxField({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-primary"
      />
      <span>
        <span className="font-body text-body-md">{label}</span>
        <span className="block font-label-sm text-label-sm text-text-muted">{hint}</span>
      </span>
    </label>
  );
}

/**
 * One product form for publishing a new piece and for editing one already in
 * the catalogue. `initial` is the only difference, plus the copy on the button:
 * a second form for edits is how the two drift until a field can be set but
 * never changed.
 *
 * Every taxonomy field is a PICK from a managed list rather than free text
 * (migration 18): typed values used to become permanent storefront filter
 * facets, so the catalogue ended up with three blues and four off-whites.
 *
 * Picking a category then pre-fills the stitching charge, size scale and
 * meterage and decides whether the dupatta fields appear at all. Those are
 * starting points, not rules — every one stays editable.
 */
export function ProductForm({
  submitLabel,
  onSubmit,
  onCancel,
  canManageOptions = false,
  initial,
}: {
  submitLabel: string;
  /**
   * Awaited: the button spins until it settles. Reject to keep the form
   * filled in — a failed save must not cost the user everything they typed.
   */
  onSubmit: (item: ProductInput) => Promise<void>;
  onCancel?: () => void;
  /** Super Admins manage the lists; everyone else is told who can. */
  canManageOptions?: boolean;
  /**
   * The piece being edited. Absent for a new one.
   *
   * Its photos come back as `kind: "stored"`: they can be reordered, removed
   * and re-framed, but not re-cropped, because their pixels are on Storage
   * rather than in this page.
   */
  initial?: CatalogItem;
}) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState<ProductFormPhoto[]>(() =>
    (initial?.images ?? []).map((photo) => ({ kind: "stored" as const, ...photo }))
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [taxonomy, setTaxonomy] = useState<ProductTaxonomy | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    productTaxonomy
      .read()
      .then((lists) => {
        if (cancelled) return;
        setTaxonomy(lists);
        // Filled in here rather than in `useState`, because resolving the
        // embroidery labels back to ids needs the lists to have arrived.
        if (initial) setForm(formFromItem(initial, lists));
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // Loaded once. Re-running on a new `initial` would throw away edits in
    // progress; the caller remounts with a `key` when it wants a fresh form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  const category = useMemo(
    () => taxonomy?.categories.find((option) => option.id === form.categoryId) ?? null,
    [taxonomy, form.categoryId]
  );

  /**
   * Categories on offer for the chosen gender. A category with no gender is
   * offered to all of them; the rest are scoped, so a Men's piece is never
   * offered "3-Piece Suits".
   */
  const categoriesForGender = useMemo(
    () =>
      (taxonomy?.categories ?? []).filter(
        (option) =>
          option.gender === null || option.gender === form.gender || form.gender === "Unisex"
      ),
    [taxonomy, form.gender]
  );

  const sizeScale = useMemo(
    () => taxonomy?.sizeScales.find((scale) => scale.id === form.sizeScaleId) ?? null,
    [taxonomy, form.sizeScaleId]
  );

  /**
   * Applies a category's defaults.
   *
   * Only fills fields the user has not already filled — retyping a stitching
   * charge because you changed your mind about the category is exactly the
   * annoyance the defaults exist to remove, but silently overwriting something
   * already entered is worse than not helping at all.
   */
  const applyCategoryDefaults = useCallback(
    (next: CategoryOption | null, lists: ProductTaxonomy) => {
      if (!next) return;
      setForm((prev) => {
        const scale = next.defaultSizeScaleId
          ? lists.sizeScales.find((option) => option.id === next.defaultSizeScaleId)
          : null;

        return {
          ...prev,
          stitchingEligible: prev.stitchingEligible || next.defaultStitchingAddOn !== null,
          stitchingAddOn:
            prev.stitchingAddOn ||
            (next.defaultStitchingAddOn !== null ? String(next.defaultStitchingAddOn) : ""),
          sizeScaleId: prev.sizeScaleId ?? next.defaultSizeScaleId,
          // A scale with exactly one size ("Unstitched", "One Size") has nothing
          // to choose, so tick it rather than making it a required extra click.
          sizes:
            prev.sizes.length > 0
              ? prev.sizes
              : scale && scale.values.length === 1
                ? scale.values
                : [],
          meters: prev.meters || (next.defaultMeters !== null ? String(next.defaultMeters) : ""),
        };
      });
    },
    []
  );

  function chooseCategory(id: string | null) {
    update("categoryId", id);
    if (!taxonomy) return;
    applyCategoryDefaults(taxonomy.categories.find((option) => option.id === id) ?? null, taxonomy);
  }

  /** Changing gender can strip the chosen category out of the offered list. */
  function chooseGender(gender: ProductGender) {
    setForm((prev) => {
      const stillOffered = (taxonomy?.categories ?? []).some(
        (option) =>
          option.id === prev.categoryId &&
          (option.gender === null || option.gender === gender || gender === "Unisex")
      );
      return { ...prev, gender, categoryId: stillOffered ? prev.categoryId : null };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const found = validate(form, category);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = Object.values(found)[0];
      toast(first ?? "Check the highlighted fields.", "error");
      requestAnimationFrame(() => {
        formRef.current
          ?.querySelector<HTMLElement>("[data-invalid='true']")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }

    setSubmitting(true);
    try {
      // The zoom set in the preview is CSS until here. Baking it into the
      // pixels means the shop serves the tight crop as a smaller file, instead
      // of downloading the whole frame and scaling it up in every tile. Photos
      // already on the product were cropped when they were first uploaded.
      let cropped: ProductFormPhoto[];
      try {
        cropped = await Promise.all(
          images.map(async (photo) =>
            photo.kind === "upload"
              ? { kind: "upload" as const, ...(await cropToDataUrl(photo)) }
              : photo
          )
        );
      } catch (err) {
        console.error("[ProductForm] crop failed", err);
        toast("Couldn't apply the image crop. Reset it in the preview and try again.", "error");
        // `finally` below clears `submitting`; nothing has been sent anywhere,
        // so the form is left exactly as it was typed.
        return;
      }

      await onSubmit({
        title: form.title.trim(),
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice.trim() ? Number(form.compareAtPrice) : null,
        description: form.description.trim(),
        gender: form.gender,

        // Non-null by the time validation has passed.
        categoryId: form.categoryId as string,
        fabricId: form.fabricId as string,
        fabricWeightGsm: optionalNumber(form.fabricWeightGsm),
        colorIds: form.colorIds,
        badgeId: form.badgeId,

        sizeScaleId: form.sizeScaleId,
        sizes: form.sizes,

        stock: Number(form.stock),
        sku: optional(form.sku),
        isNewArrival: form.isNewArrival,
        stitchingEligible: form.stitchingEligible,
        stitchingAddOn: form.stitchingEligible ? Number(form.stitchingAddOn) : null,

        meters: optionalNumber(form.meters),
        metersNote: optional(form.metersNote),
        embroideryIds: form.embroideryIds,
        // A dupatta on a category that has none would be a field nobody saw.
        dupattaLength: category?.hasDupatta ? optionalNumber(form.dupattaLength) : null,
        dupattaFabricId: category?.hasDupatta ? form.dupattaFabricId : null,
        dupattaFinish: category?.hasDupatta ? optional(form.dupattaFinish) : null,
        heritageStory: optional(form.heritageStory),
        images: cropped,
      });

      // Only a create clears the form. Blanking an edit the moment it saves
      // would wipe the screen the person is still looking at.
      if (!initial) {
        setForm(emptyForm);
        setImages([]);
      }
      setPreviewOpen(false);
    } catch (err) {
      // The caller toasts the reason. Log here so a missed toast still leaves
      // a trace for whoever has DevTools open.
      console.error("[ProductForm] save failed", err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadFailed) {
    return (
      <div className="border border-outline-variant p-8">
        <p className="font-body text-body-md">
          Couldn&apos;t load the product lists, so the form can&apos;t be filled in safely. Reload
          the page to try again.
        </p>
      </div>
    );
  }

  if (!taxonomy) {
    return (
      <div className="border border-outline-variant p-8">
        <p className="font-body text-body-md text-text-muted">Loading the product lists…</p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => void handleSubmit(e)}
      noValidate
      aria-busy={submitting || undefined}
      className="border border-outline-variant p-8"
    >
      <ImageGalleryUpload images={images} onChange={setImages} />

      {/* Only offered once there is something to preview: an empty dialog would
          be a button that opens nothing. */}
      {images.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button type="button" variant="secondary" onClick={() => setPreviewOpen(true)}>
            Preview on the shop
          </Button>
          <p className="font-body text-label-sm text-text-muted">
            See the shapes each page crops these photos to, and set what stays in frame.
          </p>
        </div>
      )}

      <StorefrontPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        images={images}
        onChange={setImages}
        title={form.title}
        price={form.price}
        badge={taxonomy.badges.find((option) => option.id === form.badgeId)?.label ?? null}
        gender={form.gender}
      />

      {!canManageOptions && (
        // Never a dead control: the person filling this in needs to know why
        // there is no "add a new fabric" button and who can add one.
        <p className="mt-6 border border-outline-variant bg-surface-container-low px-4 py-3 font-body text-label-sm text-text-muted">
          Categories, fabrics, colours and badges come from a managed list. Ask a Super Admin to add
          one if what you need isn&apos;t here.
        </p>
      )}

      <Group title="The piece">
        <TextField
          label="Product Name"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          error={errors.title}
          placeholder="Emerald Silk Unstitched Set"
        />
        <SelectField
          label="Gender"
          value={form.gender}
          onChange={(e) => chooseGender(e.target.value as ProductGender)}
          hint="Scopes which categories are offered."
        >
          {PRODUCT_GENDERS.map((gender) => (
            <option key={gender} value={gender}>
              {gender}
            </option>
          ))}
        </SelectField>
        <OptionSelect
          label="Category"
          options={categoriesForGender}
          value={form.categoryId}
          onChange={chooseCategory}
          error={errors.categoryId}
          hint="Fills in the stitching charge, sizes and meterage below."
        />
        <OptionSelect
          label="Fabric"
          options={taxonomy.fabrics}
          value={form.fabricId}
          onChange={(id) => update("fabricId", id)}
          error={errors.fabricId}
        />
        <TextField
          label="Fabric Weight (gsm)"
          inputMode="numeric"
          value={form.fabricWeightGsm}
          onChange={(e) => update("fabricWeightGsm", e.target.value)}
          error={errors.fabricWeightGsm}
          hint="Optional. Keeps “Raw Silk 80gm” from becoming its own fabric."
          placeholder="80"
        />
        <div className="sm:col-span-2">
          <ColorSwatchPicker
            label="Colours"
            colors={taxonomy.colors}
            selected={form.colorIds}
            onChange={(ids) => update("colorIds", ids)}
            error={errors.colorIds}
            hint="Pick every colourway this piece comes in. The first one is what listings show. The shop filters on a colour's family, not its name, so “Midnight Blue” and “Deep Navy” sit together under Blue."
          />
        </div>
        <div className="sm:col-span-2">
          <TextAreaField
            label="Description"
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            error={errors.description}
            hint="Fabric weight, finish, and what makes the piece distinct."
          />
        </div>
      </Group>

      <Group title="Sizes">
        <OptionSelect
          label="Size Scale"
          options={taxonomy.sizeScales}
          value={form.sizeScaleId}
          onChange={(id) => {
            update("sizeScaleId", id);
            // The old sizes belong to the old scale; keeping them would let a
            // shoe be sold in "Unstitched".
            update("sizes", []);
          }}
          hint="Unstitched fabric is sold as one size."
        />
        <div className="sm:col-span-2">
          <ChipMultiSelect
            label="Sizes Stocked"
            options={(sizeScale?.values ?? []).map((size) => ({ id: size, label: size }))}
            selected={form.sizes}
            onChange={(sizes) => update("sizes", sizes)}
            error={errors.sizes}
            emptyMessage="Choose a size scale first."
          />
        </div>
      </Group>

      <Group title="Price & stock">
        <TextField
          label="Price (PKR)"
          inputMode="numeric"
          value={form.price}
          onChange={(e) => update("price", e.target.value)}
          error={errors.price}
          placeholder="24500"
        />
        <TextField
          label="Was Price (PKR)"
          inputMode="numeric"
          value={form.compareAtPrice}
          onChange={(e) => update("compareAtPrice", e.target.value)}
          error={errors.compareAtPrice}
          hint="Optional. Shown struck through beside the price."
          placeholder="32000"
        />
        <TextField
          label="Stock"
          inputMode="numeric"
          value={form.stock}
          onChange={(e) => update("stock", e.target.value)}
          error={errors.stock}
          hint="Units on hand. Zero publishes the piece as out of stock."
          placeholder="12"
        />
        <TextField
          label="SKU"
          value={form.sku}
          onChange={(e) => update("sku", e.target.value)}
          error={errors.sku}
          hint="Optional, but must be unique across the catalogue."
          placeholder="FJ-EM-001"
        />
      </Group>

      <Group title="Stitching">
        <div className="sm:col-span-2">
          <CheckboxField
            label="Offer bespoke stitching for this piece"
            hint="Adds the stitching option to the product page and the bag."
            checked={form.stitchingEligible}
            onChange={(checked) => update("stitchingEligible", checked)}
          />
        </div>
        {form.stitchingEligible && (
          <TextField
            label="Stitching Charge (PKR)"
            inputMode="numeric"
            value={form.stitchingAddOn}
            onChange={(e) => update("stitchingAddOn", e.target.value)}
            error={errors.stitchingAddOn}
            hint={
              category?.defaultStitchingAddOn != null
                ? `Filled in from ${category.label}. Change it if this piece differs.`
                : "Added to the price when the customer chooses stitching."
            }
            placeholder="6500"
          />
        )}
      </Group>

      <Group
        title="Product page details"
        hint="All optional. Each one fills a row in the specs panel on the product page."
      >
        <div className="sm:col-span-2">
          <CheckboxField
            label="Show in New Arrivals"
            hint="Features the piece on the homepage and the New Arrivals page."
            checked={form.isNewArrival}
            onChange={(checked) => update("isNewArrival", checked)}
          />
        </div>
        <OptionSelect
          label="Badge"
          options={taxonomy.badges}
          value={form.badgeId}
          onChange={(id) => update("badgeId", id)}
          allowEmpty
          hint="Short label on the card, e.g. “Limited Edition”."
        />
        <TextField
          label="Meters"
          inputMode="decimal"
          value={form.meters}
          onChange={(e) => update("meters", e.target.value)}
          error={errors.meters}
          hint={
            category?.defaultMeters != null
              ? `Filled in from ${category.label}.`
              : "Total metres of fabric."
          }
          placeholder="4.5"
        />
        <TextField
          label="Meters Note"
          value={form.metersNote}
          onChange={(e) => update("metersNote", e.target.value)}
          hint="Optional, e.g. “Standard Suit”."
          placeholder="Standard Suit"
        />
        <div className="sm:col-span-2">
          <ChipMultiSelect
            label="Embroidery"
            options={taxonomy.embroideryTechniques}
            selected={form.embroideryIds}
            onChange={(ids) => update("embroideryIds", ids)}
            hint="Tick every technique on the piece."
          />
        </div>

        {/* Only rendered where a dupatta exists. Footwear has none, and a field
            that never applies is how a form starts feeling like paperwork. */}
        {category?.hasDupatta && (
          <>
            <TextField
              label="Dupatta Length (m)"
              inputMode="decimal"
              value={form.dupattaLength}
              onChange={(e) => update("dupattaLength", e.target.value)}
              error={errors.dupattaLength}
              placeholder="2.5"
            />
            <OptionSelect
              label="Dupatta Fabric"
              options={taxonomy.fabrics}
              value={form.dupattaFabricId}
              onChange={(id) => update("dupattaFabricId", id)}
              allowEmpty
            />
            <TextField
              label="Dupatta Finish"
              value={form.dupattaFinish}
              onChange={(e) => update("dupattaFinish", e.target.value)}
              hint="Optional, e.g. “scalloped edge”."
              placeholder="with Border"
            />
          </>
        )}

        <div className="sm:col-span-2">
          <TextAreaField
            label="Heritage Story"
            rows={3}
            value={form.heritageStory}
            onChange={(e) => update("heritageStory", e.target.value)}
            hint="The craft behind the piece: where it was made and by whom."
          />
        </div>
      </Group>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button type="submit" variant="primary" loading={submitting} loadingLabel="Saving product">
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        {submitting && (
          <p className="font-body text-label-sm text-text-muted">
            Saving. Images can take a moment.
          </p>
        )}
      </div>
    </form>
  );
}
