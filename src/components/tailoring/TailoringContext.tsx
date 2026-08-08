"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { tailoring } from "@/lib/data";
import type { TailoringConfig } from "@/lib/data";
import { DEFAULT_STITCHER_SLUG } from "@/data/stitchers";
import {
  DEFAULT_GARMENT_TYPE,
  GARMENT_PRICES,
  HEMLINES,
  NECKLINES,
  SLEEVES,
  bespokePrice,
} from "@/lib/tailoringOptions";

// Re-exported so existing importers keep working; the shape lives in the data
// layer, where it maps onto a `stitching_requests` row.
export type { TailoringConfig };

// The options and their prices live in `@/lib/tailoringOptions`, which is pure
// so the ORDER ROUTE can import it and re-price a bespoke line from the
// customer's choices. Re-exported here so the existing screens keep their
// import path.
export { NECKLINES, SLEEVES, HEMLINES, GARMENT_PRICES };

const defaultConfig: TailoringConfig = {
  measurements: {},
  neckline: NECKLINES[1].label,
  necklinePrice: NECKLINES[1].price,
  sleeve: SLEEVES[0].label,
  sleevePrice: SLEEVES[0].price,
  hemline: HEMLINES[0].label,
  hemlinePrice: HEMLINES[0].price,
  garmentType: DEFAULT_GARMENT_TYPE,
  basePrice: GARMENT_PRICES[DEFAULT_GARMENT_TYPE],
  stitcherSlug: DEFAULT_STITCHER_SLUG,
};

interface TailoringContextValue {
  config: TailoringConfig;
  setConfig: (c: TailoringConfig) => void;
  total: number;
  mounted: boolean;
}

const TailoringContext = createContext<TailoringContextValue | null>(null);

export function TailoringProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<TailoringConfig>(defaultConfig);
  const [mounted, setMounted] = useState(false);

  // Storage lives in the data layer; this provider holds React state only.
  useEffect(() => {
    let active = true;
    tailoring
      .read()
      .then((stored) => {
        if (active && stored) setConfigState(stored);
      })
      .finally(() => {
        if (active) setMounted(true);
      });
    return () => {
      active = false;
    };
  }, []);

  function setConfig(c: TailoringConfig) {
    setConfigState(c);
    void tailoring.write(c);
  }

  // Derived from the choices, not summed from the stored prices, so the figure
  // on screen is the same one the order route will charge.
  const total = bespokePrice(config);

  return (
    <TailoringContext.Provider value={{ config, setConfig, total, mounted }}>
      {children}
    </TailoringContext.Provider>
  );
}

export function useTailoring() {
  const ctx = useContext(TailoringContext);
  if (!ctx) throw new Error("useTailoring must be used within TailoringProvider");
  return ctx;
}
