import Link from "next/link";
import { cn } from "@/lib/utils";

export type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  titleId?: string;
  className?: string;
  tone?: "light" | "dark";
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View all",
  titleId,
  className,
  tone = "light",
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className={tone === "dark" ? "eyebrow-accent" : "eyebrow"}>
            {eyebrow}
          </p>
        ) : null}
        <h2
          id={titleId}
          className={cn(
            "font-heading text-3xl uppercase tracking-wide sm:text-4xl",
            eyebrow && "mt-2",
            tone === "dark" ? "text-white" : "text-dark-charcoal",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "mt-3 text-base",
              tone === "dark" ? "text-white/70" : "text-medium-gray",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className={cn(
            "link-underline shrink-0 font-heading text-sm font-semibold uppercase tracking-wide",
            tone === "dark"
              ? "text-titan-yellow"
              : "text-dark-charcoal hover:text-near-black",
          )}
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
