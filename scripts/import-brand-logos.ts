/**
 * Process brand logos from ../graphics/brand logos into transparent PNGs,
 * write them to public/images/brands/{slug}.png, upload to Supabase storage,
 * and upsert each brand with the public logo URL.
 *
 * Usage:
 *   npx tsx scripts/import-brand-logos.ts
 */

import { config } from "dotenv";
import { resolve } from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { prepareBrandLogo } from "../src/lib/images/brand-logo";
import { BRAND_IDS, SEED_BRANDS } from "../src/lib/data/seed-data";

config({ path: resolve(process.cwd(), ".env.local") });

const SOURCE_DIR = resolve(process.cwd(), "../graphics/brand logos");
const LOCAL_OUT = resolve(process.cwd(), "public/images/brands");

type LogoImport = {
  sourceFile: string;
  slug: string;
  brandId: string;
};

/** One logo file → one brand. Prefer the cleaner DeWalt asset. */
const IMPORTS: LogoImport[] = [
  {
    sourceFile: "titanlogo.webp",
    slug: "titan-safety",
    brandId: BRAND_IDS.titanSafety,
  },
  {
    sourceFile: "3M-Logo.png",
    slug: "3m",
    brandId: BRAND_IDS.threeM,
  },
  {
    sourceFile: "dewalt-logo-png_seeklogo-314365.png",
    slug: "dewalt",
    brandId: BRAND_IDS.dewalt,
  },
  {
    sourceFile: "Carhartt-Logo.png",
    slug: "carhartt",
    brandId: BRAND_IDS.carhartt,
  },
  {
    sourceFile: "Honeywell-Logo.png",
    slug: "honeywell",
    brandId: BRAND_IDS.honeywell,
  },
  {
    sourceFile: "milwaukee-logo-png_seeklogo-520491.png",
    slug: "milwaukee",
    brandId: BRAND_IDS.milwaukee,
  },
  {
    sourceFile: "CAT.png",
    slug: "cat",
    brandId: BRAND_IDS.cat,
  },
  {
    sourceFile: "pyramex.webp",
    slug: "pyramex",
    brandId: BRAND_IDS.pyramex,
  },
];

function contentTypeFor(file: string): string {
  const lower = file.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await mkdir(LOCAL_OUT, { recursive: true });

  console.log(`Processing ${IMPORTS.length} brand logos from:\n  ${SOURCE_DIR}\n`);

  for (const item of IMPORTS) {
    const seed = SEED_BRANDS.find((b) => b.id === item.brandId);
    if (!seed) {
      throw new Error(`No seed brand for ${item.slug}`);
    }

    const sourcePath = resolve(SOURCE_DIR, item.sourceFile);
    const input = await readFile(sourcePath);
    const prepared = await prepareBrandLogo(
      input,
      contentTypeFor(item.sourceFile),
    );

    const localName = `${item.slug}.png`;
    const localPath = resolve(LOCAL_OUT, localName);
    await writeFile(localPath, prepared.buffer);
    console.log(`  ✓ wrote public/images/brands/${localName}`);

    const storagePath = `brands/${item.slug}.png`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(storagePath, prepared.buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(
        `Storage upload failed for ${item.slug}: ${uploadError.message}`,
      );
    }

    const { data: publicUrl } = supabase.storage
      .from("product-images")
      .getPublicUrl(storagePath);

    const logoUrl = `${publicUrl.publicUrl}?v=${Date.now()}`;

    const { data: existing, error: lookupError } = await supabase
      .from("brands")
      .select("id")
      .eq("slug", seed.slug)
      .maybeSingle();

    if (lookupError) {
      throw new Error(
        `Brand lookup failed for ${item.slug}: ${lookupError.message}`,
      );
    }

    const brandId = existing?.id ?? seed.id;
    const row = {
      id: brandId,
      name: seed.name,
      slug: seed.slug,
      description: seed.description,
      logo_url: logoUrl,
      website: seed.website ?? null,
      active: true,
    };

    const { error: upsertError } = existing
      ? await supabase.from("brands").update(row).eq("id", brandId)
      : await supabase.from("brands").insert(row);

    if (upsertError) {
      throw new Error(`Brand upsert failed for ${item.slug}: ${upsertError.message}`);
    }

    console.log(
      `  ✓ ${existing ? "updated" : "created"} brand ${seed.name} → ${storagePath}`,
    );
  }

  console.log("\nDone. Brands are live with transparent PNG logos.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
