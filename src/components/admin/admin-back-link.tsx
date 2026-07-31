import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminBackLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-sm border border-border-gray bg-white px-3 text-sm font-semibold text-dark-charcoal transition-colors hover:bg-light-gray",
        className,
      )}
    >
      <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
      {children}
    </Link>
  );
}
