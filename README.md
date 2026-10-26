# Vapor District

A production-oriented, 21+ vape storefront and admin console for the Philippines. Built with Next.js 15 App Router, React 19, Prisma/PostgreSQL, Auth.js, and a dark neon/vapour visual system.

The application covers the complete commerce loop: a persisted 21+ gate, catalog discovery, variant-level inventory, persistent cart, server-authoritative checkout, COD/GCash/Stripe card payments, customer accounts, and an admin console for analytics, catalog, stock, and order fulfilment.

> Nicotine is an addictive chemical. This store is intended for adults 21 and older. The age gate is a compliance acknowledgement, not identity verification; valid ID may be requested on delivery.

## Feature highlights

### Storefront

- Accessible, non-dismissible 21+ gate persisted for 30 days in a versioned cookie and localStorage.
- Landing page with featured products, six merchandising categories, compliance messaging, and mobile-first navigation.
- Instant catalog search across product name, brand, category, variant labels, and flavour profiles.
- AND-combined filters for category, nicotine strength, flavour profile, price range, and stock.
- Product detail pages with image gallery, variant selection, per-variant price/stock/SKU, verified-purchase reviews, and review eligibility states.
- Persistent Zustand cart with stock caps, quantity controls, shipping estimates, and blocked-checkout protection.
- Authenticated three-step checkout with saved or new Philippine addresses.
- Server-authoritative quote and order placement: prices, variants, stock, addresses, GCash proofs, and totals are rechecked on the server.
- Atomic stock reservation, idempotent order creation, and clear error states when the cart becomes stale.
- COD, manual GCash verification, and feature-gated Stripe-hosted card payment.
- Stripe webhook handling for paid, expired, and failed Checkout Sessions.
- Scheduled cleanup of unpaid card orders with transactional stock restoration.
- Customer portal with order history, ownership-checked order detail, timeline, and address management.

### Admin console

- Database-backed RBAC guard on every layout, page, and mutating server action.
- Revenue, order, product, and low-stock metrics using `Asia/Manila` date boundaries.
- 30-day sales/order chart with an accessible textual summary.
- Recent orders and a searchable, status-filterable order queue.
- Full order detail with payment metadata, GCash receipt preview, shipping snapshot, and event timeline.
- Safe, method-aware status transitions; card `PAID` is webhook-only.
- Transactional cancellation with one-time stock restoration.
- Product CRUD with dynamic variants, publish validation, image metadata, archive/delete safeguards, and inline stock adjustment.

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 15.5 App Router, React 19, strict TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui on Radix primitives, Lucide icons |
| Data | PostgreSQL, Prisma 6, Neon serverless adapter with `ws` |
| Auth | Auth.js v5 credentials, bcryptjs, JWT sessions, database-backed role checks |
| State | Zustand persisted cart, React Server Actions |
| Payments | Stripe hosted Checkout and signature-verified webhook |
| Media | Cloudinary signed uploads; authenticated delivery for GCash proofs |
| Charts | Recharts |
| Validation | Zod |
| Tests | Vitest unit tests, Playwright E2E specs |
| Deployment | Vercel-ready with cron configuration |

## Project structure

```text
app/
  (auth)/                 login and registration
  (storefront)/           landing, catalog, product detail, cart, checkout, account
  admin/                  guarded dashboard, products, orders
  api/                    Auth.js, Stripe webhook, cron, uploads, proof delivery, health
components/
  admin/                  admin shell, product form, stock/order controls
  auth/                   login and registration forms
  checkout/               checkout wizard and payment components
  shared/                 price, stock, pagination, status badges
  storefront/             age gate, header/footer, catalog, cart, product detail
  ui/                     shadcn/Radix primitives
lib/
  actions/                server actions for auth, checkout, reviews, addresses, admin
  data/                   server-only queries returning client-safe DTOs
  validators/             Zod schemas
  auth-guards.ts          session and database-backed RBAC guards
  db.ts                   Prisma singleton with Neon/local PostgreSQL support
  env.ts                  server-side environment validation
  money.ts                integer-centavo PHP helpers
  order-state.ts          transition matrix and restock planning
prisma/
  schema.prisma           data model, indexes, constraints
  migrations/             SQL migrations
  seed.ts                 idempotent categories/admin and optional demo data
tests/
  unit/                   Vitest unit tests
  e2e/                    Playwright smoke/E2E specs
docs/
  deployment.md           production deployment and integrations
  operations.md           smoke tests, rollback, backups, launch inputs
```

