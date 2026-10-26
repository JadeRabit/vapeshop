import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Star } from "lucide-react";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductDetailView } from "@/components/storefront/product-detail-view";
import { ReviewForm } from "@/components/storefront/review-form";
import { getProductDetail, getReviewEligibility } from "@/lib/data/catalog";
import { getInitials, formatDate } from "@/lib/utils";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductDetail(slug);

  if (!product) {
    return { title: "Product not found" };
  }

  const image = product.images[0];

  return {
    title: `${product.name} · ${product.brand}`,
    description: product.shortDescription,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.name} · ${product.brand}`,
      description: product.shortDescription,
      url: `/products/${product.slug}`,
      images: image ? [{ url: image.url, alt: image.alt }] : undefined,
    },
  };
}

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={className} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={value <= Math.round(rating) ? "inline size-4 fill-primary text-primary" : "inline size-4 text-white/20"}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [product, session] = await Promise.all([getProductDetail(slug), auth()]);

  if (!product) notFound();

  const eligibility = session?.user?.id
    ? await getReviewEligibility(product.id, session.user.id)
    : null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <ChevronRight className="size-3" aria-hidden="true" />
        <Link href="/products" className="hover:text-primary">
          Shop all
        </Link>
        <ChevronRight className="size-3" aria-hidden="true" />
        <Link href={`/products?category=${product.category.slug}`} className="hover:text-primary">
          {product.category.name}
        </Link>
        <ChevronRight className="size-3" aria-hidden="true" />
        <span className="text-foreground" aria-current="page">
          {product.name}
        </span>
      </nav>

      <ProductDetailView product={product} />

      <section id="reviews" className="mt-20 border-t border-white/10 pt-12" aria-labelledby="reviews-heading">
        <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Community</p>
                <h2 id="reviews-heading" className="mt-1 text-3xl font-semibold">
                  Reviews
                </h2>
              </div>
              {product.ratingAverage ? (
                <div className="text-right">
                  <p className="flex items-center justify-end gap-2 text-2xl font-semibold">
                    {product.ratingAverage.toFixed(1)}
                    <Stars rating={product.ratingAverage} />
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {product.reviewCount} verified review{product.reviewCount === 1 ? "" : "s"}
                  </p>
                </div>
              ) : null}
            </div>

            {product.reviews.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
                <p className="text-base font-semibold">No reviews yet.</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Be the first verified purchaser to share how this product performed.
                </p>
              </div>
            ) : (
              <ol className="mt-6 space-y-4">
                {product.reviews.map((review) => (
                  <li key={review.id} className="rounded-2xl border border-white/10 bg-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-bold text-primary">
                          {getInitials(review.authorName)}
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{review.authorName}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Stars rating={review.rating} />
                        {review.verifiedPurchase ? (
                          <Badge variant="success">Verified purchase</Badge>
                        ) : null}
                      </div>
                    </div>
                    <h3 className="mt-4 text-sm font-semibold">{review.title}</h3>
                    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                      {review.body}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <aside className="h-fit rounded-2xl border border-white/10 bg-card p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold">Share your experience</h2>
            {eligibility?.canReview ? (
              <div className="mt-4">
                <p className="mb-4 text-sm leading-6 text-muted-foreground">
                  You have a qualifying order for this product. One review per product.
                </p>
                <ReviewForm productId={product.id} />
              </div>
            ) : !session?.user ? (
              <div className="mt-3 space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  Reviews are limited to verified purchasers. Sign in to check your eligibility.
                </p>
                <Button asChild className="w-full">
                  <Link href={`/login?callbackUrl=${encodeURIComponent(`/products/${product.slug}`)}`}>
                    Sign in to review
                  </Link>
                </Button>
              </div>
            ) : eligibility?.hasReviewed ? (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                You have already reviewed this product. Thank you for helping other customers.
              </p>
            ) : (
              <div className="mt-3 space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  No qualifying purchase found. Reviews open after a paid, shipped, or delivered order
                  containing this product.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/account/orders">View your orders</Link>
                </Button>
              </div>
            )}

            <div className="mt-6 border-t border-white/10 pt-4 text-xs leading-6 text-muted-foreground">
              Reviews reflect individual experiences. Nicotine products are not smoking-cessation
              devices unless approved as such.
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
