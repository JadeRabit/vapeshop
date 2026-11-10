import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RegisterForm } from "@/components/auth/register-form";
import { siteConfig } from "@/lib/config";
import { safeCallbackUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Create account",
  description: `Create a ${siteConfig.name} account for faster checkout and order tracking.`,
  robots: { index: false, follow: false },
};

type RegisterPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl, "/");
  const session = await auth();

  if (session?.user) {
    redirect(callbackUrl);
  }

  return <RegisterForm callbackUrl={callbackUrl} />;
}
