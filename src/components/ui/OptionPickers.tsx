"use client";

// The controls that replaced the free-text fields on the product form.
//
// All three share one rule: they can only ever produce a value that is on the
// managed list. That is the whole point — a typo used to become a permanent
// storefront filter facet (see migration 18), and a control that cannot express
// a typo is a stronger guarantee than validating one after the fact.
//
// Archived options are accepted as a CURRENT value but never offered as a new
// one, so editing an old product doesn't silently change its colour.

import { useId, useMemo, useState } from "react";
import {
  COLOR_FAMILIES,
  COLOR_FAMILY_LABELS,
  swatchForeground,
  swatchNeedsRing,
} from "@/lib/productTaxonomy";
import type { ColorOption, TaxonomyOption } from "@/lib/data";

const labelClass = "font-body text-label-sm uppercase tracking-widest text-on-surface-variant";
const controlClass =
  "w-full border border-outline-variant bg-transparent px-4 py-3 font-body text-body-md transition-colors focus:border-marketplace-bronze focus:outline-none focus-visible:ring-1 focus-visible:ring-marketplace-bronze disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:text-text-muted";

function Shell({
  id,
  label,
  hint,
  error,
  children,
}: {
  id?: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {id ? (
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
      ) : (
        <p className={labelClass}>{label}</p>
      )}
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p className="mt-1.5 font-label-sm text-label-sm text-error">{error}</p>
      ) : (
        hint && <p className="mt-1.5 font-label-sm text-label-sm text-text-muted">{hint}</p>
      )}
    </div>
  );
}

/**
 * Live options, plus whatever is currently selected even if it was archived.
 *
 * Without the second half, opening an old product would quietly reset the field
 * to blank — which reads as "this product has no category" rather than "this
 * category is no longer offered".
 */
function offerable<T extends TaxonomyOption>(options: T[], selectedId: string | null): T[] {
  return options.filter((option) => !option.archived || option.id === selectedId);
}

/** Single-choice picker over one managed list. */
export function OptionSelect({
  label,
  options,
  value,
  onChange,
  hint,
  error,
  placeholder = "Choose one",
  allowEmpty = false,
  disabled = false,
}: {
  label: string;
  options: TaxonomyOption[];
  value: string | null;
  onChange: (id: string | null) => void;
  hint?: string;
  error?: string;
  placeholder?: string;
  allowEmpty?: boolean;
  disabled?: boolean;
}) {
  const id = useId();
  const list = offerable(options, value);

  return (
    <Shell id={id} label={label} hint={hint} error={error}>
      <select
        id={id}
        value={value ?? ""}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value || null)}
        className={controlClass}
      >
        <option value="">{allowEmpty ? "None" : placeholder}</option>
        {list.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
            {option.archived ? " (no longer offered)" : ""}
          </option>
        ))}
      </select>
    </Shell>
  );
}

/**
 * Multi-choice picker rendered as toggle chips.
 *
 * Chips rather than a multiple <select>: a native multi-select needs
 * ctrl/cmd-click to deselect, which people do not discover, and it shows about
 * four rows at a time. Used for embroidery techniques and sizes.
 */
