/**
 * Attach real product photos to pricing-guide SKUs (TSC-*).
 *
 * Sources (local Titan asset folders):
 *   ~/Desktop/TITAN/inventory/**
 *   public/images/categories/**
 *   ~/Desktop/TITAN/graphics/**
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/attach-pricing-guide-images.ts
 */

import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(process.cwd(), ".env.local") });

const INV = resolve("/Users/neo/Desktop/TITAN/inventory");
const GRAPHICS = resolve("/Users/neo/Desktop/TITAN/graphics");
const CATEGORIES = resolve(process.cwd(), "public/images/categories");

/** SKU → absolute local image path */
const IMAGE_BY_SKU: Record<string, string> = {
  "TSC-EYE-001": resolve(INV, "glasses/Frameless Safety Glasses  .webp"),
  "TSC-EYE-002": resolve(INV, "glasses/Protective Safety Goggles.webp"),
  "TSC-EYE-003": resolve(INV, "glasses/Anti Fog Safety Glasses.webp"),
  "TSC-EAR-001": resolve(INV, "hearing/Earplugs.webp"),
  "TSC-EAR-002": resolve(INV, "hearing/Ear Protector.webp"),
  "TSC-HAT-001": resolve(INV, "hard hats/Type 1 Hard Hats.webp"),
  "TSC-HAT-002": resolve(INV, "hard hats/Type 2 Hard Hats.webp"),
  "TSC-VIS-001": resolve(GRAPHICS, "thumbs/reflective cloths.webp"),
  "TSC-VIS-002": resolve(CATEGORIES, "reflective-visibility-clothing.png"),
  "TSC-VIS-003": resolve(
    INV,
    "Shirts/portwest-hi-vis-shirts-yellow-2xl-portwest-hi-vis-long-sleeve-pocket-shirt-ansi-class-3-s191-s191-2xl-yl-29580811600009_700x700.jpg.webp",
  ),
  "TSC-VIS-004": resolve(
    INV,
    "Sweater/PyramexHiVisBlackBottomPulloverSafetySweatshirtwithHood-ANSIClass3-RSSH32-1_579x579.webp",
  ),
  "TSC-VIS-005": resolve(
    INV,
    "pants/PORTWESTHi-VisExtremeWaterproofRainPantsYellowBlack_PW342_1_700x700.jpg.webp",
  ),
  "TSC-HND-001": resolve(INV, "gloves/Coated Work Gloves.webp"),
  "TSC-HND-002": resolve(INV, "gloves/Cut Resistant Gloves.webp"),
  "TSC-HND-003": resolve(
    INV,
    "gloves/Welding Gloves & Gauntlets/cordova-safety-leather-palm-gloves-7200r-1_700x700.webp",
  ),
  "TSC-HND-004": resolve(INV, "gloves/Disposable Gloves.webp"),
  "TSC-RSP-001": resolve(INV, "Respiratory/Respiratory Protection Masks.webp"),
  "TSC-RSP-002": resolve(CATEGORIES, "respiratory-protection.png"),
  "TSC-RSP-003": resolve(GRAPHICS, "thumbs/respiratory.webp"),
  "TSC-FAL-001": resolve(CATEGORIES, "fall-protection.png"),
  "TSC-FAL-002": resolve(GRAPHICS, "thumbs/fall protection.webp"),
  "TSC-FAL-003": resolve(CATEGORIES, "fall-protection.png"),
  "TSC-FAL-004": resolve(GRAPHICS, "thumbs/fall protection.webp"),
  "TSC-TRF-001": resolve(GRAPHICS, "images/coness.png"),
  "TSC-TRF-002": resolve(GRAPHICS, "images/cones.jpg"),
  "TSC-TRF-003": resolve(CATEGORIES, "traffic-cones.jpg"),
  "TSC-TRF-004": resolve(INV, "tape/Caution Barricade Tape.webp"),
  "TSC-TRF-005": resolve(INV, "traffic/Barricades/Barricades.webp"),
  "TSC-TRF-006": resolve(CATEGORIES, "traffic-safety-equipment.png"),
  "TSC-TRF-007": resolve(
    process.cwd(),
    "public/images/products/warning-triangle-kit.jpg",
  ),
  "TSC-SGN-001": resolve(GRAPHICS, "images/signs.jpg"),
  "TSC-EMG-001": resolve(GRAPHICS, "thumbs/combos.webp"),
  "TSC-EMG-002": resolve(INV, "glasses/Protective Safety Goggles.webp"),
  "TSC-EMG-003": resolve(CATEGORIES, "traffic-safety.png"),
  "TSC-BDY-001": resolve(INV, "Safety Equip/Knee Pads.jpeg"),
  "TSC-BDY-002": resolve(
    INV,
    "coveralls/ToughDuckInsulatedSafetyCoverallwithLayDownCollar-S787-1_700x700.webp",
  ),
  "TSC-BDY-003": resolve(
    INV,
    "pants/PORTWESTHi-VisExtremeWaterproofRainPantsYellowBlack_PW342_1_700x700.jpg.webp",
  ),
  "TSC-FT-001": resolve(INV, "foot protection/Steel Toe Boots & Shoes.webp"),
  "TSC-FT-002": resolve(
    INV,
    "foot protection/Waterproof Work Boots & Safety Shoes.webp",
  ),
  "TSC-BND-001": resolve(CATEGORIES, "combo-deals.png"),
};

