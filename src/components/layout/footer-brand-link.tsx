"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type FooterBrandLinkProps = {
  children: React.ReactNode;
  label: string;
  className?: string;
};

/** Footer brand block: returns home and lands the visitor at the top of the page. */
export function FooterBrandLink({
  children,
  label,
  className,
}: FooterBrandLinkProps) {
  const pathname = usePathname();

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    // Already home, so there is nothing to navigate to — just ride back up.
    if (pathname === "/") event.preventDefault();

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <Link
      href="/"
      onClick={handleClick}
      aria-label={label}
      className={cn(
        "focus-visible:ring-titan-yellow block rounded-sm transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none",
        className,
      )}
    >
      {children}
    </Link>
  );
}
