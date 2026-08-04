import Image from "next/image";
import Link from "next/link";
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
        "group relative block overflow-hidden rounded-sm border border-border-gray bg-white transition-[border-color,box-shadow] duration-200 hover:border-titan-yellow hover:shadow-[0_14px_32px_rgba(15,15,15,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow focus-visible:ring-offset-2",
        className,
      )}
    >
      {/* Match banner artwork (~4:3) so cover fills edge-to-edge with no letterbox. */}
      <div className="relative aspect-[4/3] overflow-hidden bg-white">
        <Image
          src={imageUrl}
          alt=""
          fill
          className="scale-[1.02] object-cover object-center"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 22vw"
        />
      </div>
    </Link>
  );
}
