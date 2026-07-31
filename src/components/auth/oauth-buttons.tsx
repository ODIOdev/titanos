"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { absoluteUrl } from "@/lib/utils";

type OAuthProvider = "google" | "apple";

const PROVIDERS: {
  id: OAuthProvider;
  label: string;
  logo: string;
  logoWidth: number;
  logoHeight: number;
}[] = [
  {
    id: "google",
    label: "Continue with Google",
    logo: "/images/auth/google.png",
    logoWidth: 128,
    logoHeight: 128,
  },
  {
    id: "apple",
    label: "Continue with Apple",
    logo: "/images/auth/apple.png",
    logoWidth: 128,
    logoHeight: 128,
  },
];

export type OAuthButtonsProps = {
  redirectTo?: string;
  className?: string;
  /** Stack buttons (default) or place them side-by-side. */
  layout?: "stack" | "row";
};

export function OAuthButtons({
  redirectTo = "/account",
  className,
  layout = "stack",
}: OAuthButtonsProps) {
  const [loading, setLoading] = useState<OAuthProvider | null>(null);

  async function signInWith(provider: OAuthProvider) {
    setLoading(provider);
    try {
      if (!isSupabaseConfigured()) {
        toast.error(
          "Authentication is not configured. Add Supabase env vars to enable social sign-in.",
        );
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: absoluteUrl(
            `/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          ),
          ...(provider === "apple"
            ? {
                // Apple requires the email/name scopes for first sign-in profile data
                scopes: "name email",
              }
            : {}),
        },
      });

      if (error) toast.error(error.message);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : `Unable to start ${provider === "google" ? "Google" : "Apple"} sign-in.`,
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className={className}>
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-border-gray" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-medium-gray">Or continue with</span>
        </div>
      </div>

      <div
        className={
          layout === "row" ? "mt-6 grid gap-3 sm:grid-cols-2" : "mt-6 grid gap-3"
        }
      >
        {PROVIDERS.map((provider) => {
          const busy = loading === provider.id;
          return (
            <Button
              key={provider.id}
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              disabled={loading != null}
              onClick={() => void signInWith(provider.id)}
            >
              <Image
                src={provider.logo}
                alt=""
                width={provider.logoWidth}
                height={provider.logoHeight}
                className="size-5 object-contain"
              />
              {busy ? "Redirecting…" : provider.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
