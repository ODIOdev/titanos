import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { PriceDisplay } from "@/components/products/price-display";
import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { WishlistButton } from "@/components/products/wishlist-button";
import type { Product } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";

export type ProductCardProps = {
  product: Product;
  className?: string;
  priority?: boolean;
};

function stockLabel(quantity: number, threshold: number) {
  if (quantity <= 0) return { text: "Out of stock", tone: "out" as const };
  if (quantity <= threshold) return { text: "Low stock", tone: "low" as const };
  return { text: "In stock", tone: "in" as const };
}

export function ProductCard({
  product,
  className,
  priority = false,
}: ProductCardProps) {
  const imageUrl =
    product.image_url ??
    product.images?.find((img) => img.is_primary)?.url ??
    product.images?.[0]?.url ??
    "/images/products/titan-premium-vented-hard-hat.svg";

  const onSale =
    product.compare_at_price != null && product.compare_at_price > product.price;
  const savings = onSale ? product.compare_at_price! - product.price : 0;
  const percentOff = onSale
    ? Math.round((savings / product.compare_at_price!) * 100)
    : 0;
  const stock = stockLabel(
    product.inventory_quantity,
    product.low_stock_threshold,
  );
  const showStock = stock.tone !== "in";
  const specs = [product.ansi_class, product.color, product.size].filter(
    Boolean,
  ) as string[];

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-sm border border-border-gray bg-white transition-[border-color,box-shadow] duration-200 hover:border-dark-charcoal hover:shadow-sm",
        className,
      )}
    >
      <div className="relative">
        <Link
          href={`/product/${product.slug}`}
          className="relative block aspect-square overflow-hidden bg-light-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-titan-yellow"
        >
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            priority={priority}
            className="object-contain p-5"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </Link>

        <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5">
          {onSale ? (
            <Badge variant="sale">
              {percentOff > 0 ? `Save ${percentOff}%` : "Sale"}
            </Badge>
          ) : null}
          {product.bestseller ? (
            <Badge variant="bestseller">Bestseller</Badge>
          ) : null}
        </div>

        <div className="absolute right-2 top-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <WishlistButton
            productId={product.id}
            productName={product.name}
            className="bg-white/90"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="min-h-0 flex-1">
          {product.brand?.name ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-medium-gray">
              {product.brand.name}
            </p>
          ) : null}
          <Link
            href={`/product/${product.slug}`}
            className="mt-0.5 block font-heading text-sm uppercase leading-snug tracking-wide text-dark-charcoal line-clamp-2 transition-colors hover:text-near-black sm:text-base"
          >
            {product.name}
          </Link>
          <p className="mt-1 text-xs text-medium-gray">SKU: {product.sku}</p>
          {specs.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1">
              {specs.slice(0, 3).map((spec) => (
                <li
                  key={spec}
                  className="rounded-sm bg-light-gray px-1.5 py-0.5 text-[11px] font-medium text-medium-gray"
                >
                  {spec}
                </li>
              ))}
            </ul>
          ) : null}
          {product.rating_count > 0 ? (
            <div className="mt-2">
              <StarRating
                rating={product.rating_avg}
                count={product.rating_count}
                size="sm"
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
          <PriceDisplay
            price={product.price}
            compareAtPrice={product.compare_at_price}
            size="md"
          />
          {savings > 0 ? (
            <span className="text-xs font-semibold text-success-green">
              Save {formatCurrency(savings)}
            </span>
          ) : null}
        </div>

        {showStock ? (
          <p
            className={cn(
              "text-xs font-medium",
              stock.tone === "low" && "text-warning-orange",
              stock.tone === "out" && "text-red-700",
            )}
          >
            {stock.text}
          </p>
        ) : null}

        <AddToCartButton
          product={product}
          quantity={1}
          size="sm"
          className="mt-auto w-full"
          label="Add to Cart"
          disabled={stock.tone === "out"}
        />
      </div>
    </article>
  );
}
