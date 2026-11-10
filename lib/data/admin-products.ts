import "server-only";
import { cache } from "react";
import { type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { comingSoonCategorySlugs, isCategoryComingSoon, siteConfig } from "@/lib/config";

export type AdminCategoryDTO = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  isComingSoon: boolean;
};

export type AdminProductVariantDTO = {
  id: string;
  label: string;
  sku: string;
  flavorProfile: "FRUITY" | "MENTHOL" | "DESSERT" | "TOBACCO" | "OTHER" | null;
  nicotineMg: number | null;
  color: string | null;
  priceCentavos: number;
  stock: number;
  lowStockThreshold: number;
  isPreOrder: boolean;
  isActive: boolean;
  sortOrder: number;
  hasOrderHistory: boolean;
};

export type AdminProductImageDTO = {
  id: string;
  mediaId: string;
  url: string | null;
  alt: string;
  variantId: string | null;
  sortOrder: number;
};

export type AdminProductDTO = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  shortDescription: string;
  description: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lowestPriceCentavos: number;
  totalStock: number;
  isLowStock: boolean;
  hasPreOrder: boolean;
  hasOrderHistory: boolean;
  variants: AdminProductVariantDTO[];
  images: AdminProductImageDTO[];
};

export type AdminProductStatusFilter = "all" | "published" | "draft";

export type AdminProductSummary = {
  total: number;
  published: number;
  draft: number;
  lowStock: number;
  comingSoon: number;
};

export type AdminProductListResult = {
  products: AdminProductDTO[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  search: string;
  status: AdminProductStatusFilter;
  category: string;
  lowStock: boolean;
  comingSoon: boolean;
  summary: AdminProductSummary;
};

const adminProductInclude = {
  category: { select: { id: true, name: true, slug: true } },
  variants: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { orderItems: true } } },
  },
  images: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { media: { select: { secureUrl: true } } },
  },
} satisfies Prisma.ProductInclude;

type AdminProductWithRelations = Prisma.ProductGetPayload<{ include: typeof adminProductInclude }>;

function mapAdminProduct(product: AdminProductWithRelations): AdminProductDTO {
  const activeVariants = product.variants.filter((variant) => variant.isActive);
  const pricedVariants = activeVariants.length > 0 ? activeVariants : product.variants;
  const lowestPriceCentavos =
    pricedVariants.length > 0
      ? Math.min(...pricedVariants.map((variant) => variant.priceCentavos))
      : 0;
  const totalStock = product.variants.reduce((total, variant) => total + variant.stock, 0);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    lowestPriceCentavos,
    totalStock,
    isLowStock: activeVariants.some(
      (variant) => variant.stock <= variant.lowStockThreshold,
    ),
    hasPreOrder: product.variants.some((variant) => variant.isPreOrder && variant.isActive),
    hasOrderHistory: product.variants.some((variant) => variant._count.orderItems > 0),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      label: variant.label,
      sku: variant.sku,
      flavorProfile: variant.flavorProfile,
      nicotineMg: variant.nicotineMg,
      color: variant.color,
      priceCentavos: variant.priceCentavos,
      stock: variant.stock,
      lowStockThreshold: variant.lowStockThreshold,
      isPreOrder: variant.isPreOrder,
      isActive: variant.isActive,
      sortOrder: variant.sortOrder,
      hasOrderHistory: variant._count.orderItems > 0,
    })),
    images: product.images.map((image) => ({
      id: image.id,
      mediaId: image.mediaId,
      url: image.media.secureUrl,
      alt: image.alt,
      variantId: image.variantId,
      sortOrder: image.sortOrder,
    })),
  };
}

export const getAdminCategories = cache(async (): Promise<AdminCategoryDTO[]> => {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, isActive: true },
  });
  return categories.map((category) => ({
    ...category,
    isComingSoon: isCategoryComingSoon(category.slug),
  }));
});

export async function getAdminProductList({
  search = "",
  page = 1,
  status,
  category,
  lowStock,
  comingSoon,
}: {
  search?: string;
  page?: number;
  status?: string;
  category?: string;
  lowStock?: string;
  comingSoon?: string;
}): Promise<AdminProductListResult> {
  const normalizedSearch = search.trim().slice(0, 100);
  const normalizedStatus: AdminProductStatusFilter =
    status === "published" || status === "draft" ? status : "all";
  const normalizedCategory = category?.trim().slice(0, 100) ?? "";
  const onlyLowStock = lowStock === "1" || lowStock === "true";
  const onlyComingSoon = comingSoon === "1" || comingSoon === "true";
  const pageSize = siteConfig.pageSize;
  const requestedPage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;

  const [totalProducts, publishedProducts, comingSoonProducts, activeVariants] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({
        where: { category: { slug: { in: [...comingSoonCategorySlugs] } } },
      }),
      prisma.productVariant.findMany({
        where: { isActive: true },
        select: { productId: true, stock: true, lowStockThreshold: true },
      }),
    ]);

  const lowStockProductIds = [
    ...new Set(
      activeVariants
        .filter((variant) => variant.stock <= variant.lowStockThreshold)
        .map((variant) => variant.productId),
    ),
  ];

  const conditions: Prisma.ProductWhereInput[] = [];
  if (normalizedSearch) {
    conditions.push({
      OR: [
        { name: { contains: normalizedSearch, mode: "insensitive" } },
        {
          variants: {
            some: { sku: { contains: normalizedSearch, mode: "insensitive" } },
          },
        },
      ],
    });
  }
  if (normalizedStatus === "published") conditions.push({ isActive: true });
  if (normalizedStatus === "draft") conditions.push({ isActive: false });
  if (normalizedCategory) conditions.push({ category: { slug: normalizedCategory } });
  if (onlyLowStock) conditions.push({ id: { in: lowStockProductIds } });
  if (onlyComingSoon) {
    conditions.push({ category: { slug: { in: [...comingSoonCategorySlugs] } } });
  }

  const where: Prisma.ProductWhereInput =
    conditions.length > 0 ? { AND: conditions } : {};

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: adminProductInclude,
      orderBy: [{ isActive: "desc" }, { name: "asc" }, { id: "asc" }],
      skip: (requestedPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return {
    products: products.map(mapAdminProduct),
    total,
    page: requestedPage,
    pageCount,
    pageSize,
    search: normalizedSearch,
    status: normalizedStatus,
    category: normalizedCategory,
    lowStock: onlyLowStock,
    comingSoon: onlyComingSoon,
    summary: {
      total: totalProducts,
      published: publishedProducts,
      draft: totalProducts - publishedProducts,
      lowStock: lowStockProductIds.length,
      comingSoon: comingSoonProducts,
    },
  };
}

export const getAdminProduct = cache(async (productId: string): Promise<AdminProductDTO | null> => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: adminProductInclude,
  });
  return product ? mapAdminProduct(product) : null;
});
