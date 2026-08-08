"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { useWishlist } from "@/components/wishlist/WishlistContext";
import { useAuth } from "@/components/providers/AuthProvider";
import { SlidingUnderline, useSlidingUnderline } from "@/components/ui/SlidingUnderline";
import { canAccessDashboard } from "@/lib/auth/roles";

const navLinks = [
  { label: "MEN", href: "/men" },
  { label: "WOMEN", href: "/women" },
  { label: "NEW ARRIVALS", href: "/new-arrivals" },
  { label: "TAILORING", href: "/tailoring" },
];

interface NavItem {
  label: string;
  href: string;
  /** The Dashboard link, which carries the bronze accent instead of primary. */
  accent?: boolean;
}

/**
 * Desktop nav with a single underline that slides between items rather than
 * one underline per link popping in and out.
 */
function DesktopNav({
  items,
  isActive,
}: {
  items: NavItem[];
  isActive: (href: string) => boolean;
}) {
  const activeItem = items.find((item) => isActive(item.href));
  const { containerRef, setItemRef, indicator, animate } = useSlidingUnderline(
    activeItem?.href ?? null
  );

  // Spacing must be `gap-8`, not `space-x-8`: the latter sets margin-left on
  // every child after the first, which would shift the indicator off-centre.
  return (
    <div ref={containerRef} className="relative hidden lg:flex items-center gap-8">
      {items.map((item) => (
        <Link
          key={item.href}
          ref={setItemRef(item.href)}
          href={item.href}
          aria-current={isActive(item.href) ? "page" : undefined}
          className={`transition-colors duration-200 font-label-md text-label-md ${
            item.accent
              ? "text-marketplace-bronze hover:text-primary"
              : isActive(item.href)
                ? "text-primary"
                : "text-on-surface-variant hover:text-primary"
          }`}
        >
          {item.label}
        </Link>
      ))}

      <SlidingUnderline
        indicator={indicator}
        animate={animate}
        className={`-bottom-1.5 ${activeItem?.accent ? "bg-marketplace-bronze" : "bg-primary"}`}
      />
    </div>
  );
}

