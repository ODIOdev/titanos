"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { COLOR_OPTIONS, SIZE_OPTIONS, groupCatalogSizes } from "@/lib/data/catalog-options";
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

/** Number input that clears a leading 0 so typing isn’t blocked. */
function QtyInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: number;
  onChange: (qty: number) => void;
  ariaLabel: string;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");
  const qty = Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;

  return (
    <Input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      aria-label={ariaLabel}
      value={focused ? draft : qty === 0 ? "" : String(qty)}
      placeholder="0"
      onFocus={(e) => {
        setFocused(true);
        setDraft(qty === 0 ? "" : String(qty));
        e.currentTarget.select();
      }}
      onBlur={() => {
        setFocused(false);
        const next = Math.max(0, Number.parseInt(draft, 10) || 0);
        onChange(next);
        setDraft("");
      }}
      onChange={(e) => {
        const raw = e.target.value.replace(/\D/g, "");
        setDraft(raw);
        onChange(raw === "" ? 0 : Math.max(0, Number.parseInt(raw, 10) || 0));
      }}
      className="h-9"
    />
  );
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
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const selected = COLOR_OPTIONS.find((opt) => opt.value === value);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    function placeMenu() {
      const button = buttonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const menuHeight = Math.min(224, window.innerHeight - 16);
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const openUp = spaceBelow < menuHeight && rect.top > spaceBelow;
      const top = openUp
        ? Math.max(8, rect.top - menuHeight - 4)
        : rect.bottom + 4;

      setMenuStyle({
        position: "fixed",
        top,
        left: rect.left,
        width: rect.width,
        maxHeight: openUp
          ? Math.min(menuHeight, rect.top - 12)
          : Math.min(menuHeight, window.innerHeight - rect.bottom - 12),
        zIndex: 80,
      });
    }

    placeMenu();
    window.addEventListener("resize", placeMenu);
    // Capture scroll from overflow ancestors (matrix scroller, admin shell).
    window.addEventListener("scroll", placeMenu, true);
    return () => {
      window.removeEventListener("resize", placeMenu);
      window.removeEventListener("scroll", placeMenu, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
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

  const menu = open ? (
    <ul
      ref={menuRef}
      id={listId}
      role="listbox"
      aria-label={ariaLabel}
      style={menuStyle}
      className="overflow-auto rounded-sm border border-border-gray bg-white py-1 shadow-md"
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
              <span className="font-medium text-dark-charcoal">{opt.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  ) : null;

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        ref={buttonRef}
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

      {mounted && menu ? createPortal(menu, document.body) : null}
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
            Size is required for stock. Color is optional (saved as Default).
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="size-3.5" aria-hidden="true" />
          Add row
        </Button>
      </div>

      <div className="overflow-x-auto rounded-sm border border-border-gray [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="min-w-[28rem]">
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
                {groupCatalogSizes(sizeOptions).map((group) => (
                  <optgroup key={group.id} label={group.title}>
                    {group.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              <QtyInput
                value={row.qty}
                ariaLabel={`Quantity row ${index + 1}`}
                onChange={(qty) => updateRow(index, { qty })}
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
    </div>
  );
}

export function normalizeVariantRows(rows: VariantRow[]): VariantRow[] {
  return rows
    .filter((row) => row.size.trim())
    .map((row) => ({
      color: row.color.trim() || "Default",
      size: row.size.trim(),
      qty: Number.isFinite(row.qty) && row.qty >= 0 ? Math.floor(row.qty) : 0,
    }));
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
