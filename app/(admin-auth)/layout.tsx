import Link from "next/link";
import {
  ArrowLeft,
  LayoutDashboard,
  LockKeyhole,
  Package,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { siteConfig } from "@/lib/config";

export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#050507]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(196,255,77,.13),transparent_38%),radial-gradient(circle_at_88%_92%,rgba(167,139,250,.12),transparent_42%)]"
        aria-hidden="true"
      />
      <div
        className="surface-grid pointer-events-none absolute inset-0 opacity-50"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 sm:px-6">
        <header className="flex items-center justify-between gap-4 py-6">
          <Link href="/" className="flex items-center gap-3" aria-label={`${siteConfig.name} storefront`}>
            <span className="grid size-10 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-display text-sm font-semibold tracking-tight">
                {siteConfig.name}
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
                Admin console
              </span>
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to storefront
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center py-8 sm:py-12">
          <div className="grid w-full max-w-4xl gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
            <section className="hidden lg:block" aria-labelledby="admin-login-intro">
              <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
                <LockKeyhole className="size-3.5" aria-hidden="true" />
                Restricted system
              </p>
              <h1
                id="admin-login-intro"
                className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-balance xl:text-5xl"
              >
                Operate the shop.
                <span className="text-gradient block">Not the guesswork.</span>
              </h1>
              <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
                A separate, role-checked entrance for staff. Catalog, stock, orders, and revenue —
                without the storefront in the way.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  { icon: Package, title: "Catalog & inventory", body: "Publish products, variants, and stock levels." },
                  { icon: ShoppingBag, title: "Order fulfilment", body: "Verify payments and move orders through the queue." },
                  { icon: LayoutDashboard, title: "Revenue overview", body: "Track sales, low stock, and recent activity." },
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-primary">
                      <item.icon className="size-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-0.5 text-xs leading-6 text-muted-foreground">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(196,255,77,.8)]" />
                  Server-side RBAC
                </span>
                <span>PH · Manila</span>
                <span>Session · 7 days</span>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#0b0b12]/95 p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,.9)] backdrop-blur sm:p-8">
              {children}
            </section>
          </div>
        </main>

        <footer className="pb-6 text-center text-[11px] leading-5 text-muted-foreground">
          Authorized staff only. Administrator access is verified against the database on every
          request.
        </footer>
      </div>
    </div>
  );
}
