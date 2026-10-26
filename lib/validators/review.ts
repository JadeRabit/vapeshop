import { z } from "zod";

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Choose a rating.").max(5),
  title: z.string().trim().min(3, "Add a short title.").max(80),
  body: z
    .string()
    .trim()
    .min(10, "Share at least a little detail about your experience.")
    .max(1200, "Review is too long."),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
