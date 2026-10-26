"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { authorizationResult, requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import {
  productInputSchema,
  stockUpdateSchema,
} from "@/lib/validators/product";
import type { FieldErrors, ProductActionState, StockActionState } from "@/lib/action-result";

function fieldErrorsFrom(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}): FieldErrors {
  return Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).filter(
      (entry): entry is [string, string[]] => Boolean(entry[1]?.length),
    ),
  );
}

function parseJsonArray(value: FormDataEntryValue | null): unknown[] {
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function booleanFromForm(value: FormDataEntryValue | null) {
  return value === "true" || value === "on" || value === "1";
}

function parseProductForm(formData: FormData) {
  return productInputSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug"),
    brand: formData.get("brand"),
    categoryId: formData.get("categoryId"),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description"),
    isFeatured: booleanFromForm(formData.get("isFeatured")),
    isActive: booleanFromForm(formData.get("isActive")),
    variants: parseJsonArray(formData.get("variants")),
    images: parseJsonArray(formData.get("images")),
  });
}

function revalidateProductSurfaces(slug: string, previousSlug?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${slug}`);
  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/products/${previousSlug}`);
  }
  revalidatePath("/sitemap.xml");
}

function uniqueConstraintResult(error: unknown): ProductActionState | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return null;
  }

  const target = Array.isArray(error.meta?.target)
    ? (error.meta.target as string[]).join(",")
    : String(error.meta?.target ?? "");

  if (target.includes("slug")) {
    return {
      ok: false,
      message: "That product slug is already in use.",
      fieldErrors: { slug: ["Choose a different slug."] },
    };
  }
  if (target.includes("sku")) {
    return {
      ok: false,
      message: "One or more variant SKUs are already in use.",
      fieldErrors: { variants: ["Every SKU must be unique across the catalogue."] },
    };
  }
  if (target.includes("mediaId")) {
    return {
      ok: false,
      message: "One of those images is already attached to another product.",
      fieldErrors: { images: ["Upload a fresh image or remove the duplicate."] },
    };
  }

  return {
    ok: false,
    message: "A duplicate value conflicted with an existing record.",
  };
}

async function assertCategoryExists(categoryId: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  return Boolean(category);
}

async function findSkuConflict(skus: string[], productId?: string) {
  const conflicting = await prisma.productVariant.findMany({
    where: {
      sku: { in: skus },
      ...(productId ? { productId: { not: productId } } : {}),
    },
    select: { sku: true },
    take: 5,
  });
  return conflicting.map((variant) => variant.sku);
}

async function validateProductMedia(mediaIds: string[]) {
  if (mediaIds.length === 0) return true;
  const media = await prisma.mediaAsset.findMany({
    where: { id: { in: mediaIds } },
    select: { id: true, kind: true },
  });
  return (
    media.length === mediaIds.length &&
    media.every((asset) => asset.kind === "PRODUCT_IMAGE")
  );
}

export async function createProductAction(
  _previous: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  try {
    await requireAdmin();
  } catch (error) {
    return authorizationResult(error);
  }

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the product details and try again.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const input = parsed.data;
  if (!(await assertCategoryExists(input.categoryId))) {
    return {
      ok: false,
      message: "Choose an existing category.",
      fieldErrors: { categoryId: ["That category no longer exists."] },
    };
  }

  if (input.images.some((image) => Boolean(image.variantId))) {
    return {
      ok: false,
      message: "Save the product before linking images to variants.",
      fieldErrors: {
        images: ["Create the product first, then edit it to associate images with variants."],
      },
    };
  }

  const mediaIds = [...new Set(input.images.map((image) => image.mediaId))];
  if (!(await validateProductMedia(mediaIds))) {
    return {
      ok: false,
      message: "One or more uploaded images could not be verified.",
      fieldErrors: { images: ["Re-upload the affected image and try again."] },
    };
  }

  const existingSlug = await prisma.product.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  });
  if (existingSlug) {
    return {
      ok: false,
      message: "That product slug is already in use.",
      fieldErrors: { slug: ["Choose a different slug."] },
    };
  }

  const skuConflicts = await findSkuConflict(input.variants.map((variant) => variant.sku));
  if (skuConflicts.length > 0) {
    return {
      ok: false,
      message: "One or more SKUs are already in use.",
      fieldErrors: { variants: [`Already in use: ${skuConflicts.join(", ")}.`] },
    };
  }

  try {
    const product = await prisma.$transaction(async (transaction) => {
      const created = await transaction.product.create({
        data: {
          name: input.name,
          slug: input.slug,
          brand: input.brand,
          categoryId: input.categoryId,
          shortDescription: input.shortDescription,
          description: input.description,
          isFeatured: input.isFeatured,
          isActive: input.isActive,
          variants: {
            create: input.variants.map((variant, index) => ({
              label: variant.label,
              sku: variant.sku,
              flavorProfile: variant.flavorProfile ?? null,
              nicotineMg: variant.nicotineMg ?? null,
              color: variant.color ?? null,
              priceCentavos: variant.priceCentavos,
              stock: variant.stock,
              lowStockThreshold: variant.lowStockThreshold,
              isActive: variant.isActive,
              sortOrder: variant.sortOrder ?? index,
            })),
          },
        },
      });

      for (const [index, image] of input.images.entries()) {
        await transaction.productImage.create({
          data: {
            productId: created.id,
            mediaId: image.mediaId,
            alt: image.alt,
            variantId: null,
            sortOrder: image.sortOrder ?? index,
          },
        });
      }

      return created;
    });

    revalidateProductSurfaces(product.slug);
    return {
      ok: true,
      message: input.isActive ? "Product published." : "Product saved as a draft.",
      productId: product.id,
      slug: product.slug,
    };
  } catch (error) {
    const uniqueResult = uniqueConstraintResult(error);
    if (uniqueResult) return uniqueResult;
    console.error("Product creation failed", error);
    return { ok: false, message: "We could not save that product. Please try again." };
  }
}

