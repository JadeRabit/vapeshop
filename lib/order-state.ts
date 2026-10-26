export type OrderStatusValue = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentMethodValue = "COD" | "GCASH" | "CARD";

export const ADMIN_TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]> = {
  PENDING: ["PAID", "SHIPPED", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export type TransitionActor = "ADMIN" | "SYSTEM";

export type TransitionOrder = {
  status: OrderStatusValue;
  paymentMethod: PaymentMethodValue;
  paymentReference?: string | null;
  paymentProofId?: string | null;
};

export type TransitionDecision =
  | { allowed: true }
  | { allowed: false; reason: string };

export function canTransition(
  order: TransitionOrder,
  next: OrderStatusValue,
  actor: TransitionActor,
): TransitionDecision {
  if (order.status === next) {
    return { allowed: false, reason: "The order is already in that status." };
  }

  if (!ADMIN_TRANSITIONS[order.status].includes(next)) {
    return {
      allowed: false,
      reason: `Orders cannot move from ${order.status.toLowerCase()} to ${next.toLowerCase()}.`,
    };
  }

  // Only the Stripe webhook (SYSTEM) may mark a hosted card payment as paid.
  if (actor === "ADMIN" && order.paymentMethod === "CARD" && next === "PAID") {
    return {
      allowed: false,
      reason: "Card payments can only be confirmed by the payment provider webhook.",
    };
  }

  // COD can be shipped before cash is collected.
  if (
    actor === "ADMIN" &&
    next === "SHIPPED" &&
    order.status === "PENDING" &&
    order.paymentMethod !== "COD"
  ) {
    return {
      allowed: false,
      reason: "Only Cash on Delivery orders may ship before payment is verified.",
    };
  }

  if (
    actor === "ADMIN" &&
    next === "PAID" &&
    order.paymentMethod === "GCASH" &&
    (!order.paymentProofId || !order.paymentReference)
  ) {
    return {
      allowed: false,
      reason: "A GCash payment reference and receipt are required before verification.",
    };
  }

  return { allowed: true };
}

export function getAllowedAdminTransitions(
  order: TransitionOrder,
): Array<{ value: OrderStatusValue; label: string }> {
  return ADMIN_TRANSITIONS[order.status]
    .filter((next) => canTransition(order, next, "ADMIN").allowed)
    .map((next) => ({
      value: next,
      label: next.charAt(0) + next.slice(1).toLowerCase(),
    }));
}

export function isTerminalStatus(status: OrderStatusValue) {
  return status === "DELIVERED" || status === "CANCELLED";
}

export function restoresStockOnTransition(next: OrderStatusValue) {
  return next === "CANCELLED";
}

/**
 * Returns quantities to restore for a cancelled order. Pure so it can be
 * unit-tested and reused by the admin and expiry paths.
 */
export function getRestockPlan(
  items: Array<{ variantId: string; quantity: number }>,
): Array<{ variantId: string; quantity: number }> {
  const grouped = new Map<string, number>();
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error("Invalid order item quantity.");
    }
    grouped.set(item.variantId, (grouped.get(item.variantId) ?? 0) + item.quantity);
  }
  return [...grouped.entries()].map(([variantId, quantity]) => ({
    variantId,
    quantity,
  }));
}
