## 1. Project foundation

- [x] 1.1 Initialise a Next.js 15 App Router project with React 19 and strict TypeScript at the repository root while preserving `.opencode/` and `openspec/`
- [x] 1.2 Install runtime dependencies for Prisma/Neon, Auth.js, Zod, Zustand, Recharts, Stripe, Cloudinary, bcryptjs, Sonner, and shadcn/Radix primitives; pin compatible versions
- [x] 1.3 Install and configure development tooling: ESLint, Prettier, Vitest, Playwright, Prisma CLI, and package scripts for lint/typecheck/test/build/db workflows
- [x] 1.4 Configure Tailwind and shadcn/ui with the dark neon/vapor design tokens, Space Grotesk/Inter fonts, reduced-motion defaults, and accessible focus styles
- [x] 1.5 Create `.gitignore`, initialise git, and add a documented `.env.example` covering database, auth, app URL, Cloudinary, Stripe, cron, and optional seed settings
- [x] 1.6 Implement `lib/env.ts` with server/public Zod schemas so required variables fail fast and optional Stripe/card support fails closed
- [x] 1.7 Configure `next.config.ts` for allow-listed Cloudinary images, security headers, and Node-compatible service boundaries; add the initial `vercel.json`
- [x] 1.8 Build the root layout with fonts, metadata, toast provider, global error boundary, and not-found page
- [x] 1.9 Add base SEO helpers for canonical metadata, Open Graph defaults, sitemap, robots, and brand content in `lib/config.ts`

## 2. Prisma schema and seed data

- [x] 2.1 Create `lib/db.ts` with the Prisma singleton, Neon serverless driver adapter, pooled `DATABASE_URL`, and migration-only `DIRECT_URL`
- [x] 2.2 Add Auth.js models (`User`, `Account`, `Session`, `VerificationToken`) with normalized unique email, optional password hash, and `Role` enum
- [x] 2.3 Add catalog models (`Category`, `Product`, `ProductVariant`, `ProductImage`, `MediaAsset`, `Review`) with category/product/variant relationships and gallery/ordering fields
- [x] 2.4 Add order models (`Order`, `OrderItem`, `OrderEvent`, `Address`) with status/payment/media enums, immutable snapshots, idempotency key, Stripe references, and lifecycle timestamps
- [x] 2.5 Add unique constraints, query indexes, cascade/restrict deletion policies, default-address partial unique index, and raw SQL CHECK constraints for non-negative money/stock and 1–5 ratings
- [ ] 2.6 Run Prisma format, validate, and generate; create and apply the initial migration against a Neon development branch
- [x] 2.7 Implement an idempotent seed for the six storefront categories and a required-environment admin account without exposing credentials in client code
- [x] 2.8 Add an opt-in demo seed for representative products, variants, images, reviews, and orders covering every status/payment combination for local analytics and UI testing
- [ ] 2.9 Verify money is stored as integer centavos and that constraint violations for negative stock/prices and duplicate SKUs/slugs are rejected at the database boundary

## 3. Authentication, sessions, and RBAC

- [x] 3.1 Split Auth.js into an Edge-safe `auth.config.ts` and a Node-only `auth.ts` with Prisma adapter, JWT strategy, session expiration, and `id`/`role` session augmentation
- [x] 3.2 Implement the Credentials provider with normalized email lookup, bcrypt password verification, generic failure messages, and a secure Auth.js route handler
- [x] 3.3 Add registration Zod schemas, a server action with lowercased/unique email, 10-character password policy, confirmation matching, customer-only role assignment, and hashed storage
- [x] 3.4 Build accessible login and registration pages/forms with safe callback URL handling, field errors, pending states, and sign-in/sign-out actions
- [x] 3.5 Implement `middleware.ts` for `/admin`, `/account`, and `/checkout` so unauthenticated users redirect to login and authenticated non-admins cannot enter admin routes
- [x] 3.6 Implement server-only `requireUser()` and database-backed `requireAdmin()` guards plus ownership helpers for orders and addresses
- [ ] 3.7 Verify customer JWT/tampered callbacks cannot access admin pages, invoke admin actions, or retrieve another user's order/address data
- [x] 3.8 Add auth rate-limit/WAF guidance and a best-effort serverless-safe guard at the login/registration boundary without promising in-memory durability

