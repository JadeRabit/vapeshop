## Context

This is a greenfield application: the repository currently contains only OpenSpec configuration and workflow tooling. The product is a single-tenant, 21+ vape retailer serving the Philippines, with a direct-to-consumer storefront and a staff-only operations console.

The implementation must optimise for:

- A premium, mobile-first brand experience on constrained connections.
- Trust and compliance around age-restricted sales.
- Accurate inventory and server-authoritative pricing.
- PH payment expectations: Cash on Delivery (COD), manual GCash verification, and hosted card payment.
- Low operational overhead on Vercel with a managed PostgreSQL database (Neon).
- A small admin team that needs fast, safe catalog and order workflows.

The main stakeholders are customers, store administrators, and the business/legal owner responsible for age-restricted marketing. Card payments are delegated to a PCI-compliant hosted provider; GCash remains a manual reconciliation flow in this release.

## Goals / Non-Goals

**Goals:**

- Deliver a complete, responsive shopping journey from age gate through catalog discovery, cart, authenticated checkout, and order tracking.
- Support six merchandising categories: Nic Salts, Freebase, Pod Systems, Disposables, Mods & Tanks, and Coils/Accessories.
- Model inventory at the variant level so flavor, nicotine strength, colour, SKU, price, and stock remain consistent.
- Provide a premium dark neon/vapor UI that is usable with a keyboard, screen reader, and reduced-motion preferences.
- Enforce admin authorization in the edge middleware, server-rendered admin layout, and every mutating server action.
- Keep catalog mutations and order placement fully typed and validated with Zod, Prisma transactions, and revalidation.
- Handle money, stock, idempotency, and payment state transitions deterministically and safely under concurrent requests.
- Ship with environment validation, seed data, deployment instructions, and Vercel-compatible configuration.

**Non-Goals:**

- Guest checkout, multi-vendor/marketplace behavior, multi-warehouse inventory, or per-region tax calculation.
- Live courier integration or public tracking numbers from third-party logistics providers; statuses are managed internally.
- Automated GCash API reconciliation, refunds, or partial refunds; admins record outcomes manually.
- Card data storage or custom card forms; all card entry happens on Stripe-hosted Checkout.
- Coupon/promotion engines, loyalty points, gift cards, subscriptions, product recommendations, or an email/SMS notification service.
- Self-service password reset, social login, email verification, or multi-factor authentication in this release.
- A general-purpose CMS, user-generated product media, review moderation queues, or a light theme.
- Real-time websocket updates; "live" statuses mean revalidated server data and, for card checkout, short-interval status refresh on the confirmation page.
- Verified government-ID age validation. The 21+ gate is a compliance notice and deterrent, not identity proof.

## Decisions

### 1. Application architecture and rendering

- **Next.js 15.x App Router + React 19 + strict TypeScript** with Tailwind CSS, shadcn/ui on Radix primitives, and Lucide icons. The implementation pins compatible versions at scaffold time rather than floating ranges.
- **Server Components are the default.** Client Components are reserved for the age gate, interactive filters, gallery/variant selection, cart state, checkout wizard, admin dialogs, Recharts, and other browser-only interactions.
- **Node.js runtime for every database-backed route and action.** No Prisma queries run in Edge middleware. Edge code is limited to the Auth.js configuration imported by `middleware.ts`, which only inspects the signed JWT.
- **Mutations use Server Actions.** Route Handlers are used only for external boundaries: Auth.js callbacks, Stripe webhooks, Cloudinary signing, cron cleanup, private payment-proof delivery, and health checks. This gives built-in same-origin protections for admin/user mutations.
- **Reads are Server Component/query functions, not Server Actions.** Product and order fetching stays in server-only `lib/data` modules invoked during rendering; Server Actions are reserved for mutations and the explicit checkout quote refresh. This follows Next.js data-fetching best practice while keeping all database access server-side and typed. The required revalidation behavior is performed in the create/update/order actions.
- **No build-time database dependency.** DB-backed pages render dynamically or use runtime caches so a Vercel build cannot fail because production data is unavailable. Admin and account views always render dynamically.
- **Freshness strategy.** Product detail pages read stock directly per request. Broader catalog queries may be wrapped with `unstable_cache` and tags (`catalog`, `products`) but are invalidated by every relevant mutation. Every admin catalog action calls `revalidatePath` for the affected admin and storefront routes plus `revalidateTag("catalog")`; checkout place/cancel calls the applicable order and catalog revalidations. Checkout always performs a final authoritative database read.
- **Serializable DTO boundary.** Prisma records, especially money values and dates, are never passed directly to Client Components. Query modules map them to explicit DTOs (prices as integer centavos, dates as ISO strings, no password hashes or private upload keys).
- **Client-side catalog filtering** is implemented over an initial server-fetched result set because instant search is a requirement. This is appropriate for the initial catalog (target ceiling of roughly 500 products). If the catalog outgrows that, the browser component can be swapped to server-side search without changing the data contracts.

