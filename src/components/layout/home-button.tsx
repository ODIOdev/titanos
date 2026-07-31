"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

type HomeButtonProps = {
  className?: string;
  /** Dark admin sidebar style */
  variant?: "default" | "sidebar" | "ghost";
  label?: string;
  onClick?: () => void;
};

/** Links to `/`. Hidden on the website landing page. */
export function HomeButton({
  className,
  variant = "default",
  label = "Home",
  onClick,
}: HomeButtonProps) {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <Link
      href="/"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-semibold transition-colors",
        variant === "default" &&
          "h-9 rounded-sm border border-border-gray bg-white px-3 text-dark-charcoal hover:border-warning-orange/40 hover:text-warning-orange",
        variant === "ghost" &&
          "h-9 rounded-sm px-2.5 text-dark-charcoal hover:text-warning-orange",
        variant === "sidebar" &&
          "w-full gap-2.5 rounded-sm px-3 py-2.5 text-white/80 hover:bg-white/10 hover:text-warning-orange",
        className,
      )}
    >
      <Home className="size-4 shrink-0" aria-hidden="true" />
      {label}
    </Link>
  );
}
