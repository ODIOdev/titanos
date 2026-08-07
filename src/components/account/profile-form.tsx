"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Pencil, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  changeAccountEmail,
  removeAvatar,
  updateProfile,
  uploadAvatar,
  type ActionResult,
} from "@/lib/actions/auth";
import { formatPhoneInput } from "@/lib/phone";
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
  const [emailOpen, setEmailOpen] = useState(false);
  const [nextEmail, setNextEmail] = useState(email ?? "");
  const [emailPending, startEmailChange] = useTransition();

  useEffect(() => {
    setPreviewUrl(avatarUrl);
  }, [avatarUrl]);

  useEffect(() => {
    if (emailOpen) setNextEmail(email ?? "");
  }, [emailOpen, email]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      ...defaultValues,
      phone: defaultValues.phone
        ? formatPhoneInput(defaultValues.phone)
        : "",
    },
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

  function submitEmailChange() {
    startEmailChange(async () => {
      const result = await changeAccountEmail({ email: nextEmail });
      if (!result.success) {
        toast.error(result.error ?? "Unable to change email.");
        return;
      }
      toast.success(result.message ?? "Confirmation sent.");
      setEmailOpen(false);
      router.refresh();
    });
  }

  const initials = [defaultValues.firstName, defaultValues.lastName]
    .map((part) => part?.trim()?.[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-sm border border-border-gray bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-2.5 border-b border-border-gray bg-light-gray/40 px-4 py-3">
        <span className="inline-flex size-7 items-center justify-center rounded-sm bg-titan-yellow/70 text-near-black">
          <User className="size-3.5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
            Account
          </h2>
          <p className="text-xs text-medium-gray">Photo &amp; contact</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-3 rounded-sm border border-border-gray bg-light-gray/30 p-3">
          <div
            className={cn(
              "relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-gray bg-white",
              uploading && "opacity-70",
            )}
          >
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Profile photo"
                fill
                className="object-cover"
                sizes="56px"
                unoptimized={previewUrl.startsWith("blob:")}
              />
            ) : initials ? (
              <span className="font-heading text-base font-semibold uppercase text-dark-charcoal">
                {initials}
              </span>
            ) : (
              <User className="size-6 text-medium-gray" aria-hidden="true" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs text-medium-gray">JPG / PNG / WEBP · 5 MB max</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera aria-hidden="true" />
                {uploading ? "…" : previewUrl ? "Change" : "Upload"}
              </Button>
              {previewUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={uploading}
                  className="text-medium-gray hover:text-red-700"
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
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-3 flex flex-1 flex-col gap-3"
          noValidate
        >
          {email ? (
            <div className="space-y-1.5">
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    disabled
                    autoComplete="email"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mb-0 h-10 shrink-0"
                  onClick={() => setEmailOpen(true)}
                >
                  <Pencil aria-hidden="true" />
                  Edit
                </Button>
              </div>
              <p className="text-xs text-medium-gray">
                Changing email requires inbox confirmation.
              </p>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              required
              autoComplete="given-name"
              error={errors.firstName?.message}
              {...register("firstName")}
            />
            <Input
              label="Last name"
              required
              autoComplete="family-name"
              error={errors.lastName?.message}
              {...register("lastName")}
            />
          </div>
          <Input
            label="Company"
            autoComplete="organization"
            error={errors.company?.message}
            {...register("company")}
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
                autoComplete="tel"
              />
            )}
          />

          <div className="mt-auto pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </form>
      </div>

      <Dialog
        open={emailOpen}
        onOpenChange={setEmailOpen}
        title="Change email"
        description="We’ll send a confirmation link to the new address. Your login email updates after you confirm."
      >
        <div className="space-y-4">
          <Input
            label="Current email"
            type="email"
            value={email ?? ""}
            disabled
          />
          <Input
            label="New email"
            type="email"
            required
            value={nextEmail}
            onChange={(e) => setNextEmail(e.target.value)}
            autoComplete="email"
            data-autofocus
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={emailPending}
              onClick={() => setEmailOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={emailPending || !nextEmail.trim()}
              onClick={submitEmailChange}
            >
              {emailPending ? "Sending…" : "Send confirmation"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
