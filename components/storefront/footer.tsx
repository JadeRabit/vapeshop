import Link from "next/link";
import { AtSign, Mail, MapPin, Phone, Sparkles } from "lucide-react";
import { categoryDefinitions, siteConfig, storefrontNav } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-[#060609]">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr]">
          <div className="space-y-4">
            <Link href="/" className="flex w-fit items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles className="size-4" aria-hidden="true" />
              </span>
              <span className="font-display text-base font-semibold tracking-tight">
                {siteConfig.name}
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-6 text-muted-foreground">{siteConfig.description}</p>
            <p className="text-xs text-muted-foreground">{siteConfig.vatNote}</p>
          </div>

          <div>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Shop
            </h2>
            <ul className="space-y-2.5 text-sm">
              {storefrontNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-muted-foreground hover:text-primary">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/products?category=coils-accessories"
                  className="text-muted-foreground hover:text-primary"
                >
                  Coils & Accessories
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Account
            </h2>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/account/orders" className="text-muted-foreground hover:text-primary">
                  Orders
                </Link>
              </li>
              <li>
                <Link href="/account/addresses" className="text-muted-foreground hover:text-primary">
                  Addresses
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-muted-foreground hover:text-primary">
                  Cart
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-muted-foreground hover:text-primary">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Support
            </h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 text-primary" aria-hidden="true" />
                <a href={`mailto:${siteConfig.supportEmail}`} className="hover:text-primary">
                  {siteConfig.supportEmail}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 text-primary" aria-hidden="true" />
                <a href={`tel:${siteConfig.supportPhone.replace(/\s/g, "")}`} className="hover:text-primary">
                  {siteConfig.supportPhone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="size-4 text-primary" aria-hidden="true" />
                {siteConfig.address}
              </li>
              <li className="flex items-center gap-2.5">
                <AtSign className="size-4 text-primary" aria-hidden="true" />
                <span>@vapordistrict.ph</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] px-4 py-4 text-xs leading-6 text-amber-100/80">
          <strong className="font-semibold text-amber-100">Age-restricted products.</strong> This store
          sells nicotine products intended only for adults aged 21 and over. Nicotine is an addictive
          chemical. Keep all products out of reach of children and pets. Valid government ID may be
          requested on delivery.
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/5 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.legalName}. All rights reserved.
          </p>
          <p>
            {categoryDefinitions.length} curated categories · PHP pricing · Philippines only
          </p>
        </div>
      </div>
    </footer>
  );
}
