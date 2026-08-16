// Chart tokens pulled from tailwind.config.ts — kept in one place so charts
// never hardcode a hex inline (see CLAUDE.md "no magic numbers").
export const CHART_COLORS = {
  series: "#804A00", // marketplace-bronze
  seriesFill: "rgba(128, 74, 0, 0.1)", // series at ~10% opacity, per mark spec
  accent: "#a08000", // gold
  grid: "#e2e2e2", // surface-container-highest, recessive gridlines
  mutedText: "#4c4546", // on-surface-variant
  ink: "#1a1c1c", // on-surface
  surface: "#ffffff", // surface-container-lowest, ring/gap color
} as const;

export const CHART_VIEWBOX_WIDTH = 600;
export const CHART_VIEWBOX_HEIGHT = 220;
export const CHART_MAX_BAR_THICKNESS = 40;
export const CHART_BAR_GAP = 4;
export const CHART_BAR_RADIUS = 4;
