import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { env } from "@/lib/env";

let configured = false;

function ensureConfigured() {
  if (!env.isCloudinaryConfigured) return false;
  if (!configured) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
  return true;
}

export const isCloudinaryConfigured = env.isCloudinaryConfigured;

export function createUploadSignature({
  folder,
  authenticated,
}: {
  folder: string;
  authenticated: boolean;
}) {
  if (!ensureConfigured()) return null;

  const timestamp = Math.round(Date.now() / 1000);
  const params: Record<string, string | number> = { timestamp, folder };
  if (authenticated) params.type = "authenticated";

  const signature = cloudinary.utils.api_sign_request(
    params,
    env.CLOUDINARY_API_SECRET as string,
  );

  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME as string,
    apiKey: env.CLOUDINARY_API_KEY as string,
    timestamp,
    signature,
    folder,
    type: authenticated ? "authenticated" : "upload",
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
  };
}

export function createPrivateDownloadUrl(publicId: string, expiresAtSeconds: number) {
  if (!ensureConfigured()) return null;
  return cloudinary.utils.private_download_url(publicId, "image", {
    expires_at: expiresAtSeconds,
    attachment: false,
  });
}
