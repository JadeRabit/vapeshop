import { describe, expect, it } from "vitest";
import {
  MAX_LINE_QUANTITY,
  cartItemCount,
  cartSubtotalCentavos,
  clampCartQuantity,
  lineWarning,
} from "@/lib/cart-rules";

describe("cart quantity rules", () => {
  it("returns zero when stock is unavailable", () => {
    expect(clampCartQuantity(1, 0)).toBe(0);
    expect(clampCartQuantity(5, -2)).toBe(0);
  });

  it("clamps to stock and to the per-line ceiling", () => {
    expect(clampCartQuantity(3, 5)).toBe(3);
    expect(clampCartQuantity(10, 5)).toBe(5);
    expect(clampCartQuantity(3, 500)).toBe(3);
    expect(clampCartQuantity(500, 500)).toBe(MAX_LINE_QUANTITY);
  });

  it("floors fractional quantities and keeps at least one", () => {
    expect(clampCartQuantity(2.9, 10)).toBe(2);
    expect(clampCartQuantity(0, 10)).toBe(1);
    expect(clampCartQuantity(-4, 10)).toBe(1);
  });

  it("computes totals from line quantities", () => {
    const lines = [
      { unitPriceCentavos: 35000, quantity: 2, stock: 10 },
      { unitPriceCentavos: 55000, quantity: 1, stock: 4 },
    ];
    expect(cartItemCount(lines)).toBe(3);
    expect(cartSubtotalCentavos(lines)).toBe(125000);
  });

  it("warns about unavailable or over-cap quantities", () => {
    expect(lineWarning({ stock: 0, quantity: 1 })).toBe("Out of stock");
    expect(lineWarning({ stock: 2, quantity: 3 })).toBe("Only 2 left");
    expect(lineWarning({ stock: 3, quantity: 2 })).toBeNull();
  });
});
