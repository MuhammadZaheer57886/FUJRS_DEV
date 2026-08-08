"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useTailoring,
  NECKLINES,
  SLEEVES,
  HEMLINES,
  GARMENT_PRICES,
} from "@/components/tailoring/TailoringContext";
import {
  MEASUREMENT_FIELDS,
  isMeasurementSetComplete,
  type MeasurementField,
  type MeasurementSet,
} from "@/lib/measurements";
import { getStitcherBySlug, stitchers } from "@/data/stitchers";
import { Button } from "@/components/ui/Button";
import { ReferencePhotos } from "@/components/tailoring/ReferencePhotos";

const measurementGuides: Record<string, string> = {
  Chest:
    "Measure around the fullest part of your bust, ensuring the tape is level across the back and comfortably snug but not tight.",
  Waist: "Measure around your natural waistline, just above the belly button.",
  Hips: "Measure around the fullest part of your hips, roughly 8 inches below your waist.",
  Shoulder: "Measure from the edge of one shoulder to the other, across the back.",
  "Arm Length": "Measure from the shoulder seam to your wrist bone, with arm slightly bent.",
  Length: "Measure from the shoulder point down to your desired garment length.",
  Bicep: "Measure around the fullest part of your upper arm.",
  Neck: "Measure around the base of your neck, where a collar would sit.",
  "Front Length": "Measure from the shoulder to the desired front hemline.",
  "Back Length": "Measure from the nape of the neck to the desired back hemline.",
  "Trouser Length": "Measure from your waist down to your ankle.",
  Inseam: "Measure from the crotch seam down to the ankle.",
};

