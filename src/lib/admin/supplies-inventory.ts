/** Warehouse packing supplies inventory (boxes + consumable items). */

export const SUPPLIES_INVENTORY_KEY = "supplies_inventory";

export type SupplyBox = {
  id: string;
  kind: "box";
  name: string;
  length: number;
  width: number;
  height: number;
  qty: number;
  /** Cost per unit (weighted avg when restocking). */
  unitCost: number;
  lowStockThreshold: number;
};

export type SupplyItem = {
  id: string;
  kind: "item";
  name: string;
  qty: number;
  unit: string;
  /** Cost per unit (weighted avg when restocking). */
  unitCost: number;
  lowStockThreshold: number;
  notes?: string;
};

export type SupplyEntry = SupplyBox | SupplyItem;

export type SuppliesInventory = {
  boxes: SupplyBox[];
  items: SupplyItem[];
};

export const DEFAULT_SUPPLY_BOX_TEMPLATES: Omit<
  SupplyBox,
  "id" | "qty" | "unitCost" | "lowStockThreshold"
>[] = [
  { kind: "box", name: "Poly mailer", length: 12, width: 10, height: 1 },
  { kind: "box", name: "Small box", length: 8, width: 6, height: 4 },
  { kind: "box", name: "Medium box", length: 12, width: 10, height: 8 },
  { kind: "box", name: "Large box", length: 18, width: 14, height: 12 },
];

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function asNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Round money to 4 decimals (cheap per-unit supplies). */
export function roundUnitCost(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value * 10000) / 10000;
}

/** Per-count price from total purchase cost ÷ quantity. */
export function unitCostFromTotal(totalCost: number, qty: number): number {
  const cost = Math.max(0, Number(totalCost) || 0);
  const count = Math.floor(Number(qty) || 0);
  if (count <= 0 || cost <= 0) return 0;
  return roundUnitCost(cost / count);
}

/** Weighted average unit cost when adding stock to an existing line. */
export function mergeUnitCost(
  existingQty: number,
  existingUnitCost: number,
  addQty: number,
  addTotalCost: number,
): number {
  const onHand = Math.max(0, Math.floor(existingQty));
  const incoming = Math.max(0, Math.floor(addQty));
  const priorCost = Math.max(0, existingUnitCost) * onHand;
  const purchaseCost = Math.max(0, Number(addTotalCost) || 0);
  const totalQty = onHand + incoming;
  if (totalQty <= 0) return 0;
  if (purchaseCost <= 0) {
    return roundUnitCost(Math.max(0, existingUnitCost));
  }
  return roundUnitCost((priorCost + purchaseCost) / totalQty);
}

export function emptySuppliesInventory(): SuppliesInventory {
  return { boxes: [], items: [] };
}

export function parseSuppliesInventory(value: unknown): SuppliesInventory {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return emptySuppliesInventory();
  }
  const row = value as Record<string, unknown>;
  const boxesRaw = Array.isArray(row.boxes) ? row.boxes : [];
  const itemsRaw = Array.isArray(row.items) ? row.items : [];

  const boxes: SupplyBox[] = [];
  for (const item of boxesRaw) {
    if (!item || typeof item !== "object") continue;
    const b = item as Record<string, unknown>;
    const name = typeof b.name === "string" ? b.name.trim() : "";
    if (!name) continue;
    boxes.push({
      id: typeof b.id === "string" && b.id ? b.id : newId("box"),
      kind: "box",
      name,
      length: Math.max(0, asNumber(b.length)),
      width: Math.max(0, asNumber(b.width)),
      height: Math.max(0, asNumber(b.height)),
      qty: Math.max(0, Math.floor(asNumber(b.qty))),
      unitCost: roundUnitCost(asNumber(b.unitCost)),
      lowStockThreshold: Math.max(
        0,
        Math.floor(asNumber(b.lowStockThreshold, 5)),
      ),
    });
  }

  const items: SupplyItem[] = [];
  for (const item of itemsRaw) {
    if (!item || typeof item !== "object") continue;
    const i = item as Record<string, unknown>;
    const name = typeof i.name === "string" ? i.name.trim() : "";
    if (!name) continue;
    items.push({
      id: typeof i.id === "string" && i.id ? i.id : newId("item"),
      kind: "item",
      name,
      qty: Math.max(0, Math.floor(asNumber(i.qty))),
      unit:
        typeof i.unit === "string" && i.unit.trim()
          ? i.unit.trim()
          : "each",
      unitCost: roundUnitCost(asNumber(i.unitCost)),
      lowStockThreshold: Math.max(
        0,
        Math.floor(asNumber(i.lowStockThreshold, 5)),
      ),
      notes:
        typeof i.notes === "string" && i.notes.trim()
          ? i.notes.trim()
          : undefined,
    });
  }

  return { boxes, items };
}