### 2. Folder and module structure

```text
vapeshop/
├─ app/
│  ├─ layout.tsx                     # fonts, metadata, global providers
│  ├─ globals.css
│  ├─ error.tsx
│  ├─ not-found.tsx
│  ├─ (storefront)/
│  │  ├─ layout.tsx                  # header, footer, age gate, cart sheet
│  │  ├─ page.tsx                    # landing / featured / categories
│  │  ├─ products/
│  │  │  ├─ page.tsx                 # catalog + client filters
│  │  │  └─ [slug]/page.tsx          # PDP + gallery + reviews
│  │  ├─ cart/page.tsx               # full cart and order summary
│  │  ├─ checkout/
│  │  │  ├─ page.tsx                 # authenticated multi-step wizard
│  │  │  └─ success/[orderNumber]/page.tsx
│  │  └─ account/
│  │     ├─ layout.tsx               # customer route guard + navigation
│  │     ├─ page.tsx                 # redirects to orders
│  │     ├─ orders/page.tsx
│  │     ├─ orders/[orderNumber]/page.tsx
│  │     └─ addresses/page.tsx
│  ├─ (auth)/
│  │  ├─ layout.tsx
│  │  ├─ login/page.tsx
│  │  └─ register/page.tsx
│  ├─ admin/
│  │  ├─ layout.tsx                  # requireAdmin + sidebar/top bar
│  │  ├─ loading.tsx
│  │  ├─ error.tsx
│  │  ├─ page.tsx                    # analytics overview
│  │  ├─ products/page.tsx           # datatable + create/edit dialog
│  │  └─ orders/
│  │     ├─ page.tsx                 # filterable order list
│  │     └─ [orderNumber]/page.tsx   # order detail + status actions
│  └─ api/
│     ├─ auth/[...nextauth]/route.ts
│     ├─ stripe/webhook/route.ts
│     ├─ cron/expire-orders/route.ts
│     ├─ admin/payment-proof/[orderId]/route.ts
│     ├─ uploads/sign/route.ts       # short-lived Cloudinary signatures
│     └─ health/route.ts
├─ components/
│  ├─ ui/                            # generated shadcn primitives
│  ├─ storefront/
│  │  ├─ age-gate.tsx
│  │  ├─ header.tsx
│  │  ├─ footer.tsx
│  │  ├─ product-card.tsx
│  │  ├─ catalog-browser.tsx
│  │  ├─ product-gallery.tsx
│  │  ├─ variant-selector.tsx
│  │  ├─ review-form.tsx
│  │  ├─ cart-sheet.tsx
│  │  ├─ checkout-wizard.tsx
│  │  └─ order-status-timeline.tsx
│  ├─ admin/
│  │  ├─ sidebar.tsx
│  │  ├─ metric-card.tsx
│  │  ├─ sales-chart.tsx
│  │  ├─ product-table.tsx
│  │  ├─ product-form-dialog.tsx
│  │  ├─ stock-editor.tsx
│  │  ├─ order-status-actions.tsx
│  │  └─ payment-proof.tsx
│  ├─ auth/
│  │  ├─ login-form.tsx
│  │  └─ register-form.tsx
│  └─ shared/
│     ├─ price.tsx
│     ├─ stock-badge.tsx
│     ├─ empty-state.tsx
│     └─ confirm-dialog.tsx
├─ lib/
│  ├─ config.ts                      # currency, shipping constants, site metadata
│  ├─ env.ts                         # server env parsing via Zod
│  ├─ db.ts                          # Prisma singleton with Neon adapter
│  ├─ auth.ts                        # full Auth.js config / handlers / guards
│  ├─ auth.config.ts                 # Edge-safe callbacks
│  ├─ actions/                       # "use server" mutations
│  │  ├─ auth.ts
│  │  ├─ checkout.ts
│  │  ├─ reviews.ts
│  │  ├─ addresses.ts
│  │  ├─ admin-products.ts
│  │  ├─ admin-orders.ts
│  │  └─ uploads.ts
│  ├─ data/                          # server-only queries -> DTOs
│  │  ├─ catalog.ts
│  │  ├─ account.ts
│  │  ├─ admin-products.ts
│  │  ├─ admin-orders.ts
│  │  ├─ analytics.ts
│  │  └─ reviews.ts
│  ├─ payments/stripe.ts
│  ├─ media/cloudinary.ts
│  ├─ validators/                    # shared Zod schemas
│  ├─ order-state.ts                 # transition matrix + stock policy
│  ├─ money.ts
│  ├─ rate-limit.ts                  # best-effort boundary, documented
│  └─ utils.ts
├─ hooks/
│  ├─ use-cart.ts
│  └─ use-filtered-products.ts
├─ stores/cart.ts                    # Zustand persist store
├─ prisma/
│  ├─ schema.prisma
│  ├─ seed.ts
│  └─ migrations/
├─ tests/
│  ├─ unit/
│  └─ e2e/
├─ public/
├─ auth.ts                            # optional re-export if tooling expects root
├─ middleware.ts
├─ next.config.ts
├─ tailwind config / postcss config
├─ components.json
├─ vercel.json
├─ .env.example
└─ README.md
```

