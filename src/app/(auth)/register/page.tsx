import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a Titan Safety Co. account for faster checkout and quote tracking.",
};

export default function RegisterPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide text-dark-charcoal">
        Create account
      </h1>
      <p className="mt-2 text-sm text-medium-gray">
        Set up a business account for orders, quotes, and crew outfitting.
      </p>
      <div className="mt-6">
        <RegisterForm />
      </div>
    </div>
  );
}
