import { z } from "zod";

const phoneRegex = /^(?:\+63|0)9\d{9}$/;

export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()-]/g, ""))
  .refine((value) => phoneRegex.test(value), {
    message: "Enter a valid PH mobile number (e.g. 09171234567).",
  });

export const addressSchema = z.object({
  label: z.string().trim().max(40).optional().or(z.literal("")),
  recipientName: z.string().trim().min(2, "Enter the recipient name.").max(80),
  phone: phoneSchema,
  line1: z.string().trim().min(5, "Enter the street address.").max(160),
  line2: z.string().trim().max(160).optional().or(z.literal("")),
  barangay: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Enter the city or municipality.").max(80),
  province: z.string().trim().min(2, "Enter the province.").max(80),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Enter a valid 4-digit PH postal code."),
  isDefault: z.boolean().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;
