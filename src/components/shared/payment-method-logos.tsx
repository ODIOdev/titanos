import { cn } from "@/lib/utils";

/** Intrinsic sizes of files in /public/images/payments (for aspect ratio). */
export const PAYMENT_LOGOS = [
  {
    name: "Visa",
    src: "/images/payments/visa.png",
    width: 208,
    height: 68,
  },
  {
    name: "Mastercard",
    src: "/images/payments/mastercard.png",
    width: 96,
    height: 60,
  },
  {
    name: "American Express",
    src: "/images/payments/amex.png",
    width: 200,
    height: 56,
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

const SLOT =
  "inline-flex h-8 w-[4.5rem] shrink-0 items-center justify-center";
const MARK =
  "block h-[1.125rem] w-auto max-w-[3.75rem] object-contain object-center";

export function PaymentMethodLogos({
  className,
  itemClassName,
}: {
  className?: string;
  itemClassName?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {PAYMENT_LOGOS.map((logo) => (
        <li
          key={logo.name}
          className={cn(
            SLOT,
            "rounded-sm border border-border-gray/80 bg-white px-1.5",
            itemClassName,
          )}
        >
          {/* Plain img avoids Next/Image soft-clipping small brand marks. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo.src}
            alt={logo.name}
            width={logo.width}
            height={logo.height}
            className={MARK}
            decoding="async"
          />
        </li>
      ))}
    </ul>
  );
}
