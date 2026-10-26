"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { registerAction } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/action-result";

type RegisterFormProps = {
  callbackUrl: string;
};

export function RegisterForm({ callbackUrl }: RegisterFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(registerAction, initialActionState);

  useEffect(() => {
    if (state.ok && state.redirectTo) {
      toast.success("Account created.");
      router.push(state.redirectTo);
    }
  }, [state, router]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Join</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">Create your account.</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          You must be 21 or older. Your details stay private and are only used to fulfil orders.
        </p>
      </div>

      {!state.ok && state.message ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <form action={formAction} className="space-y-5" noValidate>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <div className="relative">
            <UserRound
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="name"
              name="name"
              autoComplete="name"
              required
              aria-invalid={Boolean(state.fieldErrors?.name)}
              aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
              className="pl-10"
              placeholder="Juan Dela Cruz"
            />
          </div>
          {state.fieldErrors?.name ? (
            <p id="name-error" className="text-xs text-destructive" role="alert">
              {state.fieldErrors.name[0]}
            </p>
          ) : null}
        </div>

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

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <LockKeyhole
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={10}
                aria-invalid={Boolean(state.fieldErrors?.password)}
                aria-describedby={state.fieldErrors?.password ? "password-error" : "password-hint"}
                className="pl-10"
                placeholder="10+ characters"
              />
            </div>
            {state.fieldErrors?.password ? (
              <p id="password-error" className="text-xs text-destructive" role="alert">
                {state.fieldErrors.password[0]}
              </p>
            ) : (
              <p id="password-hint" className="text-xs text-muted-foreground">
                At least 10 characters.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <div className="relative">
              <LockKeyhole
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
                aria-describedby={
                  state.fieldErrors?.confirmPassword ? "confirm-password-error" : undefined
                }
                className="pl-10"
                placeholder="Repeat password"
              />
            </div>
            {state.fieldErrors?.confirmPassword ? (
              <p id="confirm-password-error" className="text-xs text-destructive" role="alert">
                {state.fieldErrors.confirmPassword[0]}
              </p>
            ) : null}
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
          {!pending ? <ArrowRight aria-hidden="true" /> : null}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
