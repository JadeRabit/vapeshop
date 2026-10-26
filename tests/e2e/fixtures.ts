import { test as base, expect, type Page } from "@playwright/test";
import { siteConfig } from "../../lib/config";

const AGE_COOKIE_MAX_AGE_SECONDS = siteConfig.ageCookieDays * 24 * 60 * 60;

export const demoSeedEnabled = process.env.SEED_DEMO_DATA === "true";

export const adminCredentials = {
  email: process.env.E2E_ADMIN_EMAIL ?? process.env.SEED_ADMIN_EMAIL ?? "",
  password: process.env.E2E_ADMIN_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD ?? "",
};

export const customerCredentials = {
  email:
    process.env.E2E_CUSTOMER_EMAIL ??
    (demoSeedEnabled ? "demo.customer@vapordistrict.ph" : ""),
  password:
    process.env.E2E_CUSTOMER_PASSWORD ?? (demoSeedEnabled ? "DemoCustomer123" : ""),
};

export function hasAdminCredentials() {
  return Boolean(adminCredentials.email && adminCredentials.password);
}

export function hasCustomerCredentials() {
  return Boolean(customerCredentials.email && customerCredentials.password);
}

/**
 * Every spec except the age-gate spec gets a context that is already age
 * verified. The cookie satisfies the server layout and localStorage satisfies
 * the client-side re-check.
 */
export const test = base.extend({
  context: async ({ context, baseURL }, run) => {
    const now = Date.now();
    const cookieValue = `v${siteConfig.ageStorageVersion}.${now}`;
    const storedValue = JSON.stringify({
      version: siteConfig.ageStorageVersion,
      acceptedAt: now,
      expiresAt: now + AGE_COOKIE_MAX_AGE_SECONDS * 1000,
    });

    await context.addCookies([
      {
        name: siteConfig.ageCookieName,
        value: cookieValue,
        url: new URL(baseURL ?? "http://localhost:3000").origin,
        path: "/",
        sameSite: "Lax",
        expires: Math.floor((now + AGE_COOKIE_MAX_AGE_SECONDS * 1000) / 1000),
      },
    ]);

    await context.addInitScript(
      ({ name, value }) => {
        try {
          window.localStorage.setItem(name, value);
        } catch {
          // Storage can be unavailable on opaque origins; the test will fail
          // loudly at the age gate instead of crashing the context.
        }
      },
      { name: siteConfig.ageCookieName, value: storedValue },
    );

    await run(context);
  },
});

export { expect };

export async function login(
  page: Page,
  credentials: { email: string; password: string },
  callbackUrl?: string,
) {
  const loginPath = callbackUrl
    ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/login";

  await page.goto(loginPath);
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();

  await page.getByLabel("Email address").fill(credentials.email);
  await page.getByLabel("Password", { exact: true }).fill(credentials.password);

  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 30_000 }),
    page.getByRole("button", { name: "Sign in", exact: true }).click(),
  ]);
}

export function ageCookieValue(now = Date.now()) {
  return `v${siteConfig.ageStorageVersion}.${now}`;
}
