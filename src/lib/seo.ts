import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const siteOrigin = siteUrl ? new URL(siteUrl) : undefined;

export const siteMetadata: Metadata = {
  metadataBase: siteOrigin,
  title: {
    default: "FUJRS | Premium Fashion and Bespoke Tailoring",
    template: "%s | FUJRS",
  },
  description:
    "Ready-to-wear Pakistani fashion and made-to-measure tailoring from FUJRS.",
  applicationName: "FUJRS",
  alternates: siteOrigin ? { canonical: "/" } : undefined,
  openGraph: {
    type: "website",
    siteName: "FUJRS",
    title: "FUJRS | Premium Fashion and Bespoke Tailoring",
    description:
      "Ready-to-wear Pakistani fashion and made-to-measure tailoring from FUJRS.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FUJRS | Premium Fashion and Bespoke Tailoring",
    description:
      "Ready-to-wear Pakistani fashion and made-to-measure tailoring from FUJRS.",
  },
};

export function absoluteUrl(path: string) {
  return siteOrigin ? new URL(path, siteOrigin).toString() : path;
}

export function noIndexMetadata(): Metadata {
  return { robots: { index: false, follow: false } };
}