"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteMember } from "@/lib/actions/admin";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";

export function MemberRowActions({
  memberId,
  memberName,
  canDelete = true,
}: {
  memberId: string;
  memberName: string;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleConfirmDelete() {
    startTransition(async () => {
      const result = await deleteMember(memberId);
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
          href={`/admin/members/${memberId}/edit`}
          className="inline-flex size-8 items-center justify-center rounded-sm border border-border-gray text-dark-charcoal hover:bg-light-gray"
          aria-label={`Edit ${memberName}`}
          title="Edit"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
        </Link>
        <button
          type="button"
          disabled={pending || !canDelete}
          onClick={() => setConfirmOpen(true)}
          className="inline-flex size-8 items-center justify-center rounded-sm border border-border-gray text-dark-charcoal hover:bg-light-gray disabled:opacity-50"
          aria-label={`Remove ${memberName}`}
          title={canDelete ? "Remove" : "Master admin cannot be removed"}
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        itemLabel={memberName}
        description="This removes their login and admin access. This cannot be undone."
        pending={pending}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
