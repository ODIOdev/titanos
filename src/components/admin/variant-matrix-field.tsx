"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { COLOR_OPTIONS, SIZE_OPTIONS } from "@/lib/data/catalog-options";
import { ColorSwatch } from "@/components/shared/color-swatch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type VariantRow = {
  color: string;
  size: string;
  qty: number;
};

export type VariantMatrixFieldProps = {
  value: VariantRow[];
  onChange: (rows: VariantRow[]) => void;
  /** Defaults to the canonical sizes; pass the catalog list to include custom sizes. */
  sizeOptions?: { label: string; value: string }[];
  className?: string;
};

function emptyRow(): VariantRow {
  return { color: "", size: "", qty: 0 };
}

function ColorSelect({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = COLOR_OPTIONS.find((opt) => opt.value === value);

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

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-full items-center gap-2 rounded-sm border border-border-gray bg-white px-2.5 text-left text-sm text-near-black transition-colors hover:border-dark-charcoal/40 focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40"
      >
        {selected ? (
          <ColorSwatch color={selected.value} className="size-3.5" />
        ) : (
          <span className="size-3.5 shrink-0 rounded-sm border border-dashed border-medium-gray" />
        )}
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            selected ? "text-near-black" : "text-medium-gray",
          )}
        >
          {selected?.label ?? "Select color"}
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
          aria-label={ariaLabel}
          className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-auto rounded-sm border border-border-gray bg-white py-1 shadow-md"
        >
          <li role="option" aria-selected={value === ""}>
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm hover:bg-light-gray",
                value === "" && "bg-light-gray",
              )}
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              <span className="size-4 shrink-0 rounded-sm border border-dashed border-medium-gray" />
              <span className="text-medium-gray">Select color</span>
            </button>
          </li>
          {COLOR_OPTIONS.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <li key={opt.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm hover:bg-light-gray",
                    isSelected && "bg-light-gray",
                  )}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <ColorSwatch color={opt.value} size="md" />
                  <span className="font-medium text-dark-charcoal">
                    {opt.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/** Zebra-row editor for color / size / qty variant combinations. */
export function VariantMatrixField({
  value,
  onChange,
  sizeOptions = SIZE_OPTIONS,
  className,
}: VariantMatrixFieldProps) {
  const rows = value.length > 0 ? value : [emptyRow()];

  function updateRow(index: number, patch: Partial<VariantRow>) {
    const next = rows.map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    );
    onChange(next);
  }

  function addRow() {
    onChange([...rows, emptyRow()]);
  }

  function removeRow(index: number) {
    if (rows.length <= 1) {
      onChange([emptyRow()]);
      return;
    }
    onChange(rows.filter((_, i) => i !== index));
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-dark-charcoal">
            Size &amp; color matrix
          </p>
          <p className="mt-0.5 text-xs text-medium-gray">
            Shoppers pick from these combinations on the product page.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="size-3.5" aria-hidden="true" />
          Add row
        </Button>
      </div>

      <div className="overflow-visible rounded-sm border border-border-gray">
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_5.5rem_2.5rem] gap-2 border-b border-border-gray bg-light-gray px-3 py-2 text-xs font-semibold uppercase tracking-wide text-medium-gray">
          <span>Color</span>
          <span>Size</span>
          <span>Qty</span>
          <span className="sr-only">Remove</span>
        </div>

        <ul>
          {rows.map((row, index) => (
            <li
              key={index}
              className={cn(
                "grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_5.5rem_2.5rem] items-center gap-2 px-3 py-2",
                index % 2 === 0 ? "bg-white" : "bg-light-gray/70",
                index === rows.length - 1 && "rounded-b-sm",
              )}
            >
              <ColorSelect
                value={row.color}
                ariaLabel={`Color row ${index + 1}`}
                onChange={(color) => updateRow(index, { color })}
              />

              <select
                value={row.size}
                aria-label={`Size row ${index + 1}`}
                onChange={(e) => updateRow(index, { size: e.target.value })}
                className="flex h-9 w-full appearance-none rounded-sm border border-border-gray bg-white px-2 py-1.5 text-sm text-near-black focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40"
              >
                <option value="">Size</option>
                {sizeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <Input
                type="number"
                min={0}
                inputMode="numeric"
                aria-label={`Quantity row ${index + 1}`}
                value={Number.isFinite(row.qty) ? row.qty : 0}
                onChange={(e) =>
                  updateRow(index, {
                    qty: Math.max(0, Number.parseInt(e.target.value, 10) || 0),
                  })
                }
                className="h-9"
              />

              <button
                type="button"
                aria-label={`Remove row ${index + 1}`}
                onClick={() => removeRow(index)}
                className="inline-flex size-9 items-center justify-center rounded-sm text-medium-gray transition-colors hover:bg-white hover:text-red-600"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function normalizeVariantRows(rows: VariantRow[]): VariantRow[] {
  return rows.filter((row) => row.color.trim() && row.size.trim());
}

export function parseVariantRows(raw: unknown): VariantRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const color = typeof row.color === "string" ? row.color : "";
      const size = typeof row.size === "string" ? row.size : "";
      const qty = Number(row.qty);
      return {
        color,
        size,
        qty: Number.isFinite(qty) && qty >= 0 ? Math.floor(qty) : 0,
      } satisfies VariantRow;
    })
    .filter((row): row is VariantRow => row != null);
}
