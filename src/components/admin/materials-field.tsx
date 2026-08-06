"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { MATERIAL_OPTIONS } from "@/lib/data/catalog-options";
import { cn } from "@/lib/utils";

export type MaterialsFieldProps = {
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
};

/** Multi-select checklist of product materials for admin + shop filters. */
export function MaterialsField({
  value,
  onChange,
  className,
}: MaterialsFieldProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = useMemo(() => new Set(value), [value]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggle(option: string) {
    if (selected.has(option)) {
      onChange(value.filter((item) => item !== option));
      return;
    }
    onChange([...value, option]);
  }

  const summary =
    value.length === 0
      ? "Select materials"
      : value.length === 1
        ? value[0]
        : `${value.length} selected`;

  return (
    <div className={cn("w-full space-y-3", className)}>
      <div ref={rootRef} className="relative">
        <label className="mb-1.5 block text-sm font-medium text-dark-charcoal">
          Materials
        </label>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-10 w-full items-center justify-between gap-2 rounded-sm border border-border-gray bg-white px-3 text-left text-sm text-near-black transition-colors hover:border-dark-charcoal/40 focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40"
        >
          <span
            className={cn(
              "truncate",
              value.length === 0 && "text-medium-gray",
            )}
          >
            {summary}
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-medium-gray transition-transform",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>

        {open ? (
          <ul
            id={listId}
            role="listbox"
            aria-multiselectable="true"
            aria-label="Materials"
            className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-auto rounded-sm border border-border-gray bg-white py-1 shadow-md"
          >
            {MATERIAL_OPTIONS.map((option) => {
              const checked = selected.has(option);
              return (
                <li key={option} role="option" aria-selected={checked}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-light-gray",
                      checked && "bg-light-gray/80",
                    )}
                    onClick={() => toggle(option)}
                  >
                    <span
                      className={cn(
                        "inline-flex size-4 shrink-0 items-center justify-center rounded-sm border",
                        checked
                          ? "border-dark-charcoal bg-dark-charcoal text-white"
                          : "border-border-gray bg-white",
                      )}
                      aria-hidden="true"
                    >
                      {checked ? (
                        <Check className="size-3" strokeWidth={3} />
                      ) : null}
                    </span>
                    <span className="font-medium text-dark-charcoal">
                      {option}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
      <p className="text-xs text-medium-gray">
        Used by the shop Materials filter and shown on the product page.
      </p>
    </div>
  );
}
