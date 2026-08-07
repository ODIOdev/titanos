/** Named shipping boxes + per-product last packaging memory. */

export const SHIPPING_BOX_PRESETS_KEY = "shipping_box_presets";

export type ShippingPackageDims = {
  pounds: number;
  ounces: number;
  length: number;
  width: number;
  height: number;
};

export type ShippingBoxPreset = ShippingPackageDims & {
  id: string;
  name: string;
};

export type ProductShippingPackage = ShippingPackageDims & {
  presetId?: string | null;
  updatedAt: string;
};

export const DEFAULT_BOX_PRESETS: ShippingBoxPreset[] = [
  {
    id: "preset-poly-mailer",
    name: "Poly mailer",
    pounds: 0,
    ounces: 8,
    length: 12,
    width: 10,
    height: 1,
  },
  {
    id: "preset-small",
    name: "Small box",
    pounds: 1,
    ounces: 0,
    length: 8,
    width: 6,
    height: 4,
  },
  {
    id: "preset-medium",
    name: "Medium box",
    pounds: 2,
    ounces: 0,
    length: 12,
    width: 10,
    height: 8,
  },
  {
    id: "preset-large",
    name: "Large box",
    pounds: 5,
    ounces: 0,
    length: 18,
    width: 14,
    height: 12,
  },
];

export function normalizePackage(
  input: Partial<ShippingPackageDims>,
): ShippingPackageDims {
  const pounds = Math.max(0, Number(input.pounds) || 0);
  const ounces = Math.max(0, Math.min(15, Number(input.ounces) || 0));
  const length = Math.max(0, Number(input.length) || 0);
  const width = Math.max(0, Number(input.width) || 0);
  const height = Math.max(0, Number(input.height) || 0);
  const totalOz = pounds * 16 + ounces;
  return {
    pounds: Math.floor(totalOz / 16),
    ounces: totalOz % 16,
    length,
    width,
    height,
  };
}

export function parseBoxPresets(value: unknown): ShippingBoxPreset[] {
  if (!value || typeof value !== "object") return [...DEFAULT_BOX_PRESETS];
  const raw = value as { presets?: unknown };
  if (!Array.isArray(raw.presets) || raw.presets.length === 0) {
    return [...DEFAULT_BOX_PRESETS];
  }
  const presets: ShippingBoxPreset[] = [];
  for (const item of raw.presets) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id : "";
    const name = typeof row.name === "string" ? row.name.trim() : "";
    if (!id || !name) continue;
    presets.push({
      id,
      name,
      ...normalizePackage({
        pounds: Number(row.pounds),
        ounces: Number(row.ounces),
        length: Number(row.length),
        width: Number(row.width),
        height: Number(row.height),
      }),
    });
  }
  return presets.length > 0 ? presets : [...DEFAULT_BOX_PRESETS];
}

export function readProductShippingPackage(
  metadata: unknown,
): ProductShippingPackage | null {
  if (!metadata || typeof metadata !== "object") return null;
  const pkg = (metadata as { shippingPackage?: unknown }).shippingPackage;
  if (!pkg || typeof pkg !== "object") return null;
  const row = pkg as Record<string, unknown>;
  const dims = normalizePackage({
    pounds: Number(row.pounds),
    ounces: Number(row.ounces),
    length: Number(row.length),
    width: Number(row.width),
    height: Number(row.height),
  });
  if (dims.length <= 0 && dims.width <= 0 && dims.height <= 0 && dims.pounds <= 0 && dims.ounces <= 0) {
    return null;
  }
  return {
    ...dims,
    presetId: typeof row.presetId === "string" ? row.presetId : null,
    updatedAt:
      typeof row.updatedAt === "string"
        ? row.updatedAt
        : new Date(0).toISOString(),
  };
}

/**
 * Merge remembered product packages for an order:
 * - weight = sum of (package weight × qty) for products that have memory
 * - dimensions = largest L/W/H among remembered packages (outer carton estimate)
 */
export function resolveOrderPackage(input: {
  lines: Array<{
    productId: string | null;
    quantity: number;
    pkg: ProductShippingPackage | null;
  }>;
  fallbackItemCount: number;
}): ShippingPackageDims | null {
  const remembered = input.lines.filter((line) => line.pkg && line.productId);
  if (remembered.length === 0) return null;

  let totalOz = 0;
  let length = 0;
  let width = 0;
  let height = 0;
  let newest = remembered[0]!;

  for (const line of remembered) {
    const pkg = line.pkg!;
    const qty = Math.max(1, line.quantity || 1);
    totalOz += (pkg.pounds * 16 + pkg.ounces) * qty;
    length = Math.max(length, pkg.length);
    width = Math.max(width, pkg.width);
    height = Math.max(height, pkg.height);
    if (pkg.updatedAt > newest.pkg!.updatedAt) newest = line;
  }

  // Single SKU: exact last package (qty already in weight sum; dims as last used).
  if (remembered.length === 1) {
    const pkg = remembered[0]!.pkg!;
    const qty = Math.max(1, remembered[0]!.quantity || 1);
    const oz = (pkg.pounds * 16 + pkg.ounces) * qty;
    return normalizePackage({
      pounds: Math.floor(oz / 16),
      ounces: oz % 16,
      length: pkg.length,
      width: pkg.width,
      height: pkg.height,
    });
  }

  return normalizePackage({
    pounds: Math.floor(totalOz / 16),
    ounces: totalOz % 16,
    length: length || newest.pkg!.length,
    width: width || newest.pkg!.width,
    height: height || newest.pkg!.height,
  });
}

export function formatPackageLabel(pkg: ShippingPackageDims) {
  const weight =
    pkg.pounds > 0 || pkg.ounces > 0
      ? `${pkg.pounds} lb ${pkg.ounces} oz`
      : "wt —";
  const dims =
    pkg.length > 0 && pkg.width > 0 && pkg.height > 0
      ? `${pkg.length}×${pkg.width}×${pkg.height} in`
      : "dims —";
  return `${dims} · ${weight}`;
}