export function ChipMultiSelect({
  label,
  options,
  selected,
  onChange,
  hint,
  error,
  emptyMessage = "Nothing to choose from yet.",
}: {
  label: string;
  options: { id: string; label: string; archived?: boolean }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  hint?: string;
  error?: string;
  emptyMessage?: string;
}) {
  const list = options.filter((option) => !option.archived || selected.includes(option.id));

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id]);
  }

  return (
    <Shell label={label} hint={hint} error={error}>
      {list.length === 0 ? (
        <p className="font-body text-body-md text-text-muted">{emptyMessage}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {list.map((option) => {
            const active = selected.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(option.id)}
                className={`border px-3 py-2 font-label-sm text-label-sm uppercase tracking-widest transition-colors ${
                  active
                    ? "border-primary bg-primary text-on-primary"
                    : "border-outline-variant text-on-surface-variant hover:border-marketplace-bronze"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </Shell>
  );
}

/** One circular swatch. Shared by the picker and the storefront filter. */
export function Swatch({
  hex,
  selected = false,
  size = 32,
}: {
  hex: string;
  selected?: boolean;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      style={{
        backgroundColor: hex,
        width: size,
        height: size,
        // A pale swatch on a pale page is an invisible gap in the row, so
        // Ivory and Signature White get an outline and Emerald does not.
        boxShadow: swatchNeedsRing(hex) ? "inset 0 0 0 1px rgba(0,0,0,0.25)" : undefined,
      }}
      className="relative flex shrink-0 items-center justify-center rounded-full"
    >
      {selected && (
        <span
          className="material-symbols-outlined text-[18px] leading-none"
          style={{ color: swatchForeground(hex) }}
        >
          check
        </span>
      )}
    </span>
  );
}

/**
 * The colour picker, grouped by family.
 *
 * Grouping is the same idea as the storefront filter: a flat list of every
 * colour is what made "Deep Navy", "Midnight Blue" and "Pastel Blue" feel like
 * three unrelated choices instead of three blues. The search box is there
 * because a long list of swatches is hard to scan by eye alone.
 */
export function ColorSwatchPicker({
  label,
  colors,
  value,
  onChange,
  hint,
  error,
}: {
  label: string;
  colors: ColorOption[];
  value: string | null;
  onChange: (id: string | null) => void;
  hint?: string;
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const searchId = useId();

  const groups = useMemo(() => {
    const available = offerable(colors, value);
    const q = query.trim().toLowerCase();
    const matching = q
      ? available.filter(
          (color) =>
            color.label.toLowerCase().includes(q) ||
            COLOR_FAMILY_LABELS[color.family].toLowerCase().includes(q)
        )
      : available;

    return COLOR_FAMILIES.map((family) => ({
      family,
      colors: matching.filter((color) => color.family === family),
    })).filter((group) => group.colors.length > 0);
  }, [colors, value, query]);

  const selected = colors.find((color) => color.id === value) ?? null;

  return (
    <Shell label={label} hint={hint} error={error}>
      <div className="border border-outline-variant p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-body text-body-md">
            {selected ? (
              <span className="flex items-center gap-2">
                <Swatch hex={selected.hex} size={20} />
                <span>
                  {selected.label}
                  <span className="text-text-muted"> · {COLOR_FAMILY_LABELS[selected.family]}</span>
                </span>
              </span>
            ) : (
              <span className="text-text-muted">No colour chosen</span>
            )}
          </p>
          <label htmlFor={searchId} className="sr-only">
            Search colours
          </label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search colours"
            className="border border-outline-variant bg-transparent px-3 py-1.5 font-body text-body-md focus:border-marketplace-bronze focus:outline-none"
          />
        </div>

        {groups.length === 0 ? (
          <p className="mt-4 font-body text-body-md text-text-muted">
            No colour matches “{query}”. A Super Admin can add it from the dashboard.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {groups.map((group) => (
              <div key={group.family}>
                <p className="font-label-sm text-label-sm uppercase tracking-widest text-text-muted">
                  {COLOR_FAMILY_LABELS[group.family]}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {group.colors.map((color) => {
                    const active = color.id === value;
                    return (
                      <button
                        key={color.id}
                        type="button"
                        // The name is never conveyed by the swatch alone —
                        // it is both the accessible name and the visible text.
                        aria-label={`${color.label}, ${COLOR_FAMILY_LABELS[color.family]}`}
                        aria-pressed={active}
                        title={color.label}
                        onClick={() => onChange(active ? null : color.id)}
                        className={`flex items-center gap-2 border py-1.5 pl-1.5 pr-3 transition-colors ${
                          active
                            ? "border-primary"
                            : "border-transparent hover:border-outline-variant"
                        }`}
                      >
                        <Swatch hex={color.hex} selected={active} size={28} />
                        <span className="font-body text-body-md">
                          {color.label}
                          {color.archived && (
                            <span className="text-text-muted"> (retired)</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
