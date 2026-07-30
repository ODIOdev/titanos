import type { HTMLAttributes } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorMessageProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  message: string;
}

function ErrorMessage({
  title = "Something went wrong",
  message,
  className,
  ...props
}: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800",
        className
      )}
      {...props}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-red-700">{message}</p>
      </div>
    </div>
  );
}

export { ErrorMessage };
