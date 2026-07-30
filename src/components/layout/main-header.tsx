"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Menu, Search, User } from "lucide-react";
import { SITE_CONFIG } from "@/lib/data/seed-data";
import { cn } from "@/lib/utils";
import { DesktopNavigation } from "@/components/layout/desktop-navigation";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { SearchBar } from "@/components/layout/search-bar";
import { CartButton } from "@/components/layout/cart-button";

function HeaderLogo({ compact = false }: { compact?: boolean }) {
  const [failed, setFailed] = React.useState(false);
  const src = compact
    ? "/images/logo/logo-badge.webp"
    : "/images/logo/logo-txt.webp";

  if (failed) {
    return (
      <span className="font-heading text-base font-bold uppercase tracking-wide text-dark-charcoal sm:text-lg">
        TITAN SAFETY CO.
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={SITE_CONFIG.name}
      width={compact ? 44 : 180}
      height={compact ? 44 : 40}
      className={cn(
        "h-9 w-auto object-contain",
        compact ? "h-9 w-9" : "h-8 sm:h-9",
      )}
      priority
      onError={() => setFailed(true)}
    />
  );
}

export function MainHeader() {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);

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
          <div className="hidden h-16 items-center gap-3 lg:flex xl:gap-4">
            <Link href="/" className="shrink-0" aria-label={SITE_CONFIG.name}>
              <HeaderLogo />
            </Link>

            <DesktopNavigation />

            <div className="flex shrink-0 items-center justify-end gap-0.5">
              <SearchBar className="hidden w-40 xl:block xl:w-52" />
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-sm text-dark-charcoal transition-colors hover:bg-light-gray xl:hidden"
                aria-label="Search"
                onClick={() => setMobileSearchOpen((prev) => !prev)}
              >
                <Search className="size-4" aria-hidden="true" />
              </button>
              <Link
                href="/account"
                className="inline-flex size-9 items-center justify-center rounded-sm text-dark-charcoal transition-colors hover:bg-light-gray"
                aria-label="Account"
              >
                <User className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/account/wishlist"
                className="inline-flex size-9 items-center justify-center rounded-sm text-dark-charcoal transition-colors hover:bg-light-gray"
                aria-label="Wishlist"
              >
                <Heart className="size-4" aria-hidden="true" />
              </Link>
              <CartButton />
            </div>
          </div>

          <div className="flex h-14 items-center justify-between gap-2 lg:hidden">
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-sm text-dark-charcoal hover:bg-light-gray"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" />
            </button>

            <Link href="/" className="shrink-0" aria-label={SITE_CONFIG.name}>
              <HeaderLogo compact />
            </Link>

            <div className="flex items-center">
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-sm text-dark-charcoal hover:bg-light-gray"
                aria-label="Search"
                aria-expanded={mobileSearchOpen}
                onClick={() => setMobileSearchOpen((prev) => !prev)}
              >
                <Search className="size-5" />
              </button>
              <CartButton />
            </div>
          </div>

          {mobileSearchOpen ? (
            <div className="border-t border-border-gray py-3 xl:hidden">
              <SearchBar
                autoFocus
                onNavigate={() => setMobileSearchOpen(false)}
              />
            </div>
          ) : null}
        </div>
      </header>

      <MobileNavigation open={mobileOpen} onOpenChange={setMobileOpen} />
    </>
  );
}
