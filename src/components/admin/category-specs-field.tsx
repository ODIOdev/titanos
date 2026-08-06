"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { getCategorySpecificationFields } from "@/lib/data/catalog-options";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type SpecAnswer = {
  name: string;
  value: string;
};

export type CategorySpecsFieldProps = {
  categorySlug?: string | null;
  value: SpecAnswer[];
  onChange: (next: SpecAnswer[]) => void;
  className?: string;
};

/** Dropdown checklist of category specs with answer inputs for selected fields. */
export function CategorySpecsField({
  categorySlug,
  value,
  onChange,
  className,
}: CategorySpecsFieldProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const fields = useMemo(
    () => getCategorySpecificationFields(categorySlug),
    [categorySlug],
  );

  const selectedNames = useMemo(
    () => new Set(value.map((row) => row.name)),
    [value],
  );

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

  // When category changes, keep only answers that still apply.
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    const allowed = new Set(fields);
    const current = valueRef.current;
    const next =
      fields.length === 0
        ? []
        : current.filter((row) => allowed.has(row.name));
    if (
      next.length !== current.length ||
      next.some((row, i) => row.name !== current[i]?.name)
    ) {
      onChangeRef.current(next);
    }
  }, [categorySlug, fields]);

  function toggleField(name: string) {
    if (selectedNames.has(name)) {
      onChange(value.filter((row) => row.name !== name));
      return;
    }
    onChange([...value, { name, value: "" }]);
  }

  function setAnswer(name: string, answer: string) {
    onChange(
      value.map((row) =>
        row.name === name ? { ...row, value: answer } : row,
      ),
    );
  }

  const summary =
    value.length === 0
      ? "Select specifications"
      : `${value.length} selected`;

  return (
    <div className={cn("w-full space-y-3", className)}>
      <div ref={rootRef} className="relative">
        <label className="mb-1.5 block text-sm font-medium text-dark-charcoal">
          Category specifications
        </label>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          disabled={fields.length === 0}
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-sm border border-border-gray bg-white px-3 text-left text-sm transition-colors",
            fields.length === 0
              ? "cursor-not-allowed text-medium-gray opacity-60"
              : "text-near-black hover:border-dark-charcoal/40 focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40",
          )}
        >
          <span className={cn(value.length === 0 && "text-medium-gray")}>
            {fields.length === 0
              ? categorySlug
                ? "No specification checklist for this category"
                : "Select a category first"
              : summary}
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-medium-gray transition-transform",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>

        {open && fields.length > 0 ? (
          <ul
            id={listId}
            role="listbox"
            aria-multiselectable="true"
            aria-label="Category specification fields"
            className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-auto rounded-sm border border-border-gray bg-white py-1 shadow-md"
          >
            {fields.map((name) => {
              const checked = selectedNames.has(name);
              return (
                <li key={name} role="option" aria-selected={checked}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-light-gray",
                      checked && "bg-light-gray/80",
                    )}
                    onClick={() => toggleField(name)}
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
                      {name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      {value.length > 0 ? (
        <div className="overflow-hidden rounded-sm border border-border-gray">
          <div className="border-b border-border-gray bg-light-gray px-3 py-2 text-xs font-semibold uppercase tracking-wide text-medium-gray">
            Answers
          </div>
          <ul>
            {value.map((row, index) => (
              <li
                key={row.name}
                className={cn(
                  "grid gap-2 px-3 py-2 @5xl:grid-cols-[12rem_minmax(0,1fr)] @5xl:items-center",
                  index % 2 === 0 ? "bg-white" : "bg-light-gray/70",
                )}
              >
                <span className="text-sm font-medium text-dark-charcoal">
                  {row.name}
                </span>
                <Input
                  value={row.value}
                  placeholder={`Enter ${row.name.toLowerCase()}`}
                  aria-label={`${row.name} value`}
                  onChange={(e) => setAnswer(row.name, e.target.value)}
                  className="h-9"
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-xs text-medium-gray">
        Pick multiple fields from the checklist, then fill in each answer.
        These appear with the product listing details.
      </p>
    </div>
  );
}
