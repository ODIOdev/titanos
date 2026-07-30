"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPassword, type ActionResult } from "@/lib/actions/auth";
import { forgotPasswordSchema } from "@/lib/validations";

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result: ActionResult = await resetPassword(values);
      if (!result.success) {
        toast.error(result.error ?? "Unable to send reset email.");
        return;
      }
      toast.success(result.message ?? "Check your email for a reset link.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to send reset email.");
    }
  });

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          hint="We'll send a password reset link if an account exists."
          error={errors.email?.message}
          {...register("email")}
        />
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="text-center text-sm text-medium-gray">
        Remembered your password?{" "}
        <Link href="/login" className="font-medium text-dark-charcoal underline-offset-2 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
