import {
  adminCredentials,
  expect,
  hasAdminCredentials,
  login,
  test,
} from "./fixtures";

test.describe("admin product validation", () => {
  test.skip(!hasAdminCredentials(), "Set E2E_ADMIN_EMAIL/PASSWORD or seed admin credentials.");

  test("keeps a product open and blocks publishing without images", async ({ page }) => {
    await login(page, adminCredentials, "/admin/products");
    await expect(page.getByRole("heading", { name: "Products", level: 1 })).toBeVisible();

    await page.getByRole("button", { name: "Add product" }).first().click();

    const dialog = page.getByRole("dialog", { name: "Add product" });
    await expect(dialog).toBeVisible();

    const suffix = Date.now().toString(36);
    const productName = `E2E Draft ${suffix}`;

    await dialog.getByLabel("Name", { exact: true }).fill(productName);
    await dialog.getByLabel("Brand", { exact: true }).fill("E2E Lab");
    await dialog
      .getByLabel("Short description", { exact: true })
      .fill("A temporary product that must not be published.");
    await dialog
      .getByLabel("Full description", { exact: true })
      .fill("This description is long enough to satisfy the product validation rules.");
    await dialog.getByLabel("Label", { exact: true }).fill("30mg · 30ml");
    await dialog.getByLabel("SKU", { exact: true }).fill(`E2E-${suffix}`);
    await dialog.getByLabel("Price (₱)", { exact: true }).fill("199.00");
    await dialog.getByLabel("Stock", { exact: true }).fill("5");
    await dialog.getByLabel("Low-stock at", { exact: true }).fill("2");

    await dialog.getByText("Published to storefront", { exact: true }).click();
    await dialog.getByRole("button", { name: "Save product" }).click();

    await expect(
      dialog.getByText("Add at least one image with alt text before publishing."),
    ).toBeVisible();
    await expect(
      dialog.getByText("Check the product details and try again."),
    ).toBeVisible();
    await expect(dialog.getByLabel("Name", { exact: true })).toHaveValue(productName);
    await expect(page).toHaveURL(/\/admin\/products$/);

    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
  });
});
