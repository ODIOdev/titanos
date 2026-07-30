"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { register as registerAction, type ActionResult } from "@/lib/actions/auth";
import { registerSchema, type RegisterInput } from "@/lib/validations";

export function RegisterForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result: ActionResult = await registerAction(values);
      if (!result.success) {
        toast.error(result.error ?? "Unable to create account.");
        return;
      }
      toast.success(result.message ?? "Account created.");
      router.push("/account");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to create account.");
    }
  });

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            autoComplete="given-name"
            required
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <Input
            label="Last name"
            autoComplete="family-name"
            required
            error={errors.lastName?.message}
            {...register("lastName")}
          />
        </div>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Company"
          autoComplete="organization"
          error={errors.company?.message}
          {...register("company")}
        />
        <Input
          label="Phone"
          type="tel"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-medium-gray">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-dark-charcoal underline-offset-2 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
