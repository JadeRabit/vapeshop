"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ImageOff,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/shared/price";
import { QuantityStepper } from "@/components/shared/quantity-stepper";
import { StockBadge } from "@/components/shared/stock-badge";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import type { ProductDetailDTO } from "@/lib/data/catalog";
import { flavorProfiles, siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

export function ProductDetailView({ product }: { product: ProductDetailDTO }) {
  const [selectedVariantId, setSelectedVariantId] = useState(() => {
    const purchasable = product.variants.find((variant) => variant.stock > 0);
    return purchasable?.id ?? product.variants[0]?.id ?? "";
  });
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);

  const selectedVariant =
    product.variants.find((variant) => variant.id === selectedVariantId) ?? product.variants[0];
  const images = product.images;
  const activeImage = images[imageIndex] ?? images[0];

  function selectVariant(variantId: string) {
    setSelectedVariantId(variantId);
    setQuantity(1);
    const variant = product.variants.find((item) => item.id === variantId);
    const variantImageIndex = variant?.imageUrl
      ? images.findIndex((image) => image.variantId === variantId)
      : -1;
    if (variantImageIndex >= 0) setImageIndex(variantImageIndex);
  }

  function moveImage(direction: -1 | 1) {
    if (images.length < 2) return;
    setImageIndex((current) => (current + direction + images.length) % images.length);
  }

  const flavorLabel = selectedVariant?.flavorProfile
    ? flavorProfiles.find((flavor) => flavor.value === selectedVariant.flavorProfile)?.label
    : null;

  return (
    <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
      <div className="space-y-4">
        <div
          className="group relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-card"
          tabIndex={images.length > 1 ? 0 : -1}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              moveImage(-1);
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              moveImage(1);
            }
          }}
          aria-label={images.length > 1 ? "Product image gallery. Use arrow keys to navigate." : undefined}
        >
          {activeImage ? (
            <Image
              src={activeImage.url}
              alt={activeImage.alt}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <span className="grid h-full place-items-center text-muted-foreground">
              <ImageOff className="size-8" aria-hidden="true" />
            </span>
          )}
          {product.isFeatured ? (
            <Badge className="absolute left-4 top-4">Featured</Badge>
          ) : null}
          {images.length > 1 ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur"
                onClick={() => moveImage(-1)}
                aria-label="Previous image"
              >
                <ChevronLeft aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur"
                onClick={() => moveImage(1)}
                aria-label="Next image"
              >
                <ChevronRight aria-hidden="true" />
              </Button>
              <span className="absolute bottom-4 right-4 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium backdrop-blur">
                {imageIndex + 1} / {images.length}
              </span>
            </>
          ) : null}
        </div>

        {images.length > 1 ? (
          <div className="grid grid-cols-5 gap-2" role="group" aria-label="Product image thumbnails">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setImageIndex(index)}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-xl border transition-colors",
                  index === imageIndex
                    ? "border-primary ring-1 ring-primary/40"
                    : "border-white/10 opacity-70 hover:opacity-100",
                )}
                aria-label={`Show image ${index + 1}: ${image.alt}`}
                aria-pressed={index === imageIndex}
              >
                <Image src={image.url} alt="" fill sizes="120px" className="object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <Link href={`/products?category=${product.category.slug}`} className="hover:text-primary">
            {product.category.name}
          </Link>{" "}
          · {product.brand}
        </p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">{product.name}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {product.ratingAverage ? (
            <span className="inline-flex items-center gap-1.5 text-sm">
              <Star className="size-4 fill-primary text-primary" aria-hidden="true" />
              <span className="font-semibold">{product.ratingAverage.toFixed(1)}</span>
              <span className="text-muted-foreground">
                ({product.reviewCount} review{product.reviewCount === 1 ? "" : "s"})
              </span>
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">No reviews yet</span>
          )}
          <StockBadge
            stock={selectedVariant?.stock ?? 0}
            threshold={selectedVariant?.lowStockThreshold}
            inactive={!selectedVariant}
          />
        </div>

        <p className="mt-5 text-sm leading-7 text-muted-foreground">{product.shortDescription}</p>

        <div className="mt-6 flex items-end justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {product.variants.length > 1 ? "Selected option" : "Price"}
            </p>
            <Price
              centavos={selectedVariant?.priceCentavos ?? product.lowestPriceCentavos}
              className="mt-1 block text-3xl font-semibold"
            />
            {selectedVariant ? (
              <p className="mt-1 text-xs text-muted-foreground">SKU {selectedVariant.sku}</p>
            ) : null}
          </div>
          {flavorLabel || selectedVariant?.nicotineMg ? (
            <div className="text-right text-xs text-muted-foreground">
              {flavorLabel ? <p>{flavorLabel}</p> : null}
              {selectedVariant?.nicotineMg ? <p>{selectedVariant.nicotineMg}mg</p> : null}
            </div>
          ) : null}
        </div>

        {product.variants.length > 0 ? (
          <fieldset className="mt-6">
            <legend className="text-sm font-medium">Choose an option</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {product.variants.map((variant) => {
                const disabled = variant.stock <= 0 || !variant.isActive;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => selectVariant(variant.id)}
                    aria-pressed={variant.id === selectedVariant?.id}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors",
                      variant.id === selectedVariant?.id
                        ? "border-primary bg-primary/[0.07]"
                        : "border-white/12 bg-white/[0.02] hover:border-white/25",
                      disabled && "cursor-not-allowed opacity-45",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{variant.label}</span>
                      {variant.stock <= 0 ? (
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-destructive">
                          Sold out
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Price centavos={variant.priceCentavos} />
                      {variant.stock > 0 ? <span>· {variant.stock} available</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <QuantityStepper
            value={quantity}
            min={1}
            max={Math.max(Math.min(selectedVariant?.stock ?? 1, 99), 1)}
            onDecrease={() => setQuantity((current) => Math.max(1, current - 1))}
            onIncrease={() =>
              setQuantity((current) =>
                Math.min(current + 1, Math.max(Math.min(selectedVariant?.stock ?? 1, 99), 1)),
              )
            }
            label="Product quantity"
          />
          {selectedVariant && selectedVariant.stock > 0 ? (
            <AddToCartButton
              size="lg"
              className="flex-1"
              quantity={quantity}
              label={`Add ${quantity} to cart`}
              line={{
                variantId: selectedVariant.id,
                productId: product.id,
                productName: product.name,
                productSlug: product.slug,
                variantLabel: selectedVariant.label,
                sku: selectedVariant.sku,
                unitPriceCentavos: selectedVariant.priceCentavos,
                imageUrl: activeImage?.url ?? selectedVariant.imageUrl ?? null,
                imageAlt: activeImage?.alt ?? selectedVariant.imageAlt ?? product.name,
                stock: selectedVariant.stock,
              }}
            />
          ) : (
            <Button size="lg" className="flex-1" disabled>
              Out of stock
            </Button>
          )}
        </div>

        {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= selectedVariant.lowStockThreshold ? (
          <p className="mt-3 text-xs text-amber-300" role="status">
            Only {selectedVariant.stock} left of this option. Stock is confirmed again at checkout.
          </p>
        ) : null}
        {selectedVariant && selectedVariant.stock <= 0 ? (
          <p className="mt-3 text-xs text-destructive" role="status">
            This option is unavailable. Choose another option or check back soon.
          </p>
        ) : null}

        <div className="mt-6 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <p className="flex items-center gap-2">
            <Truck className="size-4 text-primary" aria-hidden="true" />
            Free shipping over {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(siteConfig.freeShippingThresholdCentavos / 100)}
          </p>
          <p className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            21+ signature may be requested
          </p>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          <h2 className="text-sm font-semibold">About this product</h2>
          <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
            {product.description.split(/\n{2,}/).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
