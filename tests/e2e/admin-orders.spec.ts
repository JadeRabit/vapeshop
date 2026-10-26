import { PrismaClient } from "@prisma/client";
import { siteConfig } from "../../lib/config";
import {
  adminCredentials,
  customerCredentials,
  expect,
  hasAdminCredentials,
  hasCustomerCredentials,
  login,
  test,
} from "./fixtures";

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const skipReason = !hasAdminCredentials()
  ? "Set E2E_ADMIN_EMAIL/PASSWORD or seed admin credentials."
  : !hasCustomerCredentials()
    ? "Set E2E_CUSTOMER_EMAIL/PASSWORD or enable demo seed."
    : !databaseUrl
      ? "DATABASE_URL or DIRECT_URL is required for the E2E order fixture."
      : null;

test.describe("admin order status transitions", () => {
  test.skip(Boolean(skipReason), skipReason ?? "");

  let db: PrismaClient;
  let orderNumber: string;

  test.beforeAll(async () => {
    db = new PrismaClient({ datasourceUrl: databaseUrl });

    const customer = await db.user.findUnique({
      where: { email: customerCredentials.email },
      select: { id: true, name: true, email: true },
    });
    if (!customer) {
      throw new Error(
        `E2E customer ${customerCredentials.email} was not found. Run npm run db:seed with SEED_DEMO_DATA=true or set E2E_CUSTOMER_EMAIL.`,
      );
    }

    const variant = await db.productVariant.findFirst({
      where: { isActive: true, product: { isActive: true } },
      include: { product: { select: { name: true } } },
      orderBy: { sku: "asc" },
    });
    if (!variant) {
      throw new Error("No active product variant is available for the E2E order fixture.");
    }

    const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    orderNumber = `E2E-${suffix.toUpperCase()}`;

    const subtotalCentavos = variant.priceCentavos;
    const shippingCentavos =
      subtotalCentavos >= siteConfig.freeShippingThresholdCentavos
        ? 0
        : siteConfig.shippingFlatCentavos;

    await db.order.create({
      data: {
        orderNumber,
        userId: customer.id,
        status: "PENDING",
        paymentMethod: "COD",
        subtotalCentavos,
        shippingCentavos,
        totalCentavos: subtotalCentavos + shippingCentavos,
        shippingAddress: {
          recipientName: customer.name ?? "E2E Customer",
          phone: "09171234567",
          line1: "42 Mabini Street",
          barangay: "Poblacion",
          city: "Makati City",
          province: "Metro Manila",
          postalCode: "1210",
          country: "PH",
        },
        contactName: customer.name ?? "E2E Customer",
        contactEmail: customer.email,
        contactPhone: "09171234567",
        idempotencyKey: `e2e-${orderNumber}`,
        items: {
          create: {
            variantId: variant.id,
            productName: variant.product.name,
            variantLabel: variant.label,
            sku: variant.sku,
            unitPriceCentavos: variant.priceCentavos,
            quantity: 1,
            lineTotalCentavos: variant.priceCentavos,
          },
        },
        events: {
          create: {
            fromStatus: null,
            toStatus: "PENDING",
            note: "E2E fixture order placed.",
          },
        },
      },
    });
  });

  test.afterAll(async () => {
    if (!db) return;
    if (orderNumber) {
      await db.order.delete({ where: { orderNumber } }).catch(() => undefined);
    }
    await db.$disconnect();
  });

  test("moves a COD order through paid, shipped, and delivered", async ({ page }) => {
    await login(page, adminCredentials, `/admin/orders/${orderNumber}`);

    await expect(page.getByRole("heading", { name: "Investigate & fulfil" })).toBeVisible();
    await expect(page.getByText(`Order ${orderNumber}`)).toBeVisible();
    await expect(page.getByText("Current status: Pending.")).toBeVisible();

    await page.getByRole("button", { name: "Mark paid" }).click();
    await expect(page.getByText("Current status: Paid.")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "Mark shipped" })).toBeVisible();

    await page.getByRole("button", { name: "Mark shipped" }).click();
    await expect(page.getByText("Current status: Shipped.")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "Mark delivered" })).toBeVisible();

    await page.getByRole("button", { name: "Mark delivered" }).click();
    await expect(page.getByText("Current status: Delivered.")).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByText("No further status changes are available for this order."),
    ).toBeVisible();

    await expect(page.getByText("Pending → Paid")).toBeVisible();
    await expect(page.getByText("Paid → Shipped")).toBeVisible();
    await expect(page.getByText("Shipped → Delivered")).toBeVisible();
    await expect(page.getByText("Delivered and cash collected.")).toBeVisible();

    const updated = await db.order.findUniqueOrThrow({
      where: { orderNumber },
      include: { events: { orderBy: { createdAt: "asc" } } },
    });

    expect(updated.status).toBe("DELIVERED");
    expect(updated.paidAt).not.toBeNull();
    expect(updated.shippedAt).not.toBeNull();
    expect(updated.deliveredAt).not.toBeNull();
    expect(updated.events).toHaveLength(4);
    expect(updated.events.map((event) => event.toStatus)).toEqual([
      "PENDING",
      "PAID",
      "SHIPPED",
      "DELIVERED",
    ]);
  });
});
