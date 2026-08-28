import type { Metadata } from "next";
import { siteOrigin } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Master Tailors and Artisans",
  description:
    "Meet the FUJRS master tailors and artisans creating made-to-measure garments.",
  alternates: siteOrigin ? { canonical: "/tailoring/stitchers" } : undefined,
};

export default function StitchersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
