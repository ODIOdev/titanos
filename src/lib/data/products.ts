import { departmentForProductType } from "@/lib/data/catalog-options";
import {
  SEED_BRANDS,
  SEED_CATEGORIES,
  SEED_PRODUCTS,
  type SeedProduct,
} from "@/lib/data/seed-data";
import { productMatchesQuery } from "@/lib/search";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Brand, Category, Product, ProductFilters } from "@/types";

function seedToProduct(p: SeedProduct): Product {
  const brand = SEED_BRANDS.find((b) => b.id === p.brand_id) ?? null;
  const category = SEED_CATEGORIES.find((c) => c.id === p.category_id) ?? null;
  return {
    ...p,
    cost: p.cost,
    department: departmentForProductType(p.product_type),
    metadata: {
      certifications: p.certifications,
      features: p.features,
    },
    brand: brand
      ? {
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          description: brand.description,
          logo_url: brand.logo_url,
          active: brand.active,
        }
      : null,
    category: category
      ? {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          image_url: category.image_url,
          parent_id: null,
          sort_order: category.sort_order,
          active: category.active,
        }
      : null,
    images: [
      {
        id: `${p.id}-img`,
        product_id: p.id,
        url: p.image_url,
        alt_text: p.name,
        sort_order: 0,
        is_primary: true,
      },
    ],
    specifications: p.specifications.map((s, i) => ({
      id: `${p.id}-spec-${i}`,
      product_id: p.id,
      name: s.name,
      value: s.value,
      sort_order: i,
    })),
  };
}

function filterSeedProducts(filters: ProductFilters = {}): Product[] {
  let products = SEED_PRODUCTS.filter((p) => p.active).map(seedToProduct);

  if (filters.category) {
    const cat = SEED_CATEGORIES.find(
      (c) => c.slug === filters.category || c.id === filters.category,
    );
    if (cat) {
      products = products.filter((p) => p.category_id === cat.id);
    }
  }

  if (filters.brand) {
    const brand = SEED_BRANDS.find(
      (b) => b.slug === filters.brand || b.id === filters.brand,
    );
    if (brand) {
      products = products.filter((p) => p.brand_id === brand.id);
    }
  }

  if (filters.department) {
    products = products.filter((p) => p.department === filters.department);
  }

  if (filters.minPrice != null) {
    products = products.filter((p) => p.price >= filters.minPrice!);
  }
  if (filters.maxPrice != null) {
    products = products.filter((p) => p.price <= filters.maxPrice!);
  }
  if (filters.productType) {
    products = products.filter((p) => p.product_type === filters.productType);
  }
  if (filters.ansiClass) {
    products = products.filter((p) => p.ansi_class === filters.ansiClass);
  }
  if (filters.color) {
    products = products.filter(
      (p) => p.color?.toLowerCase() === filters.color!.toLowerCase(),
    );
  }
  if (filters.size) {
    products = products.filter(
      (p) => p.size?.toLowerCase() === filters.size!.toLowerCase(),
    );
  }
  if (filters.availability === "in_stock") {
    products = products.filter((p) => p.inventory_quantity > 0);
  }
  if (filters.rating) {
    products = products.filter((p) => p.rating_avg >= filters.rating!);
  }
  if (filters.featured) {
    products = products.filter((p) => p.featured);
  }
  if (filters.bestseller) {
    products = products.filter((p) => p.bestseller);
  }
  if (filters.q) {
    products = products.filter((p) => productMatchesQuery(p, filters.q!));
  }

  switch (filters.sort) {
    case "newest":
      break;
    case "price_asc":
      products.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      products.sort((a, b) => b.price - a.price);
      break;
    case "best_selling":
      products.sort((a, b) => Number(b.bestseller) - Number(a.bestseller));
      break;
    case "rating":
      products.sort((a, b) => b.rating_avg - a.rating_avg);
      break;
    default:
      products.sort((a, b) => Number(b.featured) - Number(a.featured));
  }

  return products;
}

