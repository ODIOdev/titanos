"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductCarouselProps = {
  /** One `<li>` per slide, sized by the caller. */
  children: React.ReactNode;
  label: string;
  intervalMs?: number;
  className?: string;
};

export function ProductCarousel({
  children,
  label,
  intervalMs = 3500,
  className,
}: ProductCarouselProps) {
  const trackRef = React.useRef<HTMLUListElement>(null);
  const pausedRef = React.useRef(false);

  const step = React.useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;

    const slide = track.firstElementChild as HTMLElement | null;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    const distance = slide ? slide.offsetWidth + gap : track.clientWidth;
    const maxScroll = track.scrollWidth - track.clientWidth;

    let target = track.scrollLeft + direction * distance;
    if (direction === 1 && track.scrollLeft >= maxScroll - 4) target = 0;
    if (direction === -1 && track.scrollLeft <= 4) target = maxScroll;

    track.scrollTo({ left: target, behavior: "smooth" });
  }, []);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      if (pausedRef.current || document.hidden) return;
      step(1);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [intervalMs, step]);

  const pause = () => {
    pausedRef.current = true;
  };
  const resume = () => {
    pausedRef.current = false;
  };

  return (
    <div
      className={cn("relative", className)}
      onPointerEnter={pause}
      onPointerLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
    >
      <ul
        ref={trackRef}
        aria-label={label}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 sm:gap-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </ul>

      <CarouselButton
        direction="prev"
        onClick={() => step(-1)}
        className="left-1"
      />
      <CarouselButton
        direction="next"
        onClick={() => step(1)}
        className="right-1"
      />
    </div>
  );
}

function CarouselButton({
  direction,
  onClick,
  className,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  className?: string;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous products" : "Next products"}
      className={cn(
        "absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border-gray bg-white/95 text-dark-charcoal shadow-[0_6px_18px_rgba(15,15,15,0.14)] backdrop-blur transition-colors duration-200 hover:bg-white hover:text-near-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow sm:flex",
        className,
      )}
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  );
}
