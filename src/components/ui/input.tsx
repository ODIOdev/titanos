import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, hint, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint && !error ? `${inputId}-hint` : undefined;

    return (
      <div className="w-full">
        {label ? (
          <Label htmlFor={inputId}>
            {label}
            {props.required ? (
              <span className="ml-0.5 text-red-600" aria-hidden="true">
                *
              </span>
            ) : null}
          </Label>
        ) : null}
        <input
          type={type}
          id={inputId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId ?? hintId}
          className={cn(
            "flex h-10 w-full rounded-sm border border-border-gray bg-white px-3 py-2 text-sm text-near-black placeholder:text-medium-gray transition-colors focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40 disabled:cursor-not-allowed disabled:bg-light-gray disabled:opacity-60",
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
Input.displayName = "Input";

export { Input };
