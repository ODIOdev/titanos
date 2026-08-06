"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { deleteProduct } from "@/lib/actions/admin";
import { brandReturnKey, withAdminReturn } from "@/lib/admin/return-to";

export function BrandProductRowActions({
  productId,
  productName,
  brandId,
}: {
  productId: string;
  productName: string;
  brandId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const editHref = withAdminReturn(
    `/admin/products/${productId}`,
    brandReturnKey(brandId),
  );

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Link
          href={editHref}
          className="inline-flex size-8 items-center justify-center rounded-sm border border-border-gray text-dark-charcoal hover:bg-light-gray"
          aria-label={`Edit ${productName}`}
          title="Edit"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={() => setDeleteOpen(true)}
          className="inline-flex size-8 items-center justify-center rounded-sm border border-border-gray text-dark-charcoal hover:bg-light-gray disabled:opacity-50"
          aria-label={`Delete ${productName}`}
          title="Delete"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemLabel={productName}
        description="This permanently removes the product from the catalog. This cannot be undone."
        pending={pending}
        onConfirm={() => {
          startTransition(async () => {
            const result = await deleteProduct(productId);
            if (!result.success) {
              toast.error(result.message);
              return;
            }
            toast.success(result.message);
            setDeleteOpen(false);
            router.refresh();
          });
        }}
      />
    </>
  );
}
