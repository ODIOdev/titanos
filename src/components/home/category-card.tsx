import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CategoryCardProps = {
  name: string;
  slug: string;
  imageUrl: string;
  href?: string;
  className?: string;
};

export function CategoryCard({
  name,
  slug,
  imageUrl,
  href,
  className,
}: CategoryCardProps) {
  const destination = href ?? `/shop/${slug}`;

  return (
    <Link
      href={destination}
      className={cn(
        "group block overflow-hidden rounded-sm border border-border-gray bg-white transition-[border-color,box-shadow] duration-200 hover:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow",
        className,
      )}
      aria-label={`Shop ${name}`}
    >
      <div className="relative aspect-square overflow-hidden bg-light-gray">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
        />
      </div>
      <div className="border-t border-border-gray bg-white px-3 py-3 sm:px-4">
        <h3 className="font-heading text-sm uppercase tracking-wide text-dark-charcoal sm:text-base">
          {name}
        </h3>
        <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-medium-gray transition-colors group-hover:text-dark-charcoal sm:text-sm">
          Shop Now
          <ArrowRight
            className="size-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
        <span
          className="mt-3 block h-0.5 w-8 origin-left scale-x-100 bg-titan-yellow transition-transform duration-200 group-hover:scale-x-150"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
