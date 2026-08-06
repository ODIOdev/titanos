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

/** Shop filter + product onboarding gender options. */
export const GENDER_OPTIONS: CatalogOption[] = [
  { label: "Men", value: "Men" },
  { label: "Women", value: "Women" },
  { label: "Unisex", value: "Unisex" },
];

/** Read gender from product metadata (admin-controlled attribute). */
export function productGender(
  product: { metadata?: Record<string, unknown> | null } | null | undefined,
): string | null {
  const raw = product?.metadata?.gender;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed || null;
}

/** Read touch-screen flag from product metadata (unset = false). */
export function productTouchScreen(
  product: { metadata?: Record<string, unknown> | null } | null | undefined,
): boolean {
  return product?.metadata?.touchScreen === true;
}

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
  { label: "Signage", value: "Signage", slug: "signage" },
];

/**
 * Industry parent departments kept on the homepage / admin, but omitted from
 * the shop department rail and sidebar filters.
 */
export const SHOP_HIDDEN_DEPARTMENTS = new Set([
  "safety equipment",
  "foot wear",
]);

/**
 * Shop filter / rail departments (admin “catalog” source).
 * Always merged into storefront options unless explicitly removed.
 */
export const DEFAULT_PRIMARY_DEPARTMENTS: string[] = [
  "Combo Deals",
  "Fall Protection",
  "Head Protection",
  "Hearing Protection",
  "Reflective Visibility Clothing",
  "Respiratory Protection",
  "Safety Glasses",
  "Safety Gloves",
  "Safety Shoes & Boots",
  "Safety Tapes",
  "Signage",
  "Traffic Safety Equipment",
];

