/**
 * Import brand logos from Safety Vests and More shop-by-brand page,
 * convert to transparent PNGs, upload to Supabase, and upsert brands.
 *
 * Source: https://www.safetyvestsandmore.com/collections/shop-by-brand
 *
 * Usage:
 *   npx tsx scripts/import-svam-brands.ts
 */

import { config } from "dotenv";
import { resolve } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { prepareBrandLogo } from "../src/lib/images/brand-logo";
import { slugify } from "../src/lib/utils";
import { BRAND_IDS, SEED_BRANDS } from "../src/lib/data/seed-data";

config({ path: resolve(process.cwd(), ".env.local") });

const SOURCE_PAGE =
  "https://www.safetyvestsandmore.com/collections/shop-by-brand";
const LOCAL_OUT = resolve(process.cwd(), "public/images/brands");

/** Prefer these display names / slugs when SVAM labels are verbose. */
const NAME_OVERRIDES: Record<string, { name: string; slug: string }> = {
  dewalt: { name: "DeWalt", slug: "dewalt" },
  "pyramex-safety-products": { name: "Pyramex", slug: "pyramex" },
  "red-kap-workwear": { name: "Red Kap", slug: "red-kap" },
  "flamesafe-workwear": { name: "Flamesafe", slug: "flamesafe" },
  "snickers-workwear": { name: "Snickers", slug: "snickers" },
  "justrite-manufacturing": { name: "Justrite", slug: "justrite" },
  "traffix-devices": { name: "Traffix", slug: "traffix" },
  "solid-gear-footwear": { name: "Solid Gear", slug: "solid-gear" },
  "shield-hydration": { name: "Shield Hydration", slug: "shield-hydration" },
  "all-sport": { name: "All Sport", slug: "all-sport" },
  "cordova-safety": { name: "Cordova", slug: "cordova" },
  "northmon-safety": { name: "Northmon", slug: "northmon" },
  "jbc-safety-plastic": { name: "JBC Safety", slug: "jbc-safety" },
  "mcr-safety": { name: "MCR Safety", slug: "mcr-safety" },
  "msa-safety": { name: "MSA Safety", slug: "msa-safety" },
  hexarmor: { name: "HexArmor", slug: "hexarmor" },
  "3m": { name: "3M", slug: "3m" },
};

const SEED_BY_SLUG = new Map(
  SEED_BRANDS.map((b) => [b.slug.toLowerCase(), b] as const),
);

type ScrapedBrand = { href: string; name: string; url: string };

function contentTypeFromUrl(url: string): string {
  const path = url.split("?")[0]!.toLowerCase();
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".svg")) return "image/svg+xml";
  return "image/png";
}

/** Prefer master asset when Shopify sized variants are listed. */
function preferOriginalUrl(url: string): string {
  return url.replace(/_(\d+x\d+)(?=\.(?:png|jpe?g|webp))/i, "");
}

function normalizeBrand(rawName: string): { name: string; slug: string } {
  const cleaned = rawName.replace(/[®™]/g, "").trim();
  const baseSlug = slugify(cleaned);
  return NAME_OVERRIDES[baseSlug] ?? { name: cleaned, slug: baseSlug };
}

async function scrapeBrands(): Promise<ScrapedBrand[]> {
  const res = await fetch(SOURCE_PAGE, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; TitanSafetyBot/1.0; +https://titansafetyco.com)",
      Accept: "text/html",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch brand page: ${res.status}`);
  const html = await res.text();

  const items = html.matchAll(/<li class="collection__item"[^>]*>([\s\S]*?)<\/li>/g);
  const brands: ScrapedBrand[] = [];
  const seen = new Set<string>();

  for (const match of items) {
    const block = match[1] ?? "";
    const a = block.match(
      /<a href="(\/collections\/[^"]+)"[^>]*aria-label="([^"]+)"/,
    );
    if (!a) continue;
    const href = a[1]!;
    const name = a[2]!;
    const img = block.match(
      /src="\/\/(www\.safetyvestsandmore\.com\/cdn\/shop\/(?:files|collections)\/[^"]+\.(?:png|jpg|jpeg|webp)[^"]*)"/i,
    );
    if (!img) continue;
    const url = `https://${img[1]}`;
    if (/SVAM-logo|favicon|ansi-class/i.test(url)) continue;
    if (seen.has(href)) continue;
    seen.add(href);
    brands.push({ href, name, url });
  }

  return brands;
}

