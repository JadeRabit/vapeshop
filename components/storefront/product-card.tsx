import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/shared/price";
import { StockBadge } from "@/components/shared/stock-badge";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import type { ProductCardDTO } from "@/lib/data/catalog";

export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductCardDTO;
  priority?: boolean;
}) {
  const image = product.images[0];
  const variant = product.variants.find((item) => item.stock > 0) ?? product.variants[0];

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-card transition-colors hover:border-primary/30">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[4/3] overflow-hidden bg-[#101018]"
        aria-label={`View ${product.name}`}
      >
        {image ? (
          <Image
            src={image.url}
            alt={image.alt}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, (min-width: 480px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="grid h-full place-items-center text-muted-foreground">
            <ImageOff className="size-7" aria-hidden="true" />
          </span>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {product.isFeatured ? <Badge>Featured</Badge> : null}
          <StockBadge stock={product.totalStock} />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {product.brand} · {product.category.name}
        </p>
        <h3 className="mt-1.5 text-base font-semibold leading-tight">
          <Link href={`/products/${product.slug}`} className="hover:text-primary">
            {product.name}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
          {product.shortDescription}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {product.variants.length > 1 ? `${product.variants.length} options from` : "Price"}
            </p>
            <Price centavos={product.lowestPriceCentavos} className="text-lg font-semibold" />
          </div>
          {variant && variant.stock > 0 ? (
            <AddToCartButton
              size="sm"
              variant="outline"
              label="Quick add"
              line={{
                variantId: variant.id,
                productId: product.id,
                productName: product.name,
                productSlug: product.slug,
                variantLabel: variant.label,
                sku: variant.sku,
                unitPriceCentavos: variant.priceCentavos,
                imageUrl: variant.imageUrl ?? image?.url ?? null,
                imageAlt: variant.imageAlt ?? image?.alt ?? product.name,
                stock: variant.stock,
              }}
            />
          ) : (
            <Link
              href={`/products/${product.slug}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              View details <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
