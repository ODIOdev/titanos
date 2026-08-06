/** Letters-only word initials from a category title, e.g. "Welding Gloves & Gauntlets" → "WGG". */
export function categorySkuAbbreviation(title: string): string {
  const initials = title
    .trim()
    .split(/[\s/_-]+/)
    .map((word) => word.replace(/[^A-Za-z0-9]/g, ""))
    .filter((word) => word.length > 0)
    .map((word) => word[0]!.toUpperCase());

  return initials.join("") || "CAT";
}

/** Normalize a user-entered SKU prefix to A–Z / 0–9, max 12 chars. */
export function normalizeCategorySkuPrefix(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);
}

/** Prefer stored `sku_prefix`, otherwise derive from the category name. */
export function resolveCategorySkuAbbreviation(category: {
  name: string;
  sku_prefix?: string | null;
}): string {
  const stored = normalizeCategorySkuPrefix(category.sku_prefix ?? "");
  if (stored) return stored;
  return categorySkuAbbreviation(category.name);
}

/** `WGG-0000` style SKU from abbreviation + sequence. */
export function formatCategorySku(abbreviation: string, sequence: number): string {
  const abbr = normalizeCategorySkuPrefix(abbreviation) || "CAT";
  const n = Math.max(0, Math.floor(sequence));
  return `${abbr}-${String(n).padStart(4, "0")}`;
}

/**
 * Next free sequence for `ABBR-####` among existing SKUs.
 * Starts at 0 (`0000`) when none exist yet.
 */
export function nextCategorySkuSequence(
  existingSkus: string[],
  abbreviation: string,
): number {
  const abbr = normalizeCategorySkuPrefix(abbreviation) || "CAT";
  const pattern = new RegExp(
    `^${abbr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-(\\d+)$`,
    "i",
  );

  let max = -1;
  for (const sku of existingSkus) {
    const match = pattern.exec(sku.trim());
    if (!match) continue;
    const n = Number.parseInt(match[1]!, 10);
    if (Number.isFinite(n) && n > max) max = n;
  }

  return max + 1;
}

export function nextCategorySku(
  existingSkus: string[],
  category: string | { name: string; sku_prefix?: string | null },
): { abbreviation: string; sequence: number; sku: string } {
  const abbreviation =
    typeof category === "string"
      ? categorySkuAbbreviation(category)
      : resolveCategorySkuAbbreviation(category);
  const sequence = nextCategorySkuSequence(existingSkus, abbreviation);
  return {
    abbreviation,
    sequence,
    sku: formatCategorySku(abbreviation, sequence),
  };
}