## Local setup

### Prerequisites

- Node.js 20+ and npm.
- PostgreSQL 15+ (local) or a Neon database branch.
- Optional: Cloudinary and Stripe credentials for uploads/card payments.

### 1. Install dependencies

```bash
npm install
npx playwright install chromium   # only needed for E2E
```

### 2. Configure the environment

```bash
cp .env.example .env
```

On PowerShell:

```powershell
Copy-Item .env.example .env
```

Fill in at minimum:

- `DATABASE_URL` and `DIRECT_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`

`DATABASE_URL` is the pooled runtime connection. `DIRECT_URL` is the non-pooled connection used by Prisma migrations and the seed script. For local PostgreSQL both may point at the same database with `sslmode=disable`.

Generate an auth secret with:

```bash
openssl rand -base64 32
```

or in PowerShell:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### 3. Prepare the database

For local development:

```bash
npm run db:migrate
```

For an existing environment or CI:

```bash
npm run db:migrate:deploy
```

The build never runs migrations. Apply migrations before deploying a new application revision.

### 4. Seed categories and the admin account

```bash
npm run db:seed
```

`SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are required whenever the seed runs. The seed is idempotent, but **rerunning it resets the admin password** to `SEED_ADMIN_PASSWORD`.

To include demo products, customers, reviews, and orders:

```dotenv
SEED_DEMO_DATA="true"
```

Then run the seed again. Demo customer credentials:

```text
demo.customer@vapordistrict.ph / DemoCustomer123
```

Do not enable demo data on a real store.

### 5. Start the app

```bash
npm run dev
```

Open <http://localhost:3000>. Sign in with the seeded admin account and use the account menu or visit `/admin`.

## Environment variables

| Variable | Requirement | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Required | Pooled PostgreSQL runtime URL |
| `DIRECT_URL` | Required for migrations/seed | Non-pooled PostgreSQL URL |
| `AUTH_SECRET` | Required | Auth.js signing secret; `NEXTAUTH_SECRET` is a fallback |
| `NEXTAUTH_SECRET` | Optional fallback | Legacy Auth.js secret name |
| `AUTH_URL` | Recommended in production | Canonical Auth.js URL |
| `AUTH_TRUST_HOST` | Optional | Trust the deployment host header |
| `NEXT_PUBLIC_APP_URL` | Required | Canonical public URL for redirects, metadata, and SEO |
| `CLOUDINARY_CLOUD_NAME` | Optional | Cloudinary cloud for uploads |
| `CLOUDINARY_API_KEY` | Optional | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Optional | Cloudinary signing secret |
| `STRIPE_SECRET_KEY` | Optional | Enables Stripe Checkout when paired with the webhook secret |
| `STRIPE_WEBHOOK_SECRET` | Optional | Verifies Stripe webhook signatures |
| `CRON_SECRET` | Required in production | Bearer secret for the order-expiry cron endpoint |
| `SEED_ADMIN_EMAIL` | Required for seeding | Admin login email |
| `SEED_ADMIN_PASSWORD` | Required for seeding | Admin password, minimum 10 characters |
| `SEED_ADMIN_NAME` | Optional | Admin display name |
| `SEED_DEMO_DATA` | Optional | Set `true` only for local/demo databases |

Optional integrations fail closed:

- Without Cloudinary credentials, uploads are disabled and checkout explains that proof upload is unavailable.
- Without both Stripe values, the card option is hidden and the webhook returns `503`.
- Without `CRON_SECRET`, the cron endpoint returns `503`.

See [`.env.example`](.env.example) for annotated examples and Playwright-only variables.

## Commands

```bash
npm run dev              # start the development server
npm run build            # prisma generate && next build
npm run start            # serve the production build
npm run lint             # ESLint
npm run typecheck        # strict TypeScript check
npm test                 # Vitest unit tests
npm run test:e2e         # Playwright E2E (requires a seeded database)