## 4. Shared visual system and storefront shell

- [x] 4.1 Generate and customise the required shadcn primitives: button, input, textarea, label, dialog, sheet, tabs, select, radio group, checkbox, badge, table, skeleton, alert, dropdown, tooltip, and toast
- [x] 4.2 Implement shared money, date, stock-badge, empty-state, confirmation-dialog, and pagination presentation components with PHP formatting
- [x] 4.3 Create server-only data modules under `lib/data` that return explicit client-safe DTOs without Prisma records, secrets, password hashes, or private upload identifiers
- [x] 4.4 Build the storefront layout with responsive header, category/mobile navigation, cart trigger, account/auth controls, footer, nicotine disclosure, and admin link for admins only
- [x] 4.5 Build the cart sheet shell and shared storefront loading/error states, ensuring focus management and keyboard access
- [ ] 4.6 Apply the visual system across mobile and desktop breakpoints and verify text/action contrast without relying on neon colour alone

## 5. Age verification and landing page

- [x] 5.1 Implement the accessible age-gate dialog with blocking overlay, inert background, focus trap, keyboard controls, 21+ warning, and non-dismissible unresolved state
- [x] 5.2 Persist acceptance for 30 days in a versioned cookie and localStorage, restore it without hydration mismatch, and render the gate again after expiry or invalid storage
- [x] 5.3 Implement the decline/exit path to the configured external destination without writing affirmative verification
- [x] 5.4 Read initial age-gate state server-side and integrate it into the storefront layout without revealing interactive age-restricted purchasing
- [x] 5.5 Build the landing hero, promotion banner, six category cards, compliance/trust strip, and closing call to action
- [x] 5.6 Query active featured products with imagery/variants and render a responsive featured rail with a useful empty state
- [ ] 5.7 Verify category deep links, mobile layout, keyboard navigation, reduced motion, and screen-reader announcements for the gate and landing page

## 6. Product catalog and product detail

- [x] 6.1 Implement active catalog/category/product queries with ordered images and active variants, map them to serializable DTOs, and support initial category/search params
- [x] 6.2 Build the instant search experience over product name, brand, and flavor with case-insensitive matching, result count, and empty state
- [x] 6.3 Add category, nicotine strength, flavor profile, price range, and in-stock filters that combine with AND semantics and support clear-all
- [x] 6.4 Build the responsive filter sidebar/sheet and product-card grid with stock labels, derived lowest price, images, and category links
- [x] 6.5 Build the product detail route with dynamic metadata, image gallery, thumbnails, product copy, and accessible gallery controls
- [x] 6.6 Implement the variant selector with per-variant price/stock/SKU/image updates and disabled purchase for inactive or out-of-stock variants
- [x] 6.7 Add the selected-variant add-to-cart action, low-stock/out-of-stock messaging, and integration with the cart store
- [x] 6.8 Implement review queries with aggregate rating, count, newest-first list, and a no-reviews state
- [x] 6.9 Implement verified-purchase review eligibility, one-review-per-product enforcement, Zod validation, server action, and product-page revalidation
- [ ] 6.10 Add review form states for unauthenticated/ineligible customers and verify product-detail responsive/accessibility behavior

## 7. Persistent cart

- [x] 7.1 Implement the versioned Zustand persist cart keyed by variant ID with add, increment/decrement, set quantity, remove, clear, and stock caps
- [x] 7.2 Add explicit hydration handling and selectors for item count, merchandise subtotal, and unavailable-item warnings without server/client mismatch
- [x] 7.3 Connect add-to-cart controls on product cards/details to the store with success feedback and cart-sheet opening behavior
- [x] 7.4 Build the cart sheet and full cart page with line summaries, quantity controls, removal, subtotal, shipping explanation, and checkout link
- [ ] 7.5 Verify cart persistence across reloads/navigation and that invalid/empty carts cannot proceed to checkout

## 8. Checkout, payments, and private media

