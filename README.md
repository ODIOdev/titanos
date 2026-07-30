# Titan Safety Co.

Production-ready ecommerce storefront for **Titan Safety Co.** — professional safety equipment, workwear, footwear, signage, and traffic-control products.

**Tagline:** Protecting People. Powering Progress.

## Stack

- Next.js App Router (TypeScript)
- Tailwind CSS
- Supabase (Auth SSR, PostgreSQL, Storage)
- Stripe Checkout + webhooks
- React Hook Form + Zod
- Lucide React + Sonner
- Vercel deployment

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project.
2. Open **Project Settings → API** and copy the project URL, anon key, and service role key.

### 3. Environment variables

```bash
cp .env.example .env.local
```

Fill in:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Never commit `.env.local` or real secrets.

### 4. Run the database migration

In the Supabase SQL Editor, run the full contents of:

```text
supabase/migrations/001_initial_schema.sql
```

This creates tables, RLS policies, triggers, full-text search, helper role functions, storage buckets, and storage policies.

### 5. Seed catalog data

```bash
npm run seed
```

Seeds brands, categories, products, images, and specifications.

### 6. Storage buckets

The migration inserts these buckets:

| Bucket | Public |
| --- | --- |
| `product-images` | Yes |
| `category-images` | Yes |
| `brand-logos` | Yes |
| `quote-attachments` | No |
| `resource-files` | No |

Confirm them under **Storage** in the Supabase dashboard.

### 7. Auth redirect URLs

In Supabase **Authentication → URL Configuration**:

- Site URL: `http://localhost:3000` (production URL later)
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://YOUR_DOMAIN/auth/callback`

Enable Email provider. Optionally enable Google OAuth and set the callback to the same `/auth/callback` route.

### 8. Stripe

1. Create a Stripe account and get test API keys.
2. Add keys to `.env.local`.
3. For local webhooks:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

Handled events:

- `checkout.session.completed`
- `checkout.session.expired`
- `payment_intent.payment_failed`
- `charge.refunded`

### 9. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Supabase/Stripe configured, the storefront still renders using local seed catalog data so you can review UI and flows. Checkout falls back to a demo success redirect until Stripe keys are set.

### 10. Create an admin user

1. Register at `/register`.
2. In Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

Roles are never trusted from the client. Admin checks run in middleware and again on the server.

### 11. Push to GitHub

```bash
git init # if needed
git add .
git commit -m "Initial Titan Safety Co. storefront"
git remote add origin git@github.com:YOUR_ORG/titan-safety-co.git
git push -u origin main
```

### 12. Deploy to Vercel

1. Import the GitHub repo in Vercel.
2. Framework preset: Next.js.
3. Add all environment variables from `.env.example` (production values).
4. Deploy.

### 13. Production URLs

Update:

- `NEXT_PUBLIC_SITE_URL` to your production domain
- Supabase redirect URLs
- Stripe webhook endpoint: `https://YOUR_DOMAIN/api/webhooks/stripe`

### 14. Post-deploy checks

- [ ] Browse `/`, `/shop`, `/product/[slug]`
- [ ] Register / login / logout
- [ ] Add to cart and complete Stripe Checkout (test mode)
- [ ] Confirm webhook marks order paid and reduces inventory
- [ ] Submit a quote with attachment
- [ ] Access `/admin` as admin only
- [ ] Confirm non-admin users are redirected from `/admin`

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run format` | Prettier |
| `npm run seed` | Seed Supabase catalog |

## Project structure

```text
src/
  app/
    (shop)/          # Public storefront pages
    (auth)/          # Login / register / forgot password
    account/         # Customer account (protected)
    admin/           # Admin dashboard (admin role)
    api/             # Checkout, webhooks, search, quotes, newsletter
    auth/callback/   # OAuth / magic-link callback
  components/        # UI, layout, home, products, cart, admin, quotes
  lib/
    supabase/        # Browser, server, proxy session refresh, service-role clients
    stripe/          # Stripe server utilities
    data/            # Product queries + seed fallbacks
    actions/         # Server actions
    validations/     # Zod schemas
  types/             # Shared + Database types
  proxy.ts           # Next.js 16 session proxy + route protection
supabase/migrations/ # SQL schema + RLS + storage
scripts/seed.ts      # Catalog seeder
public/images/       # Logos, placeholders, category/product art
```

## Security notes

- Service role key is only used in server-only modules (`lib/supabase/admin.ts`, webhooks, privileged actions).
- Checkout validates product IDs and prices on the server — client prices are ignored.
- Webhooks verify Stripe signatures and use idempotent order updates.
- RLS restricts customer data to owning users; admins use `is_admin()` helpers.

## Brand

- Titan Yellow `#F5C400`
- Dark Charcoal `#101820`
- Near Black `#090D11`
- Headings: Oswald (uppercase condensed)
- Body: Inter

## License

Proprietary — Titan Safety Co.
