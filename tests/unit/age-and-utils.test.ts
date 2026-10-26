import { describe, expect, it } from "vitest";
import {
  createAgeVerificationValue,
  isAgeVerificationValid,
} from "@/lib/age-verification";
import { safeCallbackUrl, getInitials, slugify } from "@/lib/utils";

describe("age verification", () => {
  it("accepts a current, versioned acknowledgement", () => {
    const now = Date.now();
    expect(isAgeVerificationValid(createAgeVerificationValue(now), now)).toBe(true);
  });

  it("rejects expired acknowledgements", () => {
    const now = Date.now();
    const fortyDaysAgo = now - 40 * 24 * 60 * 60 * 1000;
    expect(isAgeVerificationValid(createAgeVerificationValue(fortyDaysAgo), now)).toBe(false);
  });

  it("rejects future, malformed, missing, and wrong-version values", () => {
    const now = Date.now();
    expect(isAgeVerificationValid(createAgeVerificationValue(now + 60_000), now)).toBe(false);
    expect(isAgeVerificationValid("v1.not-a-number", now)).toBe(false);
    expect(isAgeVerificationValid("v2.123", now)).toBe(false);
    expect(isAgeVerificationValid("", now)).toBe(false);
    expect(isAgeVerificationValid(undefined, now)).toBe(false);
  });
});

describe("safe callback URLs", () => {
  it("allows same-site relative paths with query and hash", () => {
    expect(safeCallbackUrl("/account/orders?page=2#latest")).toBe(
      "/account/orders?page=2#latest",
    );
  });

  it("rejects absolute, protocol-relative, and backslash tricks", () => {
    expect(safeCallbackUrl("https://evil.example")).toBe("/");
    expect(safeCallbackUrl("//evil.example")).toBe("/");
    expect(safeCallbackUrl("/\\evil.example")).toBe("/");
    expect(safeCallbackUrl("javascript:alert(1)")).toBe("/");
    expect(safeCallbackUrl("")).toBe("/");
    expect(safeCallbackUrl(null)).toBe("/");
  });
});

describe("presentation helpers", () => {
  it("derives initials and slugs", () => {
    expect(getInitials("Mika Santos")).toBe("MS");
    expect(getInitials(null)).toBe("VD");
    expect(slugify("Mango Ice — 30mg!")).toBe("mango-ice-30mg");
  });
});
