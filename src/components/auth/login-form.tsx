"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login, type ActionResult } from "@/lib/actions/auth";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { absoluteUrl } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/account";
  const [oauthLoading, setOauthLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result: ActionResult = await login(values);
      if (!result.success) {
        toast.error(result.error ?? "Unable to sign in.");
        return;
      }
      toast.success(result.message ?? "Signed in.");
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to sign in.");
    }
  });

  async function signInWithGoogle() {
    setOauthLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        toast.error("Authentication is not configured. Add Supabase env vars to enable Google sign-in.");
        return;
      }
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: absoluteUrl(
            `/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          ),
        },
      });
      if (error) toast.error(error.message);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to start Google sign-in.",
      );
    } finally {
      setOauthLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          error={errors.password?.message}
          {...register("password")}
        />
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-medium-gray underline-offset-2 hover:text-dark-charcoal hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-border-gray" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-medium-gray">Or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        disabled={oauthLoading}
        onClick={signInWithGoogle}
      >
        {oauthLoading ? "Redirecting…" : "Continue with Google"}
      </Button>

      <p className="text-center text-sm text-medium-gray">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-dark-charcoal underline-offset-2 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
