/**
 * Seed Supabase with Titan Safety Co. catalog data.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import {
  SEED_BRANDS,
  SEED_CATEGORIES,
  SEED_PRODUCTS,
} from '../src/lib/data/seed-data'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing required environment variables.\n' +
      'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local',
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function upsertBrands() {
  console.log(`Upserting ${SEED_BRANDS.length} brands...`)
  const rows = SEED_BRANDS.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    description: b.description,
    logo_url: b.logo_url,
    active: b.active,
  }))
  const { error } = await supabase.from('brands').upsert(rows, { onConflict: 'id' })
  if (error) throw new Error(`brands upsert failed: ${error.message}`)
  console.log('  ✓ brands')
}

async function upsertCategories() {
  console.log(`Upserting ${SEED_CATEGORIES.length} categories...`)
  const rows = SEED_CATEGORIES.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    image_url: c.image_url,
    sort_order: c.sort_order,
    active: c.active,
  }))
  const { error } = await supabase
    .from('categories')
    .upsert(rows, { onConflict: 'id' })
  if (error) throw new Error(`categories upsert failed: ${error.message}`)
  console.log('  ✓ categories')
}

async function upsertProducts() {
  console.log(`Upserting ${SEED_PRODUCTS.length} products...`)
  const rows = SEED_PRODUCTS.map((p) => ({
    id: p.id,
    category_id: p.category_id,
    brand_id: p.brand_id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    short_description: p.short_description,
    description: p.description,
    price: p.price,
    compare_at_price: p.compare_at_price,
    cost: p.cost,
    inventory_quantity: p.inventory_quantity,
    low_stock_threshold: p.low_stock_threshold,
    featured: p.featured,
    bestseller: p.bestseller,
    active: p.active,
    weight: p.weight,
    shipping_class: p.shipping_class,
    rating_avg: p.rating_avg,
    rating_count: p.rating_count,
    ansi_class: p.ansi_class,
    color: p.color,
    size: p.size,
    product_type: p.product_type,
    metadata: {
      features: p.features,
      certifications: p.certifications,
      image_url: p.image_url,
    },
  }))
  const { error } = await supabase
    .from('products')
    .upsert(rows, { onConflict: 'id' })
  if (error) throw new Error(`products upsert failed: ${error.message}`)
  console.log('  ✓ products')
}

async function upsertProductImages() {
  console.log(`Upserting product images...`)
  const rows = SEED_PRODUCTS.map((p, index) => ({
    id: `d0000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    product_id: p.id,
    url: p.image_url,
    alt_text: p.name,
    sort_order: 0,
    is_primary: true,
  }))

  // Replace existing primary images for these products
  const productIds = SEED_PRODUCTS.map((p) => p.id)
  const { error: deleteError } = await supabase
    .from('product_images')
    .delete()
    .in('product_id', productIds)
  if (deleteError) {
    throw new Error(`product_images delete failed: ${deleteError.message}`)
  }

  const { error } = await supabase.from('product_images').insert(rows)
  if (error) throw new Error(`product_images insert failed: ${error.message}`)
  console.log(`  ✓ ${rows.length} product_images`)
}

async function upsertProductSpecifications() {
  console.log(`Upserting product specifications...`)
  const productIds = SEED_PRODUCTS.map((p) => p.id)
  const { error: deleteError } = await supabase
    .from('product_specifications')
    .delete()
    .in('product_id', productIds)
  if (deleteError) {
    throw new Error(
      `product_specifications delete failed: ${deleteError.message}`,
    )
  }

  const rows = SEED_PRODUCTS.flatMap((p) =>
    p.specifications.map((spec, sortOrder) => ({
      product_id: p.id,
      name: spec.name,
      value: spec.value,
      sort_order: sortOrder,
    })),
  )

  if (rows.length === 0) {
    console.log('  ✓ no specifications')
    return
  }

  const { error } = await supabase.from('product_specifications').insert(rows)
  if (error) {
    throw new Error(`product_specifications insert failed: ${error.message}`)
  }
  console.log(`  ✓ ${rows.length} product_specifications`)
}

async function seedSiteSettings() {
  console.log('Upserting site settings...')
  const rows = [
    {
      key: 'free_shipping_threshold',
      value: { amount: 199, currency: 'usd' },
    },
    {
      key: 'site_config',
      value: {
        name: 'Titan Safety Co.',
        tagline: 'Protecting People. Powering Progress.',
      },
    },
  ]
  const { error } = await supabase
    .from('site_settings')
    .upsert(rows, { onConflict: 'key' })
  if (error) {
    // Non-fatal if table shape differs slightly during early setup
    console.warn(`  ⚠ site_settings skipped: ${error.message}`)
    return
  }
  console.log('  ✓ site_settings')
}

async function main() {
  console.log('Titan Safety Co. — seeding Supabase\n')
  console.log(`URL: ${supabaseUrl}\n`)

  await upsertBrands()
  await upsertCategories()
  await upsertProducts()
  await upsertProductImages()
  await upsertProductSpecifications()
  await seedSiteSettings()

  console.log('\nSeed complete.')
  console.log(
    `  ${SEED_BRANDS.length} brands · ${SEED_CATEGORIES.length} categories · ${SEED_PRODUCTS.length} products`,
  )
}

main().catch((err) => {
  console.error('\nSeed failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
