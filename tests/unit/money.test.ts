import { describe, expect, it } from "vitest";
import {
  calculateShipping,
  centavosToPesoInput,
  formatPhp,
  pesosToCentavos,
} from "@/lib/money";

describe("PHP money helpers", () => {
  it("formats centavos as Philippine pesos", () => {
    expect(formatPhp(12345)).toBe("₱123.45");
    expect(formatPhp(1234500)).toBe("₱12,345.00");
    expect(formatPhp(0)).toBe("₱0.00");
  });

  it("parses peso input to integer centavos without floating point drift", () => {
    expect(pesosToCentavos("350")).toBe(35000);
    expect(pesosToCentavos("350.5")).toBe(35050);
    expect(pesosToCentavos("1,299.99")).toBe(129999);
    expect(pesosToCentavos("0.01")).toBe(1);
    expect(pesosToCentavos(19.99)).toBe(1999);
  });

  it("rejects malformed peso input", () => {
    expect(() => pesosToCentavos("")).toThrow();
    expect(() => pesosToCentavos("12.345")).toThrow();
    expect(() => pesosToCentavos("abc")).toThrow();
    expect(() => pesosToCentavos("-5.00")).toThrow();
  });

  it("round-trips a centavo amount into a peso input", () => {
    expect(centavosToPesoInput(35050)).toBe("350.50");
    expect(centavosToPesoInput(0)).toBe("0.00");
  });

  it("applies flat shipping below the free threshold and free shipping at it", () => {
    expect(calculateShipping(0, 250000, 9900)).toBe(0);
    expect(calculateShipping(100000, 250000, 9900)).toBe(9900);
    expect(calculateShipping(250000, 250000, 9900)).toBe(0);
    expect(calculateShipping(300000, 250000, 9900)).toBe(0);
  });
});
