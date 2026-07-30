"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { QuantitySelector } from "@/components/products/quantity-selector";
import { WishlistButton } from "@/components/products/wishlist-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCart } from "@/components/providers/cart-provider";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

export type ProductPurchaseProps = {
  product: Product;
  className?: string;
};

export function ProductPurchase({ product, className }: ProductPurchaseProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);
  const outOfStock = product.inventory_quantity <= 0;
  const maxQty = Math.max(1, product.inventory_quantity);

  function snapshot() {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      price: product.price,
      compare_at_price: product.compare_at_price,
      inventory_quantity: product.inventory_quantity,
      image_url:
        product.image_url ??
        product.images?.find((img) => img.is_primary)?.url ??
        product.images?.[0]?.url ??
        null,
    };
  }

  function handleBuyNow() {
    if (outOfStock) {
      toast.error("This product is currently out of stock.");
      return;
    }
    setBuying(true);
    addItem({ product: snapshot(), quantity });
    toast.success(`Added ${quantity} × ${product.name} to cart.`);
    router.push("/cart");
  }

  return (
    <div className={cn("space-y-5", className)}>
      {product.size ? (
        <div>
          <Label className="mb-1.5 block text-sm font-semibold text-dark-charcoal">
            Size
          </Label>
          <p className="rounded-sm border border-border-gray bg-light-gray px-3 py-2 text-sm text-dark-charcoal">
            {product.size}
          </p>
        </div>
      ) : null}

      {product.color ? (
        <div>
          <Label className="mb-1.5 block text-sm font-semibold text-dark-charcoal">
            Color
          </Label>
          <p className="rounded-sm border border-border-gray bg-light-gray px-3 py-2 text-sm text-dark-charcoal">
            {product.color}
          </p>
        </div>
      ) : null}

      <div>
        <Label
          htmlFor="product-qty"
          className="mb-1.5 block text-sm font-semibold text-dark-charcoal"
        >
          Quantity
        </Label>
        <QuantitySelector
          id="product-qty"
          value={quantity}
          onChange={setQuantity}
          max={maxQty}
          disabled={outOfStock}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <AddToCartButton
          product={snapshot()}
          quantity={quantity}
          size="lg"
          className="min-w-[10rem] flex-1 sm:flex-none"
        />
        <Button
          type="button"
          variant="secondary"
          size="lg"
          disabled={outOfStock || buying}
          onClick={handleBuyNow}
          className="min-w-[10rem] flex-1 sm:flex-none"
        >
          <Zap aria-hidden="true" />
          Buy Now
        </Button>
        <WishlistButton productId={product.id} productName={product.name} />
      </div>
    </div>
  );
}
