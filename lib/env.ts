import "server-only";
import { z } from "zod";

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: optionalString,
  AUTH_SECRET: optionalString,
  NEXTAUTH_SECRET: optionalString,
  AUTH_URL: optionalString,
  AUTH_TRUST_HOST: optionalString,
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,
  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  CRON_SECRET: optionalString,
  SEED_ADMIN_EMAIL: optionalString,
  SEED_ADMIN_PASSWORD: optionalString,
  SEED_ADMIN_NAME: optionalString,
  SEED_DEMO_DATA: optionalString,
});

const raw = serverSchema.parse(process.env);

if (!raw.AUTH_SECRET && !raw.NEXTAUTH_SECRET) {
  throw new Error("AUTH_SECRET (or NEXTAUTH_SECRET) must be configured.");
}

export const env = {
  ...raw,
  appUrl: raw.NEXT_PUBLIC_APP_URL.replace(/\/$/, ""),
  authSecret: raw.AUTH_SECRET ?? raw.NEXTAUTH_SECRET!,
  isStripeConfigured: Boolean(raw.STRIPE_SECRET_KEY && raw.STRIPE_WEBHOOK_SECRET),
  isCloudinaryConfigured: Boolean(
    raw.CLOUDINARY_CLOUD_NAME && raw.CLOUDINARY_API_KEY && raw.CLOUDINARY_API_SECRET,
  ),
};

export const isProduction = process.env.NODE_ENV === "production";
