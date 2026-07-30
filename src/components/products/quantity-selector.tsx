"use client";

import { Minus, Plus } from "lucide-react";
import { clampQuantity, cn } from "@/lib/utils";

export type QuantitySelectorProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  className?: string;
  id?: string;
  disabled?: boolean;
};

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max,
  className,
  id,
  disabled = false,
}: QuantitySelectorProps) {
  const safeMax = Math.max(min, max);
  const current = clampQuantity(value, safeMax);

  function setQuantity(next: number) {
    onChange(clampQuantity(next, safeMax));
  }

  return (
    <div
      className={cn(
        "inline-flex h-10 items-stretch overflow-hidden rounded-sm border border-border-gray bg-white",
        disabled && "opacity-60",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || current <= min}
        onClick={() => setQuantity(current - 1)}
        className="flex w-10 items-center justify-center text-dark-charcoal transition-colors hover:bg-light-gray disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={safeMax}
        value={current}
        disabled={disabled}
        aria-label="Quantity"
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10);
          if (Number.isNaN(parsed)) return;
          setQuantity(parsed);
        }}
        className="w-14 border-x border-border-gray bg-white text-center text-sm font-semibold text-dark-charcoal outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || current >= safeMax}
        onClick={() => setQuantity(current + 1)}
        className="flex w-10 items-center justify-center text-dark-charcoal transition-colors hover:bg-light-gray disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
