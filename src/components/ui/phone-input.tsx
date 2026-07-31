"use client";

import * as React from "react";
import { formatPhoneInput } from "@/lib/phone";
import { selectInputValueOnFocus } from "@/lib/input-focus";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export interface PhoneInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "value" | "onChange" | "defaultValue"
  > {
  label?: string;
  error?: string;
  hint?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      id,
      value = "",
      onValueChange,
      onBlur,
      onFocus,
      required,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint && !error ? `${inputId}-hint` : undefined;
    const display = formatPhoneInput(value);

    return (
      <div className="w-full">
        {label ? (
          <Label htmlFor={inputId}>
            {label}
            {required ? (
              <span className="ml-0.5 text-red-600" aria-hidden="true">
                *
              </span>
            ) : null}
          </Label>
        ) : null}
        <div className="relative">
          <span
            className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-medium-gray"
            aria-hidden="true"
          >
            +1
          </span>
          <input
            ref={ref}
            id={inputId}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="(555) 555-5555"
            value={display}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId ?? hintId}
            required={required}
            className={cn(
              "flex h-10 w-full rounded-sm border border-border-gray bg-white py-2 pl-10 pr-3 text-sm text-near-black placeholder:text-medium-gray transition-colors focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40 disabled:cursor-not-allowed disabled:bg-light-gray disabled:opacity-60",
              error && "border-red-600 focus-visible:ring-red-200",
              className,
            )}
            {...props}
            onFocus={(event) => {
              if (display) {
                selectInputValueOnFocus(event);
              }
              onFocus?.(event);
            }}
            onChange={(event) => {
              onValueChange?.(formatPhoneInput(event.target.value));
            }}
            onBlur={onBlur}
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
  },
);
PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
