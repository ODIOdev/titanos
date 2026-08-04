"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { createCategory, uploadCategoryImage } from "@/lib/actions/admin";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, slugify } from "@/lib/utils";

/** Opens a dialog to create a catalog category. */
export function AddCategoryButton({ className }: { className?: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [active, setActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  const displayUrl = previewUrl || (imageUrl.trim() ? imageUrl : null);

  function resetForm() {
    setName("");
    setDescription("");
    setImageUrl("");
    setActive(true);
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

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

      setImageUrl(result.url);
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
    setImageUrl("");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = name.trim();
    if (!value) {
      toast.error("Enter a category name.");
      return;
    }
    if (previewUrl || uploading) {
      toast.error("Wait for the image upload to finish before saving.");
      return;
    }

    startTransition(async () => {
      const result = await createCategory({
        name: value,
        slug: slugify(value),
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        sortOrder: 0,
        active,
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      resetForm();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(buttonVariants({ variant: "primary", size: "sm" }), className)}
      >
        <Plus className="size-3.5" aria-hidden="true" />
        Add category
      </button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetForm();
        }}
        title="Add category"
        description="Create a catalog category for the shop and product form."
        className="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-dark-charcoal">
              Default image
            </p>
            <div className="flex items-start gap-3">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-sm border border-border-gray bg-light-gray">
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
                      sizes="80px"
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
                    <ImagePlus
                      className="size-5 text-dark-charcoal"
                      aria-hidden="true"
                    />
                    <span className="text-[10px] font-medium uppercase tracking-wide text-medium-gray">
                      {uploading ? "…" : "Upload"}
                    </span>
                  </button>
                )}
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-xs text-medium-gray">
                  Used on category cards. JPG, PNG, or WEBP · max 8 MB.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  disabled={uploading || pending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="size-3.5" aria-hidden="true" />
                  {uploading
                    ? "Uploading…"
                    : displayUrl
                      ? "Replace"
                      : "Choose file"}
                </Button>
              </div>
            </div>
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
            label="Category name"
            placeholder="e.g. Safety Gloves"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            required
          />
          <Textarea
            label="Description"
            rows={3}
            placeholder="Optional short description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <label className="inline-flex items-center gap-2 text-sm text-dark-charcoal">
            <input
              type="checkbox"
              className="size-4 rounded-sm border-border-gray"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
            Active
          </label>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending || uploading}
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || uploading}>
              {pending ? "Adding…" : "Add category"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
