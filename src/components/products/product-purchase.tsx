"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { QuantitySelector } from "@/components/products/quantity-selector";
import { WishlistButton } from "@/components/products/wishlist-button";
import { ColorSwatch } from "@/components/shared/color-swatch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCart } from "@/components/providers/cart-provider";
import { parseVariantRows } from "@/components/admin/variant-matrix-field";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

export type ProductPurchaseProps = {
  product: Product;
  className?: string;
};

export function ProductPurchase({ product, className }: ProductPurchaseProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const variants = useMemo(() => {
    if (product.metadata?.hasMultipleSizes !== true) return [];
    return parseVariantRows(product.metadata?.variants).filter(
      (row) => row.qty > 0 || row.color || row.size,
    );
  }, [product.metadata]);

  const hasMatrix = variants.length > 0;
  const colors = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const row of variants) {
      if (!row.color || seen.has(row.color)) continue;
      seen.add(row.color);
      list.push(row.color);
    }
    return list;
  }, [variants]);

  const [selectedColor, setSelectedColor] = useState("");
  const sizesForColor = useMemo(() => {
    return variants
      .filter((row) => row.color === selectedColor)
      .map((row) => row.size)
      .filter(Boolean);
  }, [variants, selectedColor]);

  const [selectedSize, setSelectedSize] = useState("");

  useEffect(() => {
    if (!selectedColor && colors[0]) {
      setSelectedColor(colors[0]);
    }
  }, [colors, selectedColor]);

  useEffect(() => {
    if (!sizesForColor.includes(selectedSize)) {
      setSelectedSize(sizesForColor[0] ?? "");
    }
  }, [sizesForColor, selectedSize]);
  const activeVariant = variants.find(
    (row) => row.color === selectedColor && row.size === selectedSize,
  );

  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);

  const stock = hasMatrix
    ? (activeVariant?.qty ?? 0)
    : product.inventory_quantity;
  const outOfStock = stock <= 0;
  const maxQty = Math.max(1, stock);
  const selectionReady =
    !hasMatrix || (Boolean(selectedColor) && Boolean(selectedSize));

  function snapshot() {
    const label =
      hasMatrix && selectedColor && selectedSize
        ? `${product.name} — ${selectedColor} / ${selectedSize}`
        : product.name;
    return {
      id: product.id,
      name: label,
      slug: product.slug,
      sku: product.sku,
      price: product.price,
      compare_at_price: product.compare_at_price,
      inventory_quantity: stock,
      image_url:
        product.image_url ??
        product.images?.find((img) => img.is_primary)?.url ??
        product.images?.[0]?.url ??
        null,
    };
  }

  function variantKey() {
    if (!hasMatrix || !selectedColor || !selectedSize) return null;
    return `${selectedColor}::${selectedSize}`;
  }

  function handleBuyNow() {
    if (outOfStock) {
      toast.error("This product is currently out of stock.");
      return;
    }
    if (!selectionReady) {
      toast.error("Select a color and size first.");
      return;
    }
    setBuying(true);
    addItem({
      product: snapshot(),
      quantity,
      variant_id: variantKey(),
    });
    toast.success(`Added ${quantity} × ${snapshot().name} to cart.`);
    router.push("/cart");
  }

  return (
    <div className={cn("space-y-5", className)}>
      {hasMatrix ? (
        <>
          <div>
            <Label className="mb-2 block text-sm font-semibold text-dark-charcoal">
              Color
            </Label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => {
                const selected = selectedColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      setSelectedColor(color);
                      const nextSizes = variants
                        .filter((row) => row.color === color)
                        .map((row) => row.size);
                      if (!nextSizes.includes(selectedSize)) {
                        setSelectedSize(nextSizes[0] ?? "");
                      }
                    }}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-sm border px-3 py-2 text-sm transition-colors",
                      selected
                        ? "border-dark-charcoal bg-light-gray"
                        : "border-border-gray hover:border-dark-charcoal/40",
                    )}
                  >
                    <ColorSwatch color={color} />
                    {color}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="mb-2 block text-sm font-semibold text-dark-charcoal">
              Size
            </Label>
            <div className="flex flex-wrap gap-2">
              {sizesForColor.map((size) => {
                const row = variants.find(
                  (v) => v.color === selectedColor && v.size === size,
                );
                const disabled = (row?.qty ?? 0) <= 0;
                const selected = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "min-w-12 rounded-sm border px-3 py-2 text-sm font-semibold transition-colors",
                      selected
                        ? "border-dark-charcoal bg-dark-charcoal text-white"
                        : "border-border-gray text-dark-charcoal hover:border-dark-charcoal/40",
                      disabled && "cursor-not-allowed opacity-40",
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <>
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
              <p className="inline-flex items-center gap-2 rounded-sm border border-border-gray bg-light-gray px-3 py-2 text-sm text-dark-charcoal">
                <ColorSwatch color={product.color} />
                {product.color}
              </p>
            </div>
          ) : null}
        </>
      )}

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
          disabled={outOfStock || !selectionReady}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <AddToCartButton
          product={snapshot()}
          quantity={quantity}
          variantId={variantKey()}
          size="lg"
          className="min-w-[10rem] flex-1 sm:flex-none"
          disabled={!selectionReady}
        />
        <Button
          type="button"
          variant="secondary"
          size="lg"
          disabled={outOfStock || buying || !selectionReady}
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