export async function updateProductAction(
  _previous: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  try {
    await requireAdmin();
  } catch (error) {
    return authorizationResult(error);
  }

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the product details and try again.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const input = parsed.data;
  if (!input.id) return { ok: false, message: "Missing product reference." };

  const existing = await prisma.product.findUnique({
    where: { id: input.id },
    select: {
      id: true,
      slug: true,
      variants: { select: { id: true, _count: { select: { orderItems: true } } } },
    },
  });
  if (!existing) return { ok: false, message: "Product not found." };

  if (!(await assertCategoryExists(input.categoryId))) {
    return {
      ok: false,
      message: "Choose an existing category.",
      fieldErrors: { categoryId: ["That category no longer exists."] },
    };
  }

  const existingVariantIds = new Set(existing.variants.map((variant) => variant.id));
  const providedVariantIds = input.variants
    .map((variant) => variant.id)
    .filter((id): id is string => Boolean(id));

  if (providedVariantIds.some((id) => !existingVariantIds.has(id))) {
    return {
      ok: false,
      message: "One of those variants no longer belongs to this product.",
    };
  }

  const imageVariantIds = input.images
    .map((image) => image.variantId)
    .filter((id): id is string => Boolean(id));
  if (imageVariantIds.some((id) => !providedVariantIds.includes(id))) {
    return {
      ok: false,
      message: "An image is linked to a removed variant.",
      fieldErrors: { images: ["Choose an existing variant for every image."] },
    };
  }

  const slugConflict = await prisma.product.findFirst({
    where: { slug: input.slug, id: { not: input.id } },
    select: { id: true },
  });
  if (slugConflict) {
    return {
      ok: false,
      message: "That product slug is already in use.",
      fieldErrors: { slug: ["Choose a different slug."] },
    };
  }

  const skuConflicts = await findSkuConflict(
    input.variants.map((variant) => variant.sku),
    input.id,
  );
  if (skuConflicts.length > 0) {
    return {
      ok: false,
      message: "One or more SKUs are already in use.",
      fieldErrors: { variants: [`Already in use: ${skuConflicts.join(", ")}.`] },
    };
  }

  const mediaIds = [...new Set(input.images.map((image) => image.mediaId))];
  if (!(await validateProductMedia(mediaIds))) {
    return {
      ok: false,
      message: "One or more uploaded images could not be verified.",
      fieldErrors: { images: ["Re-upload the affected image and try again."] },
    };
  }

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.product.update({
        where: { id: input.id as string },
        data: {
          name: input.name,
          slug: input.slug,
          brand: input.brand,
          categoryId: input.categoryId,
          shortDescription: input.shortDescription,
          description: input.description,
          isFeatured: input.isFeatured,
          isActive: input.isActive,
        },
      });

      for (const [index, variant] of input.variants.entries()) {
        if (variant.id) {
          await transaction.productVariant.update({
            where: { id: variant.id },
            data: {
              label: variant.label,
              sku: variant.sku,
              flavorProfile: variant.flavorProfile ?? null,
              nicotineMg: variant.nicotineMg ?? null,
              color: variant.color ?? null,
              priceCentavos: variant.priceCentavos,
              stock: variant.stock,
              lowStockThreshold: variant.lowStockThreshold,
              isActive: variant.isActive,
              sortOrder: variant.sortOrder ?? index,
            },
          });
        } else {
          await transaction.productVariant.create({
            data: {
              productId: input.id as string,
              label: variant.label,
              sku: variant.sku,
              flavorProfile: variant.flavorProfile ?? null,
              nicotineMg: variant.nicotineMg ?? null,
              color: variant.color ?? null,
              priceCentavos: variant.priceCentavos,
              stock: variant.stock,
              lowStockThreshold: variant.lowStockThreshold,
              isActive: variant.isActive,
              sortOrder: variant.sortOrder ?? index,
            },
          });
        }
      }

      await transaction.productImage.deleteMany({ where: { productId: input.id } });

      for (const variant of existing.variants) {
        if (providedVariantIds.includes(variant.id)) continue;
        if (variant._count.orderItems > 0) {
          await transaction.productVariant.update({
            where: { id: variant.id },
            data: { isActive: false },
          });
        } else {
          await transaction.productVariant.delete({ where: { id: variant.id } });
        }
      }

      for (const [index, image] of input.images.entries()) {
        await transaction.productImage.create({
          data: {
            productId: input.id as string,
            mediaId: image.mediaId,
            alt: image.alt,
            variantId: image.variantId ?? null,
            sortOrder: image.sortOrder ?? index,
          },
        });
      }
    });

    revalidateProductSurfaces(input.slug, existing.slug);
    return {
      ok: true,
      message: input.isActive ? "Product updated and published." : "Product saved as a draft.",
      productId: input.id,
      slug: input.slug,
    };
  } catch (error) {
    const uniqueResult = uniqueConstraintResult(error);
    if (uniqueResult) return uniqueResult;
    console.error("Product update failed", error);
    return { ok: false, message: "We could not update that product. Please try again." };
  }
}

