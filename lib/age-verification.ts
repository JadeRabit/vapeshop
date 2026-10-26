import { siteConfig } from "@/lib/config";

export function isAgeVerificationValid(value: string | undefined | null, now = Date.now()): boolean {
  if (!value) return false;
  const [version, timestamp] = value.split(".");
  if (version !== `v${siteConfig.ageStorageVersion}`) return false;
  const acceptedAt = Number(timestamp);
  if (!Number.isFinite(acceptedAt)) return false;

  const maxAge = siteConfig.ageCookieDays * 24 * 60 * 60 * 1000;
  const age = now - acceptedAt;
  return age >= 0 && age <= maxAge;
}

export function createAgeVerificationValue(now = Date.now()) {
  return `v${siteConfig.ageStorageVersion}.${now}`;
}

export const AGE_VERIFICATION_COOKIE_OPTIONS = {
  httpOnly: false,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: siteConfig.ageCookieDays * 24 * 60 * 60,
};
