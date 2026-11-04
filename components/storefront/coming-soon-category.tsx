import Link from "next/link";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { availableCategoryDefinitions } from "@/lib/config";

export function ComingSoonCategory({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card p-8 sm:p-12">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(196,255,77,.12),transparent_45%),radial-gradient(circle_at_90%_100%,rgba(167,139,250,.14),transparent_50%)]"
          aria-hidden="true"
        />
        <div className="relative max-w-2xl">
          <Badge variant="outline" className="border-primary/30 bg-primary/[0.04] text-primary">
            <Clock className="size-3.5" aria-hidden="true" /> Coming soon
          </Badge>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">{title}</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">{description}</p>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            We&apos;re still curating this shelf. It is not open for orders yet — check back soon, or
            shop the categories that are ready to ship today.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/products">
                Browse available products <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/">Back to home</Link>
            </Button>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Available now
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {availableCategoryDefinitions.map((category) => (
                <Link
                  key={category.slug}
                  href={`/products?category=${category.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary"
                >
                  <Sparkles className="size-3" aria-hidden="true" />
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
