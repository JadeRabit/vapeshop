"use server";

import { getSessionUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";

type MediaRegistrationInput = {
  publicId: string;
  secureUrl?: string;
  width?: number;
  height?: number;
  bytes?: number;
  mimeType?: string;
  kind: "PRODUCT_IMAGE" | "PAYMENT_PROOF";
};

type MediaRegistrationResult = { ok: true; mediaId: string } | { ok: false; message: string };

export async function registerMediaAssetAction(
  input: MediaRegistrationInput,
): Promise<MediaRegistrationResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Sign in to register an upload." };

  if (
    !input ||
    typeof input.publicId !== "string" ||
    input.publicId.length < 3 ||
    input.publicId.length > 300
  ) {
    return { ok: false, message: "Invalid upload reference." };
  }

  if (input.kind !== "PRODUCT_IMAGE" && input.kind !== "PAYMENT_PROOF") {
    return { ok: false, message: "Invalid media kind." };
  }

  const maxBytes = input.kind === "PAYMENT_PROOF" ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
  if (input.bytes && input.bytes > maxBytes) {
    return {
      ok: false,
      message:
        input.kind === "PAYMENT_PROOF"
          ? "That receipt is too large. Use an image under 5 MB."
          : "That product image is too large. Use an image under 10 MB.",
    };
  }

  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  if (input.mimeType && !allowedMimeTypes.includes(input.mimeType)) {
    return { ok: false, message: "Upload a JPG, PNG, or WebP image." };
  }

  let expectedPrefix = `vapeshop/payment-proofs/${user.id}/`;
  if (input.kind === "PRODUCT_IMAGE") {
    const databaseUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    if (databaseUser?.role !== "ADMIN") {
      return { ok: false, message: "Administrator access is required." };
    }
    expectedPrefix = `vapeshop/products/${user.id}/`;
  }

  if (!input.publicId.startsWith(expectedPrefix)) {
    return { ok: false, message: "Upload reference does not belong to this account." };
  }

  if (
    input.kind === "PRODUCT_IMAGE" &&
    (!input.secureUrl || !/^https:\/\/res\.cloudinary\.com\//.test(input.secureUrl))
  ) {
    return { ok: false, message: "A valid product image URL is required." };
  }

  const existing = await prisma.mediaAsset.findUnique({
    where: { publicId: input.publicId },
    select: { id: true, ownerId: true, kind: true },
  });

  if (existing) {
    if (existing.ownerId !== user.id || existing.kind !== input.kind) {
      return { ok: false, message: "That upload reference is already in use." };
    }
    return { ok: true, mediaId: existing.id };
  }

  try {
    const media = await prisma.mediaAsset.create({
      data: {
        ownerId: user.id,
        kind: input.kind,
        publicId: input.publicId,
        secureUrl: input.kind === "PRODUCT_IMAGE" ? input.secureUrl : null,
        width: Number.isInteger(input.width) && input.width! > 0 ? input.width : null,
        height: Number.isInteger(input.height) && input.height! > 0 ? input.height : null,
        bytes: Number.isInteger(input.bytes) && input.bytes! > 0 ? input.bytes : null,
        mimeType: input.mimeType?.slice(0, 80) ?? null,
      },
      select: { id: true },
    });
    return { ok: true, mediaId: media.id };
  } catch (error) {
    console.error("Media registration failed", error);
    return { ok: false, message: "We could not register that upload. Please try again." };
  }
}
