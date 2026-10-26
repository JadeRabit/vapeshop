import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { createUploadSignature } from "@/lib/media/cloudinary";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to upload files." }, { status: 401 });
  }

  let purpose: unknown;
  try {
    const body = (await request.json()) as { purpose?: unknown };
    purpose = body.purpose;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (purpose !== "payment-proof" && purpose !== "product-image") {
    return NextResponse.json({ error: "Unsupported upload purpose." }, { status: 400 });
  }

  if (purpose === "product-image") {
    const databaseUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    if (databaseUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
    }
  }

  const signature = createUploadSignature({
    folder:
      purpose === "payment-proof"
        ? `vapeshop/payment-proofs/${user.id}`
        : `vapeshop/products/${user.id}`,
    authenticated: purpose === "payment-proof",
  });

  if (!signature) {
    return NextResponse.json(
      { error: "Cloudinary is not configured for this environment." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ...signature,
    maxBytes: purpose === "payment-proof" ? 5 * 1024 * 1024 : 10 * 1024 * 1024,
    acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
  });
}
