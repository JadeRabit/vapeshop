"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/action-result";
import { adminLoginAction } from "@/lib/actions/auth";

type AdminLoginFormProps = {
  callbackUrl: string;
  defaultEmail?: string;
  signedInAs?: string | null;
};

export function AdminLoginForm({
  callbackUrl,
  defaultEmail,
  signedInAs,
}: AdminLoginFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(adminLoginAction, initialActionState);

  useEffect(() => {
    if (state.ok && state.redirectTo) {
      toast.success("Administrator access granted.");
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <span className="grid size-11 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
            Staff sign in
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Administrator access.
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Use an administrator account to manage the catalog, stock, orders, and analytics.
          </p>
        </div>
      </div>

      {signedInAs ? (
        <Alert className="border-primary/25 bg-primary/5 text-primary">
          <ShieldCheck aria-hidden="true" />
          <AlertDescription className="text-primary">
            You are currently signed in as {signedInAs}. Signing in below switches this browser to
            the administrator account.
          </AlertDescription>
        </Alert>
      ) : null}

      {!state.ok && state.message ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <form action={formAction} className="space-y-5" noValidate>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <div className="space-y-2">
          <Label htmlFor="admin-email">Email address</Label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="username"
              inputMode="email"
              required
              defaultValue={defaultEmail}
              aria-invalid={Boolean(state.fieldErrors?.email)}
              aria-describedby={state.fieldErrors?.email ? "admin-email-error" : undefined}
              className="pl-10"
              placeholder="admin@yourstore.ph"
            />
          </div>
          {state.fieldErrors?.email ? (
            <p id="admin-email-error" className="text-xs text-destructive" role="alert">
              {state.fieldErrors.email[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-password">Password</Label>
          <div className="relative">
            <LockKeyhole
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={Boolean(state.fieldErrors?.password)}
              aria-describedby={state.fieldErrors?.password ? "admin-password-error" : undefined}
              className="pl-10"
              placeholder="Administrator password"
            />
          </div>
          {state.fieldErrors?.password ? (
            <p id="admin-password-error" className="text-xs text-destructive" role="alert">
              {state.fieldErrors.password[0]}
            </p>
          ) : null}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Verifying…" : "Enter admin console"}
          {!pending ? <ArrowRight aria-hidden="true" /> : null}
        </Button>
      </form>

      <div className="space-y-3 border-t border-white/10 pt-5 text-center text-xs leading-5 text-muted-foreground">
        <p>Authorized staff only. Sign-in attempts are rate-limited and role-checked.</p>
        <p>
          Customer account?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Use storefront sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