- [x] 8.1 Add checkout/quote Zod schemas and centralize PHP shipping constants, free-shipping threshold, and server-side total calculation helpers
- [x] 8.2 Implement Stripe and Cloudinary server utilities with environment feature gates and no client exposure of secret keys
- [x] 8.3 Implement the signed-upload route for admin product images and authenticated GCash proof uploads with purpose, ownership, format, and size validation
- [x] 8.4 Implement direct-upload client components, upload previews/progress/errors, and a server action that registers Cloudinary assets against the authenticated owner and media kind
- [x] 8.5 Build the authenticated checkout page and three-step wizard (delivery/contact, payment, review) with saved-address selection and inline address creation
- [x] 8.6 Implement a read-only `getCheckoutQuote` Server Action that reloads variants, detects price/stock changes, and returns authoritative lines, shipping, and total
- [x] 8.7 Build payment-method selection with COD, GCash, and feature-gated card options, including required reference/receipt fields and clear method-specific guidance
- [x] 8.8 Implement the `placeOrder` Server Action with idempotency, owned address/payment-proof checks, price/stock authority, atomic conditional stock decrements, order/item snapshots, initial event, and revalidation
- [x] 8.9 Complete the COD flow and confirmation state, including pending status and pay-on-delivery messaging
- [x] 8.10 Complete the GCash flow with unique reference enforcement, private proof linkage, pending verification state, and rejection of missing/foreign receipts
- [x] 8.11 Implement creating a Stripe Checkout Session for a pending order, persist its IDs, redirect the customer, and keep card unavailable when configuration is absent
- [x] 8.12 Implement the signature-verified, idempotent Stripe webhook for paid, expired, and failed sessions with exactly-once stock/status effects
- [x] 8.13 Implement `/api/cron/expire-orders` with `CRON_SECRET` authentication, 30-minute pending-card expiry, atomic cancellation, stock restoration, event creation, and additive lazy-expiry fallback
- [x] 8.14 Build the ownership-protected, method-aware confirmation page with cart clearing on accepted order, Stripe processing refresh behavior, and order details
- [ ] 8.15 Add an admin-only short-lived payment-proof response route with no public cache/URL leakage and verify proof upload/retrieval authorization end to end
- [ ] 8.16 Verify failed quote/order/session flows preserve the cart and never create partial orders or stock mutations

## 9. Customer account portal

- [x] 9.1 Build the guarded account layout with responsive navigation to orders and addresses and clear signed-in identity
- [x] 9.2 Implement customer order-history queries scoped by user ID with newest-first summaries, status indicators, totals, and empty state
- [x] 9.3 Build ownership-protected order detail pages with line snapshots, shipping/contact details, payment method, and chronological `OrderEvent` timeline
- [x] 9.4 Implement address list/create/update/delete server actions with Philippines-aware validation, ownership checks, and single-default transactional behavior
- [x] 9.5 Build address management UI, default-address controls, delete confirmation, and reuse of saved addresses in checkout
- [ ] 9.6 Verify order/address authorization, timeline updates after admin actions, form accessibility, and empty/error states

## 10. Admin layout, analytics, and dashboard

- [x] 10.1 Build the database-guarded admin layout with responsive sidebar/top bar, breadcrumbs, Overview/Products/Orders/Storefront links, and sign-out
- [x] 10.2 Implement analytics queries for revenue, non-cancelled orders, active products, low-stock active variants, and recent orders using `Asia/Manila` date boundaries
- [x] 10.3 Build the revenue/order/product/low-stock metric cards with PHP formatting, zero states, and links to actionable areas
- [x] 10.4 Build the Recharts 30-day interactive sales/order chart with zero-filled days, timezone-safe labels, tooltips, and an accessible textual summary
- [x] 10.5 Build the recent-orders table with order/customer/date/total/payment/status badges and links to order detail
- [ ] 10.6 Add admin loading/error boundaries and verify analytics refresh through revalidation after order, stock, or product changes

## 11. Admin product management

