import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function buildHref(
  basePath: string,
  page: number,
  params: Record<string, string | undefined>,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function Pagination({
  basePath,
  page,
  pageCount,
  total,
  params = {},
  className,
}: {
  basePath: string;
  page: number;
  pageCount: number;
  total: number;
  params?: Record<string, string | undefined>;
  className?: string;
}) {
  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground">
        Page {page} of {pageCount} · {total} {total === 1 ? "result" : "results"}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Button asChild variant="outline" size="sm">
            <Link href={buildHref(basePath, page - 1, params)} rel="prev">
              <ChevronLeft aria-hidden="true" /> Previous
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft aria-hidden="true" /> Previous
          </Button>
        )}
        {page < pageCount ? (
          <Button asChild variant="outline" size="sm">
            <Link href={buildHref(basePath, page + 1, params)} rel="next">
              Next <ChevronRight aria-hidden="true" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next <ChevronRight aria-hidden="true" />
          </Button>
        )}
      </div>
    </nav>
  );
}
