import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your Titan Safety Co. account password.",
};

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide text-dark-charcoal">
        Reset password
      </h1>
      <p className="mt-2 text-sm text-medium-gray">
        Enter your email and we&apos;ll send a reset link.
      </p>
      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
