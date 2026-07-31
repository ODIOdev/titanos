"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { resetPlatform } from "@/lib/actions/admin";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CONFIRM_WORD = "RESET";

export function ResetPlatformCard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setConfirmation("");
  }

  return (
    <>
      <section className="rounded-sm border border-red-200 bg-white p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-sm bg-red-50 text-red-700">
            <TriangleAlert className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-red-700">
              Danger zone
            </p>
            <h2 className="font-heading text-lg font-semibold uppercase tracking-wide text-dark-charcoal">
              Reset platform
            </h2>
            <p className="mt-1 text-sm text-medium-gray">
              Permanently delete all products, categories, brands, orders,
              quotes, carts, and related catalog data. Admin accounts and store
              settings are kept.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="danger"
          className="mt-5"
          onClick={() => handleOpenChange(true)}
        >
          Reset platform
        </Button>
      </section>

      <Dialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Reset the entire platform?"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="rounded-sm border border-red-200 bg-red-50 px-3 py-3 text-sm text-dark-charcoal">
            <p className="font-semibold text-red-800">
              This cannot be undone.
            </p>
            <p className="mt-1 text-medium-gray">
              All catalog and commerce data will be wiped. Type{" "}
              <span className="font-semibold text-dark-charcoal">
                {CONFIRM_WORD}
              </span>{" "}
              to continue.
            </p>
          </div>
          <Input
            label={`Type ${CONFIRM_WORD} to confirm`}
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={pending || confirmation.trim() !== CONFIRM_WORD}
              onClick={() => {
                startTransition(async () => {
                  const result = await resetPlatform(confirmation);
                  if (!result.success) {
                    toast.error(result.message);
                    return;
                  }
                  toast.success(result.message);
                  handleOpenChange(false);
                  router.refresh();
                });
              }}
            >
              {pending ? "Resetting…" : "Reset platform"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
