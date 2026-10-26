import { describe, expect, it } from "vitest";
import { checkoutInputSchema, checkoutQuoteSchema } from "@/lib/validators/checkout";
import { addressSchema } from "@/lib/validators/address";
import { reviewSchema } from "@/lib/validators/review";
import {
  productInputSchema,
  productVariantInputSchema,
  stockUpdateSchema,
} from "@/lib/validators/product";

const validBaseCheckout = {
  addressId: "addr_1",
  idempotencyKey: "6f6b4f4e-3c76-4a41-8f10-b96f1bf7a3b1",
  lines: [{ variantId: "variant_1", quantity: 2 }],
};

describe("checkout schemas", () => {
  it("accepts a valid COD checkout", () => {
    const result = checkoutInputSchema.safeParse({
      ...validBaseCheckout,
      paymentMethod: "COD",
    });
    expect(result.success).toBe(true);
  });

  it("requires a reference and proof for GCash", () => {
    const missing = checkoutInputSchema.safeParse({
      ...validBaseCheckout,
      paymentMethod: "GCASH",
      gcashReference: "",
    });
    expect(missing.success).toBe(false);
    if (!missing.success) {
      const paths = missing.error.issues.map((issue) => issue.path.join("."));
      expect(paths).toContain("gcashReference");
      expect(paths).toContain("paymentProofMediaId");
    }

    const valid = checkoutInputSchema.safeParse({
      ...validBaseCheckout,
      paymentMethod: "GCASH",
      gcashReference: " gc123456 ",
      paymentProofMediaId: "media_1",
    });
    expect(valid.success).toBe(true);
    if (valid.success) expect(valid.data.gcashReference).toBe("GC123456");
  });

  it("rejects empty carts, zero quantities, and invalid idempotency keys", () => {
    expect(checkoutQuoteSchema.safeParse({ lines: [] }).success).toBe(false);
    expect(
      checkoutQuoteSchema.safeParse({ lines: [{ variantId: "v", quantity: 0 }] }).success,
    ).toBe(false);
    expect(
      checkoutQuoteSchema.safeParse({ lines: [{ variantId: "v", quantity: 100 }] }).success,
    ).toBe(false);
    expect(
      checkoutInputSchema.safeParse({
        ...validBaseCheckout,
        paymentMethod: "COD",
        idempotencyKey: "not-a-uuid",
      }).success,
    ).toBe(false);
  });
});

describe("address schema", () => {
  const base = {
    recipientName: "Mika Santos",
    phone: "09171234567",
    line1: "42 Mabini Street",
    city: "Makati City",
    province: "Metro Manila",
    postalCode: "1210",
  };

  it("accepts a Philippine address and normalizes the phone", () => {
    const result = addressSchema.safeParse({ ...base, phone: "+63 917 123 4567" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.phone).toBe("+639171234567");
  });

  it("rejects invalid phones, postal codes, and short street lines", () => {
    expect(addressSchema.safeParse({ ...base, phone: "12345" }).success).toBe(false);
    expect(addressSchema.safeParse({ ...base, postalCode: "123" }).success).toBe(false);
    expect(addressSchema.safeParse({ ...base, line1: "abc" }).success).toBe(false);
  });
});

describe("product schemas", () => {
  const variant = {
    label: "30mg · 30ml",
    sku: "TL-MANGO-30",
    priceCentavos: 35000,
    stock: 10,
    lowStockThreshold: 5,
    isActive: true,
  };

  const draft = {
    name: "Mango Ice",
    slug: "mango-ice",
    brand: "Tropical Lab",
    categoryId: "cat_1",
    shortDescription: "Ripe mango with a cold exhale.",
    description: "A long enough product description for validation to accept this draft.",
    isFeatured: false,
    isActive: false,
    variants: [variant],
    images: [],
  };

  it("allows a draft without images but blocks publishing without them", () => {
    expect(productInputSchema.safeParse(draft).success).toBe(true);

    const publish = productInputSchema.safeParse({ ...draft, isActive: true });
    expect(publish.success).toBe(false);
    if (!publish.success) {
      expect(publish.error.issues.some((issue) => issue.path[0] === "images")).toBe(true);
    }
  });

  it("publishes when an active variant and described image exist", () => {
    const result = productInputSchema.safeParse({
      ...draft,
      isActive: true,
      images: [{ mediaId: "media_1", alt: "Mango Ice 30ml bottle", sortOrder: 0 }],
    });
    expect(result.success).toBe(true);
  });

  it("requires an active variant for publication", () => {
    const result = productInputSchema.safeParse({
      ...draft,
      isActive: true,
      variants: [{ ...variant, isActive: false }],
      images: [{ mediaId: "media_1", alt: "Mango Ice 30ml bottle" }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "variants")).toBe(true);
    }
  });

  it("rejects duplicate SKUs, duplicate images, and invalid slugs", () => {
    expect(
      productInputSchema.safeParse({
        ...draft,
        variants: [variant, { ...variant, label: "50mg" }],
      }).success,
    ).toBe(false);
    expect(
      productInputSchema.safeParse({
        ...draft,
        images: [
          { mediaId: "same", alt: "First product photo" },
          { mediaId: "same", alt: "Second product photo" },
        ],
      }).success,
    ).toBe(false);
    expect(productInputSchema.safeParse({ ...draft, slug: "Mango Ice" }).success).toBe(false);
  });

  it("rejects negative price, stock, and threshold values", () => {
    expect(productVariantInputSchema.safeParse({ ...variant, priceCentavos: 0 }).success).toBe(
      false,
    );
    expect(productVariantInputSchema.safeParse({ ...variant, stock: -1 }).success).toBe(false);
    expect(
      productVariantInputSchema.safeParse({ ...variant, lowStockThreshold: -1 }).success,
    ).toBe(false);
    expect(stockUpdateSchema.safeParse({ variantId: "v", stock: -5 }).success).toBe(false);
  });
});

describe("review schema", () => {
  it("enforces rating bounds and meaningful content", () => {
    expect(
      reviewSchema.safeParse({
        productId: "p",
        rating: 5,
        title: "Daily driver",
        body: "Smooth mango flavour with just enough ice.",
      }).success,
    ).toBe(true);
    expect(
      reviewSchema.safeParse({ productId: "p", rating: 6, title: "Daily driver", body: "x" })
        .success,
    ).toBe(false);
    expect(
      reviewSchema.safeParse({ productId: "p", rating: 0, title: "Daily driver", body: "x" })
        .success,
    ).toBe(false);
    expect(
      reviewSchema.safeParse({ productId: "p", rating: 4, title: "ok", body: "short" }).success,
    ).toBe(false);
  });
});
