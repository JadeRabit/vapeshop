"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  format?: string;
};

export function PaymentProofUpload({
  enabled,
  onUploaded,
}: {
  enabled: boolean;
  onUploaded: (mediaId: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setProgress(0);
    setStatus("idle");
    setMessage(null);
    onUploaded(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function upload(file: File) {
    setMessage(null);
    setStatus("uploading");
    setProgress(0);

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      const signatureResponse = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "payment-proof" }),
      });
      const signature = (await signatureResponse.json()) as SignatureResponse;
      if (!signatureResponse.ok) {
        throw new Error(signature.error ?? "Could not prepare the upload.");
      }

      if (file.size > signature.maxBytes) {
        throw new Error("That receipt is too large. Use an image under 5 MB.");
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
            const parsed = JSON.parse(request.responseText) as CloudinaryResult & {
              error?: { message?: string };
            };
            if (request.status < 200 || request.status >= 300) {
              reject(new Error(parsed.error?.message ?? "Cloudinary rejected the upload."));
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
        kind: "PAYMENT_PROOF",
      });

      if (!registration.ok) throw new Error(registration.message);

      setStatus("done");
      setProgress(100);
      onUploaded(registration.mediaId);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Upload failed.");
      onUploaded(null);
    }
  }

  if (!enabled) {
    return (
      <div className="rounded-xl border border-amber-300/25 bg-amber-300/[0.05] p-4 text-xs leading-6 text-amber-100">
        GCash receipt uploads are unavailable until Cloudinary is configured. Choose Cash on
        Delivery, or contact support for a manual GCash arrangement.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className={cn("sr-only")}
        id="payment-proof-file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      {!preview ? (
        <label
          htmlFor="payment-proof-file"
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-8 text-center transition-colors hover:border-primary/40 hover:bg-white/[0.04]"
        >
          <UploadCloud className="mb-3 size-6 text-primary" aria-hidden="true" />
          <span className="text-sm font-semibold">Upload GCash receipt</span>
          <span className="mt-1 text-xs leading-5 text-muted-foreground">
            JPG, PNG, or WebP · up to 5 MB · stored privately
          </span>
        </label>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-[#0d0d14]">
          <div className="relative aspect-[4/3] w-full">
            <Image src={preview} alt="GCash receipt preview" fill sizes="420px" className="object-contain" unoptimized />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="absolute right-2 top-2 bg-background/80"
            onClick={reset}
            aria-label="Remove receipt"
          >
            <X aria-hidden="true" />
          </Button>
          {status === "uploading" ? (
            <div className="absolute inset-x-0 bottom-0 bg-background/90 p-3">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Uploading… {progress}%</p>
            </div>
          ) : null}
        </div>
      )}

      {status === "uploading" ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> Securing your receipt…
        </p>
      ) : null}
      {status === "done" ? (
        <p className="flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="size-3.5" aria-hidden="true" /> Receipt uploaded. It is only visible
          to store staff.
        </p>
      ) : null}
      {status === "error" && message ? (
        <p className="text-xs text-destructive" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
