"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Package, Plus, Trash2 } from "lucide-react";
import {
  addSupplyBox,
  addSupplyItem,
  adjustSupplyQty,
  removeSupplyEntry,
  updateSupplyEntry,
} from "@/lib/actions/supplies-inventory";
import {
  DEFAULT_SUPPLY_BOX_TEMPLATES,
  supplyStockState,
  suppliesTotals,
  unitCostFromTotal,
  type SuppliesInventory,
  type SupplyBox,
  type SupplyEntry,
  type SupplyItem,
} from "@/lib/admin/supplies-inventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";

type Tab = "box" | "item";

function formatUnitCost(value: number) {
  if (!value || value <= 0) return "—";
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

function StockBadge({ qty, threshold }: { qty: number; threshold: number }) {
  const state = supplyStockState(qty, threshold);
  if (state === "out") return <Badge variant="warning">Out</Badge>;
  if (state === "low") return <Badge variant="warning">Low</Badge>;
  return <Badge variant="success">OK</Badge>;
}

function PerCountHint({
  cost,
  qty,
  unitLabel = "each",
}: {
  cost: string;
  qty: string;
  unitLabel?: string;
}) {
  const total = Number(cost);
  const count = Math.floor(Number(qty) || 0);
  const per = unitCostFromTotal(total, count);
  if (!Number.isFinite(total) || total <= 0 || count <= 0) {
    return (
      <p className="text-xs text-medium-gray">
        Enter cost and quantity to calculate per-count price.
      </p>
    );
  }
  return (
    <p className="rounded-sm border border-border-gray bg-light-gray/50 px-3 py-2 text-sm text-dark-charcoal">
      <span className="font-semibold tabular-nums">{formatUnitCost(per)}</span>
      <span className="text-medium-gray"> / {unitLabel}</span>
      <span className="mx-1.5 text-border-gray">·</span>
      <span className="text-xs text-medium-gray">
        {formatCurrency(total)} ÷ {count.toLocaleString()}
      </span>
    </p>
  );
}

function AddSuppliesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>("box");

  const [boxName, setBoxName] = useState("Medium box");
  const [length, setLength] = useState("12");
  const [width, setWidth] = useState("10");
  const [height, setHeight] = useState("8");
  const [boxQty, setBoxQty] = useState("25");
  const [boxCost, setBoxCost] = useState("");

  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("10");
  const [itemUnit, setItemUnit] = useState("each");
  const [itemNotes, setItemNotes] = useState("");
  const [itemCost, setItemCost] = useState("");

  function applyTemplate(
    template: (typeof DEFAULT_SUPPLY_BOX_TEMPLATES)[number],
  ) {
    setBoxName(template.name);
    setLength(String(template.length));
    setWidth(String(template.width));
    setHeight(String(template.height));
  }

  function resetAndClose() {
    onOpenChange(false);
  }

  function submitBox(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await addSupplyBox({
        name: boxName,
        length: Number(length) || 0,
        width: Number(width) || 0,
        height: Number(height) || 0,
        qty: Number(boxQty) || 0,
        cost: boxCost.trim() === "" ? undefined : Number(boxCost),
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setBoxCost("");
      resetAndClose();
      router.refresh();
    });
  }

  function submitItem(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await addSupplyItem({
        name: itemName,
        qty: Number(itemQty) || 0,
        unit: itemUnit,
        notes: itemNotes,
        cost: itemCost.trim() === "" ? undefined : Number(itemCost),
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setItemName("");
      setItemNotes("");
      setItemCost("");
      resetAndClose();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add supplies"
      description="Onboard warehouse packing boxes and consumable supply items."
      className="max-w-lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-1 rounded-sm border border-border-gray bg-light-gray/50 p-1">
          <button
            type="button"
            onClick={() => setTab("box")}
            className={cn(
              "rounded-sm px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors",
              tab === "box"
                ? "bg-white text-dark-charcoal shadow-sm"
                : "text-medium-gray hover:text-dark-charcoal",
            )}
          >
            Boxes
          </button>
          <button
            type="button"
            onClick={() => setTab("item")}
            className={cn(
              "rounded-sm px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors",
              tab === "item"
                ? "bg-white text-dark-charcoal shadow-sm"
                : "text-medium-gray hover:text-dark-charcoal",
            )}
          >
            Add items
          </button>
        </div>

        {tab === "box" ? (
          <form className="space-y-4" onSubmit={submitBox}>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-medium-gray">
                Quick sizes
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_SUPPLY_BOX_TEMPLATES.map((template) => (
                  <button
                    key={template.name}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="rounded-sm border border-border-gray bg-white px-2 py-1 text-[11px] font-medium text-dark-charcoal hover:border-dark-charcoal/40"
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Box name / size"
              required
              value={boxName}
              onChange={(e) => setBoxName(e.target.value)}
              placeholder="Medium box"
            />

            <div className="grid grid-cols-3 gap-2">
              <Input
                label="L (in)"
                type="number"
                min={0}
                step="0.1"
                value={length}
                onChange={(e) => setLength(e.target.value)}
              />
              <Input
                label="W (in)"
                type="number"
                min={0}
                step="0.1"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
              />
              <Input
                label="H (in)"
                type="number"
                min={0}
                step="0.1"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Quantity on hand"
                type="number"
                min={0}
                step={1}
                required
                value={boxQty}
                onChange={(e) => setBoxQty(e.target.value)}
              />
              <Input
                label="Total cost ($)"
                type="number"
                min={0}
                step="0.01"
                value={boxCost}
                onChange={(e) => setBoxCost(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <PerCountHint cost={boxCost} qty={boxQty} unitLabel="box" />

            <div className="flex justify-end gap-2 border-t border-border-gray pt-3">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Add box"}
              </Button>
            </div>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={submitItem}>
            <Input
              label="Item name"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Packing tape, bubble wrap…"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Quantity"
                type="number"
                min={0}
                step={1}
                required
                value={itemQty}
                onChange={(e) => setItemQty(e.target.value)}
              />
              <Input
                label="Unit"
                value={itemUnit}
                onChange={(e) => setItemUnit(e.target.value)}
                placeholder="each, roll, pack"
              />
            </div>
            <Input
              label="Total cost ($)"
              type="number"
              min={0}
              step="0.01"
              value={itemCost}
              onChange={(e) => setItemCost(e.target.value)}
              placeholder="0.00"
            />
            <PerCountHint
              cost={itemCost}
              qty={itemQty}
              unitLabel={itemUnit.trim() || "each"}
            />
            <Input
              label="Notes (optional)"
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              placeholder="Vendor, location…"
            />
            <div className="flex justify-end gap-2 border-t border-border-gray pt-3">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Add item"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  );
}

function SupplyRowActions({
  id,
  kind,
  qty,
}: {
  id: string;
  kind: "box" | "item";
  qty: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function adjust(delta: number) {
    startTransition(async () => {
      const result = await adjustSupplyQty({ id, kind, delta });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await removeSupplyEntry({ id, kind });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <div
      className="inline-flex flex-nowrap items-center justify-end gap-1"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 px-2.5"
        disabled={pending || qty <= 0}
        onClick={() => adjust(-1)}
      >
        −1
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 px-2.5"
        disabled={pending}
        onClick={() => adjust(10)}
      >
        +10
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 px-2.5 text-red-700 hover:border-red-300 hover:bg-red-50"
        disabled={pending}
        onClick={remove}
        aria-label="Remove"
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}

function SupplyDetailDialog({
  entry,
  open,
  onOpenChange,
}: {
  entry: SupplyEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isBox = entry?.kind === "box";

  const [name, setName] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [unit, setUnit] = useState("each");
  const [notes, setNotes] = useState("");
  const [qty, setQty] = useState("");
  const [threshold, setThreshold] = useState("");
  const [restockQty, setRestockQty] = useState("");
  const [restockCost, setRestockCost] = useState("");

  // Sync form when a different entry opens.
  useEffect(() => {
    if (!entry || !open) return;
    setName(entry.name);
    setQty(String(entry.qty));
    setThreshold(String(entry.lowStockThreshold));
    setRestockQty("");
    setRestockCost("");
    if (entry.kind === "box") {
      setLength(String(entry.length));
      setWidth(String(entry.width));
      setHeight(String(entry.height));
    } else {
      setUnit(entry.unit);
      setNotes(entry.notes ?? "");
    }
  }, [entry, open]);

  if (!entry) return null;

  const unitLabel = entry.kind === "box" ? "box" : entry.unit || "each";
  const lineValue = entry.qty * entry.unitCost;

  function save(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateSupplyEntry({
        id: entry!.id,
        kind: entry!.kind,
        name,
        qty: Number(qty),
        lowStockThreshold: Number(threshold),
        ...(entry!.kind === "box"
          ? {
              length: Number(length) || 0,
              width: Number(width) || 0,
              height: Number(height) || 0,
            }
          : {
              unit,
              notes,
            }),
        restockQty:
          restockQty.trim() === "" ? undefined : Number(restockQty),
        restockCost:
          restockCost.trim() === "" ? undefined : Number(restockCost),
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      onOpenChange(false);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await removeSupplyEntry({
        id: entry!.id,
        kind: entry!.kind,
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={entry.name}
      description={
        entry.kind === "box"
          ? "Box supply — edit size, stock, and cost."
          : "Supply item — edit stock, unit, and cost."
      }
      className="max-w-lg"
    >
      <form className="space-y-4" onSubmit={save}>
        <div className="flex flex-wrap items-center gap-2">
          <StockBadge qty={entry.qty} threshold={entry.lowStockThreshold} />
          <span className="text-sm tabular-nums text-medium-gray">
            {formatUnitCost(entry.unitCost)}/{unitLabel}
            {entry.unitCost > 0
              ? ` · ${formatCurrency(lineValue)} on hand`
              : ""}
          </span>
        </div>

        <Input
          label={isBox ? "Box name / size" : "Item name"}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {isBox ? (
          <div className="grid grid-cols-3 gap-2">
            <Input
              label="L (in)"
              type="number"
              min={0}
              step="0.1"
              value={length}
              onChange={(e) => setLength(e.target.value)}
            />
            <Input
              label="W (in)"
              type="number"
              min={0}
              step="0.1"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
            />
            <Input
              label="H (in)"
              type="number"
              min={0}
              step="0.1"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>
        ) : (
          <>
            <Input
              label="Unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="each, roll, pack"
            />
            <Input
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Vendor, location…"
            />
          </>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Input
            label="On hand"
            type="number"
            min={0}
            step={1}
            required
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
          <Input
            label="Low-stock alert"
            type="number"
            min={0}
            step={1}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
        </div>

        <div className="space-y-2 rounded-sm border border-border-gray bg-light-gray/40 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-medium-gray">
            Restock
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Add qty"
              type="number"
              min={0}
              step={1}
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
              placeholder="0"
            />
            <Input
              label="Total cost ($)"
              type="number"
              min={0}
              step="0.01"
              value={restockCost}
              onChange={(e) => setRestockCost(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <PerCountHint
            cost={restockCost}
            qty={restockQty}
            unitLabel={unitLabel}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-gray pt-3">
          <Button
            type="button"
            variant="outline"
            className="text-red-700 hover:border-red-300 hover:bg-red-50"
            disabled={pending}
            onClick={remove}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Remove
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}

export function SuppliesInventoryCard({
  inventory,
}: {
  inventory: SuppliesInventory;
}) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<SupplyEntry | null>(null);
  const totals = useMemo(() => suppliesTotals(inventory), [inventory]);

  const boxes = inventory.boxes;
  const items = inventory.items;
  const empty = boxes.length === 0 && items.length === 0;

  // Keep detail in sync after refresh while dialog stays open.
  const activeDetail = useMemo(() => {
    if (!detail) return null;
    if (detail.kind === "box") {
      return boxes.find((b) => b.id === detail.id) ?? detail;
    }
    return items.find((i) => i.id === detail.id) ?? detail;
  }, [detail, boxes, items]);

  return (
    <section
      id="supplies"
      className="overflow-hidden rounded-sm border border-border-gray bg-white scroll-mt-4"
    >      <div className="space-y-3 border-b border-border-gray px-4 py-4 @3xl:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-semibold uppercase tracking-wide text-dark-charcoal">
              Supplies inventory
            </h2>
            <p className="mt-0.5 text-sm text-medium-gray">
              Warehouse packing boxes and consumable supply items.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => setOpen(true)}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add supplies
          </Button>
        </div>

        <dl className="grid grid-cols-2 overflow-hidden rounded-sm border border-border-gray @3xl:grid-cols-4">
          <div className="border-b border-border-gray px-3 py-2.5 @3xl:border-b-0 @3xl:border-r">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-medium-gray">
              Boxes
            </dt>
            <dd className="mt-0.5 font-heading text-lg font-semibold tabular-nums leading-tight text-dark-charcoal">
              {totals.boxesUnits.toLocaleString()}
            </dd>
          </div>
          <div className="border-b border-l border-border-gray px-3 py-2.5 @3xl:border-b-0 @3xl:border-r">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-medium-gray">
              Items
            </dt>
            <dd className="mt-0.5 font-heading text-lg font-semibold tabular-nums leading-tight text-dark-charcoal">
              {totals.itemsUnits.toLocaleString()}
            </dd>
          </div>
          <div className="px-3 py-2.5 @3xl:border-r @3xl:border-border-gray">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-medium-gray">
              Value
            </dt>
            <dd className="mt-0.5 font-heading text-lg font-semibold tabular-nums leading-tight text-dark-charcoal">
              {formatCurrency(totals.value)}
            </dd>
          </div>
          <div className="border-l border-border-gray px-3 py-2.5">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-medium-gray">
              Low / out
            </dt>
            <dd
              className={cn(
                "mt-0.5 font-heading text-lg font-semibold tabular-nums leading-tight",
                totals.lowOut > 0
                  ? "text-warning-orange"
                  : "text-dark-charcoal",
              )}
            >
              {totals.lowOut}
            </dd>
          </div>
        </dl>
      </div>

      {empty ? (
        <div className="flex flex-col items-center px-4 py-12 text-center">
          <Package className="size-8 text-medium-gray" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-dark-charcoal">
            No supplies on hand yet
          </p>
          <p className="mt-1 max-w-sm text-sm text-medium-gray">
            Add box sizes with quantities, then onboard packing tape, labels,
            and other warehouse items.
          </p>
          <Button
            type="button"
            className="mt-4 gap-1.5"
            onClick={() => setOpen(true)}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add supplies
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border-gray">
          {boxes.length > 0 ? (
            <div>
              <div className="border-b border-border-gray bg-light-gray px-4 py-2">
                <p className="font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal">
                  Boxes
                </p>
              </div>
              <ul className="divide-y divide-border-gray">
                {boxes.map((box: SupplyBox) => (
                  <li key={box.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setDetail(box)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setDetail(box);
                        }
                      }}
                      className="flex w-full cursor-pointer flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-light-gray/60"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-dark-charcoal">
                          {box.name}
                        </p>
                        <p className="text-xs tabular-nums text-medium-gray">
                          {box.length > 0 || box.width > 0 || box.height > 0
                            ? `${box.length} × ${box.width} × ${box.height} in`
                            : "Size not set"}
                          {box.unitCost > 0
                            ? ` · ${formatUnitCost(box.unitCost)}/ea`
                            : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold tabular-nums text-dark-charcoal">
                          {box.qty.toLocaleString()}
                          <span className="ml-1 text-[11px] font-medium uppercase text-medium-gray">
                            on hand
                          </span>
                        </p>
                        {box.unitCost > 0 ? (
                          <p className="text-[11px] tabular-nums text-medium-gray">
                            {formatCurrency(box.qty * box.unitCost)} value
                          </p>
                        ) : null}
                      </div>
                      <StockBadge
                        qty={box.qty}
                        threshold={box.lowStockThreshold}
                      />
                      <SupplyRowActions id={box.id} kind="box" qty={box.qty} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {items.length > 0 ? (
            <div>
              <div className="border-b border-border-gray bg-light-gray px-4 py-2">
                <p className="font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal">
                  Items
                </p>
              </div>
              <ul className="divide-y divide-border-gray">
                {items.map((item: SupplyItem) => (
                  <li key={item.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setDetail(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setDetail(item);
                        }
                      }}
                      className="flex w-full cursor-pointer flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-light-gray/60"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-dark-charcoal">
                          {item.name}
                        </p>
                        <p className="text-xs text-medium-gray">
                          {item.unit}
                          {item.unitCost > 0
                            ? ` · ${formatUnitCost(item.unitCost)}/${item.unit}`
                            : ""}
                          {item.notes ? ` · ${item.notes}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold tabular-nums text-dark-charcoal">
                          {item.qty.toLocaleString()}
                          <span className="ml-1 text-[11px] font-medium uppercase text-medium-gray">
                            {item.unit}
                          </span>
                        </p>
                        {item.unitCost > 0 ? (
                          <p className="text-[11px] tabular-nums text-medium-gray">
                            {formatCurrency(item.qty * item.unitCost)} value
                          </p>
                        ) : null}
                      </div>
                      <StockBadge
                        qty={item.qty}
                        threshold={item.lowStockThreshold}
                      />
                      <SupplyRowActions
                        id={item.id}
                        kind="item"
                        qty={item.qty}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      <AddSuppliesDialog open={open} onOpenChange={setOpen} />
      <SupplyDetailDialog
        entry={activeDetail}
        open={detail != null}
        onOpenChange={(next) => {
          if (!next) setDetail(null);
        }}
      />
    </section>
  );
}