export function supplyStockState(
  qty: number,
  threshold: number,
): "ok" | "low" | "out" {
  if (qty <= 0) return "out";
  if (qty <= threshold) return "low";
  return "ok";
}

export function createSupplyBox(input: {
  name: string;
  length?: number;
  width?: number;
  height?: number;
  qty: number;
  unitCost?: number;
  totalCost?: number;
  lowStockThreshold?: number;
}): SupplyBox {
  const qty = Math.max(0, Math.floor(Number(input.qty) || 0));
  const unitCost =
    input.unitCost != null
      ? roundUnitCost(Number(input.unitCost) || 0)
      : unitCostFromTotal(Number(input.totalCost) || 0, qty);
  return {
    id: newId("box"),
    kind: "box",
    name: input.name.trim(),
    length: Math.max(0, Number(input.length) || 0),
    width: Math.max(0, Number(input.width) || 0),
    height: Math.max(0, Number(input.height) || 0),
    qty,
    unitCost,
    lowStockThreshold: Math.max(
      0,
      Math.floor(Number(input.lowStockThreshold ?? 5) || 0),
    ),
  };
}

export function createSupplyItem(input: {
  name: string;
  qty: number;
  unit?: string;
  notes?: string;
  unitCost?: number;
  totalCost?: number;
  lowStockThreshold?: number;
}): SupplyItem {
  const qty = Math.max(0, Math.floor(Number(input.qty) || 0));
  const unitCost =
    input.unitCost != null
      ? roundUnitCost(Number(input.unitCost) || 0)
      : unitCostFromTotal(Number(input.totalCost) || 0, qty);
  return {
    id: newId("item"),
    kind: "item",
    name: input.name.trim(),
    qty,
    unit: (input.unit ?? "each").trim() || "each",
    unitCost,
    lowStockThreshold: Math.max(
      0,
      Math.floor(Number(input.lowStockThreshold ?? 5) || 0),
    ),
    notes: input.notes?.trim() || undefined,
  };
}

export function suppliesTotals(inventory: SuppliesInventory) {
  const boxesUnits = inventory.boxes.reduce((s, b) => s + b.qty, 0);
  const itemsUnits = inventory.items.reduce((s, i) => s + i.qty, 0);
  const value =
    inventory.boxes.reduce((s, b) => s + b.qty * b.unitCost, 0) +
    inventory.items.reduce((s, i) => s + i.qty * i.unitCost, 0);
  const lowOut =
    inventory.boxes.filter(
      (b) => supplyStockState(b.qty, b.lowStockThreshold) !== "ok",
    ).length +
    inventory.items.filter(
      (i) => supplyStockState(i.qty, i.lowStockThreshold) !== "ok",
    ).length;
  return {
    entryCount: inventory.boxes.length + inventory.items.length,
    units: boxesUnits + itemsUnits,
    boxesUnits,
    itemsUnits,
    value: Math.round(value * 100) / 100,
    lowOut,
  };
}
