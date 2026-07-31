"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitAffiliateApplication } from "@/lib/actions/affiliates";
import {
  affiliateApplicationSchema,
  type AffiliateApplicationInput,
} from "@/lib/validations";

export type AffiliateApplicationFormProps = {
  defaultValues: {
    contactName: string;
    email: string;
    phone: string;
    company: string;
  };
  /** Declined applicants can revise and send a new application. */
  reapplying?: boolean;
};

export function AffiliateApplicationForm({
  defaultValues,
  reapplying = false,
}: AffiliateApplicationFormProps) {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AffiliateApplicationInput>({
    resolver: zodResolver(
      affiliateApplicationSchema,
    ) as Resolver<AffiliateApplicationInput>,
    defaultValues: {
      contactName: defaultValues.contactName,
      email: defaultValues.email,
      phone: defaultValues.phone,
      company: defaultValues.company,
      audience: "",
      motivation: "",
      agreedToTerms: undefined,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await submitAffiliateApplication(values);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    setSubmitted(true);
  });

  if (submitted) {
    return (
      <div className="rounded-sm border border-success-green/40 bg-success-green/5 p-6">
        <CheckCircle2
          className="size-8 text-success-green"
          aria-hidden="true"
        />
        <h3 className="mt-3 font-heading text-xl uppercase tracking-wide text-dark-charcoal">
          Application received
        </h3>
        <p className="mt-2 text-sm text-medium-gray">
          Our team reviews new affiliates weekly. You&apos;ll get an email as
          soon as your account is approved, and your code appears here.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Full name"
          required
          error={errors.contactName?.message}
          {...register("contactName")}
        />
        <Input
          label="Email"
          type="email"
          required
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Phone"
          type="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <Input
          label="Company or crew"
          error={errors.company?.message}
          {...register("company")}
        />
      </div>

      <Textarea
        label="Where will you share your code?"
        required
        rows={4}
        hint="Jobsites, trade groups, social channels, a newsletter — tell us how your audience buys PPE."
        error={errors.audience?.message}
        {...register("audience")}
      />

      <Textarea
        label="Anything else we should know?"
        rows={3}
        hint="Optional."
        error={errors.motivation?.message}
        {...register("motivation")}
      />

      <Checkbox
        label="I accept the affiliate program terms"
        description="Codes are personal, cannot be posted to coupon aggregator sites, and may be deactivated for misuse."
        {...register("agreedToTerms")}
      />
      {errors.agreedToTerms?.message ? (
        <p className="text-sm text-red-700" role="alert">
          {errors.agreedToTerms.message}
        </p>
      ) : null}

      <Button type="submit" variant="primary" size="lg" disabled={isSubmitting}>
        {isSubmitting
          ? "Submitting…"
          : reapplying
            ? "Submit new application"
            : "Apply to the program"}
      </Button>
    </form>
  );
}
