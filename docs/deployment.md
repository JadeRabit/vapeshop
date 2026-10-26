# Deployment guide

This guide takes a clean checkout to a production deployment on Vercel with Neon PostgreSQL, Cloudinary media, and Stripe card payments. COD and GCash work without Stripe/Cloudinary; GCash receipt upload requires Cloudinary.

For launch-day checks, rollback, backups, and business inputs, see [operations.md](operations.md).

## Deployment topology

```text
Browser
  │
  ├── Vercel / Next.js (Node runtime)
  │     ├── Auth.js credentials sessions (JWT)
  │     ├── Server Actions and dynamic server-rendered pages
  │     ├── /api/stripe/webhook
  │     ├── /api/cron/expire-orders
  │     ├── /api/uploads/sign
  │     ├── /api/admin/payment-proof/[orderId]
  │     └── /api/health
  │
  ├── Neon PostgreSQL (pooled runtime URL, direct migration URL)
  ├── Cloudinary (public product images, authenticated GCash proofs)
  └── Stripe hosted Checkout + webhook
```

The build does not run migrations and does not query the database. Dynamic database-backed routes require a reachable database at runtime.

## 1. Create the PostgreSQL database

Neon is recommended because the application uses the Neon serverless adapter when `DATABASE_URL` contains `neon.tech`.

1. Create a Neon project and a production database.
2. Copy two connection strings:
   - **Pooled** connection (host contains `-pooler`) → `DATABASE_URL`
   - **Direct** connection (no pooler) → `DIRECT_URL`
3. Keep `sslmode=require` on both. Never disable TLS in production.
4. Optionally create a separate Neon branch/database for previews.

The runtime Prisma client uses the pooled URL and the Neon WebSocket adapter. Prisma CLI migrations and the seed script use the direct URL. Apply committed migrations from a trusted machine or CI job:

```bash
DATABASE_URL="postgresql://…-pooler…" \
DIRECT_URL="postgresql://…direct…" \
npm run db:migrate:deploy
```

On PowerShell, set the environment variables before the command or place them in `.env` and run:

```powershell
npm run db:migrate:deploy
```

Do not use `prisma db push` in production. It bypasses the migration history. Do not add migrations to the Vercel build command: a failed migration should not leave a deployment half-live, and preview builds must not mutate production data.

### Migration policy

- Back up/snapshot before destructive migrations.
- Prefer expand/contract changes: add nullable columns, backfill, deploy code, then remove old columns in a later release.
- Review the SQL in `prisma/migrations` before applying.
- Never edit a migration that has already been applied to a shared environment.
- The initial migration is `prisma/migrations/20261026133000_init`.

## 2. Configure Vercel environment variables

Set values per environment (Production, Preview, Development) in **Project → Settings → Environment Variables**. Do not commit `.env`.

| Variable | Production | Preview | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | Required | Separate branch/database | Pooled URL |
| `DIRECT_URL` | Required | Separate branch/database | Direct URL; used by tooling |
| `AUTH_SECRET` | Required | Required, different value | Long random secret |
| `NEXTAUTH_SECRET` | Optional fallback | Optional | Leave unset when using `AUTH_SECRET` |
| `AUTH_URL` | Recommended | Preview URL | Canonical auth origin |
| `AUTH_TRUST_HOST` | `true` | `true` | Required behind proxies/self-hosting |
| `NEXT_PUBLIC_APP_URL` | Required | Preview URL | No trailing slash |
| `CLOUDINARY_CLOUD_NAME` | Recommended | Separate cloud/folder | Uploads disabled if absent |
| `CLOUDINARY_API_KEY` | Recommended | Same | Server-only |
| `CLOUDINARY_API_SECRET` | Recommended | Same | Server-only |
| `STRIPE_SECRET_KEY` | Recommended | Test key | Use test keys in preview |
| `STRIPE_WEBHOOK_SECRET` | Recommended | Test endpoint secret | Card disabled without both Stripe values |
| `CRON_SECRET` | Required | Optional | Protects `/api/cron/expire-orders` |
| `SEED_ADMIN_*` | Not needed at runtime | Not needed | Use only for a controlled seed job |
| `SEED_DEMO_DATA` | `false` | `false` | Never seed demo data in production |

Generate the auth secret once per environment:

```bash
openssl rand -base64 32
```

Important:

- `NEXT_PUBLIC_APP_URL` must be the exact public origin, for example `https://vapordistrict.ph`. It is used for Stripe success/cancel URLs, metadata, sitemap, and robots.
- `AUTH_URL` should also be the canonical origin. Auth.js can infer the host on Vercel, but explicit values are safer when using custom domains.
- Keep `AUTH_SECRET`, Cloudinary, Stripe, and cron secrets server-side. Only `NEXT_PUBLIC_APP_URL` is public.
- Preview deployments should not share the production database. Use a Neon branch and Stripe test mode.

## 3. Configure Cloudinary

Cloudinary is required for admin product uploads and customer GCash receipts.

1. Create a Cloudinary account and note the cloud name, API key, and API secret.
2. Put all three values in the server environment.
3. No unsigned upload preset is required. The app signs server-side uploads through `/api/uploads/sign`:
   - Admin product images: public `upload` type under `vapeshop/products/<adminUserId>/`.
   - GCash receipts: `authenticated` type under `vapeshop/payment-proofs/<userId>/`.
4. Keep the API secret out of client code and logs.
5. GCash proofs are delivered only through the admin-only route, which creates a five-minute signed URL. Do not make the `payment-proofs` folder public or configure a public CDN path for it.

The browser accepts JPG, PNG, and WebP. Product images are limited to 10 MB; GCash receipts to 5 MB.