function MobileNavLink({
  href,
  active,
  onNavigate,
  className = "text-on-surface",
  children,
}: {
  href: string;
  active: boolean;
  onNavigate: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center justify-between border-b border-outline-variant py-4 font-label-md text-label-md transition-colors duration-200 ${
        active ? "text-primary" : className
      }`}
    >
      {/* Accent bar wipes in from the left on the current page. */}
      <span
        aria-hidden="true"
        className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 origin-center bg-marketplace-bronze transition-transform duration-300 ease-out motion-reduce:transition-none ${
          active ? "scale-y-100" : "scale-y-0"
        }`}
      />
      <span className={`transition-[padding] duration-300 ease-out ${active ? "pl-3" : "pl-0"}`}>
        {children}
      </span>
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full bg-marketplace-bronze transition-all duration-300 ease-out motion-reduce:transition-none ${
          active ? "scale-100 opacity-100" : "scale-0 opacity-0"
        }`}
      />
    </Link>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const { session, isGuest } = useAuth();
  const { items, mounted } = useCart();
  const { slugs, mounted: wishlistMounted } = useWishlist();

  const cartCount = mounted ? items.reduce((sum, i) => sum + i.qty, 0) : 0;
  const wishlistCount = wishlistMounted ? slugs.length : 0;
  const showDashboardLink = canAccessDashboard(session?.user.role);

  // A guest holds a session so their bag has an owner, but there is no account
  // behind it — so the person icon offers sign-in, exactly as it does for
  // someone with no session at all.
  const signedIn = Boolean(session) && !isGuest;
  const accountHref = signedIn ? "/account" : "/login";

  // A section counts as current for its own page and anything beneath it, so
  // /tailoring stays lit on /tailoring/configure.
  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const desktopItems: NavItem[] = showDashboardLink
    ? [...navLinks, { label: "DASHBOARD", href: "/dashboard", accent: true }]
    : navLinks;

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setQuery("");
  }

  return (
    <nav className="docked full-width top-0 sticky z-50 border-b border-outline-variant">
      <div className="absolute inset-0 -z-10 bg-surface/90 backdrop-blur-md" />
      <div className="flex flex-col items-center w-full px-gutter max-w-container-max mx-auto py-4">
        <div className="flex items-center justify-between w-full">
          {/* Branding */}
          <Link
            href="/"
            className="block py-2 font-display-lg text-headline-sm uppercase tracking-widest"
          >
            FUJRS
          </Link>

          {/* Nav Links (Desktop Only) */}
          <DesktopNav items={desktopItems} isActive={isActive} />

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              aria-label="Search"
              className="material-symbols-outlined hover:text-tertiary-fixed-dim transition-all duration-300 scale-95 active:scale-90"
              onClick={() => setSearchOpen(true)}
            >
              search
            </button>
            <Link
              aria-label="Wishlist"
              href="/wishlist"
              aria-current={isActive("/wishlist") ? "page" : undefined}
              className={`material-symbols-outlined relative hover:text-tertiary-fixed-dim transition-all duration-300 scale-95 active:scale-90 ${
                isActive("/wishlist") ? "text-primary" : ""
              }`}
            >
              favorite
              {wishlistCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-tertiary-fixed-dim text-[10px] font-medium text-primary">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              aria-label={signedIn ? "My Account" : "Sign In"}
              href={accountHref}
              aria-current={isActive(accountHref) ? "page" : undefined}
              className={`hidden sm:block hover:text-tertiary-fixed-dim transition-all duration-300 scale-95 active:scale-90 ${
                isActive(accountHref) ? "text-primary" : ""
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={signedIn ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                person
              </span>
            </Link>
            <Link
              aria-label="Shopping bag"
              href="/cart"
              aria-current={isActive("/cart") ? "page" : undefined}
              className={`material-symbols-outlined relative hover:text-tertiary-fixed-dim transition-all duration-300 scale-95 active:scale-90 ${
                isActive("/cart") ? "text-primary" : ""
              }`}
            >
              shopping_bag
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-tertiary-fixed-dim text-[10px] font-medium text-primary">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              aria-label="Open menu"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-[70] bg-surface">
          <div className="max-w-container-max mx-auto px-gutter flex h-20 items-center justify-between border-b border-outline-variant">
            <form className="flex flex-1 items-center gap-4" onSubmit={submitSearch}>
              <span className="material-symbols-outlined text-on-surface-variant">search</span>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, fabrics, categories…"
                className="w-full border-none bg-transparent font-display-lg text-headline-sm placeholder:text-on-surface-variant focus:outline-none"
              />
            </form>
            <button
              aria-label="Close search"
              className="material-symbols-outlined"
              onClick={() => setSearchOpen(false)}
            >
              close
            </button>
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-primary/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-[80%] max-w-xs flex-col bg-surface-container-lowest">
            <div className="flex items-center justify-between border-b border-outline-variant px-6 py-5">
              <span className="font-display-lg text-headline-sm uppercase tracking-widest">
                FUJRS
              </span>
              <button
                aria-label="Close menu"
                className="material-symbols-outlined"
                onClick={() => setMobileOpen(false)}
              >
                close
              </button>
            </div>
            <nav className="flex flex-col gap-1 px-6 py-4">
              {navLinks.map((link) => (
                <MobileNavLink
                  key={link.href}
                  href={link.href}
                  active={isActive(link.href)}
                  onNavigate={() => setMobileOpen(false)}
                >
                  {link.label}
                </MobileNavLink>
              ))}
              <MobileNavLink
                href={accountHref}
                active={isActive(accountHref)}
                onNavigate={() => setMobileOpen(false)}
              >
                {signedIn ? "MY ACCOUNT" : "ACCOUNT"}
              </MobileNavLink>
              {showDashboardLink && (
                <MobileNavLink
                  href="/dashboard"
                  active={isActive("/dashboard")}
                  onNavigate={() => setMobileOpen(false)}
                  className="text-marketplace-bronze"
                >
                  DASHBOARD
                </MobileNavLink>
              )}
            </nav>
          </div>
        </div>
      )}
    </nav>
  );
}
