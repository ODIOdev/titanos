"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCategory } from "@/lib/actions/admin";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";

export function CategoryRowActions({
  categoryId,
  categoryName,
}: {
  categoryId: string;
  categoryName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleConfirmDelete() {
    startTransition(async () => {
      const result = await deleteCategory(categoryId);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setConfirmOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Link
          href={`/admin/categories/${categoryId}/edit`}
          className="inline-flex size-8 items-center justify-center rounded-sm border border-border-gray text-dark-charcoal hover:bg-light-gray"
          aria-label={`Edit ${categoryName}`}
          title="Edit"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirmOpen(true)}
          className="inline-flex size-8 items-center justify-center rounded-sm border border-border-gray text-dark-charcoal hover:bg-light-gray disabled:opacity-50"
          aria-label={`Delete ${categoryName}`}
          title="Delete"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        itemLabel={categoryName}
        description="Products in this category will become uncategorized. This cannot be undone."
        pending={pending}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
