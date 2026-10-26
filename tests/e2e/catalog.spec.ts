import { demoSeedEnabled, expect, test } from "./fixtures";

test.describe("catalog filtering", () => {
  test.skip(!demoSeedEnabled, "Requires SEED_DEMO_DATA=true and seeded demo products.");

  test("combines search, category, and empty-state filters with URL state", async ({ page }) => {
    await page.goto("/products");

    await expect(
      page.getByRole("heading", { name: "Shop all products", level: 1 }),
    ).toBeVisible();

    const search = page.getByRole("searchbox", { name: "Search products" });
    const resultCount = page.getByText(/of \d+ products/);

    await search.fill("Mango Ice");
    await expect(page).toHaveURL(/[?&]q=Mango(\+|%20)Ice/);
    await expect(page.getByRole("link", { name: "Mango Ice", exact: true })).toBeVisible();
    await expect(resultCount).toHaveText(/1 of \d+ products/);

    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(search).toHaveValue("");

    await page.getByRole("combobox", { name: "Category" }).click();
    await page.getByRole("option", { name: "Pod Systems" }).click();
    await expect(page).toHaveURL(/[?&]category=pod-systems/);
    await expect(
      page.getByRole("heading", { name: "Pod Systems", level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Aurora Pod Kit", exact: true })).toBeVisible();

    await search.fill("zzzz-no-match");
    await expect(page).toHaveURL(/[?&]q=zzzz-no-match/);
    await expect(page.getByText("Nothing matches those filters.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset filters" })).toBeVisible();

    await page.getByRole("button", { name: "Reset filters" }).click();
    await expect(
      page.getByRole("heading", { name: "Shop all products", level: 1 }),
    ).toBeVisible();
    await expect(search).toHaveValue("");
    await expect(page).not.toHaveURL(/category=/);
    await expect(page).not.toHaveURL(/q=/);
  });
});
