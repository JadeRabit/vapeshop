import { describe, expect, it } from "vitest";
import {
  ADMIN_TRANSITIONS,
  canTransition,
  getAllowedAdminTransitions,
  getRestockPlan,
  isTerminalStatus,
  restoresStockOnTransition,
} from "@/lib/order-state";

describe("order transition matrix", () => {
  it("allows COD to ship while pending, before cash collection", () => {
    const decision = canTransition(
      { status: "PENDING", paymentMethod: "COD" },
      "SHIPPED",
      "ADMIN",
    );
    expect(decision.allowed).toBe(true);
  });

  it("blocks unpaid GCash and card orders from shipping", () => {
    expect(
      canTransition({ status: "PENDING", paymentMethod: "GCASH" }, "SHIPPED", "ADMIN").allowed,
    ).toBe(false);
    expect(
      canTransition({ status: "PENDING", paymentMethod: "CARD" }, "SHIPPED", "ADMIN").allowed,
    ).toBe(false);
  });

  it("requires a GCash reference and proof before manual paid verification", () => {
    const missing = canTransition(
      { status: "PENDING", paymentMethod: "GCASH" },
      "PAID",
      "ADMIN",
    );
    expect(missing.allowed).toBe(false);

    const incomplete = canTransition(
      {
        status: "PENDING",
        paymentMethod: "GCASH",
        paymentReference: "GC-123456",
        paymentProofId: null,
      },
      "PAID",
      "ADMIN",
    );
    expect(incomplete.allowed).toBe(false);

    const complete = canTransition(
      {
        status: "PENDING",
        paymentMethod: "GCASH",
        paymentReference: "GC-123456",
        paymentProofId: "media_1",
      },
      "PAID",
      "ADMIN",
    );
    expect(complete.allowed).toBe(true);
  });

  it("only lets the payment webhook mark a card order paid", () => {
    const manual = canTransition(
      { status: "PENDING", paymentMethod: "CARD" },
      "PAID",
      "ADMIN",
    );
    expect(manual.allowed).toBe(false);
    if (!manual.allowed) expect(manual.reason).toMatch(/webhook/i);

    const webhook = canTransition(
      { status: "PENDING", paymentMethod: "CARD" },
      "PAID",
      "SYSTEM",
    );
    expect(webhook.allowed).toBe(true);
  });

  it("rejects same-status, skipped, and terminal transitions", () => {
    expect(
      canTransition({ status: "PENDING", paymentMethod: "COD" }, "PENDING", "ADMIN").allowed,
    ).toBe(false);
    expect(
      canTransition({ status: "PENDING", paymentMethod: "COD" }, "DELIVERED", "ADMIN").allowed,
    ).toBe(false);
    expect(
      canTransition({ status: "DELIVERED", paymentMethod: "COD" }, "CANCELLED", "ADMIN").allowed,
    ).toBe(false);
    expect(
      canTransition({ status: "CANCELLED", paymentMethod: "COD" }, "PAID", "ADMIN").allowed,
    ).toBe(false);
  });

  it("exposes only method-aware allowed admin transitions", () => {
    expect(getAllowedAdminTransitions({ status: "PENDING", paymentMethod: "COD" })).toEqual([
      { value: "PAID", label: "Paid" },
      { value: "SHIPPED", label: "Shipped" },
      { value: "CANCELLED", label: "Cancelled" },
    ]);

    expect(
      getAllowedAdminTransitions({ status: "PENDING", paymentMethod: "CARD" }),
    ).toEqual([{ value: "CANCELLED", label: "Cancelled" }]);

    expect(getAllowedAdminTransitions({ status: "DELIVERED", paymentMethod: "COD" })).toEqual(
      [],
    );
  });

  it("marks only delivered and cancelled as terminal", () => {
    expect(isTerminalStatus("DELIVERED")).toBe(true);
    expect(isTerminalStatus("CANCELLED")).toBe(true);
    expect(isTerminalStatus("SHIPPED")).toBe(false);
    expect(ADMIN_TRANSITIONS.PENDING).toContain("CANCELLED");
  });
});

describe("restock planning", () => {
  it("restores stock only when a transition cancels the order", () => {
    expect(restoresStockOnTransition("CANCELLED")).toBe(true);
    expect(restoresStockOnTransition("PAID")).toBe(false);
    expect(restoresStockOnTransition("DELIVERED")).toBe(false);
  });

  it("groups duplicate variant lines into a single restore quantity", () => {
    expect(
      getRestockPlan([
        { variantId: "a", quantity: 2 },
        { variantId: "b", quantity: 1 },
        { variantId: "a", quantity: 3 },
      ]),
    ).toEqual([
      { variantId: "a", quantity: 5 },
      { variantId: "b", quantity: 1 },
    ]);
  });

  it("rejects non-positive or fractional quantities", () => {
    expect(() => getRestockPlan([{ variantId: "a", quantity: 0 }])).toThrow();
    expect(() => getRestockPlan([{ variantId: "a", quantity: -1 }])).toThrow();
    expect(() => getRestockPlan([{ variantId: "a", quantity: 1.5 }])).toThrow();
  });
});