/** Stable A–Z order for department name lists (catalog, custom, off-line). */
export function sortDepartmentNames(names: string[]): string[] {
  return [...names].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

/** Resolve a URL/query param (slug or display value) to the canonical department value. */
export function resolveDepartmentParam(
  param: string | null | undefined,
): string | undefined {
  if (!param?.trim()) return undefined;
  const key = param.trim().toLowerCase();
  const fromBuiltIn = DEPARTMENT_OPTIONS.find(
    (d) => d.slug === key || d.value.toLowerCase() === key,
  );
  if (fromBuiltIn) return fromBuiltIn.value;
  const fromPrimary = DEFAULT_PRIMARY_DEPARTMENTS.find((name) => {
    const option = toDepartmentOption(name);
    return option.slug === key || option.value.toLowerCase() === key;
  });
  if (fromPrimary) return fromPrimary;
  // Custom admin-added departments use their display name as the filter value.
  return param.trim();
}

/** Build a department option from a display name. */
export function toDepartmentOption(name: string): DepartmentOption {
  const value = name.trim();
  return {
    label: value,
    value,
    slug: value
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, ""),
  };
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
      return "Safety Shoes & Boots";
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

/** Safety certifications selectable on product admin forms (A–Z). */
export const SAFETY_CERTIFICATION_OPTIONS: string[] = [
  "ANSI S3.19",
  "ANSI Z87.1",
  "ANSI Z87.1+",
  "ANSI Z87+",
  "ANSI Z89.1",
  "ANSI Z89.1 Class C",
  "ANSI Z89.1 Class E",
  "ANSI Z89.1 Class G",
  "ANSI Z89.1 Type I",
  "ANSI Z89.1 Type II",
  "ANSI Z359.11",
  "ANSI Z359.13",
  "ANSI Z359.14",
  "ANSI Z359.15",
  "ANSI/ISEA 105 - 2016 ABRASION Level 6",
  "ANSI/ISEA 105 - 2016 CUT Level A1",
  "ANSI/ISEA 105 - 2016 CUT Level A2",
  "ANSI/ISEA 105 A1",
  "ANSI/ISEA 105 A2",
  "ANSI/ISEA 105 A3",
  "ANSI/ISEA 105 A4",
  "ANSI/ISEA 105 A5",
  "ANSI/ISEA 105 A6",
  "ANSI/ISEA 105 A7",
  "ANSI/ISEA 105 A8",
  "ANSI/ISEA 105 A9",
  "ANSI/ISEA 107 Class 1",
  "ANSI/ISEA 107 Class 2",
  "ANSI/ISEA 107 Class 3",
  "ANSI/ISEA 107 Type O",
  "ANSI/ISEA 107 Type P",
  "ANSI/ISEA 107 Type R",
  "ANSI/ISEA 138-2019 Impact Level 2",
  "ASTM D4956",
  "ASTM D4956 Type I",
  "ASTM D4956 Type III",
  "ASTM D4956 Type IV",
  "ASTM D4956 Type VIII",
  "ASTM D4956 Type XI",
  "ASTM F2413",
  "ASTM F2413 EH",
  "ASTM F2413 I/C",
  "ASTM F2413 PR",
  "ASTM F2413 SR",
  "ASTM F2892 EH",
  "ASTM F3445 slip resistant",
  "CE Food Safe",
  "Class 1",
  "Class 2",
  "Class 3",
  "CSA Z94.1",
  "CSA Z94.2",
  "CSA Z94.3",
  "CSA Z96 Class 1",
  "CSA Z96 Class 2",
  "CSA Z96 Class 3",
  "CSA Z195",
  "CSA Z259",
  "EN 388",
  "EN 388:2016 +A1:2018 3131X",
  "EN 388:2016 +A1:2018 4241XP",
  "EN 388:2016 +A1:2018 4243X",
  "EN 407",
  "EN 407:2020 412X4X",
  "EN 420",
  "EN 12477 Type A",
  "EN 12477 Type B",
  "EN ISO 21420 Dexterity 2",
  "EN ISO 21420:2020 Dexterity 5",
  "Level A1",
  "Level A2",
  "Level A2 - A540",
  "Level A3",
  "Level A4",
  "Level A5",
  "Level A6",
  "Level A7",
  "Level A8",
  "Level A9",
  "MUTCD",
  "MUTCD compliant",
  "NIOSH",
  "NIOSH N95",
  "NIOSH P100",
  "OSHA",
  "OSHA 1926.502",
  "Type I Class C",
  "Type I Class E",
  "Type I Class G",
  "Type II Class C",
  "Type II Class E",
  "Type II Class G",
];

/** Product materials selectable on admin forms and shop filters. */
export const MATERIAL_OPTIONS: string[] = [
  "ABS",
  "Acrylic",
  "Aluminum",
  "Blow-molded polyethylene",
  "Buffalo Leather",
  "Composite",
  "Composite toe",
  "Cordura",
  "Cotton",
  "Cotton canvas",
  "Cow Split Leather",
  "Cowhide Leather",
  "Deerskin Leather",
  "Dyneema",
  "EVA midsole",
  "Fiberglass",
  "Fleece",
  "Foam nitrile",
  "Goatskin Leather",
  "Grain Leather",
  "HDPE",
  "HDPE shell",
  "HPPE",
  "Kevlar",
  "Latex",
  "Leather palm",
  "Mesh",
  "Mesh upper",
  "Meta-Aramid",
  "Neoprene",
  "Nitrile",
  "Nylon",
  "Para-Aramid",
  "Para-Aramid +",
  "Pigskin Leather",
  "Polycarbonate",
  "Polyester",
  "Polyester mesh",
  "Polyester solid/mesh combo",
  "Polyurethane (PU)",
  "Powder-coated steel",
  "PVC",
  "Reflective trim",
  "Retroreflective tape",
  "Rubber",
  "Rubber sole",
  "Softshell",
  "Spandex",
  "Split Leather",
  "Steel",
  "Steel toe",
  "TPU",
  "Vinyl",
];

/** Canonical options for the shop materials filter. */
export const SHOP_MATERIAL_OPTIONS: CatalogOption[] = MATERIAL_OPTIONS.map(
  (value) => ({ label: value, value }),
);

/** Materials stored on product metadata (and legacy Material specs). */
export function productMaterialValues(product: {
  metadata?: Record<string, unknown> | null;
  specifications?: { name: string; value: string }[] | null;
}): string[] {
  const values: string[] = [];
  const raw = product.metadata?.materials;
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === "string" && item.trim()) values.push(item.trim());
    }
  }
  for (const spec of product.specifications ?? []) {
    if (spec.name.trim().toLowerCase() !== "material") continue;
    if (spec.value.trim()) values.push(spec.value.trim());
  }
  return [...new Set(values)];
}

/** Whether a product matches a shop Materials filter value. */
export function productMatchesMaterial(
  product: {
    metadata?: Record<string, unknown> | null;
    specifications?: { name: string; value: string }[] | null;
  },
  filterValue: string,
): boolean {
  const filter = filterValue.trim().toLowerCase();
  if (!filter) return true;
  return productMaterialValues(product).some(
    (material) => material.trim().toLowerCase() === filter,
  );
}