- [x] 11.1 Implement server-driven product queries with name/SKU search, stable pagination, category/status metadata, variant stock totals, and low-stock flags
- [x] 11.2 Build the product datatable with URL-backed search/page state, responsive columns, thumbnails, empty state, and pagination controls
- [x] 11.3 Define shared product/variant Zod schemas for names, slugs, prices, SKUs, stock, thresholds, category, flags, image alt text, and at least one publishable variant
- [x] 11.4 Implement create, update, and archive/delete Server Actions with slug/SKU uniqueness, publishing/image rules, order-safe deletion semantics, and explicit revalidation
- [x] 11.5 Build the add/edit product dialog with dynamic variant rows, field errors, preserve-on-failure behavior, and success feedback
- [x] 11.6 Integrate admin-only signed image uploads into the dialog with previews, alt text, ordering, variant association, and failed-upload resilience
- [x] 11.7 Implement stock adjustment Server Actions and inline stock editor that reject negative values, update thresholds, and revalidate storefront/catalog/admin surfaces
- [x] 11.8 Add low-stock display and publication validation so active storefront products require an active variant and at least one described image
- [ ] 11.9 Verify direct admin mutation attempts by customers are rejected and product changes disappear/appear correctly on storefront surfaces

## 12. Admin order management

- [x] 12.1 Implement server-side order queries with order/customer/email search, status filtering, newest-first pagination, and text-labelled badges
- [x] 12.2 Build the admin order list with filters, search state, pagination, payment method, totals, and empty/error states
- [x] 12.3 Implement the full admin order detail view with contact/shipping snapshots, item/SKU snapshots, totals, payment metadata (never card data), proof status, and event timeline
- [ ] 12.4 Build the short-lived GCash proof preview UI backed by the admin-only proof route and verify customer/anonymous proof requests are denied
- [x] 12.5 Implement and unit-test the centralized method-aware order transition matrix, terminal states, and GCash proof requirement
- [x] 12.6 Implement the transactional status-update Server Action with fresh status read, allowed-transition validation, card-webhook-only paid rule, `OrderEvent` append, and exactly-once stock restoration on cancellation
- [x] 12.7 Build one-click allowed status actions with cancellation confirmation, pending/error feedback, and immediate revalidation of admin, dashboard, analytics, and customer order surfaces
- [ ] 12.8 Verify invalid/forged transitions and repeated cancellations do not change status or double-restore stock, including COD shipping before cash collection

## 13. Quality, security, and accessibility hardening

- [x] 13.1 Write unit tests for money conversion/formatting, checkout/product/address/review Schemas, cart quantity rules, order transitions, idempotency, and stock restoration
- [ ] 13.2 Write integration tests for price/stock races, duplicate idempotency keys, duplicate GCash references, proof ownership, admin authorization, and order/address ownership
- [x] 13.3 Add Playwright smoke/E2E coverage for age gate persistence, catalog filtering, variant cart, login-protected checkout, admin guard, product validation, and status update
- [ ] 13.4 Audit security headers, cookie flags, safe callback URLs, unsupported admin actions, webhook/cron authentication, private proof access, and secret/PII logging
- [ ] 13.5 Audit storefront/admin accessibility: focus states, dialog traps, labels, chart summary, tables, text-labelled badges, touch targets, reduced motion, and contrast
- [ ] 13.6 Audit responsive layouts, loading/error/empty states, image dimensions/alt text, and client bundle hotspots
- [ ] 13.7 Verify cache/revalidation behavior: storefront reflects admin/stock/order changes and checkout remains server-authoritative despite cached library views
- [ ] 13.8 Run the complete gate: Prisma validate/generate, TypeScript, ESLint, unit/integration tests, Playwright smoke, and a production `next build`

## 14. Documentation and deployment

- [x] 14.1 Complete `.env.example` with descriptions, required/optional status, and safe example values for all database, auth, Cloudinary, Stripe, cron, and seed variables
- [x] 14.2 Write the README covering features, architecture/folder tree, local setup, database migration/seed commands, test commands, and admin bootstrap
- [x] 14.3 Write the deployment guide for Neon pooled/direct URLs, migrations, Cloudinary, Stripe test/live webhooks, `AUTH_SECRET`/`NEXTAUTH_SECRET`, Vercel environment scope, and git/Vercel CLI deployment
- [x] 14.4 Finalize `vercel.json` cron configuration, document plan limitations, and verify the Stripe webhook and health endpoints are Node-runtime compatible
- [x] 14.5 Document the production smoke test, rollback procedure, backup/PITR expectation, and pre-launch legal/support/shipping/Stripe/GCash inputs
- [ ] 14.6 Run a seeded preview build and verify age gate, storefront purchase flow, all payment-method states, private proof access, admin analytics, product CRUD, and order transitions
