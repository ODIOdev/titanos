/**
 * Import Titan Safety Equipment Pricing Guide (Aug 2026) starter catalog.
 *
 * Source: Titan_Safety_Equipment_Pricing_Guide.pdf
 * - Upserts missing categories with departments
 * - Upserts ~40 products under Titan Safety brand (by SKU)
 * - Uses existing public/images/products SVG placeholders
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/import-pricing-guide.ts
 */

import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { slugify } from "../src/lib/utils";

config({ path: resolve(process.cwd(), ".env.local") });

const INVENTORY = 25;
const LOW_STOCK = 10;
const BRAND_SLUG = "titan-safety";

type CategorySeed = {
  slug: string;
  name: string;
  department: string;
  description: string;
  image_url: string;
  sort_order: number;
};

type ProductSeed = {
  sku: string;
  name: string;
  categorySlug: string;
  department: string;
  productType: string;
  unit: string;
  cost: number;
  price: number;
  shortDescription: string;
  description: string;
  imageUrl: string;
  featured?: boolean;
  bestseller?: boolean;
  ansiClass?: string | null;
  color?: string | null;
  specs?: { name: string; value: string }[];
};

const EXTRA_CATEGORIES: CategorySeed[] = [
  {
    slug: "face-shields",
    name: "Face Shields",
    department: "Safety Glasses",
    description: "Clear face shields for impact and splash protection.",
    image_url: "/images/categories/safety-glasses.svg",
    sort_order: 50,
  },
  {
    slug: "fall-protection",
    name: "Fall Protection",
    department: "Fall Protection",
    description: "Harnesses, lanyards, SRL, and fall-arrest kits.",
    image_url: "/images/categories/fall-protection.png",
    sort_order: 51,
  },
  {
    slug: "traffic-cones",
    name: "Traffic Cones",
    department: "Traffic Safety Equipment",
    description: "Reflective and weighted traffic cones for work zones.",
    image_url: "/images/categories/traffic-cones.svg",
    sort_order: 52,
  },
  {
    slug: "traffic-paddles",
    name: "Traffic Paddles",
    department: "Traffic Safety Equipment",
    description: "Hand-held STOP/SLOW paddles for traffic control.",
    image_url: "/images/categories/traffic-safety-equipment.png",
    sort_order: 53,
  },
  {
    slug: "warning-triangles",
    name: "Warning Triangles",
    department: "Traffic Safety Equipment",
    description: "Portable reflective warning triangle kits.",
    image_url: "/images/categories/traffic-safety-equipment.png",
    sort_order: 54,
  },
  {
    slug: "construction-signs",
    name: "Construction Signs",
    department: "Signage",
    description: "Temporary construction and roadway warning signs.",
    image_url: "/images/categories/construction-signs.svg",
    sort_order: 55,
  },
  {
    slug: "first-aid-kits",
    name: "First Aid Kits",
    department: "Safety Equipment",
    description: "ANSI-oriented first-aid kits for jobsites and facilities.",
    image_url: "/images/categories/hard-hats.svg",
    sort_order: 56,
  },
  {
    slug: "eyewash",
    name: "Eyewash",
    department: "Safety Equipment",
    description: "Portable eyewash bottles for emergency flushing.",
    image_url: "/images/categories/safety-glasses.svg",
    sort_order: 57,
  },
  {
    slug: "fire-extinguishers",
    name: "Fire Extinguishers",
    department: "Safety Equipment",
    description: "ABC dry-chemical extinguishers for facility readiness.",
    image_url: "/images/categories/hard-hats.svg",
    sort_order: 58,
  },
  {
    slug: "rain-gear",
    name: "Rain Gear",
    department: "Reflective Visibility Clothing",
    description: "Waterproof rain suits and wet-weather PPE.",
    image_url: "/images/categories/reflective-visibility-clothing.png",
    sort_order: 59,
  },
  {
    slug: "combo-kits",
    name: "Combo Kits",
    department: "Combo Deals",
    description: "Bundled PPE kits for crews and contractors.",
    image_url: "/images/categories/combo-deals.png",
    sort_order: 60,
  },
];

