"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, User } from "lucide-react";
import { SITE_CONFIG } from "@/lib/data/seed-data";
import { cn } from "@/lib/utils";
import { DesktopNavigation } from "@/components/layout/desktop-navigation";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { CartButton } from "@/components/layout/cart-button";
import { HomeButton } from "@/components/layout/home-button";
import { WishlistHeaderButton } from "@/components/layout/wishlist-button";

function DesktopNavigationFallback() {
  return <div className="hidden min-w-0 flex-1 lg:block" aria-hidden="true" />;
}

function HeaderLogo() {
  const [failed, setFailed] = React.useState(false);

  if (failed) {
    return (
      <span className="font-heading text-base font-bold uppercase tracking-wide text-dark-charcoal sm:text-lg">
        TITAN SAFETY CO.
      </span>
    );
  }

  return (
    <Image
      src="/images/logo/logo-badge.webp"
      alt={SITE_CONFIG.name}
      width={44}
      height={44}
      className="h-9 w-9 object-contain"
      priority
      onError={() => setFailed(true)}
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
          "sticky top-0 z-40 border-b bg-white transition-[border-color,box-shadow] duration-200",
          scrolled
            ? "border-titan-yellow shadow-[0_1px_0_0_rgba(16,24,32,0.06)]"
            : "border-border-gray",
        )}
      >
        <div className="container-titan">
          <div className="hidden h-18 items-center gap-3 lg:flex xl:gap-4">
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

          <div className="flex h-14 items-center justify-between gap-2 lg:hidden">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-sm text-dark-charcoal hover:bg-light-gray"
                aria-label="Open menu"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="size-5" />
              </button>
              <HomeButton variant="ghost" className="px-2" />
            </div>

            <Link href="/" className="shrink-0" aria-label={SITE_CONFIG.name}>
              <HeaderLogo />
            </Link>

            <div className="flex items-center">
              <WishlistHeaderButton className="size-10" />
              <CartButton />
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
