export type InventorySortOption =
  | "name-asc"
  | "stock-asc"
  | "stock-desc"
  | "value-desc"
  | "value-asc";

/** Omitted from inventory URLs, so the filter bar and the page must agree. */
export const INVENTORY_DEFAULT_SORT: InventorySortOption = "name-asc";

export const INVENTORY_SORT_OPTIONS: {
  value: InventorySortOption;
  label: string;
}[] = [
  { value: "name-asc", label: "Name A–Z" },
  { value: "stock-asc", label: "Lowest stock" },
  { value: "stock-desc", label: "Highest stock" },
  { value: "value-desc", label: "Highest value" },
  { value: "value-asc", label: "Lowest value" },
];

export function parseInventorySort(
  value: string | undefined,
): InventorySortOption {
  const match = INVENTORY_SORT_OPTIONS.find((o) => o.value === value);
  return match?.value ?? INVENTORY_DEFAULT_SORT;
}
