"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { submitReviewAction } from "@/lib/actions/reviews";
import { initialActionState } from "@/lib/action-result";
import { cn } from "@/lib/utils";

export function ReviewForm({ productId }: { productId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [rating, setRating] = useState(5);
  const [state, formAction, pending] = useActionState(submitReviewAction, initialActionState);

  useEffect(() => {
    if (state.ok) {
      toast.success("Review published.");
      formRef.current?.reset();
      setRating(5);
      router.refresh();
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />

      {!state.ok && state.message ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      {state.ok && state.message ? (
        <Alert variant="success">
          <CheckCircle2 aria-hidden="true" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <fieldset>
        <legend className="text-sm font-medium">Your rating</legend>
        <div className="mt-2 flex gap-1" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              aria-pressed={rating === value}
              className="rounded-md p-1 transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  "size-6",
                  value <= rating ? "fill-primary text-primary" : "text-white/20",
                )}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
        {state.fieldErrors?.rating ? (
          <p className="mt-1 text-xs text-destructive">{state.fieldErrors.rating[0]}</p>
        ) : null}
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="review-title">Title</Label>
        <Input
          id="review-title"
          name="title"
          required
          maxLength={80}
          placeholder="Sum it up in a few words"
          aria-invalid={Boolean(state.fieldErrors?.title)}
          aria-describedby={state.fieldErrors?.title ? "review-title-error" : undefined}
        />
        {state.fieldErrors?.title ? (
          <p id="review-title-error" className="text-xs text-destructive" role="alert">
            {state.fieldErrors.title[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-body">Review</Label>
        <Textarea
          id="review-body"
          name="body"
          required
          minLength={10}
          maxLength={1200}
          rows={4}
          placeholder="How was the flavour, draw, and quality?"
          aria-invalid={Boolean(state.fieldErrors?.body)}
          aria-describedby={state.fieldErrors?.body ? "review-body-error" : undefined}
        />
        {state.fieldErrors?.body ? (
          <p id="review-body-error" className="text-xs text-destructive" role="alert">
            {state.fieldErrors.body[0]}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Publishing…" : "Publish review"}
      </Button>
    </form>
  );
}
