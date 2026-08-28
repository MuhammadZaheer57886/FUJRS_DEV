import type { Metadata } from "next";
import { siteOrigin } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Bespoke Tailoring in Pakistan",
  description:
    "Create a made-to-measure garment with FUJRS master tailors and guided measurements.",
  alternates: siteOrigin ? { canonical: "/tailoring" } : undefined,
};

export default function TailoringLayout({ children }: { children: React.ReactNode }) {
  return children;
}
