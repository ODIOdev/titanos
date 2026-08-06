"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type TagsFieldProps = {
  value: string[];
  onChange: (next: string[]) => void;
  options: { label: string; value: string }[];
  className?: string;
  error?: string;
};

/** Multi-select checklist of merchandising tags. */
export function TagsField({
  value,
  onChange,
  options,
  className,
  error,
}: TagsFieldProps) {
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

  function toggle(optionValue: string) {
    if (selected.has(optionValue)) {
      onChange(value.filter((item) => item !== optionValue));
      return;
    }
    onChange([...value, optionValue]);
  }

  const summary =
    value.length === 0
      ? "Select tags"
      : value.length === 1
        ? value[0]
        : `${value.length} selected`;

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      <div ref={rootRef} className="relative">
        <label className="mb-1.5 block text-sm font-medium text-dark-charcoal">
          Tags
        </label>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-invalid={Boolean(error) || undefined}
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-sm border border-border-gray bg-white px-3 text-left text-sm text-near-black transition-colors hover:border-dark-charcoal/40 focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40",
            error && "border-red-500",
          )}
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
            aria-label="Tags"
            className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-auto rounded-sm border border-border-gray bg-white py-1 shadow-md"
          >
            {options.map((option) => {
              const checked = selected.has(option.value);
              return (
                <li key={option.value} role="option" aria-selected={checked}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-light-gray",
                      checked && "bg-light-gray/80",
                    )}
                    onClick={() => toggle(option.value)}
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
                      {option.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
      <p className="text-xs text-medium-gray">
        Check all that apply. Shown as badges on product cards.
      </p>
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
