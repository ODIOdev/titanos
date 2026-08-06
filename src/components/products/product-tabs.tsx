"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/data/seed-data";
import { formatCurrency, cn } from "@/lib/utils";
import type { Product } from "@/types";

export type ProductTabsProps = {
  product: Product;
  certifications?: string[];
  className?: string;
};

type TabId = "description" | "certifications" | "shipping" | "returns";

const TABS: { id: TabId; label: string }[] = [
  { id: "description", label: "Description" },
  { id: "certifications", label: "Safety Certifications" },
  { id: "shipping", label: "Shipping" },
  { id: "returns", label: "Returns" },
];

function getCertifications(
  product: Product,
  certifications?: string[],
): string[] {
  if (certifications && certifications.length > 0) return certifications;
  const meta = product.metadata;
  if (meta && Array.isArray(meta.certifications)) {
    return meta.certifications.filter(
      (item): item is string => typeof item === "string",
    );
  }
  return [];
}

function DescriptionPanel({ product }: { product: Product }) {
  return (
    <div className="prose prose-sm max-w-none text-dark-charcoal">
      <p className="whitespace-pre-line leading-relaxed text-medium-gray">
        {product.description ??
          product.short_description ??
          "No description available for this product."}
      </p>
      {Array.isArray(product.metadata?.features) ? (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-medium-gray">
          {(product.metadata.features as unknown[])
            .filter((f): f is string => typeof f === "string")
            .map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
        </ul>
      ) : null}
    </div>
  );
}

function CertificationsPanel({ items }: { items: string[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-medium-gray">
        Certification details are provided on the product packaging and data
        sheet.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-sm border border-border-gray bg-light-gray px-4 py-3 text-sm font-medium text-dark-charcoal"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function ShippingPanel() {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-medium-gray">
      <p>
        Most in-stock items ship within 1–2 business days from our Houston
        distribution center.
      </p>
      <p>
        Free standard shipping on qualifying orders over{" "}
        {formatCurrency(FREE_SHIPPING_THRESHOLD)}. Expedited options are
        available at checkout.
      </p>
      <p>
        Oversized traffic-control equipment may require freight scheduling —
        contact sales for pallet quotes.
      </p>
    </div>
  );
}

function ReturnsPanel({ productSlug }: { productSlug: string }) {
  const returnsHref = `/returns?from=${encodeURIComponent(`/product/${productSlug}`)}`;

  return (
    <div className="space-y-3 text-sm leading-relaxed text-medium-gray">
      <p>
        Unused products in original packaging may be returned within 30 days of
        delivery for a refund or exchange.
      </p>
      <p>
        Custom-printed signage and personalized gear are final sale unless
        defective.
      </p>
      <p>
        See our{" "}
        <Link
          href={returnsHref}
          className="font-medium text-dark-charcoal underline underline-offset-2"
        >
          Returns Policy
        </Link>{" "}
        for full details.
      </p>
    </div>
  );
}

function TabContent({
  id,
  product,
  certifications,
}: {
  id: TabId;
  product: Product;
  certifications: string[];
}) {
  switch (id) {
    case "description":
      return <DescriptionPanel product={product} />;
    case "certifications":
      return <CertificationsPanel items={certifications} />;
    case "shipping":
      return <ShippingPanel />;
    case "returns":
      return <ReturnsPanel productSlug={product.slug} />;
    default:
      return null;
  }
}

export function ProductTabs({
  product,
  certifications,
  className,
}: ProductTabsProps) {
  const baseId = useId();
  const [active, setActive] = useState<TabId>("description");
  const [openMobile, setOpenMobile] = useState<TabId | null>("description");
  const certs = getCertifications(product, certifications);

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop tabs */}
      <div className="hidden md:block">
        <div
          role="tablist"
          aria-label="Product information"
          className="flex flex-wrap gap-1 border-b border-border-gray"
        >
          {TABS.map((tab) => {
            const selected = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`${baseId}-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(tab.id)}
                className={cn(
                  "px-4 py-3 font-heading text-sm uppercase tracking-wide transition-colors",
                  selected
                    ? "border-b-2 border-titan-yellow text-dark-charcoal"
                    : "text-medium-gray hover:text-dark-charcoal",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        {TABS.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`${baseId}-panel-${tab.id}`}
            aria-labelledby={`${baseId}-tab-${tab.id}`}
            hidden={active !== tab.id}
            className="pt-6"
          >
            {active === tab.id ? (
              <TabContent
                id={tab.id}
                product={product}
                certifications={certs}
              />
            ) : null}
          </div>
        ))}
      </div>

      {/* Mobile accordion */}
      <div className="space-y-2 md:hidden">
        {TABS.map((tab) => {
          const isOpen = openMobile === tab.id;
          return (
            <div
              key={tab.id}
              className="overflow-hidden rounded-sm border border-border-gray"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() =>
                  setOpenMobile((prev) => (prev === tab.id ? null : tab.id))
                }
                className="flex w-full items-center justify-between gap-3 bg-white px-4 py-3 text-left"
              >
                <span className="font-heading text-sm uppercase tracking-wide text-dark-charcoal">
                  {tab.label}
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-medium-gray transition-transform",
                    isOpen && "rotate-180",
                  )}
                  aria-hidden="true"
                />
              </button>
              {isOpen ? (
                <div className="border-t border-border-gray bg-white px-4 py-4">
                  <TabContent
                    id={tab.id}
                    product={product}
                    certifications={certs}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
