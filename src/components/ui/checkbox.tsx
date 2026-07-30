"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, checked, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id ?? generatedId;

    return (
      <label
        htmlFor={checkboxId}
        className={cn(
          "inline-flex cursor-pointer items-start gap-3 text-sm text-dark-charcoal",
          props.disabled && "cursor-not-allowed opacity-60",
          className
        )}
      >
        <span className="relative mt-0.5 inline-flex size-4 shrink-0">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            checked={checked}
            className="peer absolute inset-0 size-4 cursor-pointer appearance-none rounded-sm border border-border-gray bg-white checked:border-dark-charcoal checked:bg-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow disabled:cursor-not-allowed"
            {...props}
          />
          <Check
            className="pointer-events-none absolute inset-0 m-auto size-3 text-white opacity-0 peer-checked:opacity-100"
            strokeWidth={3}
            aria-hidden="true"
          />
        </span>
        {(label || description) && (
          <span className="flex flex-col gap-0.5">
            {label ? <span className="font-medium">{label}</span> : null}
            {description ? (
              <span className="text-medium-gray">{description}</span>
            ) : null}
          </span>
        )}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
