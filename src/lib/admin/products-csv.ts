import type { Product } from "@/types";

export const PRODUCT_CSV_HEADERS = [
  "sku",
  "name",
  "slug",
  "price",
  "compare_at_price",
  "cost",
  "inventory_quantity",
  "low_stock_threshold",
  "active",
  "featured",
  "bestseller",
  "product_type",
  "department",
  "ansi_class",
  "color",
  "size",
  "shipping_class",
  "weight",
  "short_description",
  "description",
  "category_slug",
  "brand_slug",
] as const;

export type ProductCsvRow = Record<(typeof PRODUCT_CSV_HEADERS)[number], string>;

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function cell(value: string | number | boolean | null | undefined): string {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

export function productsToCsv(products: Product[]): string {
  const lines = [PRODUCT_CSV_HEADERS.join(",")];
  for (const p of products) {
    const row: ProductCsvRow = {
      sku: cell(p.sku),
      name: cell(p.name),
      slug: cell(p.slug),
      price: cell(p.price),
      compare_at_price: cell(p.compare_at_price),
      cost: cell(p.cost),
      inventory_quantity: cell(p.inventory_quantity),
      low_stock_threshold: cell(p.low_stock_threshold),
      active: cell(p.active),
      featured: cell(p.featured),
      bestseller: cell(p.bestseller),
      product_type: cell(p.product_type),
      department: cell(p.department),
      ansi_class: cell(p.ansi_class),
      color: cell(p.color),
      size: cell(p.size),
      shipping_class: cell(p.shipping_class),
      weight: cell(p.weight),
      short_description: cell(p.short_description),
      description: cell(p.description),
      category_slug: cell(p.category?.slug),
      brand_slug: cell(p.brand?.slug),
    };
    lines.push(PRODUCT_CSV_HEADERS.map((h) => escapeCsv(row[h])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

/** Minimal CSV parser supporting quoted fields. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    // Skip empty trailing lines
    if (row.length === 1 && row[0] === "" && rows.length > 0) {
      row = [];
      return;
    }
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      pushField();
      continue;
    }
    if (ch === "\n") {
      pushField();
      pushRow();
      continue;
    }
    if (ch === "\r") continue;
    field += ch;
  }
  pushField();
  if (row.length > 1 || row[0] !== "") pushRow();

  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (cells[idx] ?? "").trim();
    });
    return obj;
  });
}

export function parseBool(value: string, fallback = false): boolean {
  if (!value) return fallback;
  const v = value.toLowerCase();
  if (["true", "1", "yes", "y"].includes(v)) return true;
  if (["false", "0", "no", "n"].includes(v)) return false;
  return fallback;
}

export function parseNumber(value: string): number | null {
  if (!value) return null;
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}