const PRODUCTS: ProductSeed[] = [
  {
    sku: "TSC-EYE-001",
    name: "Clear Safety Glasses",
    categorySlug: "frameless-safety-glasses",
    department: "Safety Glasses",
    productType: "Safety Glasses",
    unit: "Each",
    cost: 2.25,
    price: 6.99,
    shortDescription: "Lightweight clear lens safety glasses for everyday jobsites.",
    description:
      "Impact-rated clear safety glasses for general construction and warehouse use. Suggested retail from the Titan Safety starter pricing guide.",
    imageUrl: "/images/products/clear-anti-fog-safety-glasses.svg",
    featured: true,
    bestseller: true,
    ansiClass: "Z87",
    color: "Clear",
    specs: [
      { name: "Unit", value: "Each" },
      { name: "Lens", value: "Clear" },
    ],
  },
  {
    sku: "TSC-EYE-002",
    name: "Sealed Safety Goggles",
    categorySlug: "protective-safety-goggles",
    department: "Safety Glasses",
    productType: "Safety Glasses",
    unit: "Each",
    cost: 4.75,
    price: 12.99,
    shortDescription: "Sealed goggles for dust, splash, and debris protection.",
    description:
      "Indirect-vent sealed safety goggles designed for dusty and splash-prone environments.",
    imageUrl: "/images/products/clear-anti-fog-safety-glasses.svg",
    ansiClass: "Z87",
    color: "Clear",
    specs: [{ name: "Unit", value: "Each" }],
  },
  {
    sku: "TSC-EYE-003",
    name: "Clear Face Shield",
    categorySlug: "face-shields",
    department: "Safety Glasses",
    productType: "Safety Glasses",
    unit: "Each",
    cost: 8.5,
    price: 19.99,
    shortDescription: "Full-face clear shield for grinding and splash work.",
    description:
      "Clear face shield for face and eye coverage during grinding, cutting, and chemical splash tasks.",
    imageUrl: "/images/products/clear-anti-fog-safety-glasses.svg",
    specs: [{ name: "Unit", value: "Each" }],
  },
  {
    sku: "TSC-EAR-001",
    name: "Disposable Foam Earplugs",
    categorySlug: "earplugs",
    department: "Hearing Protection",
    productType: "Hearing Protection",
    unit: "Box / 50 pairs",
    cost: 8.5,
    price: 19.99,
    shortDescription: "Soft foam earplugs — 50-pair box for crew packs.",
    description:
      "Disposable foam earplugs supplied in a 50-pair box. Ideal for contractor and employer bulk orders.",
    imageUrl: "/images/products/titan-premium-vented-hard-hat.svg",
    featured: true,
    bestseller: true,
    specs: [
      { name: "Unit", value: "Box / 50 pairs" },
      { name: "Pairs", value: "50" },
    ],
  },
  {
    sku: "TSC-EAR-002",
    name: "Adjustable Safety Earmuffs",
    categorySlug: "ear-protector-ear-muffs",
    department: "Hearing Protection",
    productType: "Hearing Protection",
    unit: "Each",
    cost: 8.5,
    price: 19.99,
    shortDescription: "Adjustable over-ear muffs for noisy environments.",
    description:
      "Adjustable safety earmuffs for intermittent high-noise exposure on construction and industrial sites.",
    imageUrl: "/images/products/cap-style-hard-hat-yellow.svg",
    specs: [{ name: "Unit", value: "Each" }],
  },
  {
    sku: "TSC-HAT-001",
    name: "ANSI Type I Hard Hat",
    categorySlug: "type-1-hard-hats",
    department: "Head Protection",
    productType: "Hard Hat",
    unit: "Each",
    cost: 10.5,
    price: 24.99,
    shortDescription: "Core Type I hard hat for everyday jobsite protection.",
    description:
      "ANSI Type I hard hat positioned as a core jobsite requirement with strong branding opportunity.",
    imageUrl: "/images/products/titan-premium-vented-hard-hat.svg",
    featured: true,
    bestseller: true,
    ansiClass: "Type I",
    color: "Yellow",
    specs: [
      { name: "Unit", value: "Each" },
      { name: "ANSI", value: "Type I" },
    ],
  },
  {
    sku: "TSC-HAT-002",
    name: "Type II Helmet with Chin Strap",
    categorySlug: "type-2-hard-hats",
    department: "Head Protection",
    productType: "Hard Hat",
    unit: "Each",
    cost: 42,
    price: 89.99,
    shortDescription: "Type II helmet with chin strap for lateral impact.",
    description:
      "Type II safety helmet with chin strap for applications needing top and lateral impact protection.",
    imageUrl: "/images/products/full-brim-hard-hat-with-ratchet.svg",
    ansiClass: "Type II",
    specs: [
      { name: "Unit", value: "Each" },
      { name: "ANSI", value: "Type II" },
    ],
  },
  {
    sku: "TSC-VIS-001",
    name: "Basic Class 2 Safety Vest",
    categorySlug: "high-visibility-vests",
    department: "Reflective Visibility Clothing",
    productType: "Safety Vest",
    unit: "Each",
    cost: 5.5,
    price: 14.99,
    shortDescription: "High-frequency Class 2 vest with strong margin.",
    description:
      "Basic ANSI Class 2 safety vest — high-frequency item with strong margin and easy sizing.",
    imageUrl: "/images/products/hi-vis-class-2-safety-vest.svg",
    featured: true,
    bestseller: true,
    ansiClass: "Class 2",
    color: "Lime",
    specs: [
      { name: "Unit", value: "Each" },
      { name: "ANSI", value: "Class 2" },
    ],
  },
  {
    sku: "TSC-VIS-002",
    name: "10-Pocket Class 2 Safety Vest",
    categorySlug: "high-visibility-vests",
    department: "Reflective Visibility Clothing",
    productType: "Safety Vest",
    unit: "Each",
    cost: 11,
    price: 24.99,
    shortDescription: "Class 2 surveyor-style vest with 10 pockets.",
    description:
      "10-pocket Class 2 safety vest for survey, inspection, and utility crews who need tool storage.",
    imageUrl: "/images/products/class-3-surveyor-safety-vest.svg",
    ansiClass: "Class 2",
    color: "Lime",
    specs: [
      { name: "Unit", value: "Each" },
      { name: "Pockets", value: "10" },
    ],
  },
  {
    sku: "TSC-VIS-003",
    name: "Hi-Vis Long-Sleeve Shirt",
    categorySlug: "long-sleeve",
    department: "Reflective Visibility Clothing",
    productType: "Safety Vest",
    unit: "Each",
    cost: 10,
    price: 22.99,
    shortDescription: "High-visibility long-sleeve work shirt.",
    description:
      "Hi-vis long-sleeve shirt for daytime roadway and construction visibility.",
    imageUrl: "/images/products/mesh-breakaway-safety-vest.svg",
    color: "Lime",
    specs: [{ name: "Unit", value: "Each" }],
  },
  {
    sku: "TSC-VIS-004",
    name: "Hi-Vis Safety Hoodie",
    categorySlug: "sweatshirt-with-hoody",
    department: "Reflective Visibility Clothing",
    productType: "Safety Vest",
    unit: "Each",
    cost: 20,
    price: 44.99,
    shortDescription: "High-visibility hoodie for cool-weather jobsites.",
    description:
      "Hi-vis safety hoodie with reflective trim for cooler shifts and outdoor crews.",
    imageUrl: "/images/products/hi-vis-class-2-safety-vest.svg",
    color: "Lime",
    specs: [{ name: "Unit", value: "Each" }],
  },
  {
    sku: "TSC-VIS-005",
    name: "Hi-Vis Waterproof Jacket",
    categorySlug: "rain-gear",
    department: "Reflective Visibility Clothing",
    productType: "Safety Vest",
    unit: "Each",
    cost: 30,
    price: 64.99,
    shortDescription: "Waterproof hi-vis jacket for wet weather work.",
    description:
      "Hi-vis waterproof jacket for wet-weather roadway and construction exposure.",
    imageUrl: "/images/products/class-3-surveyor-safety-vest.svg",
    color: "Lime",
    specs: [{ name: "Unit", value: "Each" }],
  },
  {
    sku: "TSC-HND-001",
    name: "Nitrile-Coated Work Gloves",
    categorySlug: "coated-work-gloves",
    department: "Safety Gloves",
    productType: "Work Glove",
    unit: "Pair",
    cost: 2.5,
    price: 6.99,
    shortDescription: "Repeat-purchase nitrile-coated grip gloves.",
    description:
      "Nitrile-coated work gloves for construction and warehouse handling — strong repeat-purchase SKU.",
    imageUrl: "/images/products/titan-flex-grip-work-gloves.svg",
    featured: true,
    bestseller: true,
    specs: [{ name: "Unit", value: "Pair" }],
  },
  {
    sku: "TSC-HND-002",
    name: "ANSI A5 Cut-Resistant Gloves",
    categorySlug: "cut-resistant-gloves",
    department: "Safety Gloves",
    productType: "Work Glove",
    unit: "Pair",
    cost: 7.5,
    price: 16.99,
    shortDescription: "ANSI A5 cut-resistant gloves for higher-risk handling.",
    description:
      "ANSI A5 cut-resistant gloves — higher-value upgrade with strong professional demand.",
    imageUrl: "/images/products/cut-resistant-gloves-level-a4.svg",
    featured: true,
    bestseller: true,
    ansiClass: "A5",
    specs: [
      { name: "Unit", value: "Pair" },
      { name: "Cut Level", value: "A5" },
    ],
  },
  {
    sku: "TSC-HND-003",
    name: "Leather Work Gloves",
    categorySlug: "abrasion-resistant-gloves",
    department: "Safety Gloves",
    productType: "Work Glove",
    unit: "Pair",
    cost: 6.75,
    price: 14.99,
    shortDescription: "Durable leather palm work gloves.",
    description:
      "Leather work gloves for general labor, material handling, and outdoor work.",
    imageUrl: "/images/products/leather-palm-work-gloves.svg",
    specs: [{ name: "Unit", value: "Pair" }],
  },
  {
    sku: "TSC-HND-004",
    name: "Disposable Nitrile Gloves",
    categorySlug: "disposable-gloves",
    department: "Safety Gloves",
    productType: "Work Glove",
    unit: "Box / 100",
    cost: 8.5,
    price: 17.99,
    shortDescription: "Disposable nitrile gloves — 100-count box.",
    description:
      "Powder-free disposable nitrile gloves in a 100-count box for inspection and light handling.",
    imageUrl: "/images/products/titan-flex-grip-work-gloves.svg",
    specs: [
      { name: "Unit", value: "Box / 100" },
      { name: "Count", value: "100" },
    ],
  },
  {
    sku: "TSC-RSP-001",
    name: "N95 Respirators",
    categorySlug: "respiratory-masks",
    department: "Respiratory Protection",
    productType: "Respiratory Mask",
    unit: "Box / 20",
    cost: 12.5,
    price: 27.99,
    shortDescription: "N95 respirators — essential repeat-order category.",
    description:
      "N95 filtering facepiece respirators in a 20-count box for dust and particulate protection.",
    imageUrl: "/images/products/titan-premium-vented-hard-hat.svg",
    featured: true,
    bestseller: true,
    specs: [
      { name: "Unit", value: "Box / 20" },
      { name: "Count", value: "20" },
      { name: "Type", value: "N95" },
    ],
  },
  {
    sku: "TSC-RSP-002",
    name: "Reusable Half-Mask Respirator",
    categorySlug: "respiratory-masks",
    department: "Respiratory Protection",
    productType: "Respiratory Mask",
    unit: "Each",
    cost: 18,
    price: 34.99,
    shortDescription: "Reusable half-mask respirator body.",
    description:
      "Reusable half-mask respirator for pairing with replaceable particulate filters.",
    imageUrl: "/images/products/cap-style-hard-hat-yellow.svg",
    specs: [{ name: "Unit", value: "Each" }],
  },
  {
    sku: "TSC-RSP-003",
    name: "Replacement P100 Filters",
    categorySlug: "respiratory-masks",
    department: "Respiratory Protection",
    productType: "Respiratory Mask",
    unit: "Pair",
    cost: 12,
    price: 24.99,
    shortDescription: "Replacement P100 filter pair for half-masks.",
    description:
      "Replacement P100 particulate filters sold as a pair for reusable half-mask respirators.",
    imageUrl: "/images/products/clear-anti-fog-safety-glasses.svg",
    specs: [
      { name: "Unit", value: "Pair" },
      { name: "Filter", value: "P100" },
    ],
  },
  {
    sku: "TSC-FAL-001",
    name: "Full-Body Fall Harness",
    categorySlug: "fall-protection",
    department: "Fall Protection",
    productType: "Fall Protection",
    unit: "Each",
    cost: 42,
    price: 79.99,
    shortDescription: "Full-body harness for elevated work.",
    description:
      "Full-body fall harness for construction and industrial fall-arrest applications.",
    imageUrl: "/images/products/full-body-safety-harness.svg",
    specs: [{ name: "Unit", value: "Each" }],
  },
  {
    sku: "TSC-FAL-002",
    name: "Shock-Absorbing Lanyard",
    categorySlug: "fall-protection",
    department: "Fall Protection",
    productType: "Fall Protection",
    unit: "Each",
    cost: 36,
    price: 69.99,
    shortDescription: "Energy-absorbing lanyard for fall arrest.",
    description:
      "Shock-absorbing lanyard designed to reduce fall forces when used with a compatible harness and anchor.",
    imageUrl: "/images/products/shock-absorbing-lanyard.svg",
    specs: [{ name: "Unit", value: "Each" }],
  },
  {
    sku: "TSC-FAL-003",
    name: "Self-Retracting Lifeline",
    categorySlug: "fall-protection",
    department: "Fall Protection",
    productType: "Fall Protection",
    unit: "Each",
    cost: 85,
    price: 149.99,
    shortDescription: "Self-retracting lifeline for mobility at height.",
    description:
      "Self-retracting lifeline (SRL) for workers who need mobility while remaining tied off.",
    imageUrl: "/images/products/full-body-safety-harness.svg",
    specs: [{ name: "Unit", value: "Each" }],
  },
  {
    sku: "TSC-FAL-004",
    name: "Roofing Fall-Protection Kit",
    categorySlug: "fall-protection",
    department: "Fall Protection",
    productType: "Fall Protection",
    unit: "Kit",
    cost: 85,
    price: 159.99,
    shortDescription: "Complete roofing fall-protection starter kit.",
    description:
      "Roofing fall-protection kit bundling core components for residential and light commercial roof work.",
    imageUrl: "/images/products/full-body-safety-harness.svg",
    specs: [{ name: "Unit", value: "Kit" }],
  },
  {
    sku: "TSC-TRF-001",
    name: "28-Inch Traffic Cone",
    categorySlug: "traffic-cones",
    department: "Traffic Safety Equipment",
    productType: "Traffic Cone",
    unit: "Each",
    cost: 10,
    price: 19.99,
    shortDescription: "28-inch reflective traffic cone.",
    description:
      "28-inch traffic cone for temporary traffic control and work-zone delineation.",
    imageUrl: "/images/products/28-inch-reflective-traffic-cone.svg",
    featured: true,
    bestseller: true,
    color: "Orange",
    specs: [
      { name: "Unit", value: "Each" },
      { name: "Height", value: "28 in" },
    ],
  },
  {
    sku: "TSC-TRF-002",
    name: "28-Inch Weighted Traffic Cone",
    categorySlug: "traffic-cones",
    department: "Traffic Safety Equipment",
    productType: "Traffic Cone",
    unit: "Each",
    cost: 15,
    price: 29.99,
    shortDescription: "Weighted 28-inch cone for windy conditions.",
    description:
      "28-inch weighted traffic cone with a heavier base for outdoor and roadway use.",
    imageUrl: "/images/products/36-inch-highway-cone-with-base.svg",
    color: "Orange",
    specs: [
      { name: "Unit", value: "Each" },
      { name: "Height", value: "28 in" },
    ],
  },
  {
    sku: "TSC-TRF-003",
    name: "Reflective Cone Collar",
    categorySlug: "traffic-cones",
    department: "Traffic Safety Equipment",
    productType: "Traffic Cone",
    unit: "Each",
    cost: 2.25,
    price: 5.99,
    shortDescription: "Reflective collar accessory for traffic cones.",
    description:
      "Reflective cone collar to improve nighttime conspicuity on standard traffic cones.",
    imageUrl: "/images/products/18-inch-mini-traffic-cone.svg",
    specs: [{ name: "Unit", value: "Each" }],
  },
  {
    sku: "TSC-TRF-004",
    name: "Caution Tape — 1,000 ft",
    categorySlug: "caution-tape",
    department: "Safety Tapes",
    productType: "Safety Tape",
    unit: "Roll",
    cost: 4.5,
    price: 9.99,
    shortDescription: "1,000 ft caution tape roll — strong add-on margin.",
    description:
      "1,000-foot caution tape roll for temporary hazard marking and work-area perimeter control.",
    imageUrl: "/images/products/men-working-sign.svg",
    featured: true,
    bestseller: true,
    color: "Yellow",
    specs: [
      { name: "Unit", value: "Roll" },
      { name: "Length", value: "1,000 ft" },
    ],
  },
  {
    sku: "TSC-TRF-005",
    name: "Expandable Safety Barricade",
    categorySlug: "barricades",
    department: "Traffic Safety Equipment",
    productType: "Barricade",
    unit: "Each",
    cost: 42,
    price: 79.99,
    shortDescription: "Expandable barricade for lane and crowd control.",
    description:
      "Expandable safety barricade for temporary lane closures and pedestrian control.",
    imageUrl: "/images/products/expandable-crowd-control-barricade.svg",
    specs: [{ name: "Unit", value: "Each" }],
  },
  {
    sku: "TSC-TRF-006",
    name: "Reflective Traffic Paddle",
    categorySlug: "traffic-paddles",
    department: "Traffic Safety Equipment",
    productType: "Barricade",
    unit: "Each",
    cost: 13,
    price: 29.99,
    shortDescription: "Reflective STOP/SLOW traffic paddle.",
    description:
      "Hand-held reflective traffic paddle for flaggers and temporary traffic control.",
    imageUrl: "/images/products/stop-sign-30-inch.svg",
    specs: [{ name: "Unit", value: "Each" }],
  },
  {
    sku: "TSC-TRF-007",
    name: "Portable Warning Triangle Kit",
    categorySlug: "warning-triangles",
    department: "Traffic Safety Equipment",
    productType: "Barricade",
    unit: "3-piece kit",
    cost: 15,
    price: 29.99,
    shortDescription: "3-piece reflective warning triangle kit.",
    description:
      "Portable 3-piece warning triangle kit for roadside and vehicle emergency marking.",
    imageUrl: "/images/products/yield-sign-aluminum.svg",
    specs: [
      { name: "Unit", value: "3-piece kit" },
      { name: "Pieces", value: "3" },
    ],
  },
  {
    sku: "TSC-SGN-001",
    name: "Construction Safety Sign",
    categorySlug: "construction-signs",
    department: "Signage",
    productType: "Construction Sign",
    unit: "Each",
    cost: 4,
    price: 9.99,
    shortDescription: "Temporary construction safety warning sign.",
    description:
      "Construction safety sign for temporary work zones and facility hazard posting.",
    imageUrl: "/images/products/road-work-ahead-sign.svg",
    specs: [{ name: "Unit", value: "Each" }],
  },
  {
    sku: "TSC-EMG-001",
    name: "ANSI 25-Person First-Aid Kit",
    categorySlug: "first-aid-kits",
    department: "Safety Equipment",
    productType: "First Aid Kit",
    unit: "Kit",
    cost: 14,
    price: 29.99,
    shortDescription: "25-person ANSI-oriented first-aid kit.",
    description:
      "ANSI-oriented 25-person first-aid kit for jobsites, shops, and facilities.",
    imageUrl: "/images/products/titan-premium-vented-hard-hat.svg",
    specs: [
      { name: "Unit", value: "Kit" },
      { name: "Persons", value: "25" },
    ],
  },
  {
    sku: "TSC-EMG-002",
    name: "16-Ounce Eyewash Bottle",
    categorySlug: "eyewash",
    department: "Safety Equipment",
    productType: "Eyewash",
    unit: "Each",
    cost: 5.5,
    price: 12.99,
    shortDescription: "16 oz portable eyewash bottle.",
    description:
      "16-ounce eyewash bottle for immediate flushing before accessing a plumbed station.",
    imageUrl: "/images/products/clear-anti-fog-safety-glasses.svg",
    specs: [
      { name: "Unit", value: "Each" },
      { name: "Volume", value: "16 oz" },
    ],
  },
  {
    sku: "TSC-EMG-003",
    name: "5-Pound ABC Extinguisher",
    categorySlug: "fire-extinguishers",
    department: "Safety Equipment",
    productType: "Fire Extinguisher",
    unit: "Each",
    cost: 35,
    price: 59.99,
    shortDescription: "5 lb ABC dry-chemical fire extinguisher.",
    description:
      "5-pound ABC extinguisher for facility and shop fire readiness.",
    imageUrl: "/images/products/plastic-a-frame-barricade.svg",
    specs: [
      { name: "Unit", value: "Each" },
      { name: "Weight", value: "5 lb" },
      { name: "Type", value: "ABC" },
    ],
  },
  {
    sku: "TSC-BDY-001",
    name: "Heavy-Duty Gel Knee Pads",
    categorySlug: "knee-pads",
    department: "Safety Equipment",
    productType: "Knee Pads",
    unit: "Pair",
    cost: 10,
    price: 24.99,
    shortDescription: "Gel knee pads for flooring and concrete work.",
    description:
      "Heavy-duty gel knee pads for kneeling tasks on concrete, tile, and rough surfaces.",
    imageUrl: "/images/products/titan-flex-grip-work-gloves.svg",
    specs: [{ name: "Unit", value: "Pair" }],
  },
  {
    sku: "TSC-BDY-002",
    name: "Disposable Coveralls",
    categorySlug: "coveralls",
    department: "Reflective Visibility Clothing",
    productType: "Safety Vest",
    unit: "Each",
    cost: 4.5,
    price: 10.99,
    shortDescription: "Disposable coveralls for dirty and dusty tasks.",
    description:
      "Disposable coveralls for painting, insulation, and general contamination control.",
    imageUrl: "/images/products/mesh-breakaway-safety-vest.svg",
    color: "White",
    specs: [{ name: "Unit", value: "Each" }],
  },
  {
    sku: "TSC-BDY-003",
    name: "Two-Piece Rain Suit",
    categorySlug: "rain-gear",
    department: "Reflective Visibility Clothing",
    productType: "Safety Vest",
    unit: "Set",
    cost: 12,
    price: 29.99,
    shortDescription: "Two-piece waterproof rain suit set.",
    description:
      "Two-piece rain suit for wet-weather outdoor labor and roadway crews.",
    imageUrl: "/images/products/hi-vis-class-2-safety-vest.svg",
    color: "Yellow",
    specs: [{ name: "Unit", value: "Set" }],
  },
  {
    sku: "TSC-FT-001",
    name: "Steel-Toe Work Boots",
    categorySlug: "steel-toe-boots-shoes",
    department: "Safety Shoes & Boots",
    productType: "Work Boot",
    unit: "Pair",
    cost: 48,
    price: 89.99,
    shortDescription: "Steel-toe work boots for industrial jobsites.",
    description:
      "Steel-toe work boots built for construction and industrial environments.",
    imageUrl: "/images/products/titan-steel-toe-work-boot.svg",
    color: "Brown",
    specs: [
      { name: "Unit", value: "Pair" },
      { name: "Toe", value: "Steel" },
    ],
  },
  {
    sku: "TSC-FT-002",
    name: "Rubber Safety Boots",
    categorySlug: "waterproof-work-boots-safety-shoes",
    department: "Safety Shoes & Boots",
    productType: "Work Boot",
    unit: "Pair",
    cost: 24,
    price: 49.99,
    shortDescription: "Rubber safety boots for wet environments.",
    description:
      "Rubber safety boots for wet, muddy, and wash-down work areas.",
    imageUrl: "/images/products/composite-toe-waterproof-boot.svg",
    color: "Black",
    specs: [
      { name: "Unit", value: "Pair" },
      { name: "Material", value: "Rubber" },
    ],
  },
  {
    sku: "TSC-BND-001",
    name: "Worker PPE Combo Kit",
    categorySlug: "combo-kits",
    department: "Combo Deals",
    productType: "Combo Kit",
    unit: "Kit",
    cost: 25,
    price: 54.99,
    shortDescription: "Starter PPE combo kit to raise average order value.",
    description:
      "Worker PPE combo kit bundling everyday essentials for new hires and small crews.",
    imageUrl: "/images/products/hi-vis-class-2-safety-vest.svg",
    featured: true,
    bestseller: true,
    specs: [{ name: "Unit", value: "Kit" }],
  },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function ensureCategories(existingBySlug: Map<string, { id: string }>) {
  console.log("Ensuring categories…");
  for (const cat of EXTRA_CATEGORIES) {
    if (existingBySlug.has(cat.slug)) {
      const id = existingBySlug.get(cat.slug)!.id;
      const { error } = await supabase
        .from("categories")
        .update({
          department: cat.department,
          active: true,
          description: cat.description,
        })
        .eq("id", id);
      if (error) throw new Error(`category update ${cat.slug}: ${error.message}`);
      continue;
    }
    const id = randomUUID();
    const { error } = await supabase.from("categories").insert({
      id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image_url: cat.image_url,
      sort_order: cat.sort_order,
      active: true,
      department: cat.department,
    });
    if (error) throw new Error(`category insert ${cat.slug}: ${error.message}`);
    existingBySlug.set(cat.slug, { id });
    console.log(`  + ${cat.slug}`);
  }
  console.log(`  ✓ ${EXTRA_CATEGORIES.length} category slots ready`);
}

async function main() {
  console.log("Titan Safety — pricing guide import\n");
  console.log(`URL: ${supabaseUrl}\n`);

  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug")
    .eq("slug", BRAND_SLUG)
    .maybeSingle();
  if (brandError) throw new Error(brandError.message);
  if (!brand) throw new Error(`Brand slug "${BRAND_SLUG}" not found`);
  console.log(`Brand: ${brand.name} (${brand.id})`);

  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, slug, name, department");
  if (catError) throw new Error(catError.message);
  const categoryBySlug = new Map(
    (categories ?? []).map((c) => [c.slug, { id: c.id }]),
  );

  await ensureCategories(categoryBySlug);

  // Refresh after inserts
  const { data: cats2, error: catError2 } = await supabase
    .from("categories")
    .select("id, slug");
  if (catError2) throw new Error(catError2.message);
  const catMap = new Map((cats2 ?? []).map((c) => [c.slug, c.id]));

  const missingCats = [
    ...new Set(PRODUCTS.map((p) => p.categorySlug)),
  ].filter((slug) => !catMap.has(slug));
  if (missingCats.length) {
    throw new Error(`Missing categories: ${missingCats.join(", ")}`);
  }

  console.log(`\nUpserting ${PRODUCTS.length} products…`);
  let created = 0;
  let updated = 0;

  for (const p of PRODUCTS) {
    const categoryId = catMap.get(p.categorySlug)!;
    const slug = slugify(p.name);
    const payload = {
      name: p.name,
      slug,
      sku: p.sku,
      short_description: p.shortDescription,
      description: p.description,
      category_id: categoryId,
      brand_id: brand.id,
      price: p.price,
      cost: p.cost,
      inventory_quantity: INVENTORY,
      low_stock_threshold: LOW_STOCK,
      weight: null,
      shipping_class: null,
      active: true,
      featured: Boolean(p.featured),
      bestseller: Boolean(p.bestseller),
      product_type: p.productType,
      department: p.department,
      ansi_class: p.ansiClass ?? null,
      color: p.color ?? null,
      size: null,
      metadata: {
        status: "active",
        tags: ["pricing-guide-2026", p.unit],
        tag: "pricing-guide-2026",
        gender: "Unisex",
        touchScreen: false,
        hasMultipleSizes: false,
        variants: [],
        unit: p.unit,
        source: "Titan_Safety_Equipment_Pricing_Guide.pdf",
        image_url: p.imageUrl,
      },
    };

    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("sku", p.sku)
      .maybeSingle();

    let productId: string;
    if (existing?.id) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw new Error(`update ${p.sku}: ${error.message}`);
      productId = existing.id;
      updated += 1;
    } else {
      productId = randomUUID();
      const { error } = await supabase.from("products").insert({
        id: productId,
        ...payload,
      });
      if (error) throw new Error(`insert ${p.sku}: ${error.message}`);
      created += 1;
    }

    const { error: delImgErr } = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", productId);
    if (delImgErr) throw new Error(`images delete ${p.sku}: ${delImgErr.message}`);

    const { error: imgErr } = await supabase.from("product_images").insert({
      id: randomUUID(),
      product_id: productId,
      url: p.imageUrl,
      alt_text: p.name,
      sort_order: 0,
      is_primary: true,
    });
    if (imgErr) throw new Error(`images insert ${p.sku}: ${imgErr.message}`);

    const { error: delSpecErr } = await supabase
      .from("product_specifications")
      .delete()
      .eq("product_id", productId);
    if (delSpecErr) {
      throw new Error(`specs delete ${p.sku}: ${delSpecErr.message}`);
    }
    const specs = p.specs ?? [];
    if (specs.length) {
      const { error: specErr } = await supabase
        .from("product_specifications")
        .insert(
          specs.map((spec, i) => ({
            product_id: productId,
            name: spec.name,
            value: spec.value,
            sort_order: i,
          })),
        );
      if (specErr) throw new Error(`specs insert ${p.sku}: ${specErr.message}`);
    }

    console.log(`  ✓ ${p.sku} — ${p.name}`);
  }

  // Activate categories/brands that now have products
  const touchedCategoryIds = [
    ...new Set(PRODUCTS.map((p) => catMap.get(p.categorySlug)!)),
  ];
  await supabase
    .from("categories")
    .update({ active: true })
    .in("id", touchedCategoryIds);
  await supabase.from("brands").update({ active: true }).eq("id", brand.id);

  console.log(
    `\nDone. Created ${created}, updated ${updated}, total ${PRODUCTS.length}.`,
  );
  console.log("Inventory set to 25 · brand Titan Safety · placeholder SVGs.");
}

main().catch((err) => {
  console.error("\nImport failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
