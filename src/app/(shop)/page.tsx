import Link from "next/link";
import { HeroSection } from "@/components/home/hero-section";
import { BenefitsPanel } from "@/components/home/benefits-panel";
import { CategoryGrid } from "@/components/home/category-grid";
import { TrustStrip } from "@/components/home/trust-strip";
import { IndustrySolutions } from "@/components/home/industry-solutions";
import { BulkOrderCta } from "@/components/home/bulk-order-cta";
import { NewsletterForm } from "@/components/home/newsletter-form";
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
      <BenefitsPanel />
      <CategoryGrid />
      <TrustStrip />

      <section className="section-y bg-white">
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

      <IndustrySolutions />
      <BulkOrderCta />

      <section className="section-y bg-light-gray">
        <div className="container-titan">
          <SectionHeader
            eyebrow="Proven on the job"
            title="Bestsellers"
            description="Products crews reorder again and again."
            href="/shop?sort=best_selling"
            linkLabel="View bestsellers"
          />
          <ProductGrid products={bestsellers} />
        </div>
      </section>

      <NewsletterForm />
    </>
  );
}
