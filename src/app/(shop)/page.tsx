import { HeroSection } from "@/components/home/hero-section";
import { TrustStrip } from "@/components/home/trust-strip";
import { IndustrySolutions } from "@/components/home/industry-solutions";
import { BulkOrderCta } from "@/components/home/bulk-order-cta";
import { NewsletterForm } from "@/components/home/newsletter-form";
import { ProductCard } from "@/components/products/product-card";
import { ProductCarousel } from "@/components/products/product-carousel";
import { ProductGrid } from "@/components/products/product-grid";
import { SectionHeader } from "@/components/shared/section-header";
import { getFeaturedProducts, getBestsellerProducts } from "@/lib/data/products";

export default async function HomePage() {
  const [featured, bestsellers] = await Promise.all([
    getFeaturedProducts(6),
    getBestsellerProducts(8),
  ]);

  return (
    <div className="home-page">
      <HeroSection />

      <section className="home-section bg-light-gray pb-6 pt-4 @3xl:py-14 @5xl:py-16">
        <div className="container-titan">
          <SectionHeader
            variant="rail"
            title="Featured products"
            description="Top-rated gear ready for your next jobsite."
            href="/shop"
            linkLabel="Shop all"
          />
          <ProductGrid products={featured} />
        </div>
      </section>

      <TrustStrip />
      <IndustrySolutions />

      <section className="home-section bg-white pb-6 pt-4 @3xl:py-14 @5xl:py-16">
        <div className="container-titan">
          <SectionHeader
            variant="rail"
            title="Bestsellers"
            description="Products crews reorder again and again."
            href="/shop?sort=best_selling"
            linkLabel="View all"
          />
          <ProductCarousel label="Bestselling products">
            {bestsellers.map((product) => (
              <li
                key={product.id}
                className="w-[78%] shrink-0 snap-start @3xl:w-[calc((100%-1rem)/2)] @5xl:w-[calc((100%-3rem)/4)]"
              >
                <ProductCard product={product} />
              </li>
            ))}
          </ProductCarousel>
        </div>
      </section>

      <BulkOrderCta />
      <NewsletterForm />
    </div>
  );
}
