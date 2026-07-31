"use client";

import { useId, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useCart } from "@/components/providers/cart-provider";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

export type AddToCartButtonProps = {
  product: Pick<
    Product,
    | "id"
    | "name"
    | "slug"
    | "sku"
    | "price"
    | "compare_at_price"
    | "inventory_quantity"
    | "image_url"
  >;
  quantity?: number;
  variantId?: string | null;
  label?: string;
  className?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  disabled?: boolean;
};

export function AddToCartButton({
  product,
  quantity = 1,
  variantId = null,
  label = "Add to Cart",
  className,
  size = "md",
  variant = "primary",
  disabled = false,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const liveId = useId();
  const [liveMessage, setLiveMessage] = useState("");
  const outOfStock = product.inventory_quantity <= 0;

  function handleAdd() {
    if (outOfStock) {
      toast.error("This product is currently out of stock.");
      return;
    }

    addItem({
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        price: product.price,
        compare_at_price: product.compare_at_price,
        inventory_quantity: product.inventory_quantity,
        image_url: product.image_url,
      },
      quantity,
      variant_id: variantId,
    });

    const message = `Added ${quantity} × ${product.name} to cart.`;
    setLiveMessage(message);
    toast.success(message);
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={disabled || outOfStock}
        onClick={handleAdd}
        className={cn(className)}
        aria-describedby={liveId}
      >
        <ShoppingCart aria-hidden="true" />
        {outOfStock ? "Out of Stock" : label}
      </Button>
      <span id={liveId} className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </span>
    </>
  );
}