function contentTypeFor(path: string): string {
  const ext = extname(path).toLowerCase().replace(/^\./, "");
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "svg") return "image/svg+xml";
  if (ext === "gif") return "image/gif";
  // some files are named *.jpg.webp
  if (path.toLowerCase().endsWith(".jpg.webp")) return "image/webp";
  if (path.toLowerCase().endsWith(".webp.jpeg")) return "image/jpeg";
  return "image/jpeg";
}

function storageExt(path: string, contentType: string): string {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/svg+xml") return "svg";
  if (contentType === "image/gif") return "gif";
  return "jpg";
}

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

async function main() {
  console.log("Attaching images to pricing-guide products\n");

  const { data: products, error } = await supabase
    .from("products")
    .select("id, sku, name, metadata")
    .like("sku", "TSC-%")
    .order("sku");
  if (error) throw new Error(error.message);
  if (!products?.length) {
    console.log("No TSC-* products found.");
    return;
  }

  let ok = 0;
  let skipped = 0;

  for (const product of products) {
    const localPath = IMAGE_BY_SKU[product.sku];
    if (!localPath) {
      console.warn(`  ✗ ${product.sku}: no image mapping`);
      skipped += 1;
      continue;
    }

    let buffer: Buffer;
    try {
      buffer = await readFile(localPath);
    } catch {
      console.warn(`  ✗ ${product.sku}: file missing → ${localPath}`);
      skipped += 1;
      continue;
    }

    const contentType = contentTypeFor(localPath);
    const ext = storageExt(localPath, contentType);
    const storagePath = `products/pricing-guide/${product.sku.toLowerCase()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(storagePath, buffer, {
        contentType,
        upsert: true,
      });
    if (uploadError) {
      throw new Error(`${product.sku} upload: ${uploadError.message}`);
    }

    const { data: publicUrl } = supabase.storage
      .from("product-images")
      .getPublicUrl(storagePath);
    const url = `${publicUrl.publicUrl}?v=${Date.now()}`;

    const { error: delErr } = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", product.id);
    if (delErr) throw new Error(`${product.sku} image delete: ${delErr.message}`);

    const { error: imgErr } = await supabase.from("product_images").insert({
      id: randomUUID(),
      product_id: product.id,
      url,
      alt_text: product.name,
      sort_order: 0,
      is_primary: true,
    });
    if (imgErr) throw new Error(`${product.sku} image insert: ${imgErr.message}`);

    const metadata =
      product.metadata && typeof product.metadata === "object"
        ? { ...(product.metadata as Record<string, unknown>) }
        : {};
    metadata.image_url = url;

    const { error: metaErr } = await supabase
      .from("products")
      .update({ metadata })
      .eq("id", product.id);
    if (metaErr) throw new Error(`${product.sku} metadata: ${metaErr.message}`);

    console.log(`  ✓ ${product.sku} ← ${basename(localPath)}`);
    ok += 1;
  }

  console.log(`\nDone. Updated ${ok}, skipped ${skipped}.`);
}

main().catch((err) => {
  console.error("\nFailed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
