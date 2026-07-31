import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { WishlistView } from "@/components/products/wishlist-view";
import { SITE_CONFIG } from "@/lib/data/seed-data";

export const metadata: Metadata = {
  title: "Wishlist",
  description: `Products you saved from ${SITE_CONFIG.name}.`,
};

export default function WishlistPage() {
  return (
    <div className="container-titan py-6 lg:py-10">
      <Breadcrumbs
        className="mb-5"
        items={[
          { label: "Home", href: "/" },
          { label: "Wishlist", href: "/wishlist" },
        ]}
      />

      <header className="border-b border-border-gray pb-6">
        <div className="max-w-4xl border-l-4 border-titan-yellow pl-4 sm:pl-5">
          <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-medium-gray">
            Saved for later
          </p>
          <h1 className="mt-1.5 font-heading text-4xl uppercase leading-[1.05] text-dark-charcoal md:text-5xl">
            Wishlist
          </h1>
          <p className="mt-3 text-medium-gray line-clamp-1">
            Every product you&apos;ve liked on this device, ready to add to your
            cart.
          </p>
        </div>
      </header>

      <WishlistView className="mt-6" />
    </div>
  );
}