export default function ConfigurePage() {
  const router = useRouter();
  const { config, setConfig } = useTailoring();

  const [garmentType, setGarmentType] = useState(config.garmentType);
  const [measurements, setMeasurements] = useState<MeasurementSet>(config.measurements);
  const [activeField, setActiveField] = useState<MeasurementField>(MEASUREMENT_FIELDS[0]);
  const [neckline, setNeckline] = useState(config.neckline);
  const [sleeve, setSleeve] = useState(config.sleeve);
  const [hemline, setHemline] = useState(config.hemline);
  const [stitcherSlug] = useState(config.stitcherSlug);

  const necklineOption = NECKLINES.find((n) => n.label === neckline)!;
  const sleeveOption = SLEEVES.find((s) => s.label === sleeve)!;
  const hemlineOption = HEMLINES.find((h) => h.label === hemline)!;
  const basePrice = GARMENT_PRICES[garmentType];
  const total = basePrice + necklineOption.price + sleeveOption.price + hemlineOption.price;
  const stitcher = getStitcherBySlug(stitcherSlug) ?? stitchers[stitchers.length - 1];

  const measurementsComplete = isMeasurementSetComplete(measurements);

  function handleConfirm() {
    setConfig({
      measurements,
      neckline,
      necklinePrice: necklineOption.price,
      sleeve,
      sleevePrice: sleeveOption.price,
      hemline,
      hemlinePrice: hemlineOption.price,
      garmentType,
      basePrice,
      stitcherSlug,
    });
    router.push("/tailoring/review");
  }

  return (
    <main className="pt-12 pb-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
      <header className="mb-16 text-center max-w-3xl mx-auto">
        <h1 className="font-headline-md text-headline-md mb-4 uppercase tracking-tight">
          Bespoke Stitching Concierge
        </h1>
        <p className="text-text-muted font-body-lg">
          Each garment is an architectural marvel. Define your silhouette through our
          precision-guided measurement portal, ensuring a fit that honors both tradition and form.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left: Visual Guide & Measurements */}
        <div className="lg:col-span-7 space-y-12">
          <div className="bg-surface-container-low p-8 border border-border-subtle relative overflow-hidden">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="font-headline-sm text-headline-sm uppercase">Anatomical Guide</h2>
                <p className="font-label-sm text-marketplace-bronze">
                  PHASE 01: DIMENSIONAL PRECISION
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <span className="w-8 h-[1px] bg-primary mt-1" />
                <span className="font-label-md">
                  {MEASUREMENT_FIELDS.indexOf(activeField) + 1} / {MEASUREMENT_FIELDS.length}
                </span>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="relative w-full aspect-[4/5] md:w-1/2 bg-white flex items-center justify-center border border-outline-variant">
                <div
                  className="w-full h-full bg-contain bg-center bg-no-repeat p-4"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD-Z3Ca8eOlsELZOUk5HB38K1QVp09xRxpV2nqETOohdf1DDAXDHXXaPdgVbu-qY2GgyBhJxOLA0Zgg2vDTQef1TeDhQRUqnXz6tM8tA0mOfsEz_A-1JneNDR5pxN6Ilkxd0UM2IPsi5jtCWZLHdbW7mJeDDeeHt9bA9WDKulYQ7YyyYZ9VDdjJe05HC3SrnRUbxMLpgQm989ZhI-era0ejbkQKRKmf7SUesGRkZYrWI5EicuBnoB3piayJx1GFhiKgNJrpK3mkGU8')",
                  }}
                />
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-3 h-3 bg-marketplace-bronze rounded-full animate-pulse" />
              </div>
              <div className="w-full md:w-1/2 space-y-6">
                <h3 className="font-label-md text-primary uppercase mb-2">
                  Selected: {activeField}
                </h3>
                <p className="text-body-md text-text-muted mb-4">
                  {measurementGuides[activeField]}
                </p>
                <ul className="space-y-2 text-label-sm text-secondary">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Stand naturally with arms at sides
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Use a flexible measuring tape
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Measurement Input Grid */}
          <div>
            <div className="mb-6">
              <label
                htmlFor="garment-type"
                className="font-label-sm uppercase tracking-widest text-text-muted"
              >
                Garment Type
              </label>
              <select
                id="garment-type"
                value={garmentType}
                onChange={(e) => setGarmentType(e.target.value)}
                className="mt-1 w-full border border-outline-variant bg-transparent px-4 py-3 text-body-md focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {Object.keys(GARMENT_PRICES).map((g) => (
                  <option key={g} value={g}>
                    {g} — PKR {GARMENT_PRICES[g].toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {MEASUREMENT_FIELDS.map((field) => {
                const fieldId = `measurement-${field.toLowerCase().replace(/\s+/g, "-")}`;
                return (
                  <div key={field}>
                    <label
                      htmlFor={fieldId}
                      className="font-label-sm text-text-muted uppercase text-[11px]"
                    >
                      {field} (in)
                    </label>
                    <input
                      id={fieldId}
                      inputMode="decimal"
                      value={measurements[field] ?? ""}
                      onFocus={() => setActiveField(field)}
                      onChange={(e) =>
                        setMeasurements((prev) => ({ ...prev, [field]: e.target.value }))
                      }
                      className="mt-1 w-full border-b border-outline-variant bg-transparent py-2 font-label-md focus:outline-none focus:border-marketplace-bronze"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <ReferencePhotos />
        </div>

        {/* Right: Style Selections & Summary */}
        <div className="lg:col-span-5 space-y-8">
          <div className="lg:sticky lg:top-28 space-y-8">
            <div className="bg-primary text-white p-8">
              <h2 className="font-headline-sm text-headline-sm uppercase mb-6">
                Styling Parameters
              </h2>

              <div className="mb-10">
                <div className="flex justify-between items-center mb-4">
                  <label className="font-label-md uppercase tracking-widest">
                    Neckline Profile
                  </label>
                  <span className="font-label-sm text-tertiary-fixed">
                    {necklineOption.price > 0
                      ? `+ PKR ${necklineOption.price.toLocaleString()}`
                      : "Included"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {NECKLINES.map((option) => (
                    <button
                      key={option.label}
                      onClick={() => setNeckline(option.label)}
                      className={`border p-4 text-center transition-all group ${
                        neckline === option.label
                          ? "border-white bg-white text-black"
                          : "border-white/20 hover:bg-white hover:text-black"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined block mb-2 ${
                          neckline === option.label ? "" : "opacity-60 group-hover:opacity-100"
                        }`}
                      >
                        {option.icon}
                      </span>
                      <span className="text-[10px] uppercase font-bold">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-10">
                <div className="flex justify-between items-center mb-4">
                  <label className="font-label-md uppercase tracking-widest">Sleeve Artistry</label>
                  <span className="font-label-sm text-tertiary-fixed">
                    {sleeveOption.price > 0
                      ? `+ PKR ${sleeveOption.price.toLocaleString()}`
                      : "Included"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {SLEEVES.map((option) => (
                    <button
                      key={option.label}
                      onClick={() => setSleeve(option.label)}
                      className={`border p-4 text-center transition-all ${
                        sleeve === option.label
                          ? "border-white bg-white text-black"
                          : "border-white/20 hover:bg-white hover:text-black"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <label className="font-label-md uppercase tracking-widest">Hemline Finish</label>
                  <span className="font-label-sm text-tertiary-fixed">
                    {hemlineOption.price > 0
                      ? `+ PKR ${hemlineOption.price.toLocaleString()}`
                      : "Included"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {HEMLINES.map((option) => (
                    <button
                      key={option.label}
                      onClick={() => setHemline(option.label)}
                      className={`border p-4 text-center transition-all flex items-center justify-center gap-3 ${
                        hemline === option.label
                          ? "border-white bg-white text-black"
                          : "border-white/20 hover:bg-white hover:text-black"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{option.icon}</span>
                      <span className="text-[10px] uppercase font-bold">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="border border-black p-8 bg-surface shadow-sm">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="font-label-sm text-text-muted uppercase mb-1">
                    Configuration Total
                  </p>
                  <p className="font-headline-sm text-3xl">PKR {total.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-label-sm text-marketplace-bronze uppercase">Lead Time</p>
                  <p className="font-label-md">14-21 Business Days</p>
                </div>
              </div>
              <Button
                onClick={handleConfirm}
                disabled={!measurementsComplete}
                variant="primary"
                className="w-full !py-5 disabled:cursor-not-allowed"
              >
                Confirm Specifications
                <span className="material-symbols-outlined">arrow_forward</span>
              </Button>
              {!measurementsComplete && (
                <p className="text-[10px] text-center mt-3 text-error uppercase tracking-widest">
                  Please fill in all 12 measurements to continue
                </p>
              )}
              <p className="text-[10px] text-center mt-4 text-text-muted uppercase tracking-widest">
                Digital measurement verification will follow via SMS
              </p>
            </div>

            {/* Assigned Master Tailor — adapted from source's marketplace
                "Marketplace Seller Context" panel into an internal FUJRS
                stitcher assignment. */}
            <div className="flex items-center gap-4 p-4 border border-outline-variant bg-white">
              <div className="w-12 h-12 bg-surface-container-high border border-black flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">apparel</span>
              </div>
              <div>
                <p className="font-label-sm text-text-muted uppercase">Assigned Master Tailor</p>
                <div className="flex items-center gap-2">
                  <span className="font-label-md">{stitcher.name}</span>
                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-marketplace-bronze text-white text-[9px] uppercase font-bold">
                    In-House
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
