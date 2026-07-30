import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      hint,
      id,
      options,
      placeholder,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id ?? generatedId;
    const errorId = error ? `${selectId}-error` : undefined;
    const hintId = hint && !error ? `${selectId}-hint` : undefined;

    return (
      <div className="w-full">
        {label ? (
          <Label htmlFor={selectId}>
            {label}
            {props.required ? (
              <span className="ml-0.5 text-red-600" aria-hidden="true">
                *
              </span>
            ) : null}
          </Label>
        ) : null}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId ?? hintId}
            className={cn(
              "flex h-10 w-full appearance-none rounded-sm border border-border-gray bg-white px-3 py-2 pr-10 text-sm text-near-black transition-colors focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40 disabled:cursor-not-allowed disabled:bg-light-gray disabled:opacity-60",
              error && "border-red-600 focus-visible:ring-red-200",
              className
            )}
            {...props}
          >
            {placeholder ? (
              <option value="" disabled>
                {placeholder}
              </option>
            ) : null}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-medium-gray"
            aria-hidden="true"
          />
        </div>
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
Select.displayName = "Select";

export { Select };
