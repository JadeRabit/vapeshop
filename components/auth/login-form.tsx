"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, CheckCircle2, LockKeyhole, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loginAction } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/action-result";

type LoginFormProps = {
  callbackUrl: string;
  registered?: boolean;
  defaultEmail?: string;
};

export function LoginForm({ callbackUrl, registered, defaultEmail }: LoginFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(loginAction, initialActionState);

  useEffect(() => {
    if (state.ok && state.redirectTo) {
      toast.success("Welcome back.");
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Sign in</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">Welcome back.</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Access your orders, saved addresses, and a faster checkout.
        </p>
      </div>

      {registered ? (
        <Alert className="border-primary/25 bg-primary/5 text-primary">
          <CheckCircle2 aria-hidden="true" />
          <AlertDescription className="text-primary">
            Account created. Sign in with your new password.
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
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              defaultValue={defaultEmail}
              aria-invalid={Boolean(state.fieldErrors?.email)}
              aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
              className="pl-10"
              placeholder="you@example.com"
            />
          </div>
          {state.fieldErrors?.email ? (
            <p id="email-error" className="text-xs text-destructive" role="alert">
              {state.fieldErrors.email[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Password</Label>
            <span className="text-xs text-muted-foreground">Minimum 10 characters</span>
          </div>
          <div className="relative">
            <LockKeyhole
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={Boolean(state.fieldErrors?.password)}
              aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
              className="pl-10"
              placeholder="Your password"
            />
          </div>
          {state.fieldErrors?.password ? (
            <p id="password-error" className="text-xs text-destructive" role="alert">
              {state.fieldErrors.password[0]}
            </p>
          ) : null}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
          {!pending ? <ArrowRight aria-hidden="true" /> : null}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New to Vapor District?{" "}
        <Link
          href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
