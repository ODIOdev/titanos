import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        className
      )}
      {...props}
    >
      {icon ? (
        <div className="mb-4 flex size-14 items-center justify-center rounded-sm bg-light-gray text-medium-gray [&_svg]:size-7">
          {icon}
        </div>
      ) : null}
      <h3 className="font-heading text-xl font-semibold uppercase tracking-wide text-dark-charcoal">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-medium-gray">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export { EmptyState };