/** Shop / home image for a department card. */
export function departmentImagePath(slug: string): string {
  const map: Record<string, string> = {
    "safety-equipment": "/images/categories/construction-hard-hats-v2.jpg",
    "traffic-control": "/images/categories/traffic-control-v4.jpg",
    "foot-wear": "/images/categories/foot-wear-v4.jpg",
    signage: "/images/categories/signage.png",
    "fall-protection": "/images/categories/fall-protection.png",
    "head-protection": "/images/categories/head-protection.png",
    "hearing-protection": "/images/categories/hearing-protection.png",
    "reflective-visibility-clothing":
      "/images/categories/reflective-visibility-clothing.png",
    "respiratory-protection": "/images/categories/respiratory-protection.png",
    "safety-glasses": "/images/categories/safety-glasses.png",
    "safety-gloves": "/images/categories/safety-gloves.png",
    "safety-shoes-boots": "/images/categories/safety-shoes-boots.png",
    "safety-tapes": "/images/categories/safety-tapes.png",
    "traffic-safety": "/images/categories/traffic-safety-equipment-v2.png",
    "traffic-safety-equipment":
      "/images/categories/traffic-safety-equipment-v2.png",
    "combo-deals": "/images/categories/combo-deals.png",
    "work-boots": "/images/categories/safety-shoes-boots.png",
    "hard-hats": "/images/categories/head-protection.png",
    "safety-vests": "/images/categories/reflective-visibility-clothing.png",
  };
  return map[slug] ?? `/images/categories/${slug}.png`;
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
  { label: "Touch Screen", value: "Touch Screen" },
  { label: "Made in USA", value: "Made in USA" },
  { label: "Bulk Eligible", value: "Bulk Eligible" },
  { label: "Limited Stock", value: "Limited Stock" },
];

/** Read merchandising tags from product metadata (supports legacy single `tag`). */
export function parseProductTags(
  metadata: Record<string, unknown> | null | undefined,
): string[] {
  const values: string[] = [];
  const seen = new Set<string>();

  function push(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    values.push(trimmed);
  }

  const list = metadata?.tags;
  if (Array.isArray(list)) {
    for (const item of list) {
      if (typeof item === "string") push(item);
    }
  }

  if (typeof metadata?.tag === "string") push(metadata.tag);

  return values;
}

/** Persist tags as both `tags[]` and legacy primary `tag` string. */
export function serializeProductTags(tags: string[] | null | undefined): {
  tags: string[];
  tag: string | null;
} {
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const tag of tags ?? []) {
    const trimmed = tag.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(trimmed);
  }
  return { tags: unique, tag: unique[0] ?? null };
}

/** Soft pastel badge classes for tag chips. */
export const TAG_PASTEL_PALETTE = [
  "bg-rose-100 text-rose-800",
  "bg-orange-100 text-orange-800",
  "bg-amber-100 text-amber-800",
  "bg-lime-100 text-lime-800",
  "bg-emerald-100 text-emerald-800",
  "bg-teal-100 text-teal-800",
  "bg-cyan-100 text-cyan-800",
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
  "touch screen": "bg-cyan-100 text-cyan-800",
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
  { label: "Type I Class C", value: "Type I Class C" },
  { label: "Type I Class G", value: "Type I Class G" },
  { label: "Type I Class E", value: "Type I Class E" },
  { label: "Type II Class C", value: "Type II Class C" },
  { label: "Type II Class G", value: "Type II Class G" },
  { label: "Type II Class E", value: "Type II Class E" },
  { label: "Class 1", value: "Class 1" },
  { label: "Class 2", value: "Class 2" },
  { label: "Class 3", value: "Class 3" },
];

/** Joins multiple ANSI classes in the products.ansi_class text column. */
export const ANSI_CLASS_SEPARATOR = " | ";

