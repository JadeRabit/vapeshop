## Why

The shop needs a production-ready, mobile-first storefront that establishes a premium vapor brand while enforcing 21+ age compliance, and an operations console that lets staff manage catalog, inventory, payments, and fulfillment without touching the database. Building both on one typed, serverless Next.js application keeps launch and operating costs low while providing a path to real payment and media infrastructure on Vercel.

## What Changes

- Scaffold a Next.js App Router application (React 19, TypeScript) with Tailwind CSS, shadcn/ui + Radix primitives, Lucide icons, and a dark neon/vapor visual system.
- Add Prisma models and migrations for Auth.js users/accounts, catalog categories, products, variants, images, reviews, customer addresses, orders, order items, and private payment proofs on PostgreSQL (Neon).
- Add Auth.js v5 credentials authentication with `ADMIN` and `CUSTOMER` roles, edge-safe session checks, and defense-in-depth authorization in middleware, layouts, route handlers, and server actions.
- Build a 21+ age-verification modal persisted in local storage and a cookie, with an accessible decline path.
- Build the storefront landing page, six category quick-links, featured products, promotions, catalog with instant client-side search and multi-facet filtering, and product detail pages with galleries, variants, per-variant stock, and reviews.
- Build a persistent Zustand cart and a validated multi-step checkout supporting Cash on Delivery, GCash reference/receipt submission, and Stripe-hosted card payment. Stock is reserved transactionally and prices/availability are always revalidated server-side.
- Build the customer portal for registration/login, order history and shipping status, and address management.
- Build the protected admin dashboard for revenue/order/inventory analytics, a Recharts sales chart, recent orders, product CRUD with image uploads and stock thresholds, and order detail/status management.
- Add seed data, environment validation, deployment documentation, and Vercel configuration for the Stripe webhook, Cloudinary uploads, and unpaid-order cleanup cron.

## Capabilities

### New Capabilities

- `age-verification`: Enforces a 21+ entry gate and persists a visitor's affirmative verification across visits with a clear decline path.
- `storefront-catalog`: Covers landing-page merchandising, category navigation, catalog search/filtering, product detail galleries, variant selection, live stock, and customer reviews.
- `cart-and-checkout`: Covers cart persistence, multi-step checkout, server-validated pricing and stock, COD/GCash/card payment flows, and order-confirmation behavior.
- `customer-account`: Covers customer registration and login, order history and shipping tracking, and reusable address management.
- `admin-access-control`: Covers authenticated administrator authorization at the edge, on server-rendered admin routes, and inside mutating server actions.
- `admin-analytics`: Covers revenue, sales, order, product, and low-stock summaries, a time-series sales chart, and a recent-orders view.
- `admin-product-management`: Covers searchable/paginated product administration, product and variant CRUD, image uploads, publishing state, and stock thresholds.
- `admin-order-management`: Covers order inspection, customer contact and fulfillment details, payment-proof review, and safe status transitions with cache revalidation.

### Modified Capabilities

<!-- This is a greenfield application; no existing capabilities are changing. -->

## Impact

- **Application:** New `app/(storefront)`, `app/(auth)`, `app/admin`, `app/api`, and `components` trees; Prisma schema, migration, and seed.
- **Dependencies:** `next`, `react`, `typescript`, `tailwindcss`, Radix/shadcn primitives, `lucide-react`, `prisma`/`@prisma/client`, Neon driver adapter, `next-auth`/`@auth/prisma-adapter`, `zod`, `zustand`, `recharts`, `stripe`, `cloudinary`, password hashing, and date/formatting utilities.
- **External services:** PostgreSQL (Neon recommended), Auth.js, Cloudinary, and Stripe. COD and GCash are manual flows; Stripe is required for real card payments and can be feature-gated when keys are absent.
- **Configuration:** `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`/`AUTH_SECRET`, `AUTH_TRUST_HOST`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`, and optional admin seed credentials.
- **Operational:** Stripe webhook and scheduled cleanup require Vercel project configuration; image domains and environment values must be set per environment. No existing data or APIs are broken.
