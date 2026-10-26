import "server-only";
import { cache } from "react";
import { type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { siteConfig } from "@/lib/config";

export type AdminCategoryDTO = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
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
  shortDescription: string;
  description: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lowestPriceCentavos: number;
  totalStock: number;
  isLowStock: boolean;
  hasOrderHistory: boolean;
  variants: AdminProductVariantDTO[];
  images: AdminProductImageDTO[];
};

export type AdminProductListResult = {
  products: AdminProductDTO[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  search: string;
};

const adminProductInclude = {
  category: { select: { id: true, name: true } },
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
  return categories;
});

export async function getAdminProductList({
  search = "",
  page = 1,
}: {
  search?: string;
  page?: number;
}): Promise<AdminProductListResult> {
  const normalizedSearch = search.trim().slice(0, 100);
  const pageSize = siteConfig.pageSize;
  const requestedPage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;

  const where: Prisma.ProductWhereInput = normalizedSearch
    ? {
        OR: [
          { name: { contains: normalizedSearch, mode: "insensitive" } },
          {
            variants: {
              some: { sku: { contains: normalizedSearch, mode: "insensitive" } },
            },
          },
        ],
      }
    : {};

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
  };
}

export const getAdminProduct = cache(async (productId: string): Promise<AdminProductDTO | null> => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: adminProductInclude,
  });
  return product ? mapAdminProduct(product) : null;
});
