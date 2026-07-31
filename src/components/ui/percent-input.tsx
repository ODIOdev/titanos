"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { selectInputValueOnFocus } from "@/lib/input-focus";
import { Label } from "@/components/ui/label";

export interface PercentInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "value" | "onChange" | "prefix"
  > {
  label?: string;
  error?: string;
  hint?: string;
  value?: number | string | null;
  onValueChange?: (value: number | null) => void;
}

/** Format percent for display: 12.5 → "12.5" */
export function formatPercentDisplay(
  value: number | string | null | undefined,
): string {
  if (value == null || value === "") return "";
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return "";
  return String(amount);
}

/** Live-format typed percent: digits + optional `.` with up to 2 decimals. */
export function formatPercentTyping(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (!cleaned) return "";

  const firstDot = cleaned.indexOf(".");
  const intRaw =
    firstDot === -1 ? cleaned : cleaned.slice(0, firstDot) || "0";
  const decRaw =
    firstDot === -1
      ? null
      : cleaned.slice(firstDot + 1).replace(/\./g, "").slice(0, 2);

  const intNormalized = intRaw.replace(/^0+(?=\d)/, "") || "0";

  if (firstDot !== -1) {
    return `${intNormalized}.${decRaw ?? ""}`;
  }
  return intNormalized;
}

export function parsePercentInput(formatted: string): number | null {
  const trimmed = formatted.trim();
  if (!trimmed || trimmed === ".") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function clampPercent(n: number): number {
  return Math.min(100, Math.max(0, n));
}

function isZeroPercentText(text: string) {
  const parsed = parsePercentInput(text);
  return parsed === 0 || text === "0" || text === "0.0" || text === "0.00";
}

const PercentInput = React.forwardRef<HTMLInputElement, PercentInputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      id,
      value,
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
    const [focused, setFocused] = React.useState(false);
    const [text, setText] = React.useState(() => formatPercentDisplay(value));

    React.useEffect(() => {
      if (focused) return;
      setText(formatPercentDisplay(value));
    }, [value, focused]);

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
          <input
            {...props}
            ref={ref}
            id={inputId}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            required={required}
            placeholder={props.placeholder ?? "0"}
            value={text}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId ?? hintId}
            className={cn(
              "flex h-10 w-full rounded-sm border border-border-gray bg-white py-2 pl-3 pr-8 text-sm text-near-black placeholder:text-medium-gray transition-colors focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40 disabled:cursor-not-allowed disabled:bg-light-gray disabled:opacity-60",
              error && "border-red-600 focus-visible:ring-red-200",
              className,
            )}
            onFocus={(e) => {
              setFocused(true);
              if (isZeroPercentText(text)) {
                setText("");
                onValueChange?.(null);
              } else {
                selectInputValueOnFocus(e);
              }
              onFocus?.(e);
            }}
            onChange={(e) => {
              const next = formatPercentTyping(e.target.value);
              setText(next);
              const parsed = parsePercentInput(next);
              onValueChange?.(parsed == null ? null : clampPercent(parsed));
            }}
            onBlur={(e) => {
              setFocused(false);
              const parsed = parsePercentInput(text);
              if (parsed == null) {
                setText("");
                onValueChange?.(null);
              } else {
                const clamped = clampPercent(parsed);
                setText(formatPercentDisplay(clamped));
                onValueChange?.(clamped);
              }
              onBlur?.(e);
            }}
          />
          <span
            className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-medium-gray"
            aria-hidden="true"
          >
            %
          </span>
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
PercentInput.displayName = "PercentInput";

export { PercentInput };
