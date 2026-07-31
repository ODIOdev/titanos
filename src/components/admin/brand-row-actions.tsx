"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteBrand } from "@/lib/actions/admin";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";

export function BrandRowActions({
  brandId,
  brandName,
}: {
  brandId: string;
  brandName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleConfirmDelete() {
    startTransition(async () => {
      const result = await deleteBrand(brandId);
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
          href={`/admin/brands/${brandId}/edit`}
          className="inline-flex size-8 items-center justify-center rounded-sm border border-border-gray text-dark-charcoal hover:bg-light-gray"
          aria-label={`Edit ${brandName}`}
          title="Edit"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirmOpen(true)}
          className="inline-flex size-8 items-center justify-center rounded-sm border border-border-gray text-dark-charcoal hover:bg-light-gray disabled:opacity-50"
          aria-label={`Delete ${brandName}`}
          title="Delete"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        itemLabel={brandName}
        description="Products from this brand will become unbranded. This cannot be undone."
        pending={pending}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