`lib/actions` owns mutations and revalidation; `lib/data` owns read-only queries and must import `server-only`. Components never call Prisma directly. Shared Zod schemas in `lib/validators` are imported by both client forms and server actions, but the server always re-parses input.

### 3. Authentication, sessions, and authorization

- **Auth.js v5 with a Prisma adapter and Credentials provider.** Passwords are hashed with `bcryptjs` at cost 12 in Node-only code. Sessions use the JWT strategy so Edge middleware can read role claims without a database round trip.
- The configuration is split:
  - `auth.config.ts` contains only Edge-safe options (`pages`, authorized/session callbacks, base path) and is used by `middleware.ts`.
  - `auth.ts` adds the Prisma adapter and Credentials provider. Credentials authorize, registration, and all database access stay on Node.
- **Two roles only:** `ADMIN` and `CUSTOMER`. Registration always assigns `CUSTOMER`; role is never accepted from form input. Admin accounts are created by the seed script or a deliberate database operation.
- Email addresses are trimmed and lowercased before persistence and comparison. Password policy: at least 10 characters, no forced composition rules, maximum 72 bytes (bcrypt limit), and server-side confirmation matching.
- **Middleware is a navigation gate, not the security boundary.** It redirects unauthenticated users from `/admin/*` and `/account/*` to login, preserves a safe relative callback URL, and sends authenticated non-admins away from `/admin/*` without exposing admin data. `app/admin/layout.tsx` calls a database-backed `requireAdmin()`. Every admin read in a page/route and every admin mutation calls `requireAdmin()` as well, so a stale or tampered JWT cannot authorize data access or changes.
- Customer order pages and actions verify ownership by user ID, not only by order number. Admin actions are separate modules rather than being conditionally enabled inside shared customer actions.
- Auth cookies are `HttpOnly`, `Secure` in production, `SameSite=Lax`; secrets are server-only. Redirect callback paths must be relative to prevent open redirects.
- No public admin registration path. The seed script requires explicit admin credentials and idempotently promotes/creates the account. Production seed data includes categories and the admin only; demo products are optional and excluded by default.
- Basic rate limiting is applied at the auth boundary where feasible, with the limitation of serverless memory explicitly documented; production deployment guidance recommends Vercel WAF/edge rate limits for `/login`, `/register`, and payment-proof endpoints.

### 4. Database and Prisma model

