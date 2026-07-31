import { WishlistView } from "@/components/products/wishlist-view";

export default function AccountWishlistPage() {
  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold uppercase tracking-wide text-dark-charcoal">
        Wishlist
      </h1>
      <p className="mt-2 text-sm text-medium-gray">
        Products saved on this device for later.
      </p>

      <WishlistView className="mt-8" />
    </div>
  );
}
