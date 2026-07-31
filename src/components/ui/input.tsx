"use client";

import * as React from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isZeroNumericDisplay,
  selectInputValueOnFocus,
  shouldSelectOnFocus,
} from "@/lib/input-focus";
import { Label } from "@/components/ui/label";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Shown inside the field on the left (e.g. "$"). */
  prefix?: string;
  /** Shows a green check inside the field when true. */
  success?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      hint,
      prefix,
      success = false,
      id,
      onFocus,
      onChange,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint && !error ? `${inputId}-hint` : undefined;
    const isPassword = type === "password";
    const [revealed, setRevealed] = React.useState(false);
    const inputType = isPassword && revealed ? "text" : type;
    const showSuccess = success && !error;
    const selectOnFocus = shouldSelectOnFocus(
      type,
      typeof props.inputMode === "string" ? props.inputMode : undefined,
    );

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
        <div className="relative">
          {prefix ? (
            <span
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-medium-gray"
              aria-hidden="true"
            >
              {prefix}
            </span>
          ) : null}
          <input
            type={inputType}
            id={inputId}
            ref={ref}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId ?? hintId}
            className={cn(
              "flex h-10 w-full rounded-sm border border-border-gray bg-white px-3 py-2 text-sm text-near-black placeholder:text-medium-gray transition-colors focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40 disabled:cursor-not-allowed disabled:bg-light-gray disabled:opacity-60",
              prefix && "pl-7",
              isPassword && showSuccess && "pr-[4.5rem]",
              isPassword && !showSuccess && "pr-10",
              !isPassword && showSuccess && "pr-10",
              type === "number" &&
                "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
              error && "border-red-600 focus-visible:ring-red-200",
              showSuccess && "border-green-600 focus-visible:ring-green-200",
              className,
            )}
            {...props}
            onChange={onChange}
            onFocus={(e) => {
              if (selectOnFocus) {
                if (isZeroNumericDisplay(e.currentTarget.value)) {
                  e.currentTarget.value = "";
                  onChange?.({
                    ...e,
                    target: e.currentTarget,
                    currentTarget: e.currentTarget,
                  } as React.ChangeEvent<HTMLInputElement>);
                } else {
                  selectInputValueOnFocus(e);
                }
              }
              onFocus?.(e);
            }}
          />
          {showSuccess ? (
            <span
              className={cn(
                "pointer-events-none absolute inset-y-0 flex w-8 items-center justify-center text-green-600",
                isPassword ? "right-10" : "right-0 w-10",
              )}
              aria-hidden="true"
            >
              <Check className="size-4" strokeWidth={2.5} />
            </span>
          ) : null}
          {isPassword ? (
            <button
              type="button"
              className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-medium-gray transition-colors hover:text-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-titan-yellow"
              aria-label={revealed ? "Hide password" : "Show password"}
              aria-pressed={revealed}
              onClick={() => setRevealed((prev) => !prev)}
            >
              {revealed ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          ) : null}
        </div>
        {error ? (
          <p id={errorId} className="mt-1.5 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p
            id={hintId}
            className={cn(
              "mt-1.5 text-sm",
              showSuccess ? "text-green-700" : "text-medium-gray",
            )}
          >
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