- **PostgreSQL on Neon**, accessed through Prisma's Neon serverless driver adapter and a single Prisma singleton in Node runtime. `DATABASE_URL` is the pooled Neon URL; `DIRECT_URL` is used only for migrations and administrative scripts. All DB-backed route handlers and actions declare Node runtime.
- **Money is stored as integer centavos** (`Int` fields suffixed `...Centavos`) to eliminate floating-point ambiguity and Decimal-to-client serialization mistakes. Formatting happens only at the UI boundary with `Intl.NumberFormat("en-PH", { currency: "PHP" })`. Stripe receives centavos directly. DB `CHECK` constraints reject negative prices and stock.
- **All sellable inventory lives on `ProductVariant`.** Products aggregate variants, images, category, reviews, and marketing state. Every product must have at least one variant; a simple product has one default variant. Stock is never stored on `Product`.
- **Orders are immutable commercial snapshots.** `OrderItem` captures product name, variant label, SKU, unit price, quantity, and line total. `Order` captures contact details and a shipping-address JSON snapshot. Later product/address edits cannot rewrite an order.
- **Soft archive products and variants** via `isActive`; orders reference variants with `Restrict` deletion. Admin UI archives rather than hard-deletes products that have orders. Images can be detached without destroying historical order data.

Core models and fields:

| Model | Purpose and important fields |
| --- | --- |
| `User` | Auth/profile record: `id`, normalized unique `email`, `name`, `phone`, optional `image`, `passwordHash`, `role` (`ADMIN`/`CUSTOMER`, default `CUSTOMER`), timestamps. Relations to accounts, sessions, addresses, orders, reviews, media. |
| `Account` | Auth.js OAuth account fields (`provider`, `providerAccountId`, tokens) with compound unique and user relation; retained for Auth.js compatibility. |
| `Session`, `VerificationToken` | Standard Auth.js adapter models; retained even though JWT sessions are used. |
| `Address` | Customer address: `recipientName`, `phone`, `line1`, `line2?`, `barangay?`, `city`, `province`, `postalCode`, `country` default `PH`, `isDefault`, timestamps. Unique partial index enforces one default per user. |
| `Category` | Seed-managed merchandising taxonomy: unique `slug`, `name`, `description`, optional `imageUrl`, `sortOrder`, active flag. Six initial categories. |
| `Product` | `name`, unique `slug`, `brand`, `shortDescription`, `description`, `categoryId`, `isFeatured`, `isActive`, timestamps. Display price is derived from active variants. |
| `ProductVariant` | Unique `sku`, `label`, optional `flavorProfile`, optional `nicotineMg`, optional `color`, `priceCentavos`, `stock`, `lowStockThreshold`, `isActive`, `sortOrder`. All order and inventory operations target this model. |
| `MediaAsset` | Cloudinary upload record: `ownerId`, `kind` (`PRODUCT_IMAGE`/`PAYMENT_PROOF`), `publicId`, optional public `secureUrl`, `resourceType`, dimensions/bytes/mime, timestamps. Proof URLs are never persisted publicly. |
| `ProductImage` | Join/ordering record linking `Product` and optionally `ProductVariant` to one `MediaAsset`, with required alt text and sort order. |
| `Review` | One review per user/product (`@@unique([userId, productId])`), 1–5 rating, title/body, `verifiedPurchase`, timestamps. |
| `Order` | Unique human-readable `orderNumber`, `userId`, status, payment method, subtotal/shipping/total centavos, contact and shipping snapshots, optional note, GCash reference/proof, Stripe session/intent IDs, unique idempotency key, lifecycle timestamps. |
| `OrderItem` | Order/variant relation plus immutable name/SKU/pricing snapshots and quantity. |
| `OrderEvent` | Append-only status history: `fromStatus`, `toStatus`, note, optional actor ID, timestamp. Powers customer/admin timelines and audit. |

