/**
 * Shared catalog taxonomy used by both the admin dashboard and public shop filters.
 * Keep these lists as the source of truth so form dropdowns and storefront filters stay in sync.
 */

export type CatalogOption = {
  label: string;
  value: string;
};

export type ColorOption = CatalogOption & {
  /** One or two hex fills for solid / split swatches. */
  swatches: readonly [string] | readonly [string, string];
};

export const PRODUCT_TYPE_OPTIONS: CatalogOption[] = [
  { label: "Hard Hat", value: "Hard Hat" },
  { label: "Safety Vest", value: "Safety Vest" },
  { label: "Work Boot", value: "Work Boot" },
  { label: "Work Shoe", value: "Work Shoe" },
  { label: "Work Glove", value: "Work Glove" },
  { label: "Safety Glasses", value: "Safety Glasses" },
  { label: "Traffic Cone", value: "Traffic Cone" },
  { label: "Barricade", value: "Barricade" },
  { label: "Street Sign", value: "Street Sign" },
  { label: "Construction Sign", value: "Construction Sign" },
  { label: "Fall Protection", value: "Fall Protection" },
  { label: "Hearing Protection", value: "Hearing Protection" },
];

/** Top-level merchandise departments for catalog organization. */
export type DepartmentOption = CatalogOption & { slug: string };

export const DEPARTMENT_OPTIONS: DepartmentOption[] = [
  {
    label: "Safety Equipment",
    value: "Safety Equipment",
    slug: "safety-equipment",
  },
  {
    label: "Traffic Control",
    value: "Traffic Control",
    slug: "traffic-control",
  },
  { label: "Foot Wear", value: "Foot Wear", slug: "foot-wear" },
  { label: "Signage", value: "Signage", slug: "signage" },
];

/** Resolve a URL/query param (slug or display value) to the canonical department value. */
export function resolveDepartmentParam(
  param: string | null | undefined,
): string | undefined {
  if (!param?.trim()) return undefined;
  const key = param.trim().toLowerCase();
  const match = DEPARTMENT_OPTIONS.find(
    (d) => d.slug === key || d.value.toLowerCase() === key,
  );
  return match?.value;
}

/** Infer department from product type when none is set (seed / backfill). */
export function departmentForProductType(
  productType: string | null | undefined,
): string | null {
  if (!productType) return null;
  switch (productType) {
    case "Hard Hat":
    case "Safety Vest":
    case "Work Glove":
    case "Safety Glasses":
    case "Fall Protection":
    case "Hearing Protection":
      return "Safety Equipment";
    case "Traffic Cone":
    case "Barricade":
      return "Traffic Control";
    case "Work Boot":
    case "Work Shoe":
      return "Foot Wear";
    case "Street Sign":
    case "Construction Sign":
      return "Signage";
    default:
      return null;
  }
}

/**
 * Spec checklist fields available per category slug.
 * Admins pick which to fill; values show on the product specifications tab.
 */
export const CATEGORY_SPECIFICATION_FIELDS: Record<string, string[]> = {
  "hard-hats": [
    "ANSI Rating",
    "Suspension",
    "Material",
    "Vents",
    "Weight",
    "Style",
    "Dielectric",
  ],
  "safety-vests": [
    "ANSI Rating",
    "Material",
    "Reflective Tape",
    "Closure",
    "Pockets",
    "Breakaway",
  ],
  "work-boots": [
    "Toe Protection",
    "EH Rated",
    "Upper",
    "Outsole",
    "Height",
    "Waterproof",
    "Insulation",
  ],
  "work-gloves": [
    "Cut Level",
    "Coating",
    "Palm",
    "Shell",
    "Gauge",
    "Cuff",
    "Touchscreen",
    "Back",
  ],
  "traffic-cones": [
    "Height",
    "Material",
    "Base",
    "Base Weight",
    "Reflective Collars",
    "Stackable",
  ],
  barricades: [
    "Type",
    "Material",
    "Expanded Length",
    "Fillable",
    "Casters",
  ],
  "street-signs": ["Size", "Sheeting", "Legend", "Blank"],
  "construction-signs": ["Size", "Sheeting", "Legend", "Style", "Mount"],
  "safety-glasses": ["Lens", "Coating", "UV", "Rating"],
  "fall-protection": [
    "Standard",
    "Capacity",
    "D-Ring",
    "Leg Straps",
    "Hooks",
    "Length",
  ],
};

export function getCategorySpecificationFields(
  categorySlug: string | null | undefined,
): string[] {
  if (!categorySlug) return [];
  return CATEGORY_SPECIFICATION_FIELDS[categorySlug] ?? [];
}

