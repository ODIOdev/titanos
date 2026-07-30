import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";
import { SEED_PRODUCTS, SEED_CATEGORIES } from "@/lib/data/seed-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/shop",
    "/search",
    "/cart",
    "/quote",
    "/bulk-orders",
    "/brands",
    "/resources",
    "/about",
    "/contact",
    "/faq",
    "/shipping",
    "/returns",
    "/privacy",
    "/terms",
  ];

  const now = new Date();

  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(route),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
    ...SEED_CATEGORIES.map((c) => ({
      url: absoluteUrl(`/shop/${c.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...SEED_PRODUCTS.map((p) => ({
      url: absoluteUrl(`/product/${p.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
