"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfile, type ActionResult } from "@/lib/actions/auth";
import { profileSchema } from "@/lib/validations";

type ProfileValues = z.infer<typeof profileSchema>;

export type ProfileFormProps = {
  defaultValues: ProfileValues;
  email?: string;
};

export function ProfileForm({ defaultValues, email }: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result: ActionResult = await updateProfile(values);
      if (!result.success) {
        toast.error(result.error ?? "Unable to update profile.");
        return;
      }
      toast.success(result.message ?? "Profile updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update profile.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4" noValidate>
      {email ? (
        <Input label="Email" type="email" value={email} disabled hint="Email cannot be changed here." />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="First name"
          required
          error={errors.firstName?.message}
          {...register("firstName")}
        />
        <Input
          label="Last name"
          required
          error={errors.lastName?.message}
          {...register("lastName")}
        />
      </div>
      <Input label="Company" error={errors.company?.message} {...register("company")} />
      <Input label="Phone" type="tel" error={errors.phone?.message} {...register("phone")} />
      <Button type="submit" variant="primary" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
