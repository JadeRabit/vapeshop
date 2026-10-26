import type { Metadata } from "next";
import { requirePageUser } from "@/lib/auth-guards";
import { AccountNav } from "@/components/account/account-nav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Your account",
    template: "%s · Your account",
  },
  robots: { index: false, follow: false },
};

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Account</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
            {user.name ? `Hi, ${user.name.split(" ")[0]}.` : "Welcome back."}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>
      </header>

      <div className="mt-6 grid gap-8 lg:grid-cols-[210px_1fr] lg:gap-10">
        <aside>
          <AccountNav isAdmin={user.role === "ADMIN"} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
