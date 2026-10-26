import { demoSeedEnabled, expect, test } from "./fixtures";

test.describe("variant cart", () => {
  test.skip(!demoSeedEnabled, "Requires SEED_DEMO_DATA=true and seeded demo products.");

  test("adds the selected variant, persists across reloads, and removes cleanly", async ({
    page,
  }) => {
    await page.goto("/products/mango-ice-nic-salt");

    await expect(page.getByRole("heading", { name: "Mango Ice", level: 1 })).toBeVisible();

    const quantity = page.getByRole("group", { name: "Product quantity" });

    // Selecting a different variant resets quantity to one.
    await page.getByRole("button", { name: /50mg · 30ml/ }).click();
    await expect(quantity).toContainText("1");
    await page.getByRole("button", { name: "Increase product quantity" }).click();
    await expect(quantity).toContainText("2");

    await page.getByRole("button", { name: "Add 2 to cart" }).click();

    const sheet = page.getByRole("dialog", { name: /Your cart/ });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText("Mango Ice", { exact: true })).toBeVisible();
    await expect(sheet.getByText("50mg · 30ml", { exact: true })).toBeVisible();

    await sheet.getByRole("link", { name: "View cart" }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByRole("heading", { name: "Your cart", level: 1 })).toBeVisible();
    await expect(page.getByText("2 items in your bag")).toBeVisible();
    await expect(page.getByText("Mango Ice", { exact: true })).toBeVisible();
    await expect(page.getByText(/50mg · 30ml/)).toBeVisible();

    // Zustand persistence is keyed on the browser origin.
    await page.reload();
    await expect(page.getByText("2 items in your bag")).toBeVisible();

    await page.getByRole("button", { name: "Increase Mango Ice quantity" }).click();
    await expect(page.getByText("3 items in your bag")).toBeVisible();

    await page.getByRole("button", { name: "Remove Mango Ice" }).click();
    await expect(page.getByText("Your cart is empty.")).toBeVisible();
    await expect(page.getByText("Nothing in your bag yet")).toBeVisible();
  });

  test("disabled variants cannot be added to the cart", async ({ page }) => {
    await page.goto("/products/aurora-pod-kit");

    const soldOut = page.getByRole("button", { name: /Frost Silver/ });
    await expect(soldOut).toBeDisabled();
    await expect(soldOut).toContainText("Sold out");
  });
});
