import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  Flame,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductCard } from "@/components/storefront/product-card";
import { getFeaturedProducts } from "@/lib/data/catalog";
import { categoryDefinitions, promoMessages, siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const featured = await getFeaturedProducts(8);

  return (
    <>
      <section className="noise-overlay relative overflow-hidden border-b border-white/10">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(196,255,77,.14),transparent_38%),radial-gradient(circle_at_82%_65%,rgba(167,139,250,.16),transparent_42%)]"
          aria-hidden="true"
        />
        <div className="surface-grid pointer-events-none absolute inset-0" aria-hidden="true" />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <Badge variant="outline" className="mb-6 border-primary/30 bg-primary/[0.04] text-primary">
              <ShieldCheck className="size-3.5" aria-hidden="true" /> 21+ only · Philippines
            </Badge>
            <h1 className="text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-balance sm:text-6xl lg:text-7xl">
              Elevated vapour.
              <span className="text-gradient block">Zero compromise.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              A tightly curated shelf of nic salts, freebase, pods, disposables, and hardware.
              Authenticated products, transparent stock, and checkout built for the Philippines.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/products">
                  Shop the collection <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/products?category=nic-salts">Explore nic salts</Link>
              </Button>
            </div>

            <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-white/10 pt-6">
              <div>
                <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <Truck className="size-3.5" aria-hidden="true" /> Shipping
                </dt>
                <dd className="mt-1 text-sm font-semibold">
                  Free over {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(siteConfig.freeShippingThresholdCentavos / 100)}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <CreditCard className="size-3.5" aria-hidden="true" /> Payment
                </dt>
                <dd className="mt-1 text-sm font-semibold">COD · GCash · Card</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <BadgeCheck className="size-3.5" aria-hidden="true" /> Stock
                </dt>
                <dd className="mt-1 text-sm font-semibold">Live per variant</dd>
              </div>
            </dl>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-10 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
            <div className="vapor-glow relative overflow-hidden rounded-[2rem] border border-white/12 bg-card">
              <Image
                src="/products/disposables.svg"
                alt="Neon disposable vape product artwork"
                width={800}
                height={800}
                priority
                className="aspect-square w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#07070b] via-[#07070b]/70 to-transparent p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  House pick
                </p>
                <p className="mt-1 font-display text-2xl font-semibold">Neon Blast 5K</p>
                <p className="mt-1 text-sm text-muted-foreground">Lychee menthol · 5,000 puffs</p>
              </div>
            </div>
            <div className="absolute -left-8 top-8 rounded-2xl border border-white/12 bg-popover/95 px-4 py-3 shadow-2xl backdrop-blur">
              <p className="flex items-center gap-2 text-xs font-semibold">
                <Flame className="size-4 text-primary" aria-hidden="true" /> Fresh drop
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Small-batch flavours weekly</p>
            </div>
            <div className="absolute -bottom-6 -right-4 rounded-2xl border border-white/12 bg-popover/95 px-4 py-3 shadow-2xl backdrop-blur">
              <p className="flex items-center gap-2 text-xs font-semibold">
                <PackageCheck className="size-4 text-primary" aria-hidden="true" /> Carefully packed
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Discreet, protected delivery</p>
            </div>
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-b border-white/10 bg-primary text-primary-foreground">
        <div className="marquee-track flex w-max items-center gap-10 py-2.5 text-xs font-bold uppercase tracking-[0.14em]">
          {[...promoMessages, ...promoMessages, ...promoMessages, ...promoMessages].map(
            (message, index) => (
              <span key={`${message}-${index}`} className="flex items-center gap-3 whitespace-nowrap">
                <Sparkles className="size-3.5" aria-hidden="true" />
                {message}
              </span>
            ),
          )}
        </div>
      </div>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="categories-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Browse by need</p>
            <h2 id="categories-heading" className="mt-2 text-3xl font-semibold sm:text-4xl">
              Six shelves. One standard.
            </h2>
          </div>
          <Button asChild variant="ghost" className="w-fit">
            <Link href="/products">
              Shop all products <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categoryDefinitions.map((category, index) => (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-card p-5 transition-colors hover:border-primary/35"
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${category.accent} via-transparent to-transparent opacity-70`}
                aria-hidden="true"
              />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    {category.eyebrow}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">{category.name}</h3>
                  <p className="mt-2 max-w-[26ch] text-sm leading-6 text-muted-foreground">
                    {category.description}
                  </p>
                </div>
                <span className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#0d0d16]">
                  <Image
                    src={`/products/${category.slug}.svg`}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover opacity-80 transition-transform duration-500 group-hover:scale-110"
                  />
                </span>
              </div>
              <p className="relative mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                Browse category <ArrowRight className="size-3.5" aria-hidden="true" />
              </p>
              <span className="absolute right-4 bottom-4 text-5xl font-bold text-white/[0.035]">
                0{index + 1}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#08080d]" aria-labelledby="featured-heading">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Curated</p>
              <h2 id="featured-heading" className="mt-2 text-3xl font-semibold sm:text-4xl">
                This week&apos;s rotation.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Hand-picked flavours and hardware with verified imagery and live stock.
              </p>
            </div>
            <Button asChild variant="outline" className="w-fit">
              <Link href="/products">
                View everything <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {featured.length === 0 ? (
            <EmptyState
              className="mt-8"
              title="No featured picks yet."
              description="The shelf is being restocked. Browse the full catalog while we curate the next drop."
              action={
                <Button asChild>
                  <Link href="/products">Browse catalog</Link>
                </Button>
              }
            />
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featured.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 2} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="trust-heading">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-card p-7 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Built for trust</p>
            <h2 id="trust-heading" className="mt-2 max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">
              No mystery stock. No surprise prices. No card data on our servers.
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {[
                {
                  icon: ShieldCheck,
                  title: "Age-gated, 21+",
                  body: "A clear compliance gate with a 30-day record and an always-available exit.",
                },
                {
                  icon: BadgeCheck,
                  title: "Verified product media",
                  body: "Every published product carries described imagery and active variants.",
                },
                {
                  icon: PackageCheck,
                  title: "Server-authoritative checkout",
                  body: "Prices and stock are reloaded at checkout; stale carts never silently substitute.",
                },
                {
                  icon: Truck,
                  title: "PH-first fulfilment",
                  body: "COD and GCash flows, with courier handoff tracked through order events.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-primary">
                    <item.icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/[0.06] p-7">
            <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Need a hand?</p>
            <h2 className="mt-2 text-2xl font-semibold">Talk to a human.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Product compatibility, delivery questions, or an order issue — we answer during store
              hours.
            </p>
            <dl className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between gap-3 border-b border-white/10 pb-2">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="text-right font-medium">{siteConfig.supportEmail}</dd>
              </div>
              <div className="flex justify-between gap-3 border-b border-white/10 pb-2">
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="text-right font-medium">{siteConfig.supportPhone}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Area</dt>
                <dd className="text-right font-medium">{siteConfig.address}</dd>
              </div>
            </dl>
            <Button asChild className="mt-6 w-full">
              <Link href="/products">Start shopping</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
