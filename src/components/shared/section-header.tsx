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
  /** Compact single-row title + link — used on dense mobile home sections. */
  variant?: "default" | "rail";
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
  variant = "default",
}: SectionHeaderProps) {
  if (variant === "rail") {
    return (
      <div
        className={cn(
          "mb-3 flex items-center justify-between gap-3 border-b border-dark-charcoal/10 pb-3 @3xl:mb-8 @3xl:items-end @3xl:border-0 @3xl:pb-0",
          className,
        )}
      >
        <div className="min-w-0 max-w-2xl border-l-4 border-titan-yellow pl-3 @3xl:border-0 @3xl:pl-0">
          {eyebrow ? (
            <p
              className={cn(
                "hidden @3xl:block",
                tone === "dark" ? "eyebrow-accent" : "eyebrow",
              )}
            >
              {eyebrow}
            </p>
          ) : null}
          <h2
            id={titleId}
            className={cn(
              "font-heading text-lg uppercase leading-none tracking-wide @3xl:text-3xl @5xl:text-4xl",
              eyebrow && "@3xl:mt-2",
              tone === "dark" ? "text-white" : "text-dark-charcoal",
            )}
          >
            {title}
          </h2>
          {description ? (
            <p
              className={cn(
                "section-header-description mt-3 hidden text-base @3xl:block",
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
              "shrink-0 rounded-sm px-3 py-1.5 font-heading text-[0.65rem] font-semibold uppercase tracking-wide transition-colors @3xl:rounded-none @3xl:bg-transparent @3xl:px-0 @3xl:py-0 @3xl:text-sm",
              tone === "dark"
                ? "bg-titan-yellow text-near-black @3xl:bg-transparent @3xl:text-titan-yellow"
                : "bg-dark-charcoal text-white hover:bg-near-black @3xl:bg-transparent @3xl:text-dark-charcoal @3xl:hover:bg-transparent @3xl:hover:text-near-black",
              "@3xl:link-underline",
            )}
          >
            {linkLabel}
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mb-5 flex flex-col gap-3 @3xl:mb-8 @3xl:flex-row @3xl:items-end @3xl:justify-between @3xl:gap-4",
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
            "font-heading text-2xl uppercase tracking-wide @3xl:text-3xl @5xl:text-4xl",
            eyebrow && "mt-1.5 @3xl:mt-2",
            tone === "dark" ? "text-white" : "text-dark-charcoal",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "section-header-description mt-2 hidden text-sm @3xl:mt-3 @3xl:block @3xl:text-base",
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