export async function getProducts(
  filters: ProductFilters = {},
  pageSize = 12,
): Promise<{ products: Product[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, filters.page ?? 1);

  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      let query = supabase
        .from("products")
        .select(
          "*, brand:brands(*), category:categories(*), images:product_images(*)",
          { count: "exact" },
        )
        .eq("active", true);

      if (filters.category) {
        const { data: cat } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", filters.category)
          .maybeSingle();
        if (cat) query = query.eq("category_id", cat.id);
      }
      if (filters.brand) {
        const { data: brand } = await supabase
          .from("brands")
          .select("id")
          .eq("slug", filters.brand)
          .maybeSingle();
        if (brand) query = query.eq("brand_id", brand.id);
      }
      if (filters.department) {
        query = query.eq("department", filters.department);
      }
      if (filters.minPrice != null) query = query.gte("price", filters.minPrice);
      if (filters.maxPrice != null) query = query.lte("price", filters.maxPrice);
      if (filters.productType) query = query.eq("product_type", filters.productType);
      if (filters.ansiClass) query = query.eq("ansi_class", filters.ansiClass);
      if (filters.color) query = query.ilike("color", filters.color);
      if (filters.size) query = query.ilike("size", filters.size);
      if (filters.availability === "in_stock") query = query.gt("inventory_quantity", 0);
      if (filters.rating) query = query.gte("rating_avg", filters.rating);
      if (filters.featured) query = query.eq("featured", true);
      if (filters.bestseller) query = query.eq("bestseller", true);

      const hasTextSearch = Boolean(filters.q?.trim());

      switch (filters.sort) {
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        case "price_asc":
          query = query.order("price", { ascending: true });
          break;
        case "price_desc":
          query = query.order("price", { ascending: false });
          break;
        case "best_selling":
          query = query.order("bestseller", { ascending: false });
          break;
        case "rating":
          query = query.order("rating_avg", { ascending: false });
          break;
        default:
          query = query.order("featured", { ascending: false }).order("name");
      }

      // Text search spans brand/category/tag — load the filtered set then paginate in memory.
      const from = (page - 1) * pageSize;
      const { data, count, error } = hasTextSearch
        ? await query
        : await query.range(from, from + pageSize - 1);
      if (error) throw error;

      let products = (data ?? []).map((row) => {
        const mapped = row as unknown as Product & { images?: Product["images"] };
        const images = mapped.images ?? [];
        const primary = images.find((i) => i.is_primary) ?? images[0];
        return {
          ...mapped,
          price: Number(mapped.price),
          compare_at_price:
            mapped.compare_at_price != null ? Number(mapped.compare_at_price) : null,
          image_url: primary?.url ?? null,
        } satisfies Product;
      });

      if (hasTextSearch) {
        products = products.filter((p) => productMatchesQuery(p, filters.q!));
        const total = products.length;
        return {
          products: products.slice(from, from + pageSize),
          total,
          page,
          pageSize,
        };
      }

      return { products, total: count ?? 0, page, pageSize };
    } catch {
      // Fall through to seed data
    }
  }

  const all = filterSeedProducts(filters);
  const start = (page - 1) * pageSize;
  return {
    products: all.slice(start, start + pageSize),
    total: all.length,
    page,
    pageSize,
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("products")
        .select(
          "*, brand:brands(*), category:categories(*), images:product_images(*), specifications:product_specifications(*)",
        )
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        const mapped = data as unknown as Product & { images?: Product["images"] };
        const images = mapped.images ?? [];
        const primary = images.find((i) => i.is_primary) ?? images[0];
        return {
          ...mapped,
          price: Number(mapped.price),
          compare_at_price:
            mapped.compare_at_price != null ? Number(mapped.compare_at_price) : null,
          image_url: primary?.url ?? null,
        } satisfies Product;
      }
    } catch {
      // Fall through
    }
  }

  const seed = SEED_PRODUCTS.find((p) => p.slug === slug && p.active);
  return seed ? seedToProduct(seed) : null;
}

export async function getProductById(id: string): Promise<Product | null> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("products")
        .select("*, brand:brands(*), category:categories(*), images:product_images(*)")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        const mapped = data as unknown as Product;
        return {
          ...mapped,
          price: Number(mapped.price),
          compare_at_price:
            mapped.compare_at_price != null ? Number(mapped.compare_at_price) : null,
        } satisfies Product;
      }
    } catch {
      // Fall through
    }
  }
  const seed = SEED_PRODUCTS.find((p) => p.id === id);
  return seed ? seedToProduct(seed) : null;
}

export async function getCategories(): Promise<Category[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (data?.length) return data as Category[];
    } catch {
      // Fall through
    }
  }
  return SEED_CATEGORIES.map((c) => ({ ...c, parent_id: null }));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function getBrands(): Promise<Brand[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase.from("brands").select("*").eq("active", true).order("name");
      if (data?.length) return data as Brand[];
    } catch {
      // Fall through
    }
  }
  return SEED_BRANDS;
}

export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  const { products } = await getProducts({ featured: true }, limit);
  return products;
}

export async function getBestsellerProducts(limit = 8): Promise<Product[]> {
  const { products } = await getProducts({ bestseller: true, sort: "best_selling" }, limit);
  return products;
}

export async function searchProducts(query: string, limit = 8): Promise<Product[]> {
  const { products } = await getProducts({ q: query }, limit);
  return products;
}
