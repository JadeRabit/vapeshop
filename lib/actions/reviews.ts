"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { reviewSchema } from "@/lib/validators/review";
import type { ActionState } from "@/lib/action-result";

export async function submitReviewAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Sign in to submit a review." };
  }

  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    title: formData.get("title"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields and try again.",
      fieldErrors: Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).filter(
          (entry): entry is [string, string[]] => Boolean(entry[1]?.length),
        ),
      ),
    };
  }

  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, isActive: true },
    select: { id: true, slug: true },
  });

  if (!product) {
    return { ok: false, message: "This product is not available for review." };
  }

  const qualifyingOrder = await prisma.order.findFirst({
    where: {
      userId: user.id,
      status: { in: ["PAID", "SHIPPED", "DELIVERED"] },
      items: { some: { variant: { productId: product.id } } },
    },
    select: { id: true },
  });

  if (!qualifyingOrder) {
    return {
      ok: false,
      message:
        "Reviews are limited to verified purchasers with a paid, shipped, or delivered order containing this product.",
    };
  }

  try {
    await prisma.review.create({
      data: {
        productId: product.id,
        userId: user.id,
        rating: parsed.data.rating,
        title: parsed.data.title,
        body: parsed.data.body,
        verifiedPurchase: true,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "You have already reviewed this product." };
    }
    console.error("Review submission failed", error);
    return { ok: false, message: "We could not save your review right now. Please try again." };
  }

  revalidatePath(`/products/${product.slug}`);
  return { ok: true, message: "Review published. Thank you for sharing your experience." };
}
