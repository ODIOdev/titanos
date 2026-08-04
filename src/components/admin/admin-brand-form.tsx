"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  createBrand,
  updateBrand,
  uploadBrandLogo,
} from "@/lib/actions/admin";
import { brandFormSchema, type BrandFormInput } from "@/lib/validations";
import { cn, slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type AdminBrandFormProps = {
  mode?: "create" | "edit";
  brandId?: string;
  defaultValues?: Partial<BrandFormInput>;
};

export function AdminBrandForm({
  mode = "create",
  brandId,
  defaultValues,
}: AdminBrandFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BrandFormInput>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      logoUrl: "",
      website: "",
      active: true,
      ...defaultValues,
    },
  });

  const active = watch("active");
  const logoUrl = watch("logoUrl");
  const displayUrl = previewUrl || (logoUrl?.trim() ? logoUrl : null);

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
      const result = await uploadBrandLogo(formData);

      if (!result.success || !result.url || result.url.startsWith("data:")) {
        URL.revokeObjectURL(localPreview);
        setPreviewUrl(null);
        toast.error(result.message || "Upload failed.");
        return;
      }

      setValue("logoUrl", result.url, { shouldValidate: true, shouldDirty: true });
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(null);
      toast.success(result.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function clearLogo() {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setValue("logoUrl", "", { shouldValidate: true, shouldDirty: true });
  }

  const onSubmit = handleSubmit((values) => {
    if (previewUrl || uploading) {
      toast.error("Wait for the logo upload to finish before saving.");
      return;
    }

    startTransition(async () => {
      const payload = {
        ...values,
        slug: values.slug || slugify(values.name),
        logoUrl: values.logoUrl?.trim() || undefined,
        website: values.website || undefined,
      };
      const result =
        mode === "edit" && brandId
          ? await updateBrand(brandId, payload)
          : await createBrand(payload);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.push("/admin/brands");
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-5">
      <section className="overflow-hidden rounded-sm border border-border-gray bg-white">
        <div className="border-b border-border-gray bg-light-gray/40 px-5 py-4">
          <h2 className="font-heading text-lg font-semibold uppercase tracking-wide text-dark-charcoal">
            {mode === "edit" ? "Edit brand" : "New brand"}
          </h2>
          <p className="mt-0.5 text-sm text-medium-gray">
            Brand details shown on product pages and shop filters.
          </p>
        </div>

        <div className="space-y-4 p-5">
          <Input
            label="Name"
            required
            error={errors.name?.message}
            {...register("name", {
              onChange: (e) => {
                if (mode === "create") {
                  setValue("slug", slugify(e.target.value), {
                    shouldValidate: true,
                  });
                }
              },
            })}
          />
          <Input
            label="Slug"
            required
            hint="URL-safe identifier"
            error={errors.slug?.message}
            {...register("slug")}
          />
          <Textarea
            label="Description"
            rows={3}
            error={errors.description?.message}
            {...register("description")}
          />
          <Input
            label="Website"
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder="https://example.com"
            hint="Optional. Include https:// or we’ll add it for you."
            error={errors.website?.message}
            {...register("website")}
          />

          <div>
            <p className="mb-1.5 text-sm font-medium text-dark-charcoal">Logo</p>
            <div
              className={cn(
                "relative flex min-h-36 flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-border-gray bg-light-gray/40 p-4 transition-colors",
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
                <div className="relative flex w-full items-center justify-center">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 rounded-sm"
                    style={{
                      backgroundImage:
                        "linear-gradient(45deg, #dfe3e8 25%, transparent 25%), linear-gradient(-45deg, #dfe3e8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #dfe3e8 75%), linear-gradient(-45deg, transparent 75%, #dfe3e8 75%)",
                      backgroundSize: "14px 14px",
                      backgroundPosition: "0 0, 0 7px, 7px -7px, -7px 0",
                      backgroundColor: "#f7f8fa",
                    }}
                  />
                  <Image
                    src={displayUrl}
                    alt="Brand logo preview"
                    width={240}
                    height={96}
                    unoptimized
                    className="relative z-[1] max-h-24 w-auto bg-transparent object-contain"
                  />
                  <button
                    type="button"
                    className="absolute right-0 top-0 z-[2] inline-flex size-8 items-center justify-center rounded-sm bg-white text-medium-gray shadow-sm hover:text-red-700"
                    aria-label="Remove logo"
                    onClick={clearLogo}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ) : (
                <>
                  <ImagePlus className="size-8 text-medium-gray" aria-hidden="true" />
                  <p className="text-sm text-medium-gray">
                    Drag a logo here, or upload below
                  </p>
                  <p className="text-xs text-medium-gray">
                    White backgrounds are removed automatically (PNG).
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
                {uploading ? "Uploading…" : "Upload logo"}
              </Button>
            </div>
            <input type="hidden" {...register("logoUrl")} />
            {errors.logoUrl?.message ? (
              <p className="mt-1.5 text-sm text-red-700">{errors.logoUrl.message}</p>
            ) : null}
          </div>

          <label className="flex items-center gap-2 text-sm text-dark-charcoal">
            <input
              type="checkbox"
              className="size-4 rounded-sm border-border-gray"
              checked={active}
              onChange={(e) =>
                setValue("active", e.target.checked, { shouldDirty: true })
              }
            />
            Active (visible in shop)
          </label>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/admin/brands")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending || uploading}>
          {pending
            ? "Saving…"
            : mode === "edit"
              ? "Save brand"
              : "Create brand"}
        </Button>
      </div>
    </form>
  );
}