/** Parse stored ansi_class (single or multi) into discrete option values. */
export function parseAnsiClasses(
  raw: string | null | undefined,
): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(ANSI_CLASS_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Serialize selected ANSI classes for storage (null when empty). */
export function serializeAnsiClasses(
  values: string[] | null | undefined,
): string | null {
  const unique = [
    ...new Set(
      (values ?? []).map((value) => value.trim()).filter(Boolean),
    ),
  ];
  return unique.length > 0 ? unique.join(ANSI_CLASS_SEPARATOR) : null;
}

/** Whether a product's stored ansi_class includes a shop filter value. */
export function productHasAnsiClass(
  stored: string | null | undefined,
  filterValue: string,
): boolean {
  if (!filterValue) return true;
  return parseAnsiClasses(stored).includes(filterValue);
}

const ANSI_CLASS_VALUE_SET = new Set(
  ANSI_CLASS_OPTIONS.map((option) => option.value),
);

/** Pull shop-filter ANSI class values out of certification selections. */
export function ansiClassesFromCertifications(
  rows: { name: string }[] | null | undefined,
): string[] {
  return [
    ...new Set(
      (rows ?? [])
        .map((row) => row.name.trim())
        .filter((name) => ANSI_CLASS_VALUE_SET.has(name)),
    ),
  ];
}

/** Canonical options for the shop ANSI / certification filter. */
export const SHOP_ANSI_CERTIFICATION_OPTIONS: CatalogOption[] =
  SAFETY_CERTIFICATION_OPTIONS.map((value) => ({ label: value, value }));

/** Whether a stored certification string matches a shop filter value. */
export function certificationMatchesFilter(
  stored: string,
  filterValue: string,
): boolean {
  const trimmed = stored.trim();
  const filter = filterValue.trim();
  if (!filter) return true;
  return (
    trimmed === filter ||
    trimmed.startsWith(`${filter}:`) ||
    trimmed.startsWith(`${filter} —`) ||
    trimmed.startsWith(`${filter} -`)
  );
}

/** Certification labels from product metadata (detail suffixes stripped for matching). */
export function productCertificationValues(product: {
  metadata?: Record<string, unknown> | null;
}): string[] {
  const raw = product.metadata?.certifications;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is string => typeof item === "string" && Boolean(item.trim()),
  );
}

/**
 * Match shop ANSI filter against `ansi_class` and additional certifications
 * stored in product metadata.
 */
export function productMatchesAnsiFilter(
  product: {
    ansi_class?: string | null;
    metadata?: Record<string, unknown> | null;
  },
  filterValue: string,
): boolean {
  if (!filterValue.trim()) return true;
  if (productHasAnsiClass(product.ansi_class, filterValue)) return true;
  return productCertificationValues(product).some((stored) =>
    certificationMatchesFilter(stored, filterValue),
  );
}

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

/** US work-boot / shoe sizes shown in shop filters and product forms. */
export const SHOE_SIZE_OPTIONS: CatalogOption[] = [
  "6",
  "6.5",
  "7",
  "7.5",
  "8",
  "8.5",
  "9",
  "9.5",
  "10",
  "10.5",
  "11",
  "11.5",
  "12",
  "13",
  "14",
  "15",
].map((value) => ({ label: value, value }));

/** Apparel letter ranks for natural size ordering (supports combo sizes like M/L). */
const APPAREL_SIZE_RANK: Record<string, number> = {
  xxs: 0,
  xs: 1,
  s: 2,
  "s/m": 2.5,
  sm: 2.5,
  m: 3,
  "m/l": 3.5,
  ml: 3.5,
  l: 4,
  "l/xl": 4.5,
  lxl: 4.5,
  xl: 5,
  "xl/2xl": 5.5,
  "2xl": 6,
  xxl: 6,
  "2xl/3xl": 6.5,
  "3xl": 7,
  xxxl: 7,
  "3xl/4xl": 7.5,
  "4xl": 8,
  xxxxl: 8,
  "5xl": 9,
  "6xl": 10,
};

const QUALITATIVE_SIZE_RANK: Record<string, number> = {
  "one size": 0,
  onesize: 0,
  os: 0,
  universal: 1,
  adjustable: 2,
  standard: 3,
};

function normalizeSizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function apparelSizeRank(value: string): number | null {
  const compact = normalizeSizeKey(value);
  if (compact in APPAREL_SIZE_RANK) return APPAREL_SIZE_RANK[compact];

  // Combo sizes written with spaces: "2XL / 3XL"
  const spaced = value
    .trim()
    .toLowerCase()
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, "");
  if (spaced in APPAREL_SIZE_RANK) return APPAREL_SIZE_RANK[spaced];

  // Average ranks for unknown combos like "S/M".
  if (spaced.includes("/")) {
    const parts = spaced.split("/").map((part) => APPAREL_SIZE_RANK[part]);
    if (parts.every((part) => part != null)) {
      return (parts[0]! + parts[parts.length - 1]!) / 2;
    }
  }
  return null;
}

