import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Titan Safety Co. account.",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-md rounded-sm border border-border-gray bg-white p-6 shadow-sm sm:p-8">
      <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide text-dark-charcoal">
        Sign in
      </h1>
      <p className="mt-2 text-sm text-medium-gray">
        Access orders, quotes, and saved addresses.
      </p>
      <div className="mt-6">
        <Suspense
          fallback={
            <div className="h-64 animate-pulse rounded-sm bg-light-gray" />
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
