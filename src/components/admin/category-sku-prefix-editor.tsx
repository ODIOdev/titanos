"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { updateCategorySkuPrefix } from "@/lib/actions/admin";
import { normalizeCategorySkuPrefix } from "@/lib/admin/category-sku";

export function CategorySkuPrefixEditor({
  categoryId,
  prefix,
  exampleSku,
}: {
  categoryId: string;
  prefix: string;
  exampleSku: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(prefix);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!editing) setValue(prefix);
  }, [prefix, editing]);

  function cancel() {
    setValue(prefix);
    setEditing(false);
  }

  function save() {
    const next = normalizeCategorySkuPrefix(value);
    if (!next) {
      toast.error("Enter a SKU prefix using letters and numbers.");
      return;
    }
    if (next === prefix) {
      setEditing(false);
      return;
    }

    startTransition(async () => {
      const result = await updateCategorySkuPrefix(categoryId, next);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setEditing(false);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <form
        className="inline-flex flex-wrap items-center gap-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <label className="sr-only" htmlFor={`sku-prefix-${categoryId}`}>
          SKU prefix
        </label>
        <span className="text-xs text-medium-gray">SKU prefix:</span>
        <input
          id={`sku-prefix-${categoryId}`}
          value={value}
          onChange={(event) =>
            setValue(normalizeCategorySkuPrefix(event.target.value))
          }
          maxLength={12}
          disabled={pending}
          autoFocus
          spellCheck={false}
          className="h-7 w-20 rounded-sm border border-border-gray bg-white px-2 font-mono text-xs font-semibold uppercase tracking-wide text-dark-charcoal outline-none focus:border-titan-yellow focus:ring-1 focus:ring-titan-yellow"
          aria-describedby={`sku-prefix-hint-${categoryId}`}
        />
        <span className="font-mono text-xs text-medium-gray">-</span>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex size-7 items-center justify-center rounded-sm border border-border-gray bg-white text-dark-charcoal hover:bg-light-gray disabled:opacity-50"
          aria-label="Save SKU prefix"
          title="Save"
        >
          <Check className="size-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={cancel}
          className="inline-flex size-7 items-center justify-center rounded-sm border border-border-gray bg-white text-dark-charcoal hover:bg-light-gray disabled:opacity-50"
          aria-label="Cancel"
          title="Cancel"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
        <span
          id={`sku-prefix-hint-${categoryId}`}
          className="basis-full text-[0.65rem] text-medium-gray"
        >
          Letters & numbers only · preview {normalizeCategorySkuPrefix(value) || "—"}
          -0000
        </span>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="group inline-flex items-center gap-1.5 rounded-sm text-xs text-medium-gray transition-colors hover:text-dark-charcoal"
      title={`Edit SKU prefix (e.g. ${exampleSku})`}
      aria-label={`Edit SKU prefix ${prefix}`}
    >
      <span>
        SKU prefix:{" "}
        <span className="font-mono font-semibold tracking-wide text-dark-charcoal">
          {prefix}-
        </span>
      </span>
      <Pencil
        className="size-3 opacity-50 group-hover:opacity-100"
        aria-hidden="true"
      />
    </button>
  );
}
