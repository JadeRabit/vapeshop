import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { safeCallbackUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Vapor District account to track orders and check out faster.",
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    registered?: string;
    email?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl, "/");
  const session = await auth();

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <LoginForm
      callbackUrl={callbackUrl}
      registered={params.registered === "1"}
      defaultEmail={params.email?.slice(0, 254)}
    />
  );
}