If Cloudinary is absent, product publishing without images is blocked and GCash checkout explains that receipt upload is unavailable. COD still works.

## 4. Configure Stripe

Stripe is optional. Card payment is enabled only when both `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are present.

1. Create or use a Stripe account and complete business verification before going live.
2. Start in test mode.
3. Add `STRIPE_SECRET_KEY` (`sk_test_…` first).
4. Create a webhook endpoint:
   - URL: `https://YOUR_DOMAIN/api/stripe/webhook`
   - Events:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.expired`
     - `checkout.session.async_payment_failed`
5. Copy the endpoint signing secret (`whsec_…`) into `STRIPE_WEBHOOK_SECRET`.
6. Complete a test purchase and verify the order becomes `PAID` only through the webhook.
7. When ready, switch to live keys and create a separate live webhook endpoint.

The webhook verifies the raw request body with the signature and runs on the Node runtime. It is idempotent: repeated paid/expired events do not double-restore stock or overwrite terminal states. Admin retries reuse an open Checkout Session, and an expired session can only cancel the order it is still attached to. Manual admin changes to `PAID` for card orders are intentionally blocked.

For local webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Use the test webhook secret printed by the Stripe CLI.

### Stripe URLs

The Checkout Session is created with:

- Success: `${NEXT_PUBLIC_APP_URL}/checkout/success/<orderNumber>?session_id=…`
- Cancel: `${NEXT_PUBLIC_APP_URL}/checkout?cancelled=1`

If `NEXT_PUBLIC_APP_URL` is wrong, Stripe can redirect customers to the wrong host.

## 5. Configure the Vercel project

1. Import the repository into Vercel.
2. Framework preset: Next.js.
3. Build command: `npm run build` (default).
4. Install command: `npm install`.
5. Output: Next.js default.
6. Add the environment variables from the table above.
7. Deploy.

`vercel.json` contains the cleanup schedule:

```json
{
  "crons": [{ "path": "/api/cron/expire-orders", "schedule": "*/15 * * * *" }]
}
```

Vercel invokes the route with `Authorization: Bearer <CRON_SECRET>` when `CRON_SECRET` is configured. The endpoint rejects requests without that header.

**Plan limitation:** cron frequency depends on the Vercel plan. If the 15-minute schedule is not available on the selected plan, use an external scheduler (for example GitHub Actions, Upstash QStash, or a small VPS cron) that calls:

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  https://YOUR_DOMAIN/api/cron/expire-orders
```

The route returns JSON with `expired` and `checked` counts and is safe to call repeatedly. It expires pending card orders older than 30 minutes, cancels them atomically, and restores stock once.

## 6. Deploy and seed the admin

A recommended first release sequence:

```bash
# Locally or in CI, with production credentials in .env
npm ci
npm run db:migrate:deploy
SEED_ADMIN_EMAIL="admin@yourdomain.ph" \
SEED_ADMIN_PASSWORD="use-a-unique-strong-password" \
SEED_ADMIN_NAME="Store Admin" \
SEED_DEMO_DATA="false" \
npm run db:seed
```

Then deploy the application (Git push or CLI):

```bash
npx vercel --prod
```

The seed:

- Upserts the six categories.
- Creates or promotes the admin account.
- Resets that admin's password to `SEED_ADMIN_PASSWORD` on every run.
- Skips demo data unless `SEED_DEMO_DATA=true`.

After seeding, sign in at `/login` and verify the `/admin` dashboard. Do not leave seed credentials in a shared shell history or CI log. Rotate the admin password by rerunning the seed with a new value, or update the bcrypt hash through a controlled script.

## 7. Health and observability

- `GET /api/health` returns application liveness only (`status`, `service`, timestamp) with `Cache-Control: no-store`. It deliberately does not expose database state or secrets.
- `GET /api/cron/expire-orders` returns counts and requires the cron bearer secret.
- Stripe webhook failures are logged server-side without returning stack traces.
- Use Vercel function logs and Neon query/monitoring views for launch monitoring.
- Add an uptime monitor for `/api/health`, the storefront, and `/login`.
- Add a platform WAF/rate-limit rule in front of `/login`, `/register`, and `/api/auth/*`; the built-in limiter is best-effort and not durable across serverless instances.

## 8. Preview environments

For each preview deployment:

- Use a Neon branch, not the production database.
- Use Stripe test keys and a test webhook endpoint.
- Use a separate Cloudinary folder/cloud if demo media should not mix with production.
- Set `NEXT_PUBLIC_APP_URL` and `AUTH_URL` to the preview URL.
- Never set `SEED_DEMO_DATA=true` against a shared production database.

## 9. Deployment checklist

- [ ] Production Neon database created; pooled and direct URLs stored.
- [ ] `npm run db:migrate:deploy` succeeded against the production direct URL.
- [ ] Admin seeded with a unique password.
- [ ] `AUTH_SECRET`, `AUTH_URL`, and `NEXT_PUBLIC_APP_URL` set for Production.
- [ ] Cloudinary credentials set; product upload and GCash proof preview tested.
- [ ] Stripe live keys and live webhook endpoint configured; test payment verified.
- [ ] `CRON_SECRET` set; cron endpoint returns `401` without the bearer token.
- [ ] `/api/health` returns `200` with no database details.
- [ ] Vercel cron plan/limit confirmed, or an external scheduler is configured.
- [ ] Custom domain and TLS active; canonical URLs match `NEXT_PUBLIC_APP_URL`.
- [ ] Demo data disabled; no test accounts remain.
- [ ] Smoke test in [operations.md](operations.md) passed.
- [ ] Backups/PITR and rollback owner confirmed.
