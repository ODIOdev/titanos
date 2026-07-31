"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { COLOR_OPTIONS } from "@/lib/data/catalog-options";
import { ColorSwatch } from "@/components/shared/color-swatch";
import { cn } from "@/lib/utils";

export type ColorPaletteFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  /** Start expanded. Defaults to collapsed (None selected until opened). */
  defaultOpen?: boolean;
};

/** Shared color palette picker for admin product onboarding. */
export function ColorPaletteField({
  label = "Default color",
  value,
  onChange,
  onBlur,
  name,
  error,
  hint,
  required,
  defaultOpen = false,
}: ColorPaletteFieldProps) {
  const panelId = useId();
  const [open, setOpen] = useState(defaultOpen);
  const selected = COLOR_OPTIONS.find((option) => option.value === value);

  return (
    <fieldset className="w-full">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
        className="mb-1.5 flex w-full items-center justify-between gap-3 rounded-sm border border-border-gray bg-white px-3 py-2.5 text-left transition-colors hover:border-dark-charcoal/40"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-sm font-medium text-dark-charcoal">
            {label}
            {required ? (
              <span className="ml-0.5 text-red-600" aria-hidden="true">
                *
              </span>
            ) : null}
          </span>
          {selected ? (
            <span className="inline-flex min-w-0 items-center gap-1.5 text-sm text-medium-gray">
              <ColorSwatch color={selected.value} />
              <span className="truncate">{selected.label}</span>
            </span>
          ) : (
            <span className="text-sm text-medium-gray">None</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-medium-gray transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      <div id={panelId} hidden={!open}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <label
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-sm border px-2.5 py-2 text-sm transition-colors",
              value === ""
                ? "border-dark-charcoal bg-light-gray"
                : "border-border-gray hover:border-dark-charcoal/40",
            )}
          >
            <input
              type="radio"
              name={name}
              value=""
              checked={value === ""}
              className="sr-only"
              onChange={() => onChange("")}
              onBlur={onBlur}
            />
            <span className="size-4 rounded-sm border border-dashed border-medium-gray" />
            <span className="text-medium-gray">None</span>
          </label>

          {COLOR_OPTIONS.map((option) => {
            const isSelected = value === option.value;
            return (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-sm border px-2.5 py-2 text-sm transition-colors",
                  isSelected
                    ? "border-dark-charcoal bg-light-gray"
                    : "border-border-gray hover:border-dark-charcoal/40",
                )}
              >
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={isSelected}
                  className="sr-only"
                  onChange={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  onBlur={onBlur}
                />
                <ColorSwatch color={option.value} size="md" />
                <span className="truncate font-medium text-dark-charcoal">
                  {option.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {error ? (
        <p className="mt-1.5 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : hint && open ? (
        <p className="mt-1.5 text-sm text-medium-gray">{hint}</p>
      ) : null}
    </fieldset>
  );
}
