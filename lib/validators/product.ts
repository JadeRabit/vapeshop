import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.");

export const productVariantInputSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1, "Variant label is required.").max(100),
  sku: z
    .string()
    .trim()
    .min(3, "SKU must be at least 3 characters.")
    .max(64)
    .regex(/^[A-Za-z0-9_-]+$/, "SKU may only contain letters, numbers, dashes, and underscores."),
  flavorProfile: z
    .enum(["FRUITY", "MENTHOL", "DESSERT", "TOBACCO", "OTHER"])
    .nullable()
    .optional(),
  nicotineMg: z.coerce.number().int().min(0).max(100).nullable().optional(),
  color: z.string().trim().max(50).nullable().optional(),
  priceCentavos: z.coerce.number().int().min(1, "Price must be greater than zero."),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative."),
  lowStockThreshold: z.coerce.number().int().min(0, "Threshold cannot be negative."),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const productImageInputSchema = z.object({
  id: z.string().optional(),
  mediaId: z.string().min(1),
  alt: z.string().trim().min(5, "Describe the image for accessibility.").max(160),
  variantId: z.string().nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const productInputSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(2, "Product name is required.").max(140),
    slug: slugSchema,
    brand: z.string().trim().min(2, "Brand is required.").max(80),
    categoryId: z.string().min(1, "Choose a category."),
    shortDescription: z.string().trim().min(10).max(220),
    description: z.string().trim().min(20).max(5000),
    isFeatured: z.boolean().default(false),
    isActive: z.boolean().default(false),
    variants: z.array(productVariantInputSchema).min(1, "Add at least one variant."),
    images: z.array(productImageInputSchema).max(10).default([]),
  })
  .superRefine((value, ctx) => {
    const skus = value.variants.map((variant) => variant.sku.toLowerCase());
    if (new Set(skus).size !== skus.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["variants"],
        message: "Variant SKUs must be unique.",
      });
    }

    const mediaIds = value.images.map((image) => image.mediaId);
    if (new Set(mediaIds).size !== mediaIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["images"],
        message: "Each image can only be used once.",
      });
    }

    if (value.isActive) {
      if (!value.images.some((image) => image.alt.trim().length >= 5)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["images"],
          message: "Add at least one image with alt text before publishing.",
        });
      }
      if (!value.variants.some((variant) => variant.isActive)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants"],
          message: "An active product needs at least one active variant.",
        });
      }
    }
  });

export const stockUpdateSchema = z.object({
  variantId: z.string().min(1),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative."),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
});

export const archiveProductSchema = z.object({
  productId: z.string().min(1),
});

export type ProductInput = z.infer<typeof productInputSchema>;
export type ProductVariantInput = z.infer<typeof productVariantInputSchema>;
export type ProductImageInput = z.infer<typeof productImageInputSchema>;
