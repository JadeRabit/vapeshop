import "server-only";
import { type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { siteConfig } from "@/lib/config";

export type AdminReviewDTO = {
  id: string;
  rating: number;
  title: string;
  body: string;
  verifiedPurchase: boolean;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
  };
  customer: {
    id: string;
    name: string | null;
    email: string;
  };
};

export type AdminReviewSummary = {
  total: number;
  average: number;
  verified: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

export type AdminReviewListResult = {
  reviews: AdminReviewDTO[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  search: string;
  rating: number | null;
  summary: AdminReviewSummary;
};

function normalizeRating(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return parsed >= 1 && parsed <= 5 ? parsed : null;
}

export async function getAdminReviewList({
  search = "",
  page = 1,
  rating,
}: {
  search?: string;
  page?: number;
  rating?: string;
}): Promise<AdminReviewListResult> {
  const normalizedSearch = search.trim().slice(0, 100);
  const normalizedRating = normalizeRating(rating);
  const pageSize = siteConfig.pageSize;
  const requestedPage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;

  const where: Prisma.ReviewWhereInput = {
    ...(normalizedRating ? { rating: normalizedRating } : {}),
    ...(normalizedSearch
      ? {
          OR: [
            { title: { contains: normalizedSearch, mode: "insensitive" } },
            { body: { contains: normalizedSearch, mode: "insensitive" } },
            { product: { name: { contains: normalizedSearch, mode: "insensitive" } } },
            { user: { name: { contains: normalizedSearch, mode: "insensitive" } } },
            { user: { email: { contains: normalizedSearch, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [reviews, total, ratingGroups, verified] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (requestedPage - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        verifiedPurchase: true,
        createdAt: true,
        product: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.review.count({ where }),
    prisma.review.groupBy({
      by: ["rating"],
      _count: { _all: true },
    }),
    prisma.review.count({ where: { verifiedPurchase: true } }),
  ]);

  const distribution: AdminReviewSummary["distribution"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let ratingTotal = 0;
  let reviewTotal = 0;

  for (const group of ratingGroups) {
    const bucket = group.rating as 1 | 2 | 3 | 4 | 5;
    distribution[bucket] = group._count._all;
    ratingTotal += bucket * group._count._all;
    reviewTotal += group._count._all;
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return {
    reviews: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      body: review.body,
      verifiedPurchase: review.verifiedPurchase,
      createdAt: review.createdAt.toISOString(),
      product: review.product,
      customer: review.user,
    })),
    total,
    page: requestedPage,
    pageCount,
    pageSize,
    search: normalizedSearch,
    rating: normalizedRating,
    summary: {
      total: reviewTotal,
      average: reviewTotal > 0 ? Math.round((ratingTotal / reviewTotal) * 10) / 10 : 0,
      verified,
      distribution,
    },
  };
}
