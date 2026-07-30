"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";
import type { ProductImage } from "@/types";
import { cn } from "@/lib/utils";

export type ProductGalleryProps = {
  images: ProductImage[];
  productName: string;
  className?: string;
};

export function ProductGallery({
  images,
  productName,
  className,
}: ProductGalleryProps) {
  const sorted = useMemo(() => {
    if (images.length === 0) {
      return [
        {
          id: "placeholder",
          product_id: "",
          url: "/images/products/titan-premium-vented-hard-hat.svg",
          alt_text: productName,
          sort_order: 0,
          is_primary: true,
        } satisfies ProductImage,
      ];
    }
    return [...images].sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return a.sort_order - b.sort_order;
    });
  }, [images, productName]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const active = sorted[Math.min(activeIndex, sorted.length - 1)]!;

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className="relative aspect-square overflow-hidden rounded-sm border border-border-gray bg-light-gray"
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
      >
        <button
          type="button"
          className="relative h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-titan-yellow"
          onClick={() => setZoomed((prev) => !prev)}
          aria-label={zoomed ? "Exit image zoom" : "Zoom product image"}
        >
          <Image
            src={active.url}
            alt={active.alt_text ?? productName}
            fill
            priority
            className={cn(
              "object-contain p-6 transition-transform duration-300",
              zoomed ? "scale-150" : "scale-100",
            )}
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-sm bg-white/90 px-2 py-1 text-xs font-medium text-dark-charcoal">
            <ZoomIn className="size-3.5" aria-hidden="true" />
            Zoom
          </span>
        </button>
      </div>

      {sorted.length > 1 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Product images">
          {sorted.map((image, index) => {
            const selected = index === activeIndex;
            return (
              <li key={image.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveIndex(index);
                    setZoomed(false);
                  }}
                  aria-label={`View image ${index + 1}`}
                  aria-current={selected ? "true" : undefined}
                  className={cn(
                    "relative size-16 overflow-hidden rounded-sm border bg-light-gray transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow sm:size-20",
                    selected
                      ? "border-dark-charcoal"
                      : "border-border-gray hover:border-medium-gray",
                  )}
                >
                  <Image
                    src={image.url}
                    alt={image.alt_text ?? `${productName} thumbnail ${index + 1}`}
                    fill
                    className="object-contain p-1.5"
                    sizes="80px"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
