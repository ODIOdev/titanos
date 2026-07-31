"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  removeAvatar,
  updateProfile,
  uploadAvatar,
  type ActionResult,
} from "@/lib/actions/auth";
import { profileSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";

type ProfileValues = z.infer<typeof profileSchema>;

export type ProfileFormProps = {
  defaultValues: ProfileValues;
  email?: string;
  avatarUrl?: string | null;
};

export function ProfileForm({
  defaultValues,
  email,
  avatarUrl = null,
}: ProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl);
  const [uploading, startUpload] = useTransition();

  useEffect(() => {
    setPreviewUrl(avatarUrl);
  }, [avatarUrl]);

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
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to update profile.",
      );
    }
  });

  function onFileSelected(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    const formData = new FormData();
    formData.append("file", file);

    startUpload(async () => {
      try {
        const result = await uploadAvatar(formData);
        if (!result.success) {
          toast.error(result.error ?? "Unable to upload photo.");
          setPreviewUrl(avatarUrl);
          return;
        }
        if (result.url) setPreviewUrl(result.url);
        toast.success(result.message ?? "Profile photo updated.");
        router.refresh();
      } catch (err) {
        setPreviewUrl(avatarUrl);
        toast.error(
          err instanceof Error ? err.message : "Unable to upload photo.",
        );
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
        URL.revokeObjectURL(objectUrl);
      }
    });
  }

  function onRemovePhoto() {
    startUpload(async () => {
      try {
        const result = await removeAvatar();
        if (!result.success) {
          toast.error(result.error ?? "Unable to remove photo.");
          return;
        }
        setPreviewUrl(null);
        toast.success(result.message ?? "Profile photo removed.");
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Unable to remove photo.",
        );
      }
    });
  }

  const initials = [defaultValues.firstName, defaultValues.lastName]
    .map((part) => part?.trim()?.[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className={cn(
            "relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-gray bg-light-gray",
            uploading && "opacity-70",
          )}
        >
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Profile photo"
              fill
              className="object-cover"
              sizes="96px"
              unoptimized={previewUrl.startsWith("blob:")}
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
          <p className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
            Profile photo
          </p>
          <p className="text-sm text-medium-gray">
            JPG, PNG, WEBP, or GIF — max 5 MB.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera aria-hidden="true" />
              {uploading ? "Uploading…" : previewUrl ? "Change photo" : "Upload photo"}
            </Button>
            {previewUrl ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={uploading}
                onClick={onRemovePhoto}
              >
                <Trash2 aria-hidden="true" />
                Remove
              </Button>
            ) : null}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(event) => onFileSelected(event.target.files)}
          />
        </div>
      </section>

      <form onSubmit={onSubmit} className="max-w-xl space-y-4" noValidate>
        {email ? (
          <Input
            label="Email"
            type="email"
            value={email}
            disabled
            hint="Email cannot be changed here."
          />
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
        <Input
          label="Company"
          error={errors.company?.message}
          {...register("company")}
        />
        <Input
          label="Phone"
          type="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </div>
  );
}