/** Convert length labels (18 in, 6 ft, Up to 8 ft) to inches for sorting. */
function lengthSizeInches(value: string): number | null {
  const trimmed = value.trim().toLowerCase();
  const upToFt = trimmed.match(/up\s*to\s*(\d+(?:\.\d+)?)\s*(?:ft|feet|')\b/);
  if (upToFt) return Number(upToFt[1]) * 12;
  const feet = trimmed.match(/(\d+(?:\.\d+)?)\s*(?:ft|feet|')\b/);
  if (feet) return Number(feet[1]) * 12;
  const inches = trimmed.match(/(\d+(?:\.\d+)?)\s*(?:in|inch|inches|")\b/);
  if (inches) return Number(inches[1]);
  return null;
}

function shoeOrNumericSize(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  return Number(trimmed);
}

/**
 * Sort key groups: apparel → shoe/numeric → length → qualitative → other.
 * Within each group, sizes follow natural metric / size-chart order.
 */
function sizeSortTuple(value: string): [number, number, string] {
  const apparel = apparelSizeRank(value);
  if (apparel != null) return [0, apparel, value.toLowerCase()];

  const shoe = shoeOrNumericSize(value);
  if (shoe != null) return [1, shoe, value.toLowerCase()];

  const length = lengthSizeInches(value);
  if (length != null) return [2, length, value.toLowerCase()];

  const qualitative = QUALITATIVE_SIZE_RANK[normalizeSizeKey(value)]
    ?? QUALITATIVE_SIZE_RANK[value.trim().toLowerCase()];
  if (qualitative != null) return [3, qualitative, value.toLowerCase()];

  return [4, 0, value.toLowerCase()];
}

/** Compare size labels for shop filters and admin size pickers. */
export function compareCatalogSizes(a: string, b: string): number {
  const [aKind, aOrder, aLabel] = sizeSortTuple(a);
  const [bKind, bOrder, bLabel] = sizeSortTuple(b);
  if (aKind !== bKind) return aKind - bKind;
  if (aOrder !== bOrder) return aOrder - bOrder;
  return aLabel.localeCompare(bLabel);
}

export function sortCatalogSizes<T extends { label: string; value: string }>(
  options: T[],
): T[] {
  return [...options].sort((a, b) =>
    compareCatalogSizes(a.label || a.value, b.label || b.value),
  );
}

export type SizeGroupId =
  | "apparel"
  | "shoe"
  | "length"
  | "qualitative"
  | "other";

export const SIZE_GROUP_LABELS: Record<SizeGroupId, string> = {
  apparel: "Apparel",
  shoe: "Shoe / boot",
  length: "Length / dimension",
  qualitative: "Fit",
  other: "Other",
};

const SIZE_GROUP_ORDER: SizeGroupId[] = [
  "apparel",
  "shoe",
  "length",
  "qualitative",
  "other",
];

/** Classify a size label into a titled shop-filter partition. */
export function sizeGroupId(value: string): SizeGroupId {
  const [kind] = sizeSortTuple(value);
  if (kind === 0) return "apparel";
  if (kind === 1) return "shoe";
  if (kind === 2) return "length";
  if (kind === 3) return "qualitative";
  return "other";
}

export type SizeOptionGroup<T extends { label: string; value: string }> = {
  id: SizeGroupId;
  title: string;
  options: T[];
};

/** Partition sizes into titled groups while preserving natural sort order. */
export function groupCatalogSizes<T extends { label: string; value: string }>(
  options: T[],
): SizeOptionGroup<T>[] {
  const buckets = new Map<SizeGroupId, T[]>();
  for (const option of sortCatalogSizes(options)) {
    const id = sizeGroupId(option.label || option.value);
    const list = buckets.get(id) ?? [];
    list.push(option);
    buckets.set(id, list);
  }
  return SIZE_GROUP_ORDER.flatMap((id) => {
    const groupOptions = buckets.get(id);
    if (!groupOptions?.length) return [];
    return [{ id, title: SIZE_GROUP_LABELS[id], options: groupOptions }];
  });
}

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
  opts?: { compare?: (a: CatalogOption, b: CatalogOption) => number },
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
  const values = Array.from(map.values());
  if (opts?.compare) return values.sort(opts.compare);
  return values.sort((a, b) => a.label.localeCompare(b.label));
}

export function toSelectOptions(
  options: CatalogOption[],
  emptyLabel = "Select…",
): { label: string; value: string }[] {
  return [{ label: emptyLabel, value: "" }, ...options];
}

/** Empty option + partitioned optgroups for size (and similar) selects. */
export function toGroupedSelectOptions(
  options: CatalogOption[],
  emptyLabel = "Select…",
): {
  options: { label: string; value: string }[];
  optionGroups: { label: string; options: CatalogOption[] }[];
} {
  return {
    options: [{ label: emptyLabel, value: "" }],
    optionGroups: groupCatalogSizes(options).map((group) => ({
      label: group.title,
      options: group.options,
    })),
  };
}
