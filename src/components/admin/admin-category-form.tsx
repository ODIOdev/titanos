"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { createCategory, updateCategory, uploadCategoryImage } from "@/lib/actions/admin";
import {
  categoryFormSchema,
  type CategoryFormInput,
} from "@/lib/validations";
import { toSelectOptions } from "@/lib/data/catalog-options";
import { cn, slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type AdminCategoryFormProps = {
  mode?: "create" | "edit";
  categoryId?: string;
  defaultValues?: Partial<CategoryFormInput>;
  departmentOptions?: { label: string; value: string }[];
};

export function AdminCategoryForm({
  mode = "create",
  categoryId,
  defaultValues,
  departmentOptions = [],
}: AdminCategoryFormProps) {
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
  } = useForm<CategoryFormInput>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      imageUrl: "",
      sortOrder: 0,
      active: false,
      skuPrefix: "",
      department: "",
      ...defaultValues,
    },
  });
  const imageUrl = watch("imageUrl");
  const displayUrl = previewUrl || (imageUrl?.trim() ? imageUrl : null);

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
      const result = await uploadCategoryImage(formData);

      if (!result.success || !result.url || result.url.startsWith("data:")) {
        URL.revokeObjectURL(localPreview);
        setPreviewUrl(null);
        toast.error(result.message || "Upload failed.");
        return;
      }

      setValue("imageUrl", result.url, { shouldValidate: true, shouldDirty: true });
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(null);
      toast.success(result.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function clearImage() {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setValue("imageUrl", "", { shouldValidate: true, shouldDirty: true });
  }

  const onSubmit = handleSubmit((values) => {
    if (previewUrl || uploading) {
      toast.error("Wait for the image upload to finish before saving.");
      return;
    }

    startTransition(async () => {
      const payload = {
        ...values,
        slug: values.slug || slugify(values.name),
        imageUrl: values.imageUrl?.trim() || undefined,
      };
      const result =
        mode === "edit" && categoryId
          ? await updateCategory(categoryId, payload)
          : await createCategory(payload);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      if (mode === "edit") {
        router.push(`/admin/categories/${categoryId}`);
        router.refresh();
      } else if (result.id) {
        router.push(`/admin/categories/${result.id}`);
        router.refresh();
      } else {
        router.push("/admin/categories");
        router.refresh();
      }
    });
  });

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-2xl space-y-4 rounded-sm border border-border-gray bg-white p-3 @5xl:space-y-5 @5xl:p-6"
      noValidate
    >
      <div>
        <p className="mb-2 text-sm font-medium text-dark-charcoal">
          Default image
        </p>
        <div className="flex flex-col gap-3 @5xl:flex-row @5xl:items-start">
          <div
            className={cn(
              "relative mx-auto size-28 shrink-0 overflow-hidden rounded-sm border border-border-gray bg-light-gray @5xl:mx-0",
              dragOver && "border-titan-yellow ring-1 ring-titan-yellow",
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
              <>
                <Image
                  src={displayUrl}
                  alt="Category default image"
                  fill
                  unoptimized={
                    displayUrl.startsWith("data:") ||
                    displayUrl.startsWith("blob:")
                  }
                  className="object-cover"
                  sizes="112px"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  disabled={uploading || pending}
                  className="absolute right-1 top-1 inline-flex size-6 items-center justify-center rounded-sm bg-dark-charcoal text-white hover:bg-near-black disabled:opacity-50"
                  aria-label="Remove image"
                >
                  <Trash2 className="size-3" />
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={uploading || pending}
                onClick={() => fileInputRef.current?.click()}
                className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center"
              >
                <ImagePlus className="size-5 text-dark-charcoal" aria-hidden="true" />
                <span className="text-[10px] font-medium uppercase tracking-wide text-medium-gray">
                  {uploading ? "…" : "Upload"}
                </span>
              </button>
            )}
          </div>
          <div className="min-w-0 text-center @5xl:pt-0.5 @5xl:text-left">
            <p className="text-xs text-medium-gray">
              Used on category cards and the shop grid. JPG, PNG, or WEBP · max
              8 MB.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 w-full @5xl:w-auto"
              disabled={uploading || pending}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-3.5" aria-hidden="true" />
              {uploading ? "Uploading…" : displayUrl ? "Replace" : "Choose file"}
            </Button>
          </div>
        </div>
        {errors.imageUrl?.message ? (
          <p className="mt-1.5 text-sm text-red-700" role="alert">
            {errors.imageUrl.message}
          </p>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>

      <Input
        label="Name"
        required
        error={errors.name?.message}
        {...register("name", {
          onChange: (e) => {
            setValue("slug", slugify(e.target.value), { shouldValidate: true });
          },
        })}
      />
      <Select
        label="Department"
        hint="Which merchandise department this category belongs to"
        options={toSelectOptions(departmentOptions, "Select department")}
        error={errors.department?.message}
        {...register("department")}
      />
      <Input
        label="SKU prefix"
        placeholder="e.g. WGG"
        error={errors.skuPrefix?.message}
        hint="Used for new product SKUs (WGG-0001). Leave blank to use name initials."
        {...register("skuPrefix", {
          setValueAs: (value: string) =>
            value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12),
        })}
      />
      <Textarea
        label="Description"
        rows={4}
        error={errors.description?.message}
        {...register("description")}
      />

      <Input
        label="Sort order"
        type="number"
        error={errors.sortOrder?.message}
        {...register("sortOrder")}
      />
      <p className="text-xs text-medium-gray">
        Status is automatic: inactive with no products, active once a product is
        assigned.
      </p>
      <div className="flex flex-col-reverse gap-2 pt-2 @5xl:flex-row @5xl:flex-wrap @5xl:gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={pending || uploading}
          onClick={() => router.push("/admin/categories")}
          className="w-full @5xl:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={pending || uploading}
          className="w-full @5xl:w-auto"
        >
          {pending
            ? "Saving…"
            : mode === "edit"
              ? "Save changes"
              : "Create category"}
        </Button>
      </div>
    </form>
  );
}
