import { cn } from "@/lib/utils";
import { getColorSwatches } from "@/lib/data/catalog-options";

export type ColorSwatchProps = {
  color: string;
  className?: string;
  size?: "sm" | "md";
  title?: string;
};

/** Visual chip for catalog colors (solid or split dual-tone). */
export function ColorSwatch({
  color,
  className,
  size = "sm",
  title,
}: ColorSwatchProps) {
  const swatches = getColorSwatches(color);
  const dim = size === "md" ? "size-5" : "size-4";

  return (
    <span
      title={title ?? color}
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-sm border border-black/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]",
        dim,
        className,
      )}
    >
      {swatches.length === 1 ? (
        <span
          className="h-full w-full"
          style={{
            backgroundColor: swatches[0],
            backgroundImage:
              swatches[0] === "transparent"
                ? "linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%),linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%)"
                : undefined,
            backgroundSize: swatches[0] === "transparent" ? "6px 6px" : undefined,
            backgroundPosition:
              swatches[0] === "transparent" ? "0 0, 3px 3px" : undefined,
          }}
        />
      ) : (
        swatches.map((fill, index) => (
          <span
            key={`${fill}-${index}`}
            className="h-full flex-1"
            style={{ backgroundColor: fill }}
          />
        ))
      )}
    </span>
  );
}
