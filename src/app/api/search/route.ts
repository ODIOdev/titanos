import { NextResponse } from "next/server";
import { getProductStockQuantity } from "@/lib/catalog/product-stock";
import { searchProducts } from "@/lib/data/products";
import type { StorefrontProductPreview } from "@/components/products/product-preview-dialog";

const FALLBACK_IMAGE = "/images/products/titan-premium-vented-hard-hat.svg";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 1) {
    return NextResponse.json({ products: [], results: [] });
  }

  const products = await searchProducts(q, 8);
  const payload = products.map((product) => {
    const imageUrl =
      product.image_url ??
      product.images?.find((img) => img.is_primary)?.url ??
      product.images?.[0]?.url ??
      FALLBACK_IMAGE;

    const preview: StorefrontProductPreview = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      imageUrl,
      brandName: product.brand?.name ?? null,
      categoryName: product.category?.name ?? null,
      price: Number(product.price ?? 0),
      compareAtPrice:
        product.compare_at_price != null
          ? Number(product.compare_at_price)
          : null,
      inventoryQuantity: getProductStockQuantity(product),
      lowStockThreshold: product.low_stock_threshold ?? 0,
      shortDescription: product.short_description,
    };

    return {
      id: preview.id,
      name: preview.name,
      slug: preview.slug,
      sku: preview.sku,
      price: preview.price,
      image_url: preview.imageUrl,
      preview,
    };
  });

  return NextResponse.json({ products: payload, results: payload });
}
