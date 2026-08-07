"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  buildProductWithSupplies,
  getSuppliesInventory,
} from "@/lib/actions/supplies-inventory";
import type {
  SuppliesInventory,
  SupplyBox,
  SupplyItem,
} from "@/lib/admin/supplies-inventory";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";

function formatUnitCost(value: number) {
  if (!value || value <= 0) return null;
  if (value < 0.01) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value);
  }
  return formatCurrency(value);
}

export function BuildProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<SuppliesInventory | null>(null);
  const [boxId, setBoxId] = useState("");
  const [boxQty, setBoxQty] = useState("1");
  const [itemQtyById, setItemQtyById] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    void getSuppliesInventory()
      .then((data) => {
        if (cancelled) return;
        setInventory(data);
        const firstBox = data.boxes.find((b) => b.qty > 0) ?? data.boxes[0];
        setBoxId(firstBox?.id ?? "");
        setBoxQty("1");
        setItemQtyById({});
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Could not load supplies inventory.");
          setInventory({ boxes: [], items: [] });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const selectedBox: SupplyBox | undefined = useMemo(
    () => inventory?.boxes.find((b) => b.id === boxId),
    [inventory, boxId],
  );

  const availableBoxes = inventory?.boxes ?? [];
  const availableItems = inventory?.items ?? [];

  function handleOpenChange(next: boolean) {
    setOpen(next);
  }

  function setItemQty(id: string, value: string) {
    setItemQtyById((prev) => ({ ...prev, [id]: value }));
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 shrink-0 px-2.5"
        onClick={(e) => {
          e.stopPropagation();
          handleOpenChange(true);
        }}
      >
        Build
      </Button>
      <Dialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Build packaging"
        description={`Pack “${productName}” using warehouse supplies. Deducts boxes/items and remembers size for labels.`}
        className="max-w-lg"
      >
        {loading || !inventory ? (
          <p className="py-6 text-sm text-medium-gray">Loading supplies…</p>
        ) : availableBoxes.length === 0 ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-medium-gray">
              No boxes in supplies inventory yet. Add boxes under Supplies
              inventory, then build packaging for this product.
            </p>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!boxId) {
                toast.error("Select a box.");
                return;
              }
              const qty = Math.floor(Number(boxQty));
              if (!Number.isFinite(qty) || qty < 1) {
                toast.error("Use at least 1 box.");
                return;
              }
              const itemUsages = Object.entries(itemQtyById)
                .map(([id, raw]) => ({
                  id,
                  qty: Math.floor(Number(raw) || 0),
                }))
                .filter((u) => u.qty > 0);

              startTransition(async () => {
                const result = await buildProductWithSupplies({
                  productId,
                  boxId,
                  boxQty: qty,
                  itemUsages,
                });
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
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-medium-gray">
                Box
              </p>
              <div className="space-y-1.5">
                {availableBoxes.map((box: SupplyBox) => {
                  const selected = box.id === boxId;
                  const dims =
                    box.length > 0 || box.width > 0 || box.height > 0
                      ? `${box.length}×${box.width}×${box.height} in`
                      : "Size not set";
                  const unit = formatUnitCost(box.unitCost);
                  return (
                    <button
                      key={box.id}
                      type="button"
                      disabled={box.qty <= 0}
                      onClick={() => setBoxId(box.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-sm border px-3 py-2 text-left text-sm transition-colors",
                        selected
                          ? "border-dark-charcoal bg-light-gray/60"
                          : "border-border-gray bg-white hover:border-dark-charcoal/40",
                        box.qty <= 0 && "opacity-50",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block font-medium text-dark-charcoal">
                          {box.name}
                        </span>
                        <span className="block text-xs tabular-nums text-medium-gray">
                          {dims}
                          {unit ? ` · ${unit}/ea` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums text-xs font-semibold text-dark-charcoal">
                        {box.qty} on hand
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Input
              label="Boxes to use"
              type="number"
              min={1}
              step={1}
              required
              value={boxQty}
              onChange={(e) => setBoxQty(e.target.value)}
              hint={
                selectedBox
                  ? `Max ${selectedBox.qty} · ${selectedBox.name}`
                  : undefined
              }
            />

            {availableItems.length > 0 ? (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-medium-gray">
                  Add items (optional)
                </p>
                <ul className="space-y-2">
                  {availableItems.map((item: SupplyItem) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center gap-2 rounded-sm border border-border-gray px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-dark-charcoal">
                          {item.name}
                        </p>
                        <p className="text-xs tabular-nums text-medium-gray">
                          {item.qty.toLocaleString()} {item.unit} on hand
                        </p>
                      </div>
                      <div className="w-20 shrink-0">
                        <Input
                          aria-label={`Qty of ${item.name}`}
                          type="number"
                          min={0}
                          step={1}
                          value={itemQtyById[item.id] ?? ""}
                          onChange={(e) => setItemQty(item.id, e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex justify-end gap-2 border-t border-border-gray pt-3">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending || !boxId}>
                {pending ? "Building…" : "Build"}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </>
  );
}
