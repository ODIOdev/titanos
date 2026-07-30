import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-sm bg-border-gray/70",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
