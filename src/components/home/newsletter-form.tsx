"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeNewsletter } from "@/lib/actions/newsletter";
import { newsletterSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";

type NewsletterFormValues = z.infer<typeof newsletterSchema>;

export type NewsletterFormProps = {
  className?: string;
};

export function NewsletterForm({ className }: NewsletterFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      const result = await subscribeNewsletter(values);
      if (!result.success) {
        toast.error(result.error ?? "Subscription failed. Please try again.");
        return;
      }
      toast.success(
        result.message ?? "You're subscribed. Watch your inbox for safety updates.",
      );
      reset();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <section
      className={cn("section-y border-t border-border-gray bg-light-gray", className)}
      aria-labelledby="newsletter-heading"
    >
      <div className="container-titan">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
          <div>
            <p className="eyebrow">Stay informed</p>
            <h2
              id="newsletter-heading"
              className="mt-2 font-heading text-3xl uppercase tracking-wide text-dark-charcoal sm:text-4xl"
            >
              Safety updates delivered to your inbox.
            </h2>
            <p className="mt-3 max-w-md text-base text-medium-gray">
              Product alerts, compliance tips, and volume-pricing offers — no
              fluff.
            </p>
          </div>

          <div>
            <form
              onSubmit={onSubmit}
              className="flex flex-col gap-3 sm:flex-row sm:items-start"
              noValidate
            >
              <div className="flex-1 text-left">
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  aria-label="Email address"
                  className="h-12"
                  error={errors.email?.message}
                  {...register("email")}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                className="w-full shrink-0 sm:w-auto"
              >
                {isSubmitting ? "Subscribing…" : "Subscribe"}
              </Button>
            </form>
            <p className="mt-3 text-xs text-medium-gray">
              We respect your privacy. Unsubscribe anytime. See our{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-2 hover:text-dark-charcoal"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
