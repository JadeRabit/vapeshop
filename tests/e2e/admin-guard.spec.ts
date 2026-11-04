import {
  adminCredentials,
  adminLogin,
  customerCredentials,
  expect,
  hasAdminCredentials,
  hasCustomerCredentials,
  login,
  test,
} from "./fixtures";

test.describe("admin access control", () => {
  test("anonymous visitors are redirected to the admin login with a callback", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login\?callbackUrl=%2Fadmin/);
    await expect(page.getByRole("heading", { name: "Administrator access." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Use storefront sign in" })).toBeVisible();
  });

  test("signed-in customers cannot enter the admin console", async ({ page }) => {
    test.skip(!hasCustomerCredentials(), "Set customer credentials or enable demo seed.");

    await login(page, customerCredentials);
    await page.goto("/admin");

    await expect(page).toHaveURL(/error=forbidden/);
    await expect(page).not.toHaveURL(/\/admin/);
  });

  test("administrators can reach the dashboard", async ({ page }) => {
    test.skip(!hasAdminCredentials(), "Set E2E_ADMIN_EMAIL/PASSWORD or seed admin credentials.");

    await adminLogin(page, adminCredentials, "/admin");

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Overview", level: 1 })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Admin" })).toBeVisible();
  });
});
