import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, rows = 4, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;
    const errorId = error ? `${textareaId}-error` : undefined;
    const hintId = hint && !error ? `${textareaId}-hint` : undefined;

    return (
      <div className="w-full">
        {label ? (
          <Label htmlFor={textareaId}>
            {label}
            {props.required ? (
              <span className="ml-0.5 text-red-600" aria-hidden="true">
                *
              </span>
            ) : null}
          </Label>
        ) : null}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId ?? hintId}
          className={cn(
            "flex min-h-[100px] w-full rounded-sm border border-border-gray bg-white px-3 py-2 text-sm text-near-black placeholder:text-medium-gray transition-colors focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40 disabled:cursor-not-allowed disabled:bg-light-gray disabled:opacity-60",
            error && "border-red-600 focus-visible:ring-red-200",
            className
          )}
          {...props}
        />
        {error ? (
          <p id={errorId} className="mt-1.5 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="mt-1.5 text-sm text-medium-gray">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
