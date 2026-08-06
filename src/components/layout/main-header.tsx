"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, User, X } from "lucide-react";
import { SITE_CONFIG } from "@/lib/data/seed-data";
import { cn } from "@/lib/utils";
import { DesktopNavigation } from "@/components/layout/desktop-navigation";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { CartButton } from "@/components/layout/cart-button";
import { HomeButton } from "@/components/layout/home-button";
import { WishlistHeaderButton } from "@/components/layout/wishlist-button";

function DesktopNavigationFallback() {
  return (
    <div className="hidden min-w-0 flex-1 @5xl:block" aria-hidden="true" />
  );
}

function HeaderLogo() {
  return (
    <Image
      src="/images/logo/logo-badge-mobile.png"
      alt={SITE_CONFIG.name}
      width={88}
      height={88}
      className="storefront-mobile-logo h-11 w-11 object-contain"
      priority
      unoptimized
    />
  );
}

export function MainHeader({
  isAdmin = false,
  signedIn = false,
}: {
  isAdmin?: boolean;
  signedIn?: boolean;
}) {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "storefront-header sticky top-0 z-40 border-b transition-[border-color,box-shadow,background-color] duration-200",
          /* Mobile (official responsive) matches iPhone preview: charcoal bar */
          "border-white/12 bg-dark-charcoal",
          /* Desktop keeps the light storefront chrome */
          "@5xl:bg-white",
          scrolled
            ? "border-titan-yellow shadow-[0_1px_0_0_rgba(16,24,32,0.06)]"
            : "@5xl:border-border-gray",
        )}
      >
        <div className="container-titan">
          <div className="storefront-desktop-header hidden h-18 items-center gap-3 @5xl:flex xl:gap-4">
            <HomeButton variant="ghost" className="shrink-0" />
            <React.Suspense fallback={<DesktopNavigationFallback />}>
              <DesktopNavigation />
            </React.Suspense>

            <div className="flex shrink-0 items-center justify-end gap-0.5">
              <Link
                href="/account"
                className="inline-flex size-10 items-center justify-center rounded-sm text-dark-charcoal transition-colors hover:bg-light-gray"
                aria-label="Account"
              >
                <User className="size-5" aria-hidden="true" />
              </Link>
              <WishlistHeaderButton />
              <CartButton />
            </div>
          </div>

          <div
            className={cn(
              "storefront-mobile-header flex items-center justify-between gap-2 @5xl:hidden",
              "min-h-[calc(3.5rem+var(--phone-safe-top,0px)+env(safe-area-inset-top,0px))]",
              "pt-[calc(var(--phone-safe-top,0px)+env(safe-area-inset-top,0px))]",
            )}
          >
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-sm text-white"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((prev) => !prev)}
              >
                {mobileOpen ? (
                  <X className="size-5" aria-hidden="true" />
                ) : (
                  <Menu className="size-5" aria-hidden="true" />
                )}
              </button>
            </div>

            <Link href="/" className="shrink-0" aria-label={SITE_CONFIG.name}>
              <HeaderLogo />
            </Link>

            <div className="flex items-center">
              <CartButton className="text-white" />
            </div>
          </div>
        </div>
      </header>

      <MobileNavigation
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        isAdmin={isAdmin}
        signedIn={signedIn}
      />
    </>
  );
}
