# Operations and launch runbook

This runbook covers production smoke testing, rollback, backups, incident response, and the business inputs that must be confirmed before launch. It assumes the deployment steps in [deployment.md](deployment.md) are complete.

## Production smoke test

Run this on a production-like preview first, then repeat the read-only checks immediately after the production deployment. Use a test customer account and a low-value card for payment verification.

### Public storefront

- [ ] `/` loads over HTTPS; no mixed-content or CSP errors in the browser console.
- [ ] The 21+ gate blocks the page, cannot be dismissed with Escape/outside click, and persists after accepting and reloading.
- [ ] Declining sends the visitor to the configured exit page.
- [ ] Clearing the cookie or using an expired cookie shows the gate again.
- [ ] Header, mobile navigation, footer, and cart controls work at 360 px, 768 px, and desktop widths.
- [ ] `/products` lists active products; search, category, nicotine, flavour, price, and in-stock filters combine correctly.
- [ ] Empty search results show the reset action.
- [ ] A product page shows gallery, variant price/stock/SKU, sold-out state, reviews, and review eligibility.
- [ ] Add to cart, change quantity, reload, and verify the cart persists.
- [ ] `/cart` shows correct subtotal, flat ₱99 shipping below ₱2,500, and free shipping at/above the threshold.

### Authentication and checkout

- [ ] `/admin`, `/account`, and `/checkout` redirect anonymous visitors to `/login` with a safe callback.
- [ ] A customer can register, sign in, and sign out.
- [ ] A customer cannot open `/admin` or invoke admin actions.
- [ ] COD checkout: select/add an address, review the server quote, place the order, and see the confirmation page with the cart cleared.
- [ ] Confirm the order exists in the admin queue, stock decreased by the ordered quantity, and the timeline has the `PENDING` event.
- [ ] Re-submitting the same idempotency key does not create a duplicate order.
- [ ] GCash checkout: a unique reference and receipt are required; a missing/foreign proof is rejected.
- [ ] The GCash receipt is reachable only by an admin through the private proof route; an anonymous/customer request is denied.
- [ ] Card checkout (test mode): the customer is redirected to Stripe; completing payment moves the order to `PAID`; manual admin "mark paid" is unavailable.
- [ ] Stripe `checkout.session.expired` and `async_payment_failed` cancel the order and restore stock once.
- [ ] An unpaid card order older than 30 minutes is expired by the cron route and stock is restored.
- [ ] `/checkout/success/<order>` is ownership-protected and does not expose another customer's order.

### Customer account

- [ ] `/account/orders` shows only the signed-in customer's orders.
- [ ] Order detail shows the correct items, shipping snapshot, payment method, and timeline after admin updates.
- [ ] Another customer's order number returns not found.
- [ ] Address create/edit/delete/default works; exactly one default remains; checkout can reuse saved addresses.
- [ ] Validation rejects invalid PH phone numbers, postal codes, and short street lines.

### Admin console

- [ ] Dashboard metrics, 30-day chart, low-stock list, and recent orders load with correct PHP formatting.
- [ ] Product search by name and SKU, pagination, create, edit, variant changes, and stock adjustment work.
- [ ] Publishing without an active variant or described image is rejected.
- [ ] Product archive hides the item from the storefront without breaking existing orders.
- [ ] Deleting a product with order history is blocked; archive is the safe path.
- [ ] Order search/status filters work; payment method, receipt state, totals, and event timeline are correct.
- [ ] Allowed order transitions work; invalid transitions are rejected.
- [ ] Cancelling a pending/paid order restores stock once; a repeated cancellation cannot double-restore.
- [ ] Checkout, order, and product changes appear on customer/admin surfaces after revalidation.

### Platform

- [ ] `GET /api/health` returns `200` and only liveness fields.
- [ ] `GET /api/cron/expire-orders` returns `401` without `Authorization: Bearer <CRON_SECRET>`.
- [ ] Vercel logs show no secrets, passwords, full card data, or receipt URLs.
- [ ] Stripe webhook deliveries succeed in the Stripe dashboard.
- [ ] `/sitemap.xml` and `/robots.txt` use the production origin and exclude private routes.
- [ ] Security headers are present (`CSP`, `X-Frame-Options`, `nosniff`, referrer policy).
- [ ] Uptime monitor is watching `/api/health` and the storefront.

## Rollback procedure

### Application rollback

1. In Vercel, open **Deployments**, select the last known-good deployment, and promote/roll back to it.
2. Verify `/api/health`, the storefront, login, and checkout immediately.
3. Keep the previous deployment available until the incident is understood.

### Database rollback

Migrations are forward-only; there are no down migrations. Choose the narrowest safe recovery:

- **Bad application code:** roll back Vercel first. If the schema is backward compatible, do not touch the database.
- **Bad migration:** stop writes (maintenance page or disable checkout), take a snapshot, and restore the affected database/branch from Neon point-in-time recovery or a verified logical backup.
- **Data corruption:** restore to a separate branch first, inspect it, then promote/switch `DATABASE_URL` and `DIRECT_URL` deliberately.
- **Payment/stock inconsistency:** do not bulk-edit orders in the database. Use the admin transition actions where valid, and reconcile stock with a reviewed SQL transaction after identifying affected variants. Preserve the order event trail.

After a database restore:

1. Load the storefront and admin dashboard to confirm restored database connectivity.
2. Confirm the Stripe webhook secret and endpoint still match the restored environment.
3. Reconcile orders paid during the outage with Stripe/GCash statements.
4. Rotate any credentials that may have been exposed.

### Feature kill switches

