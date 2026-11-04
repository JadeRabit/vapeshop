import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, MessageSquareText, Search, Star } from "lucide-react";
import { requirePageAdmin } from "@/lib/auth-guards";
import { getAdminReviewList } from "@/lib/data/admin-reviews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { ReviewRowActions } from "@/components/admin/review-row-actions";
import { cn, formatDateTime, formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reviews",
  robots: { index: false, follow: false },
};

type AdminReviewsPageProps = {
  searchParams: Promise<{ q?: string; rating?: string; page?: string }>;
};

function reviewsHref({
  q,
  rating,
  page,
}: {
  q?: string;
  rating?: number | null;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (rating) params.set("rating", String(rating));
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/reviews?${query}` : "/admin/reviews";
}

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5 text-amber-300", className)}
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn(
            "size-3.5",
            index < rating ? "fill-current" : "text-white/15",
          )}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export default async function AdminReviewsPage({ searchParams }: AdminReviewsPageProps) {
  await requirePageAdmin();
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const page = Number.parseInt(params.page ?? "1", 10);

  const result = await getAdminReviewList({
    search,
    rating: params.rating,
    page: Number.isFinite(page) ? page : 1,
  });

  const hasFilters = Boolean(search) || result.rating !== null;
  const distribution = [5, 4, 3, 2, 1].map((rating) => {
    const count = result.summary.distribution[rating as 1 | 2 | 3 | 4 | 5];
    return {
      rating,
      count,
      pct: result.summary.total > 0 ? Math.round((count / result.summary.total) * 100) : 0,
    };
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          Social proof
        </p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Reviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Moderate customer feedback and keep product pages trustworthy.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Average rating
              </p>
              <div className="mt-1 flex flex-wrap items-end gap-3">
                <span className="text-4xl font-semibold tabular-nums">
                  {result.summary.average.toFixed(1)}
                </span>
                <Stars rating={Math.round(result.summary.average)} className="pb-1" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Based on {result.summary.total} review{result.summary.total === 1 ? "" : "s"}.
              </p>
            </div>
            <div className="grid gap-2 text-right text-xs text-muted-foreground">
              <span className="inline-flex items-center justify-end gap-1.5">
                <MessageSquareText className="size-3.5" aria-hidden="true" />
                {result.summary.total} total
              </span>
              <span className="inline-flex items-center justify-end gap-1.5 text-emerald-300">
                <BadgeCheck className="size-3.5" aria-hidden="true" />
                {result.summary.verified} verified
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {distribution.map((row) => (
              <Link
                key={row.rating}
                href={reviewsHref({
                  q: search || undefined,
                  rating: result.rating === row.rating ? null : row.rating,
                })}
                aria-current={result.rating === row.rating ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.04]",
                  result.rating === row.rating && "bg-primary/[0.06]",
                )}
              >
                <span className="w-10 text-xs text-muted-foreground tabular-nums">
                  {row.rating} star
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <span
                    className={cn(
                      "block h-full rounded-full bg-amber-300/70 transition-all",
                      result.rating === row.rating && "bg-amber-300",
                    )}
                    style={{ width: `${row.pct}%` }}
                  />
                </span>
                <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                  {row.count}
                </span>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold">Filter reviews</h2>
          <form method="get" className="mt-4 space-y-3">
            {result.rating ? (
              <input type="hidden" name="rating" value={result.rating} />
            ) : null}
            <div>
              <label
                htmlFor="review-search"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Product, customer, or keyword
              </label>
              <Input
                id="review-search"
                name="q"
                type="search"
                defaultValue={search}
                placeholder="Aurora or Mika"
              />
            </div>
            <div>
              <label
                htmlFor="review-rating"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Rating
              </label>
              <select
                id="review-rating"
                name="rating"
                defaultValue={result.rating ? String(result.rating) : ""}
                className="h-11 w-full rounded-xl border border-input bg-white/[0.035] px-3.5 text-sm text-foreground focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20"
              >
                <option value="">All ratings</option>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} star{rating === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="outline" size="sm">
                <Search aria-hidden="true" /> Apply
              </Button>
              {hasFilters ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin/reviews">Clear</Link>
                </Button>
              ) : null}
            </div>
          </form>
          <p className="mt-4 border-t border-white/10 pt-3 text-[11px] leading-5 text-muted-foreground">
            Removing a review also refreshes the product page rating and count.
          </p>
        </Card>
      </div>

      {result.reviews.length === 0 ? (
        <EmptyState
          icon={<Star className="size-6" aria-hidden="true" />}
          title={hasFilters ? "No reviews matched." : "No reviews yet."}
          description={
            hasFilters
              ? "Try a different keyword or rating, or clear the filters."
              : "Customer reviews will appear here once shoppers rate their purchases."
          }
          action={
            hasFilters ? (
              <Button asChild variant="outline">
                <Link href="/admin/reviews">Clear filters</Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/admin/products">Browse products</Link>
              </Button>
            )
          }
        />
      ) : (
        <Card className="divide-y divide-white/[0.07]">
          {result.reviews.map((review) => (
            <article key={review.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars rating={review.rating} />
                    <Badge variant="muted">{review.rating}/5</Badge>
                    {review.verifiedPurchase ? (
                      <Badge variant="success">Verified purchase</Badge>
                    ) : null}
                  </div>
                  <h2 className="mt-2 text-base font-semibold">{review.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground" title={formatDateTime(review.createdAt)}>
                    {formatRelativeTime(review.createdAt)}
                  </span>
                  <ReviewRowActions
                    reviewId={review.id}
                    productName={review.product.name}
                    customerEmail={review.customer.email}
                  />
                </div>
              </div>

              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                {review.body}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                <Link
                  href={`/products/${review.product.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  {review.product.name}
                </Link>
                <span>
                  {review.customer.name ?? "Unnamed customer"} · {review.customer.email}
                </span>
                <span>{formatDateTime(review.createdAt)}</span>
              </div>
            </article>
          ))}
        </Card>
      )}

      {result.reviews.length > 0 ? (
        <Pagination
          basePath="/admin/reviews"
          page={result.page}
          pageCount={result.pageCount}
          total={result.total}
          params={{
            q: search || undefined,
            rating: result.rating ? String(result.rating) : undefined,
          }}
        />
      ) : null}
    </div>
  );
}
