import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { cancelPendingOrderAndRestock } from "@/lib/orders";
import { siteConfig } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: "Cron is not configured." }, { status: 503 });
  }

  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - siteConfig.orderExpiryMinutes * 60 * 1000);

  const staleOrders = await prisma.order.findMany({
    where: {
      status: "PENDING",
      paymentMethod: "CARD",
      createdAt: { lt: cutoff },
    },
    select: { id: true, orderNumber: true },
    take: 100,
  });

  let expired = 0;
  for (const order of staleOrders) {
    const cancelled = await cancelPendingOrderAndRestock({
      orderId: order.id,
      note: "Unpaid card order expired after 30 minutes; stock released.",
    });
    if (cancelled) expired += 1;
  }

  return NextResponse.json({ expired, checked: staleOrders.length });
}
