"use client";

import { useId, useRef, useState } from "react";
import { CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { registerMediaAssetAction } from "@/lib/actions/uploads";
import { cn } from "@/lib/utils";

type SignatureResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  type: "upload" | "authenticated";
  uploadUrl: string;
  maxBytes: number;
  acceptedTypes: string[];
  error?: string;
};

type CloudinaryResult = {
  public_id: string;
  secure_url?: string;
  width?: number;
  height?: number;
  bytes?: number;
  error?: { message?: string };
};

export function ProductImageUploader({
  enabled,
  onUploaded,
}: {
  enabled: boolean;
  onUploaded: (media: { mediaId: string; url: string | null }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId().replace(/[:]/g, "");
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  async function upload(file: File) {
    setStatus("uploading");
    setProgress(0);
    setMessage(null);

    try {
      const response = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "product-image" }),
      });
      const signature = (await response.json()) as SignatureResponse;
      if (!response.ok) {
        throw new Error(signature.error ?? "Could not prepare the image upload.");
      }

      if (file.size > signature.maxBytes) {
        throw new Error("That image is too large. Use a file under 10 MB.");
      }
      if (!signature.acceptedTypes.includes(file.type)) {
        throw new Error("Upload a JPG, PNG, or WebP image.");
      }

      const body = new FormData();
      body.append("file", file);
      body.append("api_key", signature.apiKey);
      body.append("timestamp", String(signature.timestamp));
      body.append("signature", signature.signature);
      body.append("folder", signature.folder);
      body.append("type", signature.type);

      const result = await new Promise<CloudinaryResult>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("POST", signature.uploadUrl);
        request.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        request.onerror = () => reject(new Error("Upload failed. Check your connection."));
        request.onload = () => {
          try {
            const parsed = JSON.parse(request.responseText) as CloudinaryResult;
            if (request.status < 200 || request.status >= 300) {
              reject(new Error(parsed.error?.message ?? "Cloudinary rejected the image."));
              return;
            }
            resolve(parsed);
          } catch {
            reject(new Error("Cloudinary returned an unreadable response."));
          }
        };
        request.send(body);
      });

      const registration = await registerMediaAssetAction({
        publicId: result.public_id,
        secureUrl: result.secure_url,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        mimeType: file.type,
        kind: "PRODUCT_IMAGE",
      });

      if (!registration.ok) throw new Error(registration.message);

      setStatus("done");
      setProgress(100);
      onUploaded({ mediaId: registration.mediaId, url: result.secure_url ?? null });
      window.setTimeout(() => setStatus("idle"), 2500);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (!enabled) {
    return (
      <p className="rounded-xl border border-amber-300/25 bg-amber-300/[0.05] px-4 py-3 text-xs leading-5 text-amber-100">
        Product image uploads are unavailable until Cloudinary is configured. Existing images can
        still be reordered, described, or removed.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <label
        htmlFor={inputId}
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-3 text-sm transition-colors hover:border-primary/40 hover:bg-white/[0.04]",
          status === "uploading" && "pointer-events-none opacity-70",
        )}
      >
        <UploadCloud className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="min-w-0">
          <span className="block font-medium">
            {status === "uploading" ? `Uploading… ${progress}%` : "Upload product image"}
          </span>
          <span className="block text-xs text-muted-foreground">
            JPG, PNG, or WebP · up to 10 MB · served from Cloudinary
          </span>
        </span>
        {status === "uploading" ? (
          <Loader2 className="ml-auto size-4 animate-spin text-muted-foreground" aria-hidden="true" />
        ) : null}
        {status === "done" ? (
          <CheckCircle2
            className="ml-auto size-4 text-emerald-300"
            aria-label="Image uploaded"
          />
        ) : null}
      </label>
      {status === "error" && message ? (
        <p className="text-xs text-destructive" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
