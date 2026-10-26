import {
  customerCredentials,
  demoSeedEnabled,
  expect,
  hasCustomerCredentials,
  login,
  test,
} from "./fixtures";

test.describe("checkout access", () => {
  test.skip(!demoSeedEnabled, "Requires SEED_DEMO_DATA=true and seeded demo products.");
  test.skip(!hasCustomerCredentials(), "Set E2E_CUSTOMER_EMAIL/PASSWORD or enable demo seed.");

  test("redirects anonymous shoppers to sign in and returns them to checkout", async ({
    page,
  }) => {
    await page.goto("/products/mango-ice-nic-salt");
    await page.getByRole("button", { name: "Add 1 to cart" }).click();
    await expect(page.getByRole("dialog", { name: /Your cart/ })).toBeVisible();

    // Navigating directly proves the middleware guard, not just the cart UI.
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fcheckout/);
    await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();

    await login(page, customerCredentials);

    await expect(page).toHaveURL(/\/checkout$/);
    await expect(
      page.getByRole("heading", { name: "Finish your order", level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Delivery address" })).toBeVisible();
    await expect(page.getByText("Mango Ice", { exact: true }).first()).toBeVisible();
  });
});
