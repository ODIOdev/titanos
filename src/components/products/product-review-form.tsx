"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { StarRating } from "@/components/ui/star-rating";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitProductReview } from "@/lib/actions/reviews";
import type { ProductReview } from "@/types";
import { cn } from "@/lib/utils";

export type ProductReviewFormProps = {
  productId: string;
  productSlug: string;
  ratingAvg: number;
  ratingCount: number;
  isAuthenticated: boolean;
  myReview: ProductReview | null;
  /** Compact control for the PDP hero row. */
  variant?: "hero" | "section";
  className?: string;
};

export function ProductReviewForm({
  productId,
  productSlug,
  ratingAvg,
  ratingCount,
  isAuthenticated,
  myReview,
  variant = "section",
  className,
}: ProductReviewFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [rating, setRating] = useState(myReview?.rating ?? 0);
  const [title, setTitle] = useState(myReview?.title ?? "");
  const [body, setBody] = useState(myReview?.body ?? "");
  const [expanded, setExpanded] = useState(variant === "section");

  const loginHref = `/login?redirect=${encodeURIComponent(pathname || `/product/${productSlug}`)}`;

  const summaryLabel = useMemo(() => {
    if (myReview) return "Update your rating";
    if (ratingCount > 0) return "Rate this product";
    return "Be the first to rate";
  }, [myReview, ratingCount]);

  function save(nextRating = rating) {
    if (!isAuthenticated) {
      router.push(loginHref);
      return;
    }
    if (nextRating < 1) {
      toast.error("Choose a star rating.");
      return;
    }

    startTransition(async () => {
      const result = await submitProductReview({
        productId,
        productSlug,
        rating: nextRating,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
      });

      if (!result.success) {
        toast.error(result.message);
        if (result.message.toLowerCase().includes("sign in")) {
          router.push(loginHref);
        }
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  if (variant === "hero") {
    return (
      <div className={cn("flex flex-wrap items-center gap-3", className)}>
        <StarRating
          rating={ratingCount > 0 ? ratingAvg : rating || 0}
          count={ratingCount}
          showValue
          interactive
          value={rating || undefined}
          disabled={pending}
          onChange={(next) => {
            if (!isAuthenticated) {
              router.push(loginHref);
              return;
            }
            setRating(next);
            setExpanded(true);
            save(next);
          }}
        />
        {!isAuthenticated ? (
          <Link
            href={loginHref}
            className="text-sm font-medium text-dark-charcoal underline-offset-2 hover:underline"
          >
            Sign in to rate
          </Link>
        ) : (
          <button
            type="button"
            className="text-sm font-medium text-dark-charcoal underline-offset-2 hover:underline"
            onClick={() => setExpanded((open) => !open)}
          >
            {summaryLabel}
          </button>
        )}
        {expanded && isAuthenticated ? (
          <div className="basis-full rounded-sm border border-border-gray bg-light-gray/60 p-3">
            <ReviewFields
              title={title}
              body={body}
              pending={pending}
              onTitleChange={setTitle}
              onBodyChange={setBody}
              onSubmit={() => save()}
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-sm border border-border-gray bg-white p-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg uppercase tracking-wide text-dark-charcoal">
            {summaryLabel}
          </h3>
          <p className="mt-1 text-sm text-medium-gray">
            {isAuthenticated
              ? "Tap a star to set your score. You can update it anytime."
              : "Sign in to leave a star rating that shows across the catalog."}
          </p>
        </div>
        <StarRating
          rating={rating || myReview?.rating || 0}
          interactive
          value={rating || undefined}
          disabled={pending}
          size="lg"
          onChange={(next) => {
            if (!isAuthenticated) {
              router.push(loginHref);
              return;
            }
            setRating(next);
          }}
        />
      </div>

      {isAuthenticated ? (
        <div className="mt-4">
          <ReviewFields
            title={title}
            body={body}
            pending={pending}
            onTitleChange={setTitle}
            onBodyChange={setBody}
            onSubmit={() => save()}
          />
        </div>
      ) : (
        <Link href={loginHref} className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
          Sign in to rate
        </Link>
      )}
    </div>
  );
}

function ReviewFields({
  title,
  body,
  pending,
  onTitleChange,
  onBodyChange,
  onSubmit,
}: {
  title: string;
  body: string;
  pending: boolean;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="review-title">Title (optional)</Label>
        <Input
          id="review-title"
          value={title}
          maxLength={120}
          placeholder="What stood out?"
          onChange={(event) => onTitleChange(event.target.value)}
          disabled={pending}
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="review-body">Review (optional)</Label>
        <textarea
          id="review-body"
          value={body}
          maxLength={2000}
          rows={3}
          placeholder="Share fit, durability, or jobsite notes…"
          onChange={(event) => onBodyChange(event.target.value)}
          disabled={pending}
          className="mt-1.5 w-full rounded-sm border border-border-gray bg-white px-3 py-2 text-sm text-dark-charcoal outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow"
        />
      </div>
      <Button type="button" onClick={onSubmit} disabled={pending}>
        {pending ? "Saving…" : "Save rating"}
      </Button>
    </div>
  );
}
