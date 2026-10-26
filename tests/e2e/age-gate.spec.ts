import { expect, test } from "@playwright/test";
import { siteConfig } from "../../lib/config";
import { ageCookieValue } from "./fixtures";

test.describe("21+ age gate", () => {
  test("blocks entry, persists acceptance, and reopens when verification expires", async ({
    page,
    context,
  }) => {
    await page.goto("/");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Are you at least 21 years old?" }),
    ).toBeVisible();

    // The unresolved gate must not be dismissible with Escape.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();

    await page.getByRole("button", { name: /I am 21 or older/i }).click();
    await expect(dialog).toBeHidden();

    const cookie = (await context.cookies()).find(
      (item) => item.name === siteConfig.ageCookieName,
    );
    expect(cookie?.value).toBeTruthy();

    const stored = await page.evaluate(
      (name) => window.localStorage.getItem(name),
      siteConfig.ageCookieName,
    );
    expect(stored).toBeTruthy();

    // Acceptance survives a full reload.
    await page.reload();
    await expect(dialog).toBeHidden();

    // A stale localStorage record reopens the gate even while the cookie is
    // still valid. This prevents a partially cleared browser from bypassing it.
    await page.evaluate(
      ({ name, value }) => window.localStorage.setItem(name, value),
      {
        name: siteConfig.ageCookieName,
        value: JSON.stringify({
          version: siteConfig.ageStorageVersion,
          acceptedAt: 0,
          expiresAt: Date.now() - 60_000,
        }),
      },
    );
    await page.reload();
    await expect(dialog).toBeVisible();

    // Restore a valid acceptance, then remove the cookie so the server cannot
    // trust the visitor. The gate must render again on the next request.
    await page.getByRole("button", { name: /I am 21 or older/i }).click();
    await expect(dialog).toBeHidden();
    await context.clearCookies();
    await page.reload();
    await expect(dialog).toBeVisible();
  });

  test("sends under-21 visitors to the configured exit destination", async ({ page }) => {
    await page.route(/^https:\/\/www\.google\.com\//, (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<!doctype html><title>Exit</title><h1>You have left the store.</h1>",
      }),
    );

    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Are you at least 21 years old?" }),
    ).toBeVisible();

    await page.getByRole("button", { name: /I am under 21/i }).click();
    await expect(page).toHaveURL(/^https:\/\/www\.google\.com\//);
  });

  test("expired cookies are ignored", async ({ page, context, baseURL }) => {
    const expired = Date.now() - siteConfig.ageCookieDays * 24 * 60 * 60 * 1000 - 1;

    await context.addCookies([
      {
        name: siteConfig.ageCookieName,
        value: ageCookieValue(expired),
        url: new URL(baseURL ?? "http://localhost:3000").origin,
        path: "/",
        expires: Math.floor((Date.now() + 60_000) / 1000),
      },
    ]);

    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Are you at least 21 years old?" }),
    ).toBeVisible();
  });
});
