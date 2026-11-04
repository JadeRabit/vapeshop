import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryDefinition } from "@/lib/config";

export function CategoryCard({
  category,
  index,
}: {
  category: CategoryDefinition;
  index: number;
}) {
  const body = (
    <>
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br",
          category.accent,
          "via-transparent to-transparent opacity-70",
        )}
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
            className={cn(
              "object-cover opacity-80 transition-transform duration-500",
              !category.comingSoon && "group-hover:scale-110",
              category.comingSoon && "opacity-50 grayscale",
            )}
          />
        </span>
      </div>
      <p
        className={cn(
          "relative mt-5 inline-flex items-center gap-1.5 text-xs font-semibold",
          category.comingSoon ? "text-muted-foreground" : "text-primary",
        )}
      >
        {category.comingSoon ? (
          <>
            <Clock className="size-3.5" aria-hidden="true" /> Coming soon
          </>
        ) : (
          <>
            Browse category <ArrowRight className="size-3.5" aria-hidden="true" />
          </>
        )}
      </p>
      <span className="absolute right-4 bottom-4 text-5xl font-bold text-white/[0.035]">
        0{index + 1}
      </span>
    </>
  );

  const className =
    "relative overflow-hidden rounded-2xl border border-white/10 bg-card p-5 transition-colors";

  if (category.comingSoon) {
    return (
      <div
        aria-disabled="true"
        className={cn(className, "cursor-default border-dashed bg-card/60")}
      >
        {body}
      </div>
    );
  }

  return (
    <Link
      href={`/products?category=${category.slug}`}
      className={cn(className, "group hover:border-primary/35")}
    >
      {body}
    </Link>
  );
}
