import { HeroSection } from "@/components/home/hero-section";
import { CategoryGrid } from "@/components/home/category-grid";
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
    <>
      <HeroSection />
      <CategoryGrid />

      <section className="section-y bg-light-gray">
        <div className="container-titan">
          <SectionHeader
            eyebrow="Top picks"
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

      <section className="section-y bg-white">
        <div className="container-titan">
          <SectionHeader
            eyebrow="Proven on the job"
            title="Bestsellers"
            description="Products crews reorder again and again."
            href="/shop?sort=best_selling"
            linkLabel="View bestsellers"
          />
          <ProductCarousel label="Bestselling products">
            {bestsellers.map((product) => (
              <li
                key={product.id}
                className="w-[78%] shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-3rem)/4)]"
              >
                <ProductCard product={product} />
              </li>
            ))}
          </ProductCarousel>
        </div>
      </section>

      <BulkOrderCta />
      <NewsletterForm />
    </>
  );
}