Enums: `Role`, `FlavorProfile` (`FRUITY`, `MENTHOL`, `DESSERT`, `TOBACCO`, `OTHER`), `OrderStatus` (`PENDING`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED`), `PaymentMethod` (`COD`, `GCASH`, `CARD`), `MediaKind`.

Key constraints and indexes:

- Unique: product/category slugs, SKU, order number, idempotency key, Stripe session ID, `(provider, providerAccountId)`, `(userId, productId)` review, GCash reference when supplied.
- Check constraints (raw SQL in migration): variant price/stock >= 0, order monetary values >= 0, review rating between 1 and 5.
- Indexes: `Product(isActive, categoryId)`, `Product(isFeatured)`, `ProductVariant(productId, isActive)`, `ProductVariant(stock)`, `Order(userId, createdAt)`, `Order(status, createdAt)`, `Review(productId, createdAt)`, `OrderItem(variantId)`.
- Deletion policy: cascade Auth.js sessions/accounts where appropriate; restrict user/order/product deletion; preserve order history. Addresses can be deleted only when not referenced by a snapshot (orders use JSON, so they remain safe).

### 5. Storefront experience

- **Visual language.** Locked dark theme with near-black `#07070B` backgrounds, layered charcoal surfaces, thin luminous borders, electric-lime primary actions, violet/cyan atmospheric accents, and coral danger states. Display type uses Space Grotesk; body uses Inter via `next/font`. Neon is used for emphasis and glow, never for large body text or low-contrast labels. The design targets WCAG 2.1 AA, visible focus rings, 44px touch targets, and reduced-motion support.
- **Age gate.** The storefront layout reads the verification cookie server-side and passes an `initiallyVerified` flag to a client `AgeGate`. When unverified, an accessible modal blocks interaction with the storefront until the visitor affirms 21+, sees the nicotine warning, or chooses to leave. Acceptance writes a 30-day `vapeshop_age_verified` cookie and a versioned localStorage timestamp. Decline navigates away to a configurable external URL. The gate is re-shown after expiry or cookie/localStorage reset; the content behind it is not presented as available to unverified visitors.
- **Landing page.** Hero brand statement, promotional announcement, six category cards, curated featured products, trust/compliance strip, and a closing call to action. Copy and promotion content live in `lib/config.ts`; products are queried from the database. Category cards deep-link to the catalog.
- **Catalog.** Server-fetched active products include active variants and ordered images. A Client Component provides category, nicotine strength, flavor profile, price range, in-stock, and instant text search; all selected facets combine with AND. Filter options derive from available data, show a result count, and expose clear-all plus an explanatory empty state. Mobile filters use a sheet; desktop uses a sidebar. Initial category/search params seed the client state for deep links.
- **Product detail.** SSR metadata and product content, responsive gallery with keyboard controls, variant selector that updates price/stock/image, per-variant stock badge, add-to-cart disabled for inactive/out-of-stock variants, and visible low-stock messaging. Reviews show aggregate rating, count, and newest-first list. Only signed-in customers with a paid/shipped/delivered order containing the product can submit one review; the form validates rating/title/body and revalidates the PDP.
- **Cart.** Zustand `persist` middleware stores only serializable cart lines and a schema version in localStorage. Lines are keyed by variant ID and include display snapshots; current price/stock remain authoritative at checkout. Hydration is explicit to prevent server/client markup drift. Quantity is capped by known stock, never below one, and the cart exposes subtotal, shipping rule, and stock/availability warnings. Checkout requires authentication.
- **Checkout.** A three-step responsive wizard: delivery/contact, payment, review/place order. Only authenticated users can enter `/checkout`; the login callback returns them to checkout with their persisted cart. Addresses can be selected from saved addresses or created inline. A read-only `getCheckoutQuote` Server Action recalculates current prices, line availability, and shipping before display. The final `placeOrder` action repeats every check and cannot trust client prices.
- **Shipping and pricing.** Prices are PHP, VAT-inclusive, with a flat shipping fee and free-shipping threshold defined in `lib/config.ts`. Shipping and totals are recalculated server-side. Empty carts, archived variants, insufficient stock, and changed prices produce actionable errors instead of silent substitution.
- **Account portal.** Registration/login, order list and details with a status timeline, order totals/items/shipping snapshot, and address CRUD with one default address. All queries scope to the authenticated user.
- **Empty/error states.** Purposeful messaging for empty catalog results, empty cart, no orders, unavailable products, failed uploads, and payment-pending confirmation. Global and route-level error boundaries provide recovery actions without leaking internal errors.

### 6. Checkout, payment, and inventory invariants

1. The customer picks an owned address and a payment method. Server checks the session and reloads the address; the snapshot is generated at order placement.
2. `placeOrder` validates an idempotency key, trusted cart variant IDs, quantities, address ownership, payment method, and GCash metadata. It loads all variants/products in one query and rejects inactive or unavailable lines.
3. In a single Prisma transaction, stock is decremented with conditional updates (`stock >= quantity`), then `Order`, `OrderItem`s, and the initial `OrderEvent` are created. A price or stock race rolls the whole transaction back. Repeated submission with the same idempotency key returns the existing order rather than creating another.
4. Payment behavior:
   - **COD:** order remains `PENDING`; confirmation is immediate. Admins may ship COD orders from `PENDING` and mark them delivered when cash is collected.
   - **GCash:** checkout requires a payment reference and an uploaded private receipt. The order remains `PENDING` until an admin verifies the proof and transitions it to `PAID`. A GCash reference cannot be reused across orders.
   - **Card:** if Stripe is configured, a Checkout Session is created for the pending order and the customer is redirected. The signed webhook is the only authority that marks a card order `PAID`; the success page refreshes/polls until that state arrives. If Stripe is not configured, the card option is not offered.
5. Stripe webhook handling verifies signatures against the raw body, is idempotent by event/session ID, and maps the session metadata to the order. Failed/expired sessions cancel the pending order and release stock once. A cron-protected route expires unpaid card orders older than 30 minutes and restores stock atomically, appending an `OrderEvent`. The Stripe session is configured to expire at the same boundary.
6. Order-state transitions are centralized in `lib/order-state.ts` and enforced server-side:
   - `PENDING` → `PAID` or `CANCELLED`; COD also permits `PENDING` → `SHIPPED`.
   - `PAID` → `SHIPPED` or `CANCELLED`.
   - `SHIPPED` → `DELIVERED`.
   - `DELIVERED` and `CANCELLED` are terminal.
   - Stock is restored at most once, on transition to `CANCELLED`; the transaction re-reads status to prevent double restoration. GCash and card orders cannot ship before payment.
7. Cart is cleared only after an order is successfully accepted (including a successfully created Stripe session). The confirmation page verifies ownership by order number + session and shows method-specific instructions/status. Card confirmation may show "payment processing" until the webhook lands.
8. Payment proof assets are uploaded directly to Cloudinary using short-lived server-generated signatures, avoiding Vercel's request-body limit. They use authenticated/private delivery. The database stores ownership and Cloudinary identifiers; admins retrieve proofs through an admin-only route that issues a very short-lived signed URL. Public product images use a separate upload folder and asset kind.

### 7. Admin console

- The admin layout requires a database-verified `ADMIN` session, then renders a responsive sidebar/top bar (Overview, Products, Orders, View storefront) with breadcrumbs and a sign-out action.
- **Overview:** metric cards for all-time paid revenue (sum of `PAID`/`SHIPPED`/`DELIVERED` totals), all non-cancelled orders, active products, and active variants at/below their low-stock threshold. Recent orders include statuses. A Recharts 30-day sales/orders chart receives zero-filled, serializable daily data from a server query; time grouping uses `Asia/Manila`.
- **Products:** server-driven search by name/SKU and pagination via URL params, with accessible table semantics. Create/edit uses a dialog with category, product copy, featured/active flags, variants (at least one), images, and low-stock thresholds. Product actions validate with Zod, enforce uniqueness, and revalidate storefront/admin paths. Stock edits are separate, non-negative, conditional, and visually flag variants at/below threshold.
- **Orders:** server-driven status filter, search, and pagination. Detail view shows customer/contact, shipping snapshot, product/variant snapshots, totals, payment method and reference, proof preview, status timeline, and allowed status transitions. Status update is one click plus a confirmation for cancellation, runs in a transaction with a single restock guarantee, writes an `OrderEvent`, and revalidates admin/customer surfaces. `revalidatePath` is included so server-rendered badges and tables update immediately.
- **Images:** admin-only signatures for product uploads; required alt text; size/type validation client-side and at registration. Direct upload occurs before form submission. Failed uploads preserve form state.
- **Accessibility/performance:** tables have headers and captions, destructive actions have confirmations, chart data has a textual summary/empty state, and all admin pages have loading/error boundaries.

### 8. Validation, security, and API boundaries

- Zod schemas are the single source of validation for auth, product/variant, address, review, checkout, and admin status actions. IDs use cuid/UUID validation, strings are length-bounded and trimmed, and monetary/quantity inputs are integers with explicit minimums.
- Every server action returns a discriminated result (`{ ok: true, ... }` or `{ ok: false, message, fieldErrors? }`) for `useActionState`; unexpected errors are logged server-side and replaced with safe messages.
- Auth, review, address, checkout, and admin actions call the relevant guard before parsing or mutating. Object-level authorization (`order.userId === session.user.id`) is mandatory for customer order routes. Admin checks query the current database role, not only the JWT.
- React escapes rendered review/admin content by default. No `dangerouslySetInnerHTML` for user-provided text. Images are restricted to Cloudinary and the local asset domain via `next/image` `remotePatterns`.
- Stripe webhooks verify signatures with the raw request body; cron requires `Bearer ${CRON_SECRET}`; uploads and payment-proof routes require sessions and appropriate roles. Service secrets never use `NEXT_PUBLIC_`.
- Security headers (CSP compatible with Next/Cloudinary/Stripe where used, `X-Content-Type-Options`, `Referrer-Policy`, frame protection, and HSTS in production) are configured in `next.config.ts`. `NEXT_PUBLIC_APP_URL` is used for absolute Stripe return URLs and canonical metadata.
- The public health endpoint returns only application liveness, not database details or secrets. Webhook/cron/auth failures are logged with correlation IDs and never expose stack traces to clients.

### 9. Testing and quality gates

- Unit tests cover money conversion/formatting, Zod schemas, cart quantity rules, idempotency behavior, order transition policy, and stock-restoration rules.
- Integration tests (or documented manual smoke tests if a disposable database is unavailable) cover order placement with a price/stock race, duplicate idempotency key, GCash reference uniqueness, admin status updates, and ownership checks.
- Playwright smoke coverage targets the age gate, catalog filter, add-to-cart, login-protected checkout, admin login guard, product creation validation, and order status update. A full payment E2E uses Stripe test mode; GCash is verified through seeded proof data.
- Delivery gates: `tsc --noEmit`, ESLint, Prisma validate/generate, unit tests, production `next build`, and a Vercel preview smoke test.

### 10. Deployment and operations

- **Environment:** `DATABASE_URL` (pooled), `DIRECT_URL` (migration), `AUTH_SECRET` (also accept `NEXTAUTH_SECRET` during setup), `AUTH_URL`/`NEXT_PUBLIC_APP_URL`, `AUTH_TRUST_HOST`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` only if needed by the chosen hosted flow (not required for server-created Checkout Sessions), `CRON_SECRET`, and optional `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`. `lib/env.ts` validates required server variables at startup/handler invocation; optional integrations fail closed.
- **Build/deploy:** run `prisma generate`, apply `prisma migrate deploy` against the direct URL before or as part of the release, seed only non-demo production data, build, then smoke test the Vercel preview. Git integration is the primary deployment path; Vercel CLI is documented for local/preview deploys.
- **Vercel config:** cron job invokes `/api/cron/expire-orders`; Stripe webhook endpoint is `/api/stripe/webhook`; Node runtime for DB routes; image domains allow Cloudinary. Cron frequency availability may depend on the Vercel plan; the deployment guide calls this out.
- **Rollback:** application rollback uses Vercel's previous deployment. Migrations are expand-first and backward-compatible for a rolling rollback. Database backups/PITR are configured in Neon, and destructive schema changes are not part of this initial release.
- **Observability:** Vercel function logs capture structured action/webhook/cron outcomes. A lightweight `/api/health` checks process liveness. Sentry or another vendor is optional and not required for launch.

## Risks / Trade-offs

- **[Age gate is bypassable]** → Treat it as a clearly labelled compliance interstitial, store acceptance with expiry, never claim it verifies identity, and have legal copy/store policy reviewed. Do not rely on it for enforcement beyond the customer-facing web session.
- **[Overselling under concurrent checkout]** → Reserved stock via conditional transaction updates, serializable-enough isolation/retry behavior, and no client-supplied price authority. Integration tests simulate competing purchases.
- **[Abandoned card orders hold inventory]** → Stripe sessions expire after 30 minutes and a cron cancels/restocks unpaid card orders. Failures are logged; admins can release stock manually via cancellation.
- **[Stripe may not be available/configured for the merchant]** → Feature-gate card in checkout and fail closed. COD/GCash remain functional; deployment docs cover Stripe merchant onboarding and test mode.
- **[GCash fraud/manual error]** → Require reference + private receipt, reject duplicate references, store an admin audit status event, and verify amount/order context manually. Manual reconciliation remains an operational risk.
- **[Private receipt exposure]** → Authenticated Cloudinary delivery, no public proof URL persistence, short-lived admin-only signed URLs, strict role checks, and no proof keys in DTOs sent to non-admin clients.
- **[Stale admin JWT after role revocation]** → DB-backed `requireAdmin()` on admin layout, pages, and every mutation, with short session validity. Middleware only improves UX.
- **[Client-side filtering does not scale indefinitely]** → Documented ceiling and clean query/DTO boundary; migrate to server-side search/filtering if the catalog exceeds the threshold.
- **[Catalog cache shows stale availability]** → Short tag-based caches invalidated by admin/order mutations; PDP and checkout read authoritative stock. Checkout never trusts displayed availability.
- **[Cloudinary/Stripe outages]** → UI communicates recoverable errors; checkout never marks payment paid without verified callback; optional services are feature-gated.
- **[Direct uploads can be abused]** → Signed, short-lived admin/customer-scoped uploads, type/size checks, per-user limits, and WAF rules; orphaned assets can be cleaned by a maintenance job.
- **[Account-required checkout reduces conversion]** → Deliberate v1 trade-off for secure order history, ownership checks, verified reviews, and simpler PII handling. Guest checkout could be added later with a separate design.
- **[No password reset or transactional email]** → Out of scope for this release; document operational support process and prioritize an email provider before public growth. Admin-aware support is required for locked-out users.
- **[Manual shipping updates not "real-time" carrier tracking]** → Status is clearly presented as store-managed fulfillment tracking, with timestamps from `OrderEvent`.
- **[Auth brute-force/rate-limit gap on serverless]** → Use Vercel WAF/rate limiting in production for auth and proof endpoints; document that in-memory limits alone are not sufficient. Add a durable rate limiter if abuse appears.
- **[Vercel cron plan limitations]** → Document required schedule/plan; add lazy expiry checks on order/admin reads as a fallback so inventory is eventually released even if cron is delayed.
- **[PHP/Stripe currency and tax expectations]** → Store all prices as PHP centavos, present VAT-inclusive pricing, configure Stripe in PHP test mode, and confirm merchant eligibility before enabling card in production.
- **[PII in admin/logs]** → Keep customer contact data server-side, redact payment references in logs, restrict admin routes, and avoid storing card data entirely.

## Migration Plan

This is a new application, so there is no production data migration.

1. Scaffold the Next.js app, strict TypeScript, styling, linting, testing, and environment template.
2. Create the Neon database/branches and define `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) locally.
3. Add the Prisma schema, generate the initial migration, apply raw CHECK/partial-unique SQL, generate Prisma Client, and implement the idempotent seed (six categories, admin, optional demo catalog).
4. Build auth, guards, data/query modules, and server actions before wiring the UI.
5. Implement storefront and checkout; verify inventory/pricing invariants and all payment states.
6. Implement admin analytics, product management, order management, and upload/proof access.
7. Run unit/type/build gates and local smoke tests; seed a Vercel preview database.
8. Create the Vercel project, set environment variables for preview/production, configure Stripe test/live webhooks and Cloudinary, verify cron authentication, then execute an end-to-end preview smoke test before promoting to production.
9. If rollback is needed, promote the prior Vercel deployment and use additive, backward-compatible schema changes only; restore from Neon backup/PITR if data corruption is suspected.

## Open Questions

No implementation-blocking questions remain; defaults are chosen so work can proceed. The following business inputs should be confirmed before production launch:

- Final legal/age-gate copy, support contact, and the preferred decline/exit URL.
- Confirmed flat shipping fee, free-shipping threshold, and whether all listed prices are VAT-inclusive (defaults live in `lib/config.ts`).
- Stripe merchant eligibility in the target country/currency and live-mode onboarding timing.
- GCash receiving account details and the real-world SLA for manual payment verification.
- Production domain and branding assets/logo beyond the generated wordmark treatment.
- Whether email/SMS notifications and password reset must be added before or immediately after launch.
