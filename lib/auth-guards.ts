import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export class AuthorizationError extends Error {
  status: 401 | 403;

  constructor(message = "You are not authorized to perform this action.", status: 401 | 403 = 401) {
    super(message);
    this.name = "AuthorizationError";
    this.status = status;
  }
}

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new AuthorizationError("Sign in to continue.", 401);
  return user;
}

export async function requireDbUser() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, name: true, email: true, role: true, phone: true, image: true },
  });
  if (!user) throw new AuthorizationError("Your account is no longer available.", 401);
  return user;
}

export async function requireAdmin() {
  const user = await requireDbUser();
  if (user.role !== "ADMIN") {
    throw new AuthorizationError("Administrator access is required.", 403);
  }
  return user;
}

export async function requirePageUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?callbackUrl=/account/orders");
  }
  return user;
}

export async function requirePageAdmin() {
  try {
    return await requireAdmin();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect(error.status === 403 ? "/?error=forbidden" : "/login?callbackUrl=/admin");
    }
    throw error;
  }
}

export async function requireOwnedOrder(orderNumber: string, userId: string) {
  const order = await prisma.order.findFirst({
    where: { orderNumber, userId },
  });
  if (!order) throw new AuthorizationError("Order not found.", 403);
  return order;
}

export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

export function authorizationResult(error: unknown) {
  if (isAuthorizationError(error)) {
    return {
      ok: false as const,
      message:
        error.status === 403
          ? "You do not have permission to perform this action."
          : "Please sign in to continue.",
      code: error.status,
    };
  }
  throw error;
}
