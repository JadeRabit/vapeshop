import { z } from "zod";

export const checkoutLineSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99),
});

export const checkoutInputSchema = z
  .object({
    addressId: z.string().min(1, "Choose a delivery address."),
    paymentMethod: z.enum(["COD", "GCASH", "CARD"]),
    gcashReference: z
      .string()
      .trim()
      .max(40)
      .optional()
      .transform((value) => (value ? value.toUpperCase() : undefined)),
    paymentProofMediaId: z.string().optional(),
    notes: z.string().trim().max(500).optional(),
    idempotencyKey: z.string().uuid("Invalid checkout key."),
    lines: z.array(checkoutLineSchema).min(1, "Your cart is empty.").max(30),
  })
  .superRefine((value, ctx) => {
    if (value.paymentMethod === "GCASH") {
      if (!value.gcashReference || value.gcashReference.length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["gcashReference"],
          message: "Enter the GCash reference number.",
        });
      }
      if (!value.paymentProofMediaId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["paymentProofMediaId"],
          message: "Upload your GCash receipt.",
        });
      }
    }
  });

export const checkoutQuoteSchema = z.object({
  lines: z.array(checkoutLineSchema).min(1).max(30),
});

export const orderStatusUpdateSchema = z.object({
  orderNumber: z.string().min(1),
  status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]),
  note: z.string().trim().max(500).optional(),
});

export const paymentProofRegistrationSchema = z.object({
  publicId: z.string().min(1).max(300),
  secureUrl: z.string().url().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  bytes: z.number().int().positive().optional(),
  mimeType: z.string().optional(),
  kind: z.enum(["PRODUCT_IMAGE", "PAYMENT_PROOF"]),
});

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
export type CheckoutLineInput = z.infer<typeof checkoutLineSchema>;
