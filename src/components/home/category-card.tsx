import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type CategoryCardProps = {
  name: string;
  slug: string;
  imageUrl: string;
  href?: string;
  className?: string;
  tabIndex?: number;
};

export function CategoryCard({
  name,
  slug,
  imageUrl,
  href,
  className,
  tabIndex,
}: CategoryCardProps) {
  const destination = href ?? `/shop/${slug}`;

  return (
    <Link
      href={destination}
      aria-label={`Shop ${name}`}
      tabIndex={tabIndex}
      className={cn(
        "group relative block overflow-hidden rounded-sm border border-border-gray bg-white transition-[border-color,box-shadow] duration-200 hover:border-titan-yellow hover:shadow-[0_14px_32px_rgba(15,15,15,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow focus-visible:ring-offset-2",
        className,
      )}
    >
      {/* Banner art is ~3:2 — match that so cover doesn't clip left/right text & hat. */}
      <div className="relative aspect-[3/2] overflow-hidden bg-light-gray">
        <Image
          src={imageUrl}
          alt=""
          fill
          className="object-cover object-center"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 22vw"
        />
      </div>
    </Link>
  );
}
