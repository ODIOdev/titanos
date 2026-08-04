"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const index = Math.min(activeIndex, sorted.length - 1);
  const active = sorted[index]!;
  const multiple = sorted.length > 1;

  useEffect(() => {
    if (!previewOpen || !multiple) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        setActiveIndex((prev) => (prev + 1) % sorted.length);
      } else if (event.key === "ArrowLeft") {
        setActiveIndex((prev) => (prev - 1 + sorted.length) % sorted.length);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewOpen, multiple, sorted.length]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative aspect-square overflow-hidden rounded-sm border border-border-gray bg-white">
        <button
          type="button"
          className="relative h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-titan-yellow"
          onClick={() => setPreviewOpen(true)}
          aria-label="Open image preview"
        >
          <span className="absolute inset-4 overflow-hidden rounded-sm border border-border-gray sm:inset-6">
            <Image
              src={active.url}
              alt={active.alt_text ?? productName}
              fill
              priority
              className="object-contain p-4 sm:p-5"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </span>
          <span className="pointer-events-none absolute bottom-3 right-3 z-10 inline-flex items-center gap-1 rounded-sm bg-white/90 px-2 py-1 text-xs font-medium text-dark-charcoal shadow-sm">
            <Expand className="size-3.5" aria-hidden="true" />
            Preview
          </span>
        </button>
      </div>

      {multiple ? (
        <ul className="flex flex-wrap gap-2" aria-label="Product images">
          {sorted.map((image, thumbIndex) => {
            const selected = thumbIndex === index;
            return (
              <li key={image.id}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(thumbIndex)}
                  aria-label={`View image ${thumbIndex + 1}`}
                  aria-current={selected ? "true" : undefined}
                  className={cn(
                    "relative size-16 overflow-hidden rounded-sm border bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow sm:size-20",
                    selected
                      ? "border-dark-charcoal"
                      : "border-border-gray hover:border-medium-gray",
                  )}
                >
                  <span className="absolute inset-1 overflow-hidden rounded-[2px] border border-border-gray">
                    <Image
                      src={image.url}
                      alt={
                        image.alt_text ??
                        `${productName} thumbnail ${thumbIndex + 1}`
                      }
                      fill
                      className="object-contain p-1"
                      sizes="80px"
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <Dialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={productName}
        description={
          multiple ? `Image ${index + 1} of ${sorted.length}` : undefined
        }
        className="max-w-4xl"
      >
        <div className="relative">
          <div className="relative h-[60vh] w-full overflow-hidden bg-white">
            <span className="absolute inset-3 overflow-hidden rounded-sm border border-border-gray sm:inset-6">
              <Image
                src={active.url}
                alt={active.alt_text ?? productName}
                fill
                className="object-contain p-4 sm:p-6"
                sizes="90vw"
                unoptimized={
                  active.url.startsWith("data:") ||
                  active.url.startsWith("blob:")
                }
              />
            </span>
          </div>

          {multiple ? (
            <>
              <button
                type="button"
                onClick={() =>
                  setActiveIndex(
                    (prev) => (prev - 1 + sorted.length) % sorted.length,
                  )
                }
                aria-label="Previous image"
                className="absolute left-2 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-sm border border-border-gray bg-white/90 text-dark-charcoal transition-colors hover:bg-white"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveIndex((prev) => (prev + 1) % sorted.length)
                }
                aria-label="Next image"
                className="absolute right-2 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-sm border border-border-gray bg-white/90 text-dark-charcoal transition-colors hover:bg-white"
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            </>
          ) : null}
        </div>
      </Dialog>
    </div>
  );
}
