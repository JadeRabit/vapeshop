import "server-only";
import { cache } from "react";
import { type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type ProductImageDTO = {
  id: string;
  url: string;
  alt: string;
  variantId: string | null;
};

export type ProductVariantDTO = {
  id: string;
  label: string;
  sku: string;
  flavorProfile: "FRUITY" | "MENTHOL" | "DESSERT" | "TOBACCO" | "OTHER" | null;
  nicotineMg: number | null;
  priceCentavos: number;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  imageUrl: string | null;
  imageAlt: string | null;
};

export type ProductCardDTO = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  shortDescription: string;
  category: { name: string; slug: string };
  isFeatured: boolean;
  images: ProductImageDTO[];
  variants: ProductVariantDTO[];
  lowestPriceCentavos: number;
  totalStock: number;
  inStock: boolean;
};

export type ProductDetailDTO = ProductCardDTO & {
  description: string;
  ratingAverage: number | null;
  reviewCount: number;
  reviews: Array<{
    id: string;
    rating: number;
    title: string;
    body: string;
    verifiedPurchase: boolean;
    createdAt: string;
    authorName: string;
  }>;
};

const productInclude = {
  category: { select: { name: true, slug: true } },
  variants: {
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      label: true,
      sku: true,
      flavorProfile: true,
      nicotineMg: true,
      priceCentavos: true,
      stock: true,
      lowStockThreshold: true,
      isActive: true,
      sortOrder: true,
    },
  },
  images: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      alt: true,
      variantId: true,
      media: { select: { secureUrl: true } },
    },
  },
} satisfies Prisma.ProductInclude;

type ProductWithCatalog = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

function mapProduct(product: ProductWithCatalog): ProductCardDTO {
  const images = product.images
    .filter((image) => Boolean(image.media.secureUrl))
    .map((image) => ({
      id: image.id,
      url: image.media.secureUrl as string,
      alt: image.alt,
      variantId: image.variantId,
    }));

  const variants = product.variants.map((variant) => {
    const variantImage = images.find((image) => image.variantId === variant.id);
    return {
      id: variant.id,
      label: variant.label,
      sku: variant.sku,
      flavorProfile: variant.flavorProfile,
      nicotineMg: variant.nicotineMg,
      priceCentavos: variant.priceCentavos,
      stock: variant.stock,
      lowStockThreshold: variant.lowStockThreshold,
      isActive: variant.isActive,
      imageUrl: variantImage?.url ?? null,
      imageAlt: variantImage?.alt ?? null,
    };
  });

  const prices = variants.map((variant) => variant.priceCentavos);
  const totalStock = variants.reduce((total, variant) => total + variant.stock, 0);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    shortDescription: product.shortDescription,
    category: product.category,
    isFeatured: product.isFeatured,
    images,
    variants,
    lowestPriceCentavos: prices.length ? Math.min(...prices) : 0,
    totalStock,
    inStock: variants.some((variant) => variant.stock > 0),
  };
}

const activeProductWhere = {
  isActive: true,
  category: { isActive: true },
  variants: { some: { isActive: true } },
  images: { some: {} },
} satisfies Prisma.ProductWhereInput;

export const getFeaturedProducts = cache(async (limit = 8) => {
  const products = await prisma.product.findMany({
    where: { ...activeProductWhere, isFeatured: true },
    include: productInclude,
    orderBy: [{ updatedAt: "desc" }],
    take: limit,
  });
  return products.map(mapProduct);
});

export const getCatalogProducts = cache(async () => {
  const products = await prisma.product.findMany({
    where: activeProductWhere,
    include: productInclude,
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
  });
  return products.map(mapProduct);
});

export const getProductDetail = cache(async (slug: string): Promise<ProductDetailDTO | null> => {
  const product = await prisma.product.findFirst({
    where: { ...activeProductWhere, slug },
    include: {
      ...productInclude,
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          rating: true,
          title: true,
          body: true,
          verifiedPurchase: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      },
    },
  });

  if (!product) return null;

  const aggregate = await prisma.review.aggregate({
    where: { productId: product.id },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const base = mapProduct(product);

  return {
    ...base,
    description: product.description,
    ratingAverage: aggregate._avg.rating
      ? Math.round(aggregate._avg.rating * 10) / 10
      : null,
    reviewCount: aggregate._count._all,
    reviews: product.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      body: review.body,
      verifiedPurchase: review.verifiedPurchase,
      createdAt: review.createdAt.toISOString(),
      authorName: review.user.name ?? "Verified customer",
    })),
  };
});

export const getReviewEligibility = cache(async (productId: string, userId: string) => {
  const [existingReview, qualifyingOrder] = await Promise.all([
    prisma.review.findUnique({
      where: { userId_productId: { userId, productId } },
      select: { id: true },
    }),
    prisma.order.findFirst({
      where: {
        userId,
        status: { in: ["PAID", "SHIPPED", "DELIVERED"] },
        items: { some: { variant: { productId } } },
      },
      select: { id: true },
    }),
  ]);

  return {
    hasReviewed: Boolean(existingReview),
    canReview: Boolean(qualifyingOrder) && !existingReview,
    hasPurchased: Boolean(qualifyingOrder),
  };
});

export const getActiveCategories = cache(async () => {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, description: true, imageUrl: true },
  });
});