async function download(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const candidates = [preferOriginalUrl(url), url];
  let lastError: Error | null = null;
  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; TitanSafetyBot/1.0; +https://titansafetyco.com)",
          Accept: "image/*,*/*",
          Referer: SOURCE_PAGE,
        },
      });
      if (!res.ok) {
        lastError = new Error(`${candidate} → ${res.status}`);
        continue;
      }
      const contentType =
        res.headers.get("content-type")?.split(";")[0]?.trim() ||
        contentTypeFromUrl(candidate);
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length < 200) {
        lastError = new Error(`${candidate} too small`);
        continue;
      }
      return { buffer, contentType };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastError ?? new Error(`Could not download ${url}`);
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

  console.log(`Scraping brands from ${SOURCE_PAGE}\n`);
  const scraped = await scrapeBrands();
  console.log(`Found ${scraped.length} brand logos\n`);

  let ok = 0;
  let failed = 0;

  for (const item of scraped) {
    const { name, slug } = normalizeBrand(item.name);
    const seed = SEED_BY_SLUG.get(slug);
    process.stdout.write(`→ ${name} (${slug}) … `);

    try {
      const downloaded = await download(item.url);
      const prepared = await prepareBrandLogo(
        downloaded.buffer,
        downloaded.contentType,
      );

      const localPath = resolve(LOCAL_OUT, `${slug}.png`);
      await writeFile(localPath, prepared.buffer);

      const storagePath = `brands/${slug}.png`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(storagePath, prepared.buffer, {
          contentType: "image/png",
          upsert: true,
        });
      if (uploadError) throw new Error(uploadError.message);

      const { data: publicUrl } = supabase.storage
        .from("product-images")
        .getPublicUrl(storagePath);
      const logoUrl = `${publicUrl.publicUrl}?v=${Date.now()}`;

      const { data: existing, error: lookupError } = await supabase
        .from("brands")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (lookupError) throw new Error(lookupError.message);

      const brandId =
        existing?.id ??
        seed?.id ??
        crypto.randomUUID();

      const row = {
        id: brandId,
        name: seed?.name ?? name,
        slug,
        description:
          seed?.description ??
          `${name} safety and workwear products for professional jobsites.`,
        logo_url: logoUrl,
        website: seed?.website ?? null,
        active: true,
      };

      const { error: writeError } = existing
        ? await supabase.from("brands").update(row).eq("id", brandId)
        : await supabase.from("brands").insert(row);
      if (writeError) throw new Error(writeError.message);

      console.log(existing ? "updated" : "created");
      ok += 1;
    } catch (err) {
      failed += 1;
      console.log(
        `FAILED (${err instanceof Error ? err.message : String(err)})`,
      );
    }
  }

  // Keep Titan Safety present even though it's not on SVAM.
  const titan = SEED_BRANDS.find((b) => b.id === BRAND_IDS.titanSafety);
  if (titan) {
    const { data: existing } = await supabase
      .from("brands")
      .select("id")
      .eq("slug", titan.slug)
      .maybeSingle();
    if (!existing) {
      await supabase.from("brands").insert({
        id: titan.id,
        name: titan.name,
        slug: titan.slug,
        description: titan.description,
        logo_url: titan.logo_url,
        website: titan.website ?? null,
        active: true,
      });
      console.log("→ Titan Safety (house brand) … created");
    }
  }

  console.log(`\nDone. ${ok} logos imported, ${failed} failed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
