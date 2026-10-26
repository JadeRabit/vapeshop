"use server";

import { revalidatePath } from "next/cache";
import { authorizationResult, requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { canTransition, getRestockPlan } from "@/lib/order-state";
import { orderStatusUpdateSchema } from "@/lib/validators/checkout";
import type { OrderActionState } from "@/lib/action-result";

function revalidateOrderSurfaces(orderNumber: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderNumber}`);
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderNumber}`);
  revalidatePath(`/checkout/success/${orderNumber}`);
  revalidatePath("/products");
}

export async function updateOrderStatusAction(
  _previous: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (error) {
    return authorizationResult(error);
  }

  const parsed = orderStatusUpdateSchema.safeParse({
    orderNumber: formData.get("orderNumber"),
    status: formData.get("status"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, message: "Choose a valid order status." };
  }

  const { orderNumber, status: nextStatus, note } = parsed.data;

  try {
    const outcome = await prisma.$transaction(async (transaction) => {
      const order = await transaction.order.findUnique({
        where: { orderNumber },
        include: {
          items: { select: { variantId: true, quantity: true } },
          paymentProof: { select: { id: true } },
        },
      });

      if (!order) {
        return { ok: false as const, message: "Order not found." };
      }

      const decision = canTransition(
        {
          status: order.status,
          paymentMethod: order.paymentMethod,
          paymentReference: order.paymentReference,
          paymentProofId: order.paymentProof?.id ?? null,
        },
        nextStatus,
        "ADMIN",
      );

      if (!decision.allowed) {
        return { ok: false as const, message: decision.reason };
      }

      const now = new Date();
      const timestampData =
        nextStatus === "PAID"
          ? { paidAt: now }
          : nextStatus === "SHIPPED"
            ? { shippedAt: now }
            : nextStatus === "DELIVERED"
              ? {
                  deliveredAt: now,
                  ...(order.paymentMethod === "COD" && !order.paidAt ? { paidAt: now } : {}),
                }
              : { cancelledAt: now };

      const updated = await transaction.order.updateMany({
        where: { id: order.id, status: order.status },
        data: { status: nextStatus, ...timestampData },
      });

      if (updated.count !== 1) {
        return {
          ok: false as const,
          message: "This order changed while you were updating it. Refresh and try again.",
        };
      }

      if (nextStatus === "CANCELLED") {
        for (const item of getRestockPlan(order.items)) {
          await transaction.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      const defaultNote =
        nextStatus === "PAID"
          ? order.paymentMethod === "GCASH"
            ? "GCash payment verified."
            : "Payment confirmed."
          : nextStatus === "SHIPPED"
            ? "Order handed to courier."
            : nextStatus === "DELIVERED"
              ? order.paymentMethod === "COD"
                ? "Delivered and cash collected."
                : "Order delivered."
              : "Order cancelled by staff and stock restored.";

      await transaction.orderEvent.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: nextStatus,
          note: note?.trim() || defaultNote,
          actorId: admin.id,
        },
      });

      return {
        ok: true as const,
        message: `Order updated to ${nextStatus.toLowerCase()}.`,
        status: nextStatus,
      };
    });

    if (!outcome.ok) {
      return { ok: false, message: outcome.message };
    }

    revalidateOrderSurfaces(orderNumber);
    return {
      ok: true,
      message: outcome.message,
      orderNumber,
      status: outcome.status,
    };
  } catch (error) {
    console.error("Order status update failed", error);
    return { ok: false, message: "We could not update that order. Please try again." };
  }
}
