"use client";

import { TriangleAlert } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ConfirmDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  itemLabel: string;
  description?: string;
  pending?: boolean;
  onConfirm: () => void;
};

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title = "Delete permanently?",
  itemLabel,
  description,
  pending = false,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      className="max-w-md"
    >
      <div className="space-y-4">
        <div className="flex gap-3 rounded-sm border border-warning-orange/40 bg-warning-orange/10 px-3 py-3">
          <TriangleAlert
            className="mt-0.5 size-5 shrink-0 text-warning-orange"
            aria-hidden="true"
          />
          <div className="min-w-0 text-sm text-dark-charcoal">
            <p className="font-semibold">
              You are about to delete “{itemLabel}”.
            </p>
            <p className="mt-1 text-medium-gray">
              {description ??
                "This action cannot be undone. Related data may be affected."}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
