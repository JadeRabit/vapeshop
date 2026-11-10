import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { siteConfig } from "@/lib/config";
import { safeCallbackUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin sign in",
  description: `Restricted administrator access to the ${siteConfig.name} console.`,
  robots: { index: false, follow: false },
};

type AdminLoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    email?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const session = await auth();

  if (session?.user?.role === "ADMIN") {
    redirect("/admin");
  }

  const requested = safeCallbackUrl(params.callbackUrl, "/admin");
  const callbackUrl =
    requested.startsWith("/admin") && !requested.startsWith("/admin/login")
      ? requested
      : "/admin";

  return (
    <AdminLoginForm
      callbackUrl={callbackUrl}
      defaultEmail={params.email?.slice(0, 254)}
      signedInAs={session?.user ? (session.user.email ?? "another account") : null}
    />
  );
}
