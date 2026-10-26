"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, DoorOpen, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { siteConfig } from "@/lib/config";
import {
  AGE_VERIFICATION_COOKIE_OPTIONS,
  createAgeVerificationValue,
} from "@/lib/age-verification";

type StoredVerification = {
  version: number;
  acceptedAt: number;
  expiresAt: number;
};

function readStoredVerification(): boolean {
  try {
    const raw = window.localStorage.getItem(siteConfig.ageCookieName);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as StoredVerification;
    const now = Date.now();
    return (
      parsed.version === siteConfig.ageStorageVersion &&
      Number.isFinite(parsed.acceptedAt) &&
      Number.isFinite(parsed.expiresAt) &&
      parsed.acceptedAt <= now &&
      parsed.expiresAt > now
    );
  } catch {
    return false;
  }
}

export function AgeGate({ initiallyVerified }: { initiallyVerified: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(!initiallyVerified);

  useEffect(() => {
    if (!initiallyVerified) return;
    if (!readStoredVerification()) {
      setOpen(true);
    }
  }, [initiallyVerified]);

  function accept() {
    const now = Date.now();
    const maxAgeSeconds = siteConfig.ageCookieDays * 24 * 60 * 60;
    const value = createAgeVerificationValue(now);

    document.cookie = [
      `${siteConfig.ageCookieName}=${value}`,
      `Path=${AGE_VERIFICATION_COOKIE_OPTIONS.path}`,
      `Max-Age=${maxAgeSeconds}`,
      `SameSite=Lax`,
      AGE_VERIFICATION_COOKIE_OPTIONS.secure ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");

    try {
      window.localStorage.setItem(
        siteConfig.ageCookieName,
        JSON.stringify({
          version: siteConfig.ageStorageVersion,
          acceptedAt: now,
          expiresAt: now + maxAgeSeconds * 1000,
        } satisfies StoredVerification),
      );
    } catch {
      // A blocked localStorage still leaves the cookie record; the gate may
      // reappear on the next visit if both storage mechanisms are required.
    }

    setOpen(false);
    router.refresh();
  }

  function decline() {
    window.location.assign(siteConfig.ageExitUrl);
  }

  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent
        showClose={false}
        className="max-w-xl border-primary/20 bg-[#0a0a11] p-0"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        aria-describedby="age-gate-description"
      >
        <div className="relative overflow-hidden rounded-2xl">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(196,255,77,.18),transparent_45%),radial-gradient(circle_at_90%_100%,rgba(167,139,250,.18),transparent_50%)]"
            aria-hidden="true"
          />
          <div className="relative space-y-6 p-6 sm:p-8">
            <DialogHeader className="space-y-4 pr-0">
              <div className="flex items-center gap-2.5">
                <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <Sparkles className="size-5" aria-hidden="true" />
                </span>
                <span className="font-display text-base font-semibold tracking-tight">
                  {siteConfig.name}
                </span>
                <span className="ml-auto rounded-full border border-primary/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                  21+ only
                </span>
              </div>
              <DialogTitle className="text-3xl leading-tight sm:text-4xl">
                Are you at least 21 years old?
              </DialogTitle>
              <DialogDescription id="age-gate-description" className="text-sm leading-6">
                This store sells nicotine and vapour products. You must be of legal age in the
                Philippines to enter. Confirming is a compliance acknowledgement, not identity
                verification — valid ID may be requested on delivery.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-start gap-3 rounded-xl border border-amber-300/25 bg-amber-300/[0.06] p-4 text-amber-100">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p className="text-xs leading-6">
                <strong className="font-semibold">Nicotine warning.</strong> Nicotine is an addictive
                chemical. Products are not for use by pregnant or breastfeeding women, or by anyone
                under 21. Keep out of reach of children and pets.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Button type="button" size="lg" className="flex-1" onClick={accept}>
                <ShieldCheck aria-hidden="true" /> I am 21 or older — enter
                <ArrowRight aria-hidden="true" />
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={decline}>
                <DoorOpen aria-hidden="true" /> I am under 21 — leave
              </Button>
            </div>

            <p className="text-[11px] leading-5 text-muted-foreground">
              By entering you confirm you are at least 21 years old and agree to our age-restricted
              store terms. This choice is stored for {siteConfig.ageCookieDays} days. You can clear it
              in your browser settings at any time.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