- **Disable card payments:** remove `STRIPE_SECRET_KEY` and/or `STRIPE_WEBHOOK_SECRET` from the environment and redeploy. The card option disappears and the webhook returns `503`.
- **Disable uploads:** remove one Cloudinary credential. Uploads fail closed; COD remains available.
- **Disable cron:** remove `CRON_SECRET`; the endpoint returns `503`. Card orders may remain pending until manually cancelled.
- **Maintenance mode:** use the hosting platform's firewall/maintenance response or temporarily deploy a maintenance branch. Do not delete production data to “reset” the store.

## Backups and point-in-time recovery

Neon keeps a restore window determined by the project/plan. Confirm the actual retention before launch and record it in the launch notes.

Expectations:

- Enable point-in-time recovery/history for the production branch.
- Keep at least one automated logical backup outside the primary region/provider if the plan or business requirements demand it (`pg_dump`/`pg_dumpall` to encrypted object storage).
- Test a restore into a separate branch at least quarterly.
- Verify that backups include users, addresses, orders, order items/events, products/variants/images, reviews, and media metadata. Cloudinary assets are external; confirm their retention/backup separately.
- Encrypt backups at rest and restrict access to the backup bucket.
- Never restore production data into a preview environment without anonymising PII.
- Retain order and payment records for the period required by Philippine tax/accounting rules and the business's legal advice.

## Incident response

### Suspected secret exposure

1. Rotate the affected secret: `AUTH_SECRET`, Cloudinary, Stripe, or `CRON_SECRET`.
2. Rotating `AUTH_SECRET` signs out all JWT sessions; confirm that is acceptable or communicate it.
3. Revoke the old Stripe webhook endpoint and Cloudinary key.
4. Review Vercel/Stripe/Cloudinary/Neon logs for misuse.
5. Check admin users and role changes in the database.

### Suspected account takeover

1. Disable/suspend the account or rotate its password hash through a controlled script.
2. Review its orders, addresses, reviews, and admin events.
3. If an admin is affected, rotate `AUTH_SECRET`, audit recent product/order changes, and notify the business owner.
4. Preserve logs before cleanup.

### Payment disputes and chargebacks

Card refunds and disputes are handled in Stripe, not in this application. Reconcile the order status manually through the admin flow where valid, and keep a written record outside the app. GCash reversals are manual.

## Pre-launch business and legal inputs

This application provides software controls, not legal advice. The business owner and Philippine counsel should confirm the following before accepting real orders.

### Legal and compliance

- [ ] Business registration, TIN, and invoicing/tax treatment (including VAT and excise where applicable).
- [ ] Legal review of online nicotine/vape sales, advertising, flavour restrictions, packaging, and delivery rules in the Philippines.
- [ ] 21+ age-verification wording, delivery ID checks, refusal/return policy for underage recipients, and staff procedure.
- [ ] Nicotine warning text and placement; product labels and packaging compliance.
- [ ] Privacy notice, terms of sale, returns/refunds policy, shipping policy, and cookie/storage disclosure.
- [ ] Data retention and deletion policy for accounts, orders, addresses, IDs, and payment proofs.
- [ ] Acceptable-use and review moderation policy.
- [ ] Consumer-protection and distance-selling disclosures (business name, address, contact, pricing, delivery timelines).

### Support and operations

- [ ] Support email, phone, hours, and escalation owner. Defaults live in `lib/config.ts`.
- [ ] Business address and legal name. Defaults live in `lib/config.ts`.
- [ ] Shipping courier(s), coverage areas, cut-off times, delivery SLA, failed-delivery process, and who pays return shipping.
- [ ] Flat shipping fee and free-shipping threshold. Defaults: ₱99 and ₱2,500.
- [ ] COD eligibility rules, maximum COD order value, and cash-handling reconciliation.
- [ ] Inventory owner, stocktake cadence, low-stock thresholds, and out-of-stock substitution policy.
- [ ] Order cancellation/refund authority and who may use the admin console.
- [ ] Incident/on-call contact and backup admin.

### Payments

- [ ] GCash business account name/number or QR, verification owner, cutoff, reference format, and reconciliation spreadsheet/process.
- [ ] Stripe account business verification, statement descriptor, payout bank account, live keys, and live webhook endpoint.
- [ ] Who reviews GCash receipts, how duplicate references are investigated, and how refunds/chargebacks are handled.
- [ ] Tax invoices/receipts and record retention for COD, GCash, and card payments.

### Data and media

- [ ] Cloudinary plan, retention, and access controls. Confirm GCash proof assets remain `authenticated`.
- [ ] Product photography rights, alt text, and image optimisation.
- [ ] Demo data removed from production; seed password rotated; no test customer/admin remains.
- [ ] Backup/PITR retention recorded and restore owner assigned.

## Demo-data cleanup (if accidentally seeded)

If `SEED_DEMO_DATA=true` was run against a real database, stop the app, take a backup, and review before deleting anything. Demo records use:

- Customer: `demo.customer@vapordistrict.ph`
- Orders: `VD-1001` through `VD-1008`
- Products: the slugs in `prisma/seed.ts` (for example `mango-ice-nic-salt`, `aurora-pod-kit`)
- Media: public IDs under `demo/products/*` and `demo/proofs/*`

Delete only records confirmed to be demo data, in dependency order, and re-run inventory reconciliation afterward. Never bulk-delete orders solely by prefix without checking real customer data.

## Launch sign-off

| Area | Owner | Signed off |
| --- | --- | --- |
| Legal/terms/privacy/nicotine compliance |  |  |
| Payments (Stripe live, GCash reconciliation) |  |  |
| Shipping/COD/courier process |  |  |
| Catalog, pricing, stock, imagery |  |  |
| Admin accounts and support rota |  |  |
| Backups, rollback, monitoring |  |  |
| Production smoke test |  |  |

Keep this table with the release record and revisit it after any material change to payments, shipping, or the regulatory environment.
