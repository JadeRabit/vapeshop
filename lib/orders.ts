import "server-only";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * Cancels a pending order exactly once and restores reserved stock.
 * Returns false when the order was not pending (already handled).
 */
export async function cancelPendingOrderAndRestock({
  orderId,
  actorId = null,
  note = "Pending order cancelled and stock released.",
  stripeCheckoutSessionId,
}: {
  orderId: string;
  actorId?: string | null;
  note?: string;
  stripeCheckoutSessionId?: string;
}): Promise<boolean> {
  try {
    return await prisma.$transaction(async (transaction) => {
      const order = await transaction.order.findUnique({
        where: { id: orderId },
        include: { items: { select: { variantId: true, quantity: true } } },
      });

      if (!order || order.status !== "PENDING") return false;

      const updated = await transaction.order.updateMany({
        where: {
          id: orderId,
          status: "PENDING",
          ...(stripeCheckoutSessionId ? { stripeCheckoutSessionId } : {}),
        },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });

      if (updated.count !== 1) return false;

      for (const item of order.items) {
        await transaction.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }

      await transaction.orderEvent.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: "CANCELLED",
          note,
          actorId,
        },
      });

      return true;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Order cancellation failed", error.code);
      return false;
    }
    throw error;
  }
}
