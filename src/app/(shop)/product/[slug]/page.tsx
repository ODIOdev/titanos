import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Truck } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductPurchase } from "@/components/products/product-purchase";
import { ProductReviewForm } from "@/components/products/product-review-form";
import { ProductTabs } from "@/components/products/product-tabs";
import { PriceDisplay } from "@/components/products/price-display";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import {
  getFeaturedProducts,
  getProductBySlug,
  getProducts,
} from "@/lib/data/products";
import {
  getApprovedReviews,
  getMyProductReview,
} from "@/lib/data/reviews";
import { FREE_SHIPPING_THRESHOLD, SITE_CONFIG } from "@/lib/data/seed-data";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { absoluteUrl, formatCurrency } from "@/lib/utils";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

function stockCopy(quantity: number, threshold: number) {
  if (quantity <= 0) {
    return { label: "Out of stock", className: "text-red-700" };
  }
  if (quantity <= threshold) {
    return {
      label: `Low stock — only ${quantity} left`,
      className: "text-amber-700",
    };
  }
  return {
    label: `In stock (${quantity} available)`,
    className: "text-green-700",
  };
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: "Product Not Found" };
  }

  const description =
    product.short_description ??
    product.description ??
    `Buy ${product.name} from ${SITE_CONFIG.name}.`;
  const image =
    product.image_url ??
    product.images?.find((img) => img.is_primary)?.url ??
    product.images?.[0]?.url;

  return {
    title: product.name,
    description,
    alternates: {
      canonical: absoluteUrl(`/product/${product.slug}`),
    },
    openGraph: {
      title: `${product.name} | ${SITE_CONFIG.name}`,
      description,
      url: absoluteUrl(`/product/${product.slug}`),
      type: "website",
      images: image
        ? [{ url: absoluteUrl(image), alt: product.name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: image ? [absoluteUrl(image)] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const imageUrl =
    product.image_url ??
    product.images?.find((img) => img.is_primary)?.url ??
    product.images?.[0]?.url ??
    null;

  const galleryImages =
    product.images && product.images.length > 0
      ? product.images
      : imageUrl
        ? [
            {
              id: `${product.id}-primary`,
              product_id: product.id,
              url: imageUrl,
              alt_text: product.name,
              sort_order: 0,
              is_primary: true,
            },
          ]
        : [];

  const stock = stockCopy(
    product.inventory_quantity,
    product.low_stock_threshold,
  );

  const [relatedResult, featured, reviews, myReview, authUser] =
    await Promise.all([
      product.category?.slug
        ? getProducts({ category: product.category.slug, sort: "featured" }, 8)
        : Promise.resolve({
            products: [] as Awaited<
              ReturnType<typeof getProducts>
            >["products"],
          }),
      getFeaturedProducts(6),
      getApprovedReviews(product.id),
      getMyProductReview(product.id),
      (async () => {
        if (!isSupabaseConfigured()) return null;
        try {
          const { createClient } = await import("@/lib/supabase/server");
          const supabase = await createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          return user;
        } catch {
          return null;
        }
      })(),
    ]);

  const related = relatedResult.products
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const frequentlyBought = featured
    .filter((p) => p.id !== product.id)
    .slice(0, 3);

  const isAuthenticated = Boolean(authUser);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.short_description ?? product.description ?? product.name,
    sku: product.sku,
    image: imageUrl ? absoluteUrl(imageUrl) : undefined,
    brand: product.brand
      ? { "@type": "Brand", name: product.brand.name }
      : undefined,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/product/${product.slug}`),
      priceCurrency: "USD",
      price: product.price.toFixed(2),
      availability:
        product.inventory_quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: SITE_CONFIG.name,
      },
    },
    aggregateRating:
      product.rating_count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating_avg,
            reviewCount: product.rating_count,
          }
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container-titan py-8 lg:py-12">
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            ...(product.category
              ? [
                  {
                    label: product.category.name,
                    href: `/shop/${product.category.slug}`,
                  },
                ]
              : []),
            { label: product.name },
          ]}
        />

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          <ProductGallery images={galleryImages} productName={product.name} />

          <div className="space-y-5">
            {product.brand ? (
              <p className="text-sm font-semibold tracking-wide text-medium-gray uppercase">
                {product.brand.name}
              </p>
            ) : null}

            <div className="space-y-2">
              <h1 className="font-heading text-3xl text-dark-charcoal uppercase md:text-4xl">
                {product.name}
              </h1>
              <p className="text-sm text-medium-gray">SKU: {product.sku}</p>
            </div>

            <div className="space-y-3">
              <ProductReviewForm
                productId={product.id}
                productSlug={product.slug}
                ratingAvg={product.rating_avg}
                ratingCount={product.rating_count}
                isAuthenticated={isAuthenticated}
                myReview={myReview}
                variant="hero"
              />
              <div className="flex flex-wrap items-center gap-2">
                {product.bestseller ? (
                  <Badge variant="bestseller">Bestseller</Badge>
                ) : null}
                {product.featured ? (
                  <Badge variant="default">Featured</Badge>
                ) : null}
              </div>
            </div>

            <PriceDisplay
              price={product.price}
              compareAtPrice={product.compare_at_price}
              size="lg"
            />

            <p className={`text-sm font-medium ${stock.className}`}>
              {stock.label}
            </p>

            {product.short_description ? (
              <p className="text-medium-gray leading-relaxed">
                {product.short_description}
              </p>
            ) : null}

            <ProductPurchase product={{ ...product, image_url: imageUrl }} />

            <div className="flex items-start gap-3 rounded-sm border border-border-gray bg-light-gray px-4 py-3">
              <Truck
                className="mt-0.5 size-5 shrink-0 text-dark-charcoal"
                aria-hidden="true"
              />
              <div className="text-sm text-medium-gray">
                <p className="font-medium text-dark-charcoal">
                  Estimated shipping
                </p>
                <p className="mt-1">
                  Most in-stock items ship within 1–2 business days. Free
                  standard shipping on orders over{" "}
                  {formatCurrency(FREE_SHIPPING_THRESHOLD)}.
                </p>
              </div>
            </div>

            <p className="text-sm text-medium-gray">
              Ordering for a crew or project?{" "}
              <Link
                href="/quote"
                className="font-semibold text-dark-charcoal underline underline-offset-2"
              >
                Request a bulk quote
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-14">
          <ProductTabs product={product} />
        </div>

        <section className="mt-16" aria-labelledby="reviews-heading">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2
                id="reviews-heading"
                className="font-heading text-2xl text-dark-charcoal uppercase md:text-3xl"
              >
                Customer Reviews
              </h2>
              <p className="mt-2 text-sm text-medium-gray">
                {product.rating_count > 0
                  ? `Based on ${product.rating_count} rating${product.rating_count === 1 ? "" : "s"}`
                  : "No ratings yet — be the first."}
              </p>
            </div>
            <StarRating
              rating={product.rating_avg}
              count={product.rating_count}
              showValue
              size="lg"
            />
          </div>

          <ProductReviewForm
            productId={product.id}
            productSlug={product.slug}
            ratingAvg={product.rating_avg}
            ratingCount={product.rating_count}
            isAuthenticated={isAuthenticated}
            myReview={myReview}
            variant="section"
            className="mb-6"
          />

          {reviews.length > 0 ? (
            <ul className="grid gap-4 md:grid-cols-3">
              {reviews.map((review) => (
                <li
                  key={review.id}
                  className="rounded-sm border border-border-gray bg-white p-5"
                >
                  <StarRating rating={review.rating} size="sm" />
                  {review.title ? (
                    <p className="mt-3 font-heading text-sm uppercase tracking-wide text-dark-charcoal">
                      {review.title}
                    </p>
                  ) : null}
                  {review.body ? (
                    <p className="mt-2 text-sm leading-relaxed text-medium-gray">
                      {review.body}
                    </p>
                  ) : null}
                  <p className="mt-4 text-xs font-semibold tracking-wide text-medium-gray uppercase">
                    {review.author_name}
                    {review.verified_purchase ? " · Verified purchase" : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-sm border border-dashed border-border-gray bg-light-gray/40 px-4 py-6 text-sm text-medium-gray">
              Ratings appear here after customers submit them. Use the stars
              above to leave yours.
            </p>
          )}
        </section>

        {frequentlyBought.length > 0 ? (
          <section className="mt-16" aria-labelledby="fbt-heading">
            <h2
              id="fbt-heading"
              className="mb-6 font-heading text-2xl text-dark-charcoal uppercase md:text-3xl"
            >
              Frequently Bought Together
            </h2>
            <ProductGrid products={frequentlyBought} className="xl:grid-cols-3" />
          </section>
        ) : null}

        {related.length > 0 ? (
          <section className="mt-16" aria-labelledby="related-heading">
            <h2
              id="related-heading"
              className="mb-6 font-heading text-2xl text-dark-charcoal uppercase md:text-3xl"
            >
              Related Products
            </h2>
            <ProductGrid products={related} />
          </section>
        ) : null}
      </div>
    </>
  );
}
