import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create a Titan Safety Co. account for faster checkout and quote tracking.",
};

export default function RegisterPage() {
  return (
    <div className="w-full max-w-3xl rounded-sm border border-border-gray bg-white p-6 shadow-sm sm:p-8 lg:p-10">
      <div className="flex flex-col gap-2 border-b border-border-gray pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide text-dark-charcoal lg:text-3xl">
            Create account
          </h1>
          <p className="mt-2 max-w-xl text-sm text-medium-gray">
            Set up a business account for orders, quotes, and crew outfitting.
          </p>
        </div>
      </div>
      <div className="mt-6">
        <RegisterForm />
      </div>
    </div>
  );
}
