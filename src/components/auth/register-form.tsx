"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select } from "@/components/ui/select";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { US_STATES } from "@/lib/data/geo";
import { register as registerAction, type ActionResult } from "@/lib/actions/auth";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      phone: "",
      state: "",
      postalCode: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");
  const confirmPassword = watch("confirmPassword");
  const firstName = watch("firstName");
  const lastName = watch("lastName");
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;
  const confirmPasswordError =
    errors.confirmPassword?.message ??
    (passwordsMismatch ? "Passwords do not match" : undefined);

  const initials = [firstName, lastName]
    .map((part) => part?.trim()?.[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function onAvatarSelected(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setAvatarError("Use JPG, PNG, WEBP, or GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be 5 MB or smaller.");
      return;
    }

    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarError(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function clearAvatar() {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarError(null);
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const formData = new FormData();
      formData.set("firstName", values.firstName);
      formData.set("lastName", values.lastName);
      formData.set("email", values.email);
      formData.set("company", values.company ?? "");
      formData.set("phone", values.phone ?? "");
      formData.set("state", values.state);
      formData.set("postalCode", values.postalCode);
      formData.set("password", values.password);
      formData.set("confirmPassword", values.confirmPassword);
      if (avatarFile) formData.set("avatar", avatarFile);

      const result: ActionResult = await registerAction(formData);
      if (!result.success) {
        toast.error(result.error ?? "Unable to create account.");
        return;
      }
      toast.success(result.message ?? "Account created.");
      router.push(result.redirectTo ?? "/account");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to create account.",
      );
    }
  });

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        <section className="space-y-4">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.14em] text-medium-gray">
            Profile photo
          </h2>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div
              className={cn(
                "relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-gray bg-light-gray",
              )}
            >
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="Profile photo preview"
                  fill
                  className="object-cover"
                  sizes="96px"
                  unoptimized
                />
              ) : initials ? (
                <span className="font-heading text-2xl font-semibold uppercase text-dark-charcoal">
                  {initials}
                </span>
              ) : (
                <User className="size-10 text-medium-gray" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm text-medium-gray">
                Optional. JPG, PNG, WEBP, or GIF — max 5 MB.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera aria-hidden="true" />
                  {avatarPreview ? "Change photo" : "Upload photo"}
                </Button>
                {avatarPreview ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearAvatar}
                  >
                    <Trash2 aria-hidden="true" />
                    Remove
                  </Button>
                ) : null}
              </div>
              {avatarError ? (
                <p className="text-sm text-red-700" role="alert">
                  {avatarError}
                </p>
              ) : null}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(event) => onAvatarSelected(event.target.files)}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t border-border-gray pt-6">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.14em] text-medium-gray">
            Account details
          </h2>
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
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              required
              error={errors.email?.message}
              {...register("email")}
            />
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  label="Phone"
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.phone?.message}
                />
              )}
            />
            <div className="sm:col-span-2">
              <Input
                label="Company"
                autoComplete="organization"
                error={errors.company?.message}
                {...register("company")}
              />
            </div>
            <Select
              label="State"
              required
              placeholder="Select state"
              autoComplete="address-level1"
              options={US_STATES.map((state) => ({
                label: state.label,
                value: state.value,
              }))}
              error={errors.state?.message}
              {...register("state")}
            />
            <Input
              label="ZIP code"
              autoComplete="postal-code"
              required
              inputMode="numeric"
              error={errors.postalCode?.message}
              {...register("postalCode")}
            />
          </div>
        </section>

        <section className="space-y-4 border-t border-border-gray pt-6">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.14em] text-medium-gray">
            Security
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
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
              error={confirmPasswordError}
              success={passwordsMatch}
              hint={passwordsMatch ? "Passwords match" : undefined}
              {...register("confirmPassword")}
            />
          </div>
        </section>

        <div className="flex flex-col gap-4 border-t border-border-gray pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full sm:min-w-[14rem] sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
          <p className="text-center text-sm text-medium-gray sm:text-right">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-dark-charcoal underline-offset-2 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>

      <OAuthButtons redirectTo="/account" layout="row" />
    </div>
  );
}
