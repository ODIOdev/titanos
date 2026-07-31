"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { replenishProduct } from "@/lib/actions/admin";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReplenishProductButton({
  productId,
  productName,
  currentQty,
}: {
  productId: string;
  productName: string;
  currentQty: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("10");
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) setAmount("10");
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => handleOpenChange(true)}
      >
        Replenish
      </Button>
      <Dialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Replenish stock"
        description={`Add units to “${productName}”. Currently ${currentQty} on hand.`}
        className="max-w-md"
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const qty = Math.floor(Number(amount));
            if (!Number.isFinite(qty) || qty < 1) {
              toast.error("Enter a quantity of at least 1.");
              return;
            }
            startTransition(async () => {
              const result = await replenishProduct(productId, qty);
              if (!result.success) {
                toast.error(result.message);
                return;
              }
              toast.success(result.message);
              setOpen(false);
              router.refresh();
            });
          }}
        >
          <Input
            label="Quantity to add"
            type="number"
            min={1}
            step={1}
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            hint={
              Number(amount) > 0
                ? `New on-hand total: ${currentQty + Math.floor(Number(amount) || 0)}`
                : undefined
            }
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Add stock"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
