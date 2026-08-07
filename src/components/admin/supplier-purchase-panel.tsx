"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Package, Boxes } from "lucide-react";
import {
  purchaseProductFromSupplier,
  purchaseSupplyBoxFromSupplier,
  purchaseSupplyItemFromSupplier,
  restockSupplyFromSupplier,
} from "@/lib/actions/supplier";
import type { SupplyEntry } from "@/lib/admin/supplies-inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";

export type SupplierProductOption = {
  id: string;
  name: string;
  sku: string | null;
  cost: number;
  stock: number;
};

type TabId = "products" | "supplies";

export function SupplierPurchasePanel({
  balance,
  products,
  supplies,
}: {
  balance: number;
  products: SupplierProductOption[];
  supplies: SupplyEntry[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("products");
  const [pending, startTransition] = useTransition();

  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [productQuery, setProductQuery] = useState("");
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const [productQty, setProductQty] = useState("10");
  const [productCost, setProductCost] = useState("");

  const [supplyMode, setSupplyMode] = useState<"restock" | "new-box" | "new-item">(
    supplies.length > 0 ? "restock" : "new-box",
  );
  const [supplyId, setSupplyId] = useState(supplies[0]?.id ?? "");
  const [supplyQty, setSupplyQty] = useState("25");
  const [supplyCost, setSupplyCost] = useState("");
  const [newName, setNewName] = useState("");
  const [boxL, setBoxL] = useState("12");
  const [boxW, setBoxW] = useState("10");
  const [boxH, setBoxH] = useState("8");
  const [itemUnit, setItemUnit] = useState("each");

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products;
    const tokens = q.split(/\s+/).filter(Boolean);
    return products.filter((p) => {
      const haystack = [p.name, p.sku ?? ""].join(" ").toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });
  }, [products, productQuery]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId) ?? null,
    [products, productId],
  );

  function pickProduct(product: SupplierProductOption) {
    setProductId(product.id);
    setProductQuery(product.sku ? `${product.name} · ${product.sku}` : product.name);
    setProductMenuOpen(false);
    if (!(Number(productCost) > 0)) {
      const suggest = Math.round(product.cost * 10 * 100) / 100;
      if (suggest > 0) setProductCost(String(suggest));
    }
  }

  const productTotal = Math.max(0, Number(productCost) || 0);
  const supplyTotal = Math.max(0, Number(supplyCost) || 0);
  const activeTotal = tab === "products" ? productTotal : supplyTotal;
  const canAfford = activeTotal > 0 && activeTotal <= balance;
  const buyProductId = productId;

  function run(action: () => Promise<{ success: boolean; message: string }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setProductCost("");
      setSupplyCost("");
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-sm border border-border-gray bg-white">
      <div className="flex flex-wrap gap-1 border-b border-border-gray bg-light-gray/40 p-1.5">
        {(
          [
            { id: "products" as const, label: "Buy products", icon: Package },
            { id: "supplies" as const, label: "Buy supplies", icon: Boxes },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors @5xl:flex-none",
              tab === item.id
                ? "bg-dark-charcoal text-white"
                : "text-medium-gray hover:text-dark-charcoal",
            )}
          >
            <item.icon className="size-3.5" aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </div>

      <div className="space-y-4 p-4 @5xl:p-5">
        {tab === "products" ? (
          products.length === 0 ? (
            <p className="py-8 text-center text-sm text-medium-gray">
              No active products to restock yet.
            </p>
          ) : (
            <div className="grid gap-3 @5xl:grid-cols-2">
              <div className="relative @5xl:col-span-2">
                <Input
                  id="supplier-product-search"
                  label="Search products"
                  type="search"
                  value={productQuery}
                  onChange={(e) => {
                    setProductQuery(e.target.value);
                    setProductMenuOpen(true);
                  }}
                  onFocus={() => setProductMenuOpen(true)}
                  onBlur={() => {
                    // Allow option click (mousedown) to fire before closing.
                    window.setTimeout(() => setProductMenuOpen(false), 120);
                  }}
                  placeholder="Type name or SKU…"
                  hint={
                    productQuery.trim()
                      ? `${filteredProducts.length} match${filteredProducts.length === 1 ? "" : "es"}`
                      : `Start typing to filter ${products.length} products`
                  }
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={productMenuOpen}
                  aria-controls="supplier-product-results"
                  aria-autocomplete="list"
                />
                {productMenuOpen ? (
                  <div
                    id="supplier-product-results"
                    role="listbox"
                    className="absolute left-0 right-0 top-[calc(100%-0.25rem)] z-20 mt-1 max-h-64 overflow-y-auto rounded-sm border border-border-gray bg-white shadow-lg"
                  >
                    {filteredProducts.length === 0 ? (
                      <p className="px-3 py-3 text-sm text-medium-gray">
                        No products match “{productQuery.trim()}”.
                      </p>
                    ) : (
                      <ul className="divide-y divide-border-gray py-1">
                        {filteredProducts.slice(0, 40).map((p) => {
                          const active = p.id === buyProductId;
                          return (
                            <li key={p.id}>
                              <button
                                type="button"
                                role="option"
                                aria-selected={active}
                                className={cn(
                                  "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors hover:bg-light-gray/70",
                                  active && "bg-titan-yellow/20",
                                )}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => pickProduct(p)}
                              >
                                <span className="text-sm font-medium text-dark-charcoal">
                                  {p.name}
                                </span>
                                <span className="text-xs tabular-nums text-medium-gray">
                                  {p.sku ? (
                                    <span className="font-mono uppercase">
                                      {p.sku}
                                    </span>
                                  ) : (
                                    "No SKU"
                                  )}
                                  {" · "}
                                  {p.stock} on hand · cost{" "}
                                  {formatCurrency(p.cost)}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {filteredProducts.length > 40 ? (
                      <p className="border-t border-border-gray px-3 py-2 text-[11px] text-medium-gray">
                        Showing first 40 of {filteredProducts.length}. Keep
                        typing to narrow.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {selectedProduct ? (
                <div className="rounded-sm border border-border-gray bg-light-gray/40 px-3 py-2.5 @5xl:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-medium-gray">
                    Selected
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-dark-charcoal">
                    {selectedProduct.name}
                  </p>
                  <p className="text-xs tabular-nums text-medium-gray">
                    {selectedProduct.sku ? (
                      <span className="font-mono uppercase">
                        {selectedProduct.sku}
                      </span>
                    ) : (
                      "No SKU"
                    )}
                    {" · "}
                    {selectedProduct.stock} on hand · cost{" "}
                    {formatCurrency(selectedProduct.cost)}
                    {productTotal > 0 && Number(productQty) > 0
                      ? ` · buying at ${formatCurrency(productTotal / Number(productQty))} / unit`
                      : null}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-medium-gray @5xl:col-span-2">
                  Search and pick a product to buy stock.
                </p>
              )}

              <div>
                <Label htmlFor="supplier-product-qty">Quantity</Label>
                <Input
                  id="supplier-product-qty"
                  type="number"
                  min={1}
                  step={1}
                  value={productQty}
                  onChange={(e) => setProductQty(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="supplier-product-cost">Total cost (USD)</Label>
                <Input
                  id="supplier-product-cost"
                  type="number"
                  min={0.01}
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={productCost}
                  onChange={(e) => setProductCost(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-gray pt-3 @5xl:col-span-2">
                <p
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    canAfford ? "text-emerald-700" : "text-red-700",
                  )}
                >
                  Charge {formatCurrency(productTotal)}
                  {!canAfford && productTotal > 0
                    ? ` · short ${(productTotal - balance).toFixed(2)}`
                    : ""}
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={pending || !canAfford || !buyProductId}
                  onClick={() =>
                    run(() =>
                      purchaseProductFromSupplier({
                        productId: buyProductId,
                        qty: Number(productQty),
                        totalCost: productTotal,
                      }),
                    )
                  }
                >
                  {pending ? "Buying…" : "Buy stock"}
                </Button>
              </div>
            </div>
          )
        ) : (
          <div className="grid gap-3 @5xl:grid-cols-2">
            <div className="@5xl:col-span-2">
              <Label>Purchase type</Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {(
                  [
                    { id: "restock" as const, label: "Restock existing" },
                    { id: "new-box" as const, label: "New box" },
                    { id: "new-item" as const, label: "New item" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={opt.id === "restock" && supplies.length === 0}
                    onClick={() => setSupplyMode(opt.id)}
                    className={cn(
                      "rounded-sm border px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide",
                      supplyMode === opt.id
                        ? "border-dark-charcoal bg-dark-charcoal text-white"
                        : "border-border-gray bg-white text-dark-charcoal hover:border-dark-charcoal/40",
                      opt.id === "restock" &&
                        supplies.length === 0 &&
                        "opacity-40",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {supplyMode === "restock" ? (
              <div className="@5xl:col-span-2">
                <Select
                  id="supplier-supply"
                  label="Supply line"
                  value={supplyId}
                  options={supplies.map((s) => ({
                    value: s.id,
                    label: `${s.kind === "box" ? "Box" : "Item"} · ${s.name} · ${s.qty} on hand`,
                  }))}
                  onChange={(e) => setSupplyId(e.target.value)}
                />
              </div>
            ) : (
              <div className="@5xl:col-span-2">
                <Label htmlFor="supplier-supply-name">Name</Label>
                <Input
                  id="supplier-supply-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={
                    supplyMode === "new-box" ? "Medium box" : "Packing tape"
                  }
                />
              </div>
            )}

            {supplyMode === "new-box" ? (
              <>
                <div>
                  <Label htmlFor="supplier-box-l">Length (in)</Label>
                  <Input
                    id="supplier-box-l"
                    type="number"
                    min={0}
                    step="0.1"
                    value={boxL}
                    onChange={(e) => setBoxL(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="supplier-box-w">Width</Label>
                    <Input
                      id="supplier-box-w"
                      type="number"
                      min={0}
                      step="0.1"
                      value={boxW}
                      onChange={(e) => setBoxW(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier-box-h">Height</Label>
                    <Input
                      id="supplier-box-h"
                      type="number"
                      min={0}
                      step="0.1"
                      value={boxH}
                      onChange={(e) => setBoxH(e.target.value)}
                    />
                  </div>
                </div>
              </>
            ) : null}

            {supplyMode === "new-item" ? (
              <div>
                <Label htmlFor="supplier-item-unit">Unit</Label>
                <Input
                  id="supplier-item-unit"
                  value={itemUnit}
                  onChange={(e) => setItemUnit(e.target.value)}
                  placeholder="each / roll / pack"
                />
              </div>
            ) : null}

            <div>
              <Label htmlFor="supplier-supply-qty">Quantity</Label>
              <Input
                id="supplier-supply-qty"
                type="number"
                min={1}
                step={1}
                value={supplyQty}
                onChange={(e) => setSupplyQty(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="supplier-supply-cost">Total cost (USD)</Label>
              <Input
                id="supplier-supply-cost"
                type="number"
                min={0.01}
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={supplyCost}
                onChange={(e) => setSupplyCost(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-gray pt-3 @5xl:col-span-2">
              <p
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  canAfford ? "text-emerald-700" : "text-red-700",
                )}
              >
                Charge {formatCurrency(supplyTotal)}
                {!canAfford && supplyTotal > 0
                  ? ` · short ${(supplyTotal - balance).toFixed(2)}`
                  : ""}
              </p>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={pending || !canAfford}
                onClick={() => {
                  const qty = Number(supplyQty);
                  if (supplyMode === "restock") {
                    const entry = supplies.find((s) => s.id === supplyId);
                    if (!entry) {
                      toast.error("Select a supply line.");
                      return;
                    }
                    run(() =>
                      restockSupplyFromSupplier({
                        id: entry.id,
                        kind: entry.kind,
                        restockQty: qty,
                        restockCost: supplyTotal,
                      }),
                    );
                    return;
                  }
                  if (supplyMode === "new-box") {
                    if (!newName.trim()) {
                      toast.error("Enter a box name.");
                      return;
                    }
                    run(() =>
                      purchaseSupplyBoxFromSupplier({
                        name: newName,
                        length: Number(boxL),
                        width: Number(boxW),
                        height: Number(boxH),
                        qty,
                        cost: supplyTotal,
                      }),
                    );
                    return;
                  }
                  if (!newName.trim()) {
                    toast.error("Enter an item name.");
                    return;
                  }
                  run(() =>
                    purchaseSupplyItemFromSupplier({
                      name: newName,
                      qty,
                      unit: itemUnit,
                      cost: supplyTotal,
                    }),
                  );
                }}
              >
                {pending ? "Buying…" : "Buy supplies"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
