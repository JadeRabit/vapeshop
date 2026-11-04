import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-lg flex-col items-center justify-center text-center">
      <span className="grid size-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-primary">
        <SearchX className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold">That admin page does not exist.</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        The record may have been deleted, or the link may be out of date. Return to the overview
        and continue from there.
      </p>
      <Button asChild className="mt-6">
        <Link href="/admin">
          <ArrowLeft aria-hidden="true" /> Back to overview
        </Link>
      </Button>
    </div>
  );
}
