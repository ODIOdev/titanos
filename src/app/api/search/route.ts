import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/data/products";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 2) {
    return NextResponse.json({ products: [], results: [] });
  }

  const products = await searchProducts(q, 8);
  const payload = products.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    price: product.price,
    image_url:
      product.image_url ??
      product.images?.find((img) => img.is_primary)?.url ??
      product.images?.[0]?.url ??
      null,
  }));

  return NextResponse.json({ products: payload, results: payload });
}
