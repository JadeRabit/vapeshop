"use server";

import { revalidatePath } from "next/cache";
import { authorizationResult, requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import type { ActionState } from "@/lib/action-result";

export async function deleteReviewAction(reviewId: string): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch (error) {
    return authorizationResult(error);
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      product: { select: { slug: true, name: true } },
    },
  });

  if (!review) {
    return { ok: false, message: "Review not found." };
  }

  try {
    await prisma.review.delete({ where: { id: review.id } });
    revalidatePath("/admin/reviews");
    revalidatePath("/admin");
    revalidatePath("/products");
    revalidatePath(`/products/${review.product.slug}`);
    return {
      ok: true,
      message: `Review for ${review.product.name} removed.`,
    };
  } catch (error) {
    console.error("Review deletion failed", error);
    return { ok: false, message: "We could not remove that review. Please try again." };
  }
}
