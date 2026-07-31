"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  createMember,
  updateMember,
  uploadMemberAvatar,
} from "@/lib/actions/admin";
import { memberFormSchema, type MemberFormInput } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";

type AdminMemberFormProps = {
  mode?: "create" | "edit";
  memberId?: string;
  defaultValues?: Partial<MemberFormInput>;
};

function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  let out = "";
  for (let i = 0; i < 12; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function AdminMemberForm({
  mode = "create",
  memberId,
  defaultValues,
}: AdminMemberFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MemberFormInput>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      promoCode: "",
      avatarUrl: "",
      password: "",
      ...defaultValues,
    },
  });

  const avatarUrl = watch("avatarUrl");
  const displayUrl = previewUrl || (avatarUrl?.trim() ? avatarUrl : null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be 8 MB or smaller.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadMemberAvatar(formData);

      if (!result.success || !result.url || result.url.startsWith("data:")) {
        URL.revokeObjectURL(localPreview);
        setPreviewUrl(null);
        toast.error(result.message || "Upload failed.");
        return;
      }

      setValue("avatarUrl", result.url, {
        shouldValidate: true,
        shouldDirty: true,
      });
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(null);
      toast.success(result.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function clearAvatar() {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setValue("avatarUrl", "", { shouldValidate: true, shouldDirty: true });
  }

  const onSubmit = handleSubmit((values) => {
    if (previewUrl || uploading) {
      toast.error("Wait for the photo upload to finish before saving.");
      return;
    }

    startTransition(async () => {
      const result =
        mode === "edit" && memberId
          ? await updateMember(memberId, values)
          : await createMember(values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.push("/admin/members");
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-5" noValidate>
      <section className="overflow-hidden rounded-sm border border-border-gray bg-white">
        <div className="border-b border-border-gray bg-light-gray/40 px-5 py-4">
          <h2 className="font-heading text-lg font-semibold uppercase tracking-wide text-dark-charcoal">
            {mode === "edit" ? "Edit member" : "New team member"}
          </h2>
          <p className="mt-0.5 text-sm text-medium-gray">
            Internal crew account with access to this admin dashboard.
          </p>
        </div>

        <div className="space-y-4 p-5">
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
            label="Email"
            type="email"
            required
            autoComplete="off"
            hint="Used as their login."
            error={errors.email?.message}
            {...register("email")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
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
            <Input
              label="Date of birth"
              type="date"
              error={errors.dateOfBirth?.message}
              {...register("dateOfBirth")}
            />
          </div>

          <Input
            label="Promo code"
            hint="Their affiliate / staff discount code."
            className="uppercase"
            error={errors.promoCode?.message}
            {...register("promoCode")}
          />

          <div>
            <p className="mb-1.5 text-sm font-medium text-dark-charcoal">
              Profile image
            </p>
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-border-gray bg-light-gray/40 p-4 transition-colors",
                dragOver && "border-titan-yellow bg-titan-yellow/10",
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) void handleFile(file);
              }}
            >
              {displayUrl ? (
                <div className="flex items-center gap-3">
                  <div className="relative size-20 overflow-hidden rounded-full border border-border-gray bg-white">
                    <Image
                      src={displayUrl}
                      alt="Member photo preview"
                      fill
                      unoptimized
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearAvatar}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Remove
                  </Button>
                </div>
              ) : (
                <>
                  <ImagePlus
                    className="size-8 text-medium-gray"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-medium-gray">
                    Drag a photo here, or upload below
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-4" aria-hidden="true" />
                {uploading ? "Uploading…" : "Upload photo"}
              </Button>
            </div>
            <input type="hidden" {...register("avatarUrl")} />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-sm border border-border-gray bg-white">
        <div className="border-b border-border-gray bg-light-gray/40 px-5 py-4">
          <h2 className="font-heading text-base font-semibold uppercase tracking-wide text-dark-charcoal">
            Login credentials
          </h2>
          <p className="mt-0.5 text-sm text-medium-gray">
            {mode === "edit"
              ? "Leave blank to keep their current password."
              : "Share these with the team member after saving."}
          </p>
        </div>

        <div className="space-y-4 p-5">
          <Input
            label={mode === "edit" ? "New password" : "Password"}
            type="password"
            required={mode === "create"}
            autoComplete="new-password"
            hint="Minimum 8 characters. Use the eye icon to check it before saving."
            error={errors.password?.message}
            {...register("password")}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setValue("password", generateTempPassword(), {
                shouldDirty: true,
              })
            }
          >
            Generate password
          </Button>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => router.push("/admin/members")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending || uploading}>
          {pending
            ? "Saving…"
            : mode === "edit"
              ? "Save member"
              : "Add member"}
        </Button>
      </div>
    </form>
  );
}
