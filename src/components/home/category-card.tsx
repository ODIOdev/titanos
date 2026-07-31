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
      aria-label={`Shop ${name}`}
      className={cn(
        "group relative block overflow-hidden rounded-sm border border-border-gray bg-near-black transition-[border-color,box-shadow] duration-200 hover:border-titan-yellow hover:shadow-[0_14px_32px_rgba(15,15,15,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow focus-visible:ring-offset-2",
        className,
      )}
    >
      <div className="relative aspect-[3/2]">
        {/* Banner artwork carries the industry name, so the link is labelled instead. */}
        <Image
          src={imageUrl}
          alt=""
          fill
          className="object-contain"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 22vw"
        />
      </div>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-end gap-1.5 bg-gradient-to-t from-near-black/85 via-near-black/40 to-transparent px-2.5 pb-2 pt-10 font-heading text-[0.625rem] uppercase tracking-wide text-white transition-colors duration-200 group-hover:text-titan-yellow sm:px-3 sm:text-xs"
      >
        Shop now
        <ArrowRight className="size-3.5" />
      </span>
    </Link>
  );
}