/** Safety certifications selectable on product admin forms. */
export const SAFETY_CERTIFICATION_OPTIONS: string[] = [
  "ANSI Z89.1",
  "ANSI Z89.1 Class E",
  "ANSI/ISEA 107 Class 2",
  "ANSI/ISEA 107 Class 3",
  "ANSI/ISEA 105 A1",
  "ANSI/ISEA 105 A4",
  "ANSI Z87+",
  "ANSI Z359.11",
  "ANSI Z359.13",
  "ASTM F2413",
  "ASTM F2892 EH",
  "ASTM F3445 slip resistant",
  "ASTM D4956",
  "ASTM D4956 Type IV",
  "CSA Z94.1",
  "CSA Z94.3",
  "EN 388",
  "MUTCD",
  "MUTCD compliant",
  "OSHA",
  "OSHA 1926.502",
];

/** Shop / home image for a department card. */
export function departmentImagePath(slug: string): string {
  const map: Record<string, string> = {
    "safety-equipment": "/images/categories/construction-hard-hats.jpg",
    "traffic-control": "/images/categories/traffic-cones.jpg",
    "foot-wear": "/images/categories/work-boots.jpg",
    signage: "/images/categories/street-signs.jpg",
  };
  return map[slug] ?? `/images/categories/${slug}.svg`;
}

/** Merchandising tags for admin catalog labeling. */
export const PRODUCT_TAG_OPTIONS: CatalogOption[] = [
  { label: "New Arrival", value: "New Arrival" },
  { label: "Bestseller", value: "Bestseller" },
  { label: "Clearance", value: "Clearance" },
  { label: "Contractor Pack", value: "Contractor Pack" },
  { label: "ANSI Rated", value: "ANSI Rated" },
  { label: "Hi-Vis", value: "Hi-Vis" },
  { label: "Waterproof", value: "Waterproof" },
  { label: "Made in USA", value: "Made in USA" },
  { label: "Bulk Eligible", value: "Bulk Eligible" },
  { label: "Limited Stock", value: "Limited Stock" },
];

/** Soft pastel badge classes for tag chips. */
export const TAG_PASTEL_PALETTE = [
  "bg-rose-100 text-rose-800",
  "bg-orange-100 text-orange-800",
  "bg-amber-100 text-amber-800",
  "bg-lime-100 text-lime-800",
  "bg-emerald-100 text-emerald-800",
  "bg-teal-100 text-teal-800",
  "bg-sky-100 text-sky-800",
  "bg-indigo-100 text-indigo-800",
  "bg-violet-100 text-violet-800",
  "bg-fuchsia-100 text-fuchsia-800",
] as const;

const CANONICAL_TAG_PASTELS: Record<string, (typeof TAG_PASTEL_PALETTE)[number]> = {
  "new arrival": "bg-sky-100 text-sky-800",
  bestseller: "bg-amber-100 text-amber-800",
  clearance: "bg-rose-100 text-rose-800",
  "contractor pack": "bg-orange-100 text-orange-800",
  "ansi rated": "bg-indigo-100 text-indigo-800",
  "hi-vis": "bg-lime-100 text-lime-800",
  waterproof: "bg-teal-100 text-teal-800",
  "made in usa": "bg-violet-100 text-violet-800",
  "bulk eligible": "bg-emerald-100 text-emerald-800",
  "limited stock": "bg-fuchsia-100 text-fuchsia-800",
};

/** Stable pastel classes for a tag name (canonical map, else hashed palette). */
export function getTagPastelClasses(tag: string): string {
  const key = tag.trim().toLowerCase();
  const mapped = CANONICAL_TAG_PASTELS[key];
  if (mapped) return mapped;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return TAG_PASTEL_PALETTE[hash % TAG_PASTEL_PALETTE.length];
}

/** ANSI / ISEA visibility and hard-hat electrical classes used across PPE. */
export const ANSI_CLASS_OPTIONS: CatalogOption[] = [
  { label: "Class 1", value: "Class 1" },
  { label: "Class 2", value: "Class 2" },
  { label: "Class 3", value: "Class 3" },
  { label: "Type I Class C", value: "Type I Class C" },
  { label: "Type I Class E", value: "Type I Class E" },
  { label: "Type I Class G", value: "Type I Class G" },
  { label: "Type II Class C", value: "Type II Class C" },
  { label: "Type II Class E", value: "Type II Class E" },
  { label: "Type II Class G", value: "Type II Class G" },
];

