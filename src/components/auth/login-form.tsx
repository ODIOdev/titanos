"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { login, type ActionResult } from "@/lib/actions/auth";
import { loginSchema, type LoginInput } from "@/lib/validations";

const REMEMBER_EMAIL_KEY = "titan-remember-email";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/account";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const rememberMe = watch("rememberMe");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (saved) {
        setValue("email", saved);
        setValue("rememberMe", true);
      }
    } catch {
      // Ignore storage access errors
    }
  }, [setValue]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result: ActionResult = await login(values);
      if (!result.success) {
        toast.error(result.error ?? "Unable to sign in.");
        return;
      }

      try {
        if (values.rememberMe) {
          window.localStorage.setItem(
            REMEMBER_EMAIL_KEY,
            values.email.trim(),
          );
        } else {
          window.localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch {
        // Ignore storage access errors
      }

      toast.success(result.message ?? "Signed in.");
      router.push(result.redirectTo ?? redirectTo);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to sign in.");
    }
  });

  const emailRegister = register("email");
  const passwordRegister = register("password");
  const rememberRegister = register("rememberMe");

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          error={errors.email?.message}
          {...emailRegister}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          error={errors.password?.message}
          {...passwordRegister}
        />
        <div className="flex items-center justify-between gap-3">
          <Checkbox
            label="Remember me"
            checked={Boolean(rememberMe)}
            onChange={(event) => {
              setValue("rememberMe", event.target.checked, {
                shouldDirty: true,
              });
            }}
            name={rememberRegister.name}
            onBlur={rememberRegister.onBlur}
            ref={rememberRegister.ref}
          />
          <Link
            href="/forgot-password"
            className="text-sm text-medium-gray underline-offset-2 hover:text-dark-charcoal hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <OAuthButtons redirectTo={redirectTo} />

      <p className="text-center text-sm text-medium-gray">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-dark-charcoal underline-offset-2 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