npm run db:generate      # Prisma client
npm run db:validate      # validate the schema
npm run db:migrate       # prisma migrate dev (local)
npm run db:migrate:deploy # apply committed migrations
npm run db:seed          # categories/admin, optional demo data
npm run db:studio        # Prisma Studio
```

## Testing

### Unit tests

```bash
npm test
```

Covered areas include PHP centavo conversion and formatting, shipping thresholds, age verification, utility helpers, checkout/address/product/review validation, cart quantity rules, and the order transition/restock matrix.

### End-to-end tests

E2E specs live in `tests/e2e`. They require:

1. A reachable PostgreSQL database with migrations applied.
2. A seeded admin account (credentials from `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` or `E2E_ADMIN_*`).
3. Demo data (`SEED_DEMO_DATA=true`) for catalog/cart/customer specs, or explicit `E2E_CUSTOMER_*` credentials and equivalent fixtures.
4. Chromium installed: `npx playwright install chromium`.

```bash
npm run test:e2e
```

Playwright starts `npm run dev` automatically unless `PLAYWRIGHT_BASE_URL` points at a running server. The admin order-status spec creates and deletes a temporary order; run E2E only against disposable/test databases, never production.

Specs cover age-gate persistence and decline, catalog search/filtering/empty state, variant cart persistence, login-protected checkout, admin guards, product publish validation, and order status transitions.

## Payments and private media

### COD

Orders are created in `PENDING`, stock is reserved atomically, and payment is collected on delivery. Admin delivery confirmation records cash collection.

### GCash

The customer submits a unique reference and uploads a receipt. Receipts are uploaded as Cloudinary `authenticated` assets and are never exposed by public URL. Admins view them through `/api/admin/payment-proof/[orderId]`, which checks the admin role and redirects to a five-minute signed URL with `no-store`.

### Card / Stripe

Card payment is available only when both Stripe variables are configured. A pending order creates a Stripe Checkout Session; the order becomes `PAID` only when a signed webhook confirms payment. Retrying checkout reuses an open session instead of creating a duplicate. Manual admin `PAID` transitions for card orders are blocked. Expired and failed sessions cancel the order and restore stock exactly once.

## Security and compliance notes

- Auth.js JWT sessions are checked in middleware for `/admin`, `/account`, and `/checkout`.
- Server layouts, pages, actions, and route handlers re-check authorization against the database; middleware is defence in depth, not the only boundary.
- Admin password hashes use bcrypt cost 12 and are never sent to the client.
- Prisma records are mapped to explicit DTOs before reaching client components.
- Security headers include CSP, `X-Frame-Options: DENY`, `nosniff`, referrer policy, and a restrictive permissions policy.
- The age gate does not provide government-ID verification. Operational age checks and refusal-at-delivery policies remain the retailer’s responsibility.
- Login and registration have a best-effort serverless rate limit. For production, add a platform WAF/rate-limit rule in front of `/login`, `/register`, and `/api/auth/*`; in-memory limits are not durable across serverless instances.
- Review the legal, tax, shipping, and payment obligations for nicotine products in the Philippines before launch. See [docs/operations.md](docs/operations.md).

## Deployment

The application is designed for Vercel with Neon PostgreSQL. The short version:

1. Create a Neon database and set pooled/direct URLs.
2. Set all production environment variables in Vercel.
3. Run `npm run db:migrate:deploy` and `npm run db:seed` against the production database from a trusted machine or CI job.
4. Deploy.
5. Configure the Stripe webhook for `https://your-domain/api/stripe/webhook`.
6. Confirm the Vercel cron schedule and `CRON_SECRET`.

Full instructions, integration setup, smoke testing, rollback, backup expectations, and launch inputs are in:

- [docs/deployment.md](docs/deployment.md)
- [docs/operations.md](docs/operations.md)

## Known limitations

- No guest checkout; an account is required.
- No password reset, social login, email verification, or MFA in this release.
- No live courier integration, automated GCash reconciliation, refunds, or partial refunds.
- Catalog filtering runs client-side over a server-fetched catalogue; the intended ceiling is roughly 500 products.
- No transactional email or SMS notifications.
- The demo product images are local SVGs; real deployments should upload product imagery to Cloudinary.
- E2E and database-dependent verification require a running PostgreSQL instance.

## OpenSpec

The product requirements, design decisions, capability specs, and task checklist are under [`openspec/changes/add-vapeshop-storefront-and-admin/`](openspec/changes/add-vapeshop-storefront-and-admin/).