export async function updateStockAction(
  _previous: StockActionState,
  formData: FormData,
): Promise<StockActionState> {
  try {
    await requireAdmin();
  } catch (error) {
    return authorizationResult(error);
  }

  const parsed = stockUpdateSchema.safeParse({
    variantId: formData.get("variantId"),
    stock: formData.get("stock"),
    lowStockThreshold: formData.get("lowStockThreshold") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Enter a valid, non-negative stock quantity.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const variant = await prisma.productVariant.findUnique({
    where: { id: parsed.data.variantId },
    select: { id: true, product: { select: { slug: true } } },
  });
  if (!variant) return { ok: false, message: "Variant not found." };

  try {
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: {
        stock: parsed.data.stock,
        ...(parsed.data.lowStockThreshold !== undefined
          ? { lowStockThreshold: parsed.data.lowStockThreshold }
          : {}),
      },
    });

    revalidateProductSurfaces(variant.product.slug);
    return {
      ok: true,
      message: "Stock updated.",
      variantId: variant.id,
      stock: parsed.data.stock,
    };
  } catch (error) {
    console.error("Stock update failed", error);
    return { ok: false, message: "We could not update stock. Please try again." };
  }
}

export async function archiveProductAction(productId: string): Promise<ProductActionState> {
  try {
    await requireAdmin();
  } catch (error) {
    return authorizationResult(error);
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true, name: true },
  });
  if (!product) return { ok: false, message: "Product not found." };

  try {
    await prisma.$transaction([
      prisma.product.update({ where: { id: product.id }, data: { isActive: false } }),
      prisma.productVariant.updateMany({
        where: { productId: product.id },
        data: { isActive: false },
      }),
    ]);

    revalidateProductSurfaces(product.slug);
    return {
      ok: true,
      message: `${product.name} archived. Existing orders are unchanged.`,
      productId: product.id,
      slug: product.slug,
    };
  } catch (error) {
    console.error("Product archive failed", error);
    return { ok: false, message: "We could not archive that product. Please try again." };
  }
}

export async function deleteProductAction(productId: string): Promise<ProductActionState> {
  try {
    await requireAdmin();
  } catch (error) {
    return authorizationResult(error);
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true, name: true },
  });
  if (!product) return { ok: false, message: "Product not found." };

  const orderReferences = await prisma.orderItem.count({
    where: { variant: { productId: product.id } },
  });
  if (orderReferences > 0) {
    return {
      ok: false,
      message:
        "This product appears in order history and cannot be permanently deleted. Archive it instead.",
    };
  }

  try {
    await prisma.product.delete({ where: { id: product.id } });
    revalidateProductSurfaces(product.slug);
    return {
      ok: true,
      message: `${product.name} permanently deleted.`,
      productId: product.id,
      slug: product.slug,
    };
  } catch (error) {
    console.error("Product deletion failed", error);
    return { ok: false, message: "We could not delete that product. Please try again." };
  }
}
