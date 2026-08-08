import type { Metadata } from "next";
import { Suspense } from "react";
import { Playfair_Display, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RouteProgress } from "@/components/layout/RouteProgress";
import { ReferralBar } from "@/components/layout/ReferralBar";
import { CartProvider } from "@/components/cart/CartContext";
import { WishlistProvider } from "@/components/wishlist/WishlistContext";
import { TailoringProvider } from "@/components/tailoring/TailoringContext";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { VisitReporter } from "@/components/providers/VisitReporter";
import { ToastProvider } from "@/components/ui/Toast";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FUJRS | Premium Fashion & Bespoke Tailoring",
  description: "Ready-to-wear collections and made-to-measure tailoring from FUJRS.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${hanken.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="flex min-h-screen flex-col bg-background text-on-surface font-body-md selection:bg-tertiary-fixed-dim selection:text-primary"
        suppressHydrationWarning
      >
        <ToastProvider>
          <AuthProvider>
            <VisitReporter />
            <CartProvider>
              <WishlistProvider>
                <TailoringProvider>
                  <Suspense fallback={null}>
                    <RouteProgress />
                  </Suspense>
                  <Navbar />
                  <Suspense fallback={null}>
                    <ReferralBar />
                  </Suspense>
                  <main className="flex-1">{children}</main>
                  <Footer />
                </TailoringProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
