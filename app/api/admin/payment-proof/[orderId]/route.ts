import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { createPrivateDownloadUrl } from "@/lib/media/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to view payment proofs." }, { status: 401 });
  }

  const databaseUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (databaseUser?.role !== "ADMIN") {
    return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  }

  const { orderId } = await context.params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      paymentMethod: true,
      paymentProof: { select: { publicId: true, secureUrl: true } },
    },
  });

  if (!order?.paymentProof) {
    return NextResponse.json({ error: "No payment proof on file." }, { status: 404 });
  }

  const signedUrl = createPrivateDownloadUrl(
    order.paymentProof.publicId,
    Math.floor(Date.now() / 1000) + 300,
  );

  if (!signedUrl) {
    return NextResponse.json(
      { error: "Private media delivery is not configured." },
      { status: 503 },
    );
  }

  return NextResponse.redirect(signedUrl, {
    status: 302,
    headers: {
      "Cache-Control": "no-store, private, max-age=0",
      "Referrer-Policy": "no-referrer",
    },
  });
}
