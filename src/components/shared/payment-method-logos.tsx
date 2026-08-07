import Image from "next/image";
import { cn } from "@/lib/utils";

/** Intrinsic pixel sizes of files in /public/images/payments (for aspect ratio). */
export const PAYMENT_LOGOS = [
  {
    name: "Visa",
    src: "/images/payments/visa.png",
    width: 208,
    height: 68,
  },
  {
    name: "Mastercard",
    src: "/images/payments/mastercard.svg",
    width: 100,
    height: 78,
  },
  {
    name: "American Express",
    src: "/images/payments/amex.svg",
    width: 100,
    height: 28,
  },
  {
    name: "Discover",
    src: "/images/payments/discover.png",
    width: 136,
    height: 23,
  },
  {
    name: "PayPal",
    src: "/images/payments/paypal.png",
    width: 124,
    height: 33,
  },
] as const;

/** Uniform badge size so every mark sits in the same footprint. */
const SLOT = "inline-flex h-9 w-[4.5rem] shrink-0 items-center justify-center";
const MARK =
  "h-auto max-h-[1.15rem] w-auto max-w-[3.65rem] object-contain object-center";

export function PaymentMethodLogos({
  className,
  itemClassName,
}: {
  className?: string;
  itemClassName?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-2", className)}>
      {PAYMENT_LOGOS.map((logo) => (
        <li
          key={logo.name}
          className={cn(
            SLOT,
            "rounded-sm border border-border-gray/80 bg-white px-1.5",
            itemClassName,
          )}
        >
          <Image
            src={logo.src}
            alt={logo.name}
            width={logo.width}
            height={logo.height}
            className={MARK}
            // Skip optimizer — small brand PNGs/SVGs get soft when resized twice.
            unoptimized
          />
        </li>
      ))}
    </ul>
  );
}
