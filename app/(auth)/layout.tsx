import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { siteConfig } from "@/lib/config";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(196,255,77,.12),transparent_35%),radial-gradient(circle_at_85%_90%,rgba(167,139,250,.14),transparent_40%)]"
        aria-hidden="true"
      />
      <div className="surface-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />

      <div className="relative mx-auto grid min-h-dvh w-full max-w-7xl lg:grid-cols-[1.05fr_1fr]">
        <aside className="hidden flex-col justify-between border-r border-white/10 p-10 lg:flex xl:p-14">
          <Link href="/" className="inline-flex w-fit items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">{siteConfig.name}</span>
          </Link>

          <div className="max-w-md space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
              Members only, 21+
            </p>
            <h2 className="text-4xl font-semibold leading-[1.05] text-balance xl:text-5xl">
              A better way to keep your <span className="text-gradient">rotation</span> stocked.
            </h2>
            <p className="text-sm leading-7 text-muted-foreground">
              Track every order, save delivery details, and check out in seconds. No newsletters, no
              noise — just your shop.
            </p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                Private account data and ownership-checked order history.
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                COD, GCash, and hosted card payment options.
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                Authenticated products with clear per-variant stock.
              </li>
            </ul>
          </div>

          <p className="max-w-sm text-xs leading-5 text-muted-foreground">
            Nicotine is an addictive chemical. Products are intended for adults 21 and older. Valid ID
            may be requested on delivery.
          </p>
        </aside>

        <main className="flex min-h-dvh flex-col">
          <div className="flex items-center justify-between p-6 lg:justify-end lg:p-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Store
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to store
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center px-6 pb-14 pt-4 sm:px-10">
            <div className="w-full max-w-md">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