/** Named color → hex used to build swatches for single & dual-tone colors. */
const COLOR_HEX: Record<string, string> = {
  black: "#1a1a1a",
  gray: "#8b9098",
  grey: "#8b9098",
  white: "#f5f5f5",
  yellow: "#f5c400",
  orange: "#f97316",
  lime: "#a3e635",
  red: "#dc2626",
  blue: "#2563eb",
  brown: "#8b5a2b",
  tan: "#d2b48c",
  clear: "transparent",
  smoke: "#9ca3af99",
  "hi-vis yellow": "#d4ff00",
  "hi-vis orange": "#ff6a00",
};

/**
 * Canonical product colors shared by shop filters and admin onboarding.
 * Dual-tone values use "Primary/Secondary" naming to match catalog data.
 */
export const COLOR_OPTIONS: ColorOption[] = [
  { label: "Black", value: "Black", swatches: ["#1a1a1a"] },
  { label: "Black/Gray", value: "Black/Gray", swatches: ["#1a1a1a", "#8b9098"] },
  { label: "Blue", value: "Blue", swatches: ["#2563eb"] },
  { label: "Brown", value: "Brown", swatches: ["#8b5a2b"] },
  { label: "Clear", value: "Clear", swatches: ["transparent"] },
  { label: "Gray", value: "Gray", swatches: ["#8b9098"] },
  { label: "Gray/Black", value: "Gray/Black", swatches: ["#8b9098", "#1a1a1a"] },
  { label: "Hi-Vis Orange", value: "Hi-Vis Orange", swatches: ["#ff6a00"] },
  { label: "Hi-Vis Yellow", value: "Hi-Vis Yellow", swatches: ["#d4ff00"] },
  { label: "Lime", value: "Lime", swatches: ["#a3e635"] },
  { label: "Orange", value: "Orange", swatches: ["#f97316"] },
  { label: "Orange/White", value: "Orange/White", swatches: ["#f97316", "#f5f5f5"] },
  { label: "Red", value: "Red", swatches: ["#dc2626"] },
  { label: "Red/White", value: "Red/White", swatches: ["#dc2626", "#f5f5f5"] },
  { label: "Smoke", value: "Smoke", swatches: ["#9ca3af99"] },
  { label: "Tan", value: "Tan", swatches: ["#d2b48c"] },
  { label: "White", value: "White", swatches: ["#f5f5f5"] },
  { label: "Yellow", value: "Yellow", swatches: ["#f5c400"] },
  { label: "Yellow/Black", value: "Yellow/Black", swatches: ["#f5c400", "#1a1a1a"] },
];

function resolveHex(token: string): string {
  const key = token.trim().toLowerCase();
  if (COLOR_HEX[key]) return COLOR_HEX[key];
  if (key.startsWith("hi-vis ")) {
    return COLOR_HEX[key] ?? COLOR_HEX[key.replace("hi-vis ", "")] ?? "#cbd5e1";
  }
  return "#cbd5e1";
}

/** Resolve 1–2 swatch fills for any color label (canonical or freeform). */
export function getColorSwatches(color: string): string[] {
  const trimmed = color.trim();
  if (!trimmed) return ["#cbd5e1"];

  const canonical = COLOR_OPTIONS.find(
    (option) => option.value.toLowerCase() === trimmed.toLowerCase(),
  );
  if (canonical) return [...canonical.swatches];

  if (trimmed.includes("/")) {
    return trimmed.split("/").map((part) => resolveHex(part));
  }

  return [resolveHex(trimmed)];
}

export const SIZE_OPTIONS: CatalogOption[] = [
  { label: "S", value: "S" },
  { label: "M", value: "M" },
  { label: "L", value: "L" },
  { label: "XL", value: "XL" },
  { label: "2XL", value: "2XL" },
  { label: "3XL", value: "3XL" },
  { label: "4XL", value: "4XL" },
];

export const SHIPPING_CLASS_OPTIONS: CatalogOption[] = [
  { label: "Standard", value: "standard" },
  { label: "Oversize", value: "oversize" },
  { label: "Freight", value: "freight" },
  { label: "Free shipping eligible", value: "free_eligible" },
];

/** Merge canonical options with any extra values found on live products. */
export function mergeCatalogOptions(
  canonical: CatalogOption[],
  extraValues: (string | null | undefined)[],
): CatalogOption[] {
  const map = new Map<string, CatalogOption>();
  for (const option of canonical) {
    map.set(option.value.toLowerCase(), option);
  }
  for (const value of extraValues) {
    if (!value) continue;
    const key = value.toLowerCase();
    if (!map.has(key)) {
      map.set(key, { label: value, value });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export function toSelectOptions(
  options: CatalogOption[],
  emptyLabel = "Select…",
): { label: string; value: string }[] {
  return [{ label: emptyLabel, value: "" }, ...options];
}
