"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { checkAuthRateLimit, clearAuthRateLimit } from "@/lib/rate-limit";
import { safeCallbackUrl } from "@/lib/utils";
import { loginSchema, registerSchema } from "@/lib/validators/auth";
import type { ActionState } from "@/lib/action-result";

const INVALID_CREDENTIALS = "Invalid email or password. Please try again.";

function fieldErrorsFrom(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}) {
  const flattened = error.flatten().fieldErrors;
  return Object.fromEntries(
    Object.entries(flattened).filter(
      (entry): entry is [string, string[]] => Boolean(entry[1]?.length),
    ),
  );
}

export async function loginAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields and try again.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const limit = checkAuthRateLimit(`login:${parsed.data.email}`);
  if (!limit.allowed) {
    return {
      ok: false,
      message: `Too many sign-in attempts. Try again in ${Math.ceil(
        (limit.retryAfterSeconds ?? 60) / 60,
      )} minute(s).`,
    };
  }

  const redirectTo = safeCallbackUrl(
    typeof formData.get("callbackUrl") === "string"
      ? (formData.get("callbackUrl") as string)
      : null,
    "/",
  );

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: INVALID_CREDENTIALS };
    }
    console.error("Unexpected sign-in failure", error);
    return {
      ok: false,
      message: "We could not sign you in right now. Please try again.",
    };
  }

  clearAuthRateLimit(`login:${parsed.data.email}`);
  return { ok: true, message: "Signed in.", redirectTo };
}

export async function registerAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields and try again.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const limit = checkAuthRateLimit(`register:${parsed.data.email}`);
  if (!limit.allowed) {
    return {
      ok: false,
      message: "Too many registration attempts. Please try again later.",
    };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existing) {
    return {
      ok: false,
      message: "An account with this email already exists. Try signing in instead.",
      fieldErrors: { email: ["This email is already registered."] },
    };
  }

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        // Role is always server-assigned; never read from form input.
        role: "CUSTOMER",
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        ok: false,
        message: "An account with this email already exists. Try signing in instead.",
        fieldErrors: { email: ["This email is already registered."] },
      };
    }
    console.error("Registration failed", error);
    return {
      ok: false,
      message: "We could not create your account right now. Please try again.",
    };
  }

  return {
    ok: true,
    message: "Account created. Sign in to continue.",
    redirectTo: `/login?registered=1&email=${encodeURIComponent(parsed.data.email)}`,
  };
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
