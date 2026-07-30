"use server";

import { getProductById } from "@/lib/data/products";
import type { Product } from "@/types";

export async function getWishlistProducts(ids: string[]): Promise<Product[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return [];

  const results = await Promise.all(unique.map((id) => getProductById(id)));
  return results.filter((p): p is Product => p != null);
}
