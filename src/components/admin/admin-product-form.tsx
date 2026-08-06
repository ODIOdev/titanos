"use client";

import { useId, useRef, useState, useTransition, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  addCatalogDepartment,
  addCatalogSize,
  createProduct,
  deleteProduct,
  updateProduct,
  uploadProductImage,
} from "@/lib/actions/admin";
import { productFormSchema, type ProductFormInput } from "@/lib/validations";
import {
  DEPARTMENT_OPTIONS,
  GENDER_OPTIONS,
  PRODUCT_TAG_OPTIONS,
  SHIPPING_CLASS_OPTIONS,
  SIZE_OPTIONS,
  toGroupedSelectOptions,
  toSelectOptions,
} from "@/lib/data/catalog-options";
import { cn, slugify } from "@/lib/utils";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { ColorPaletteField } from "@/components/admin/color-palette-field";
import { CategorySpecsField } from "@/components/admin/category-specs-field";
import { CertificationsField } from "@/components/admin/certifications-field";
import { MaterialsField } from "@/components/admin/materials-field";
import { TagsField } from "@/components/admin/tags-field";
import {
  VariantMatrixField,
  normalizeVariantRows,
  type VariantRow,
} from "@/components/admin/variant-matrix-field";
import { sumVariantQuantities } from "@/lib/catalog/product-stock";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { PercentInput } from "@/components/ui/percent-input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

function salePercentFromPrices(
  price: number | null | undefined,
  compareAt: number | null | undefined,
): number | null {
  if (
    price == null ||
    compareAt == null ||
    !(compareAt > price) ||
    !(compareAt > 0)
  ) {
    return null;
  }
  return Math.round((1 - price / compareAt) * 1000) / 10;
}

const LB_PER_KG = 2.2046226218;

function weightToDisplay(
  lb: number | null | undefined,
  unit: "lb" | "kg",
): string {
  if (lb == null) return "";
  const n = typeof lb === "number" ? lb : Number(lb);
  if (!Number.isFinite(n)) return "";
  if (unit === "lb") return String(n);
  return String(Math.round((n / LB_PER_KG) * 1000) / 1000);
}

function displayToWeightLb(value: number, unit: "lb" | "kg"): number {
  if (unit === "lb") return Math.round(value * 1000) / 1000;
  return Math.round(value * LB_PER_KG * 1000) / 1000;
}

function applySaleToPrice(listPrice: number, percent: number): number {
  const next = listPrice * (1 - percent / 100);
  return Math.round(next * 100) / 100;
}

function toMoneyAmount(value: unknown): number {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const n = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

type Option = { id: string; name: string; slug?: string };

export type ProductImageDraft = {
  id: string;
  url: string;
  altText: string;
  isPrimary: boolean;
};

type AdminProductFormProps = {
  mode: "create" | "edit";
  productId?: string;
  categories: Option[];
  brands: Option[];
  tagOptions?: { label: string; value: string }[];
  /** Canonical + admin-added sizes; shared by every product form. */
  sizeOptions?: { label: string; value: string }[];
  /** Canonical + admin-added departments; shared by every product form. */
  departmentOptions?: { label: string; value: string }[];
  defaultValues?: Partial<ProductFormInput>;
  initialImages?: ProductImageDraft[];
  /** Where cancel, create, and delete return to. */
  returnHref?: string;
};

export function AdminProductForm({
  mode,
  productId,
  categories,
  brands,
  tagOptions,
  sizeOptions,
  departmentOptions,
  defaultValues,
  initialImages = [],
  returnHref = "/admin/products",
}: AdminProductFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialCompare = toMoneyAmount(defaultValues?.compareAtPrice);
  const listPriceRef = useRef<number | null>(
    initialCompare > 0 ? initialCompare : null,
  );
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [images, setImages] = useState<ProductImageDraft[]>(initialImages);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [salePercent, setSalePercent] = useState<number | null>(() =>
    salePercentFromPrices(defaultValues?.price, defaultValues?.compareAtPrice),
  );
  /** Remount money fields after programmatic sale updates so display stays in sync. */
  const [priceSyncKey, setPriceSyncKey] = useState(0);
  const [sizes, setSizes] = useState(() => sizeOptions ?? SIZE_OPTIONS);
  const [departments, setDepartments] = useState(
    () => departmentOptions ?? DEPARTMENT_OPTIONS,
  );
  const [customSize, setCustomSize] = useState("");
  const [addingSize, setAddingSize] = useState(false);
  const [customDepartment, setCustomDepartment] = useState("");
  const [addingDepartment, setAddingDepartment] = useState(false);
  /** Display unit only — catalog weight is always stored in pounds. */
  const [weightUnit, setWeightUnit] = useState<"lb" | "kg">("lb");
  const weightFieldId = useId();

  const form = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema) as never,
    defaultValues: {
      name: "",
      slug: "",
      sku: "",
      shortDescription: "",
      description: "",
      categoryId: "",
      brandId: "",
      price: 0,
      compareAtPrice: null,
      cost: null,
      inventoryQuantity: 0,
      lowStockThreshold: 10,
      weight: null,
      shippingClass: "standard",
      catalogStatus: "active",
      active: true,
      featured: false,
      bestseller: false,
      productType: "",
      department: "",
      gender: "",
      touchScreen: false,
      tags: [],
      primaryCertifications: [],
      color: "",
      size: "",
      hasMultipleSizes: false,
      variants: [],
      specifications: [],
      materials: [],
      certifications: [],
      ...defaultValues,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    control,
    formState: { errors },
  } = form;

  const hasMultipleSizes = watch("hasMultipleSizes");
  const variants = (watch("variants") ?? []) as VariantRow[];
  const categoryId = watch("categoryId");
  const specifications = watch("specifications") ?? [];
  const materials = watch("materials") ?? [];
  const certifications = watch("certifications") ?? [];
  const primaryCertifications = watch("primaryCertifications") ?? [];
  const tags = watch("tags") ?? [];
  const selectedCategorySlug =
    categories.find((c) => c.id === categoryId)?.slug ?? null;

  function captureListPrice() {
    const currentPrice = toMoneyAmount(getValues("price"));
    const currentCompare = toMoneyAmount(getValues("compareAtPrice"));

    if (currentCompare > 0 && currentCompare >= currentPrice) {
      listPriceRef.current = currentCompare;
    } else if (currentPrice > 0) {
      listPriceRef.current = currentPrice;
    } else {
      listPriceRef.current = null;
    }
  }

  function applySalePercent(percent: number | null) {
    setSalePercent(percent);

    if (listPriceRef.current == null || !(listPriceRef.current > 0)) {
      captureListPrice();
    }

    const listPrice = listPriceRef.current;
    if (listPrice == null || !(listPrice > 0)) {
      if (percent != null && percent > 0) {
        toast.error("Enter a price before applying a sale percent.");
      }
      return;
    }

    const setOpts = {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    } as const;

    if (percent == null || percent <= 0) {
      setValue("price", listPrice, setOpts);
      setValue("compareAtPrice", null, setOpts);
      listPriceRef.current = null;
      setPriceSyncKey((k) => k + 1);
      return;
    }

    const salePrice = applySaleToPrice(listPrice, percent);
    setValue("compareAtPrice", listPrice, setOpts);
    setValue("price", salePrice, setOpts);
    setPriceSyncKey((k) => k + 1);
  }

  function handleSalePercentChange(percent: number | null) {
    // Let any in-progress Price blur commit to RHF before we read/apply.
    queueMicrotask(() => applySalePercent(percent));
  }

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      toast.error("Please choose image files.");
      return;
    }

    setUploading(true);
    try {
      for (const file of list) {
        if (file.size > 8 * 1024 * 1024) {
          toast.error(`${file.name} is larger than 8 MB.`);
          continue;
        }

        const previewUrl = URL.createObjectURL(file);
        const draftId = `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setImages((prev) => [
          ...prev,
          {
            id: draftId,
            url: previewUrl,
            altText: watch("name") || file.name,
            isPrimary: prev.length === 0,
          },
        ]);

        const formData = new FormData();
        formData.append("file", file);
        const result = await uploadProductImage(formData);

        if (!result.success || !result.url || result.url.startsWith("data:")) {
          URL.revokeObjectURL(previewUrl);
          setImages((prev) => prev.filter((img) => img.id !== draftId));
          toast.error(result.message || "Upload failed.");
          continue;
        }

        setImages((prev) =>
          prev.map((img) =>
            img.id === draftId ? { ...img, url: result.url! } : img,
          ),
        );
        URL.revokeObjectURL(previewUrl);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function setPrimary(id: string) {
    setImages((prev) =>
      prev.map((img) => ({ ...img, isPrimary: img.id === id })),
    );
  }

  function removeImage(id: string) {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target?.url.startsWith("blob:")) {
        URL.revokeObjectURL(target.url);
      }
      const next = prev.filter((img) => img.id !== id);
      if (next.length > 0 && !next.some((img) => img.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
  }

  async function handleAddCustomSize() {
    const trimmed = customSize.trim();
    if (!trimmed) return;

    const duplicate = sizes.find(
      (opt) => opt.value.toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) {
      setValue("size", duplicate.value, { shouldDirty: true });
      setCustomSize("");
      toast.info(`"${duplicate.label}" is already in the size list.`);
      return;
    }

    setAddingSize(true);
    try {
      const result = await addCatalogSize(trimmed);
      if (!result.success) {
        toast.error(result.message ?? "Failed to add size.");
        return;
      }
      setSizes((prev) => [...prev, { label: trimmed, value: trimmed }]);
      setValue("size", trimmed, { shouldDirty: true });
      setCustomSize("");
      toast.success(result.message ?? `Size "${trimmed}" added.`);
    } finally {
      setAddingSize(false);
    }
  }

  async function handleAddCustomDepartment() {
    const trimmed = customDepartment.trim();
    if (!trimmed) return;

    const duplicate = departments.find(
      (opt) => opt.value.toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) {
      setValue("department", duplicate.value, { shouldDirty: true });
      setCustomDepartment("");
      toast.info(`"${duplicate.label}" is already in the department list.`);
      return;
    }

    setAddingDepartment(true);
    try {
      const result = await addCatalogDepartment(trimmed);
      if (!result.success) {
        toast.error(result.message ?? "Failed to add department.");
        return;
      }
      setDepartments((prev) => [...prev, { label: trimmed, value: trimmed }]);
      setValue("department", trimmed, { shouldDirty: true });
      setCustomDepartment("");
      toast.success(result.message ?? `Department "${trimmed}" added.`);
    } finally {
      setAddingDepartment(false);
    }
  }

  function syncInventoryFromVariants(next: VariantRow[]) {
    const total = sumVariantQuantities(next);
    setValue("inventoryQuantity", total, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  const onSubmit = (values: ProductFormInput) => {
    startTransition(async () => {
      const normalizedVariants = values.hasMultipleSizes
        ? normalizeVariantRows(values.variants ?? [])
        : [];
      const payload = {
        ...values,
        slug: values.slug || slugify(values.name),
        variants: normalizedVariants,
        inventoryQuantity: values.hasMultipleSizes
          ? sumVariantQuantities(normalizedVariants) ||
            Math.max(0, Number(values.inventoryQuantity) || 0)
          : values.inventoryQuantity,
      };
      const imagePayload = images
        .filter(
          (img) =>
            img.url &&
            !img.url.startsWith("data:") &&
            !img.url.startsWith("blob:"),
        )
        .map((img) => ({
          url: img.url,
          altText: img.altText,
          isPrimary: img.isPrimary,
        }));

      if (images.length > 0 && imagePayload.length === 0) {
        toast.error("Wait for image uploads to finish before saving.");
        return;
      }

      const result =
        mode === "create"
          ? await createProduct(payload, imagePayload)
          : await updateProduct(productId!, payload, imagePayload);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.push(returnHref);
      router.refresh();
    });
  };

  const productName = watch("name");
  const primaryImage = images.find((img) => img.isPrimary) ?? images[0];

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="admin-product-form relative min-w-0 space-y-4 overflow-x-clip rounded-sm border border-[#cfd3d8] bg-[#e4e7eb] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] @5xl:space-y-5 @5xl:p-4"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-sm opacity-70"
        style={{
          background:
            "radial-gradient(120% 80% at 0% 0%, rgba(245,196,0,0.08), transparent 45%), radial-gradient(90% 60% at 100% 0%, rgba(100,110,125,0.10), transparent 40%)",
        }}
      />

      <FormActionsBar
        position="top"
        mode={mode}
        pending={pending}
        uploading={uploading}
        onCancel={() => router.push(returnHref)}
        onDelete={
          mode === "edit" && productId
            ? () => setDeleteOpen(true)
            : undefined
        }
      />

      {/* Product overview: identity + media */}
      <section className="relative overflow-hidden rounded-sm border border-[#cfd3d8] bg-[#f3f4f6] shadow-[0_1px_0_rgba(255,255,255,0.65)]">
        <div className="flex items-start gap-2.5 border-b border-[#d8dce1] bg-[#eceef1] px-3 py-3 @5xl:gap-3 @5xl:px-5 @5xl:py-4">
          <span className="mt-0.5 h-8 w-1 shrink-0 rounded-sm bg-titan-yellow" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="font-heading text-base font-semibold uppercase tracking-wide text-dark-charcoal @5xl:text-lg">
              {mode === "create" ? "New product" : "Product overview"}
            </h2>
            <p className="mt-0.5 text-xs text-medium-gray @5xl:text-sm">
              Core listing details customers see first on the storefront.
            </p>
          </div>
        </div>

        <div className="grid @5xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-5 p-3 @5xl:space-y-6 @5xl:border-r @5xl:border-[#d8dce1] @5xl:p-5">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-medium-gray">
                Identity
              </p>
              <div className="grid gap-3 @5xl:grid-cols-2 @5xl:gap-4">
                <div className="@5xl:col-span-2">
                  <Input
                    label="Product name"
                    required
                    placeholder="e.g. Titan Premium Vented Hard Hat"
                    error={errors.name?.message}
                    {...register("name", {
                      onChange: (e) => {
                        if (mode === "create" || !watch("slug")) {
                          setValue("slug", slugify(e.target.value), {
                            shouldValidate: true,
                          });
                        }
                      },
                    })}
                  />
                </div>
                <Input
                  label="SKU"
                  required
                  placeholder="e.g. TSH-HH-001"
                  hint="Unique inventory code"
                  error={errors.sku?.message}
                  {...register("sku")}
                />
                <TagsField
                  options={tagOptions?.length ? tagOptions : PRODUCT_TAG_OPTIONS}
                  value={tags}
                  onChange={(next) => {
                    setValue("tags", next, { shouldDirty: true });
                    const hasTouch = next.some(
                      (t) => t.trim().toLowerCase() === "touch screen",
                    );
                    if (hasTouch !== Boolean(watch("touchScreen"))) {
                      setValue("touchScreen", hasTouch, { shouldDirty: true });
                    }
                  }}
                  error={errors.tags?.message}
                />
                <div className="@5xl:col-span-2">
                  <CertificationsField
                    label="ANSI Safety certification"
                    placeholder="Select ANSI certifications"
                    hint="Shown under the product name on cards and listing subtitles."
                    value={primaryCertifications}
                    onChange={(next) =>
                      setValue("primaryCertifications", next, {
                        shouldDirty: true,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-[#d8dce1] pt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-medium-gray">
                Storefront copy
              </p>
              <div className="space-y-4">
                <Textarea
                  label="Short description"
                  rows={2}
                  placeholder="One-line summary for product cards and search results"
                  error={errors.shortDescription?.message}
                  {...register("shortDescription")}
                />
                <Textarea
                  label="Full description"
                  rows={6}
                  placeholder="Features, certifications, materials, and jobsite use cases"
                  error={errors.description?.message}
                  {...register("description")}
                />
              </div>
            </div>
          </div>

          <aside className="border-t border-[#d8dce1] bg-[#e9ebef] p-3 @5xl:border-t-0 @5xl:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
                  Media
                </p>
                <p className="text-xs text-medium-gray">
                  {images.length} image{images.length === 1 ? "" : "s"}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading || pending}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-3.5" aria-hidden="true" />
                {uploading ? "…" : "Add"}
              </Button>
            </div>

            <div
              className={cn(
                "overflow-hidden rounded-sm border border-[#cfd3d8] bg-[#f3f4f6]",
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
                if (e.dataTransfer.files?.length) {
                  void handleFiles(e.dataTransfer.files);
                }
              }}
            >
              <div className="relative aspect-square bg-[#e2e5e9]">
                {primaryImage ? (
                  <>
                    <Image
                      src={primaryImage.url}
                      alt={
                        primaryImage.altText ||
                        productName ||
                        "Default product image"
                      }
                      fill
                      unoptimized={
                        primaryImage.url.startsWith("data:") ||
                        primaryImage.url.startsWith("blob:")
                      }
                      className="object-cover"
                      sizes="352px"
                    />
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-sm bg-titan-yellow px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-dark-charcoal">
                      <Star
                        className="size-2.5"
                        fill="currentColor"
                        aria-hidden="true"
                      />
                      Default
                    </span>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={uploading || pending}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center"
                  >
                    <span className="flex size-11 items-center justify-center rounded-sm bg-[#f3f4f6] text-dark-charcoal shadow-sm">
                      <ImagePlus className="size-5" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-medium text-dark-charcoal">
                      {uploading ? "Uploading…" : "Drop images here"}
                    </span>
                    <span className="text-xs text-medium-gray">
                      JPG, PNG, WEBP · max 8 MB
                    </span>
                  </button>
                )}
              </div>

              {images.length > 0 ? (
                <ul className="grid grid-cols-4 gap-1.5 border-t border-[#d8dce1] p-2">
                  {images.map((img) => (
                    <li key={img.id} className="group relative">
                      <button
                        type="button"
                        onClick={() => setPrimary(img.id)}
                        className={cn(
                          "relative block aspect-square w-full overflow-hidden rounded-sm border bg-[#e2e5e9]",
                          img.isPrimary
                            ? "border-titan-yellow ring-1 ring-titan-yellow"
                            : "border-[#cfd3d8] hover:border-dark-charcoal",
                        )}
                        aria-pressed={img.isPrimary}
                        aria-label={
                          img.isPrimary
                            ? "Default product image"
                            : "Set as default product image"
                        }
                      >
                        <Image
                          src={img.url}
                          alt=""
                          fill
                          unoptimized={
                            img.url.startsWith("data:") ||
                            img.url.startsWith("blob:")
                          }
                          className="object-cover"
                          sizes="80px"
                        />
                        <span
                          className={cn(
                            "absolute left-0.5 top-0.5 flex size-5 items-center justify-center rounded-sm",
                            img.isPrimary
                              ? "bg-titan-yellow text-dark-charcoal"
                              : "bg-[#f3f4f6]/90 text-medium-gray opacity-0 group-hover:opacity-100",
                          )}
                          aria-hidden="true"
                        >
                          <Star
                            className="size-3"
                            fill={img.isPrimary ? "currentColor" : "none"}
                          />
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute -right-1 -top-1 hidden size-5 items-center justify-center rounded-sm bg-dark-charcoal text-white group-hover:flex"
                        aria-label="Remove image"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            {images.length > 0 ? (
              <p className="mt-2 text-xs text-medium-gray">
                Click a thumbnail (★) to pick the default storefront image.
              </p>
            ) : null}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              multiple
              className="sr-only"
              onChange={(e) => {
                if (e.target.files?.length) void handleFiles(e.target.files);
              }}
            />
          </aside>
        </div>
      </section>

      <FormSection
        title="Organization"
        description="Department, category, brand, and shopper attributes."
      >
        <div className="grid gap-3 @5xl:grid-cols-3 @5xl:gap-4">
          <Select
            label="Department"
            options={toSelectOptions(departments, "Select department")}
            error={errors.department?.message}
            {...register("department")}
          />
          <div className="w-full">
            <Label htmlFor="custom-department">Custom department</Label>
            <div className="flex gap-2">
              <Input
                id="custom-department"
                value={customDepartment}
                placeholder="e.g. Hearing Protection"
                autoComplete="off"
                disabled={addingDepartment}
                onChange={(e) => setCustomDepartment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  void handleAddCustomDepartment();
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="h-10 shrink-0"
                disabled={addingDepartment || !customDepartment.trim()}
                onClick={() => void handleAddCustomDepartment()}
              >
                {addingDepartment ? "Adding…" : "Add"}
              </Button>
            </div>
            <p className="mt-1.5 text-sm text-medium-gray">
              Added as a custom department for every product.
            </p>
          </div>
          <Select
            label="Category"
            options={[
              { label: "Uncategorized", value: "" },
              ...categories.map((c) => ({ label: c.name, value: c.id })),
            ]}
            error={errors.categoryId?.message}
            {...register("categoryId")}
          />
          <Select
            label="Brand"
            options={[
              { label: "No brand", value: "" },
              ...brands.map((b) => ({ label: b.name, value: b.id })),
            ]}
            error={errors.brandId?.message}
            {...register("brandId")}
          />
          <Select
            label="Gender"
            hint="Used by the shop Gender filter"
            options={toSelectOptions(GENDER_OPTIONS, "Select gender")}
            error={errors.gender?.message}
            {...register("gender")}
          />
          <YesNoToggle
            label="Touch screen"
            hint="Used by the shop Touch screen filter · sets the Touch Screen tag"
            value={Boolean(watch("touchScreen"))}
            onChange={(next) => {
              setValue("touchScreen", next, { shouldDirty: true });
              const currentTags = watch("tags") ?? [];
              if (next) {
                if (
                  !currentTags.some(
                    (t) => t.trim().toLowerCase() === "touch screen",
                  )
                ) {
                  setValue("tags", [...currentTags, "Touch Screen"], {
                    shouldDirty: true,
                  });
                }
              } else {
                setValue(
                  "tags",
                  currentTags.filter(
                    (t) => t.trim().toLowerCase() !== "touch screen",
                  ),
                  { shouldDirty: true },
                );
              }
            }}
          />
        </div>
      </FormSection>

      <FormSection
        title="Specs, sizes & variants"
        description="Category specs, materials, certifications, sizing, shipping, and color options."
      >
        <div className="grid gap-3 @5xl:grid-cols-2 @5xl:gap-4">
          <CategorySpecsField
            categorySlug={selectedCategorySlug}
            value={specifications}
            onChange={(next) =>
              setValue("specifications", next, { shouldDirty: true })
            }
          />
          <MaterialsField
            value={materials}
            onChange={(next) =>
              setValue("materials", next, { shouldDirty: true })
            }
          />
          <div className="@5xl:col-span-2">
            <CertificationsField
              label="Additional ANSI Safety certification"
              placeholder="Select additional ANSI certifications"
              hint="Extra certifications for the product page and shop filters."
              value={certifications}
              onChange={(next) =>
                setValue("certifications", next, { shouldDirty: true })
              }
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 @5xl:grid-cols-3 @5xl:gap-4">
          <Select
            label="Default size"
            {...toGroupedSelectOptions(sizes, "Select size")}
            error={errors.size?.message}
            {...register("size")}
          />
          <div className="w-full">
            <Label htmlFor="custom-size">Custom size</Label>
            <div className="flex gap-2">
              <Input
                id="custom-size"
                value={customSize}
                placeholder="e.g. 5XL, 10.5W"
                autoComplete="off"
                disabled={addingSize}
                onChange={(e) => setCustomSize(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  // Enter would otherwise submit the whole product form.
                  e.preventDefault();
                  void handleAddCustomSize();
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="h-10 shrink-0"
                disabled={addingSize || !customSize.trim()}
                onClick={() => void handleAddCustomSize()}
              >
                {addingSize ? "Adding…" : "Add"}
              </Button>
            </div>
            <p className="mt-1.5 text-sm text-medium-gray">
              Added to the size list for every product.
            </p>
          </div>
          <Select
            label="Shipping class"
            options={toSelectOptions(SHIPPING_CLASS_OPTIONS, "Select shipping class")}
            error={errors.shippingClass?.message}
            {...register("shippingClass")}
          />
        </div>

        <div className="mt-4 space-y-4">
          <Checkbox
            label="Multiple sizes"
            description="When checked, shoppers pick color, size, and available qty from the matrix below."
            checked={Boolean(hasMultipleSizes)}
            onChange={(e) => {
              const checked = e.target.checked;
              setValue("hasMultipleSizes", checked, { shouldDirty: true });
              if (checked && variants.length === 0) {
                const seed: VariantRow[] = [
                  {
                    color: watch("color") || "",
                    size: watch("size") || "",
                    qty: Number(watch("inventoryQuantity")) || 0,
                  },
                ];
                setValue("variants", seed, { shouldDirty: true });
                syncInventoryFromVariants(seed);
              }
            }}
          />

          {hasMultipleSizes ? (
            <VariantMatrixField
              value={variants}
              sizeOptions={sizes}
              onChange={(next) => {
                setValue("variants", next, { shouldDirty: true });
                syncInventoryFromVariants(next);
              }}
            />
          ) : (
            <Controller
              control={control}
              name="color"
              render={({ field }) => (
                <ColorPaletteField
                  label="Default color"
                  hint="Same palette used in shop filters"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  error={errors.color?.message}
                />
              )}
            />
          )}
        </div>
      </FormSection>

      <FormSection
        title="Pricing & inventory"
        description="Costs and stock levels used for checkout and low-stock alerts."
      >
        <div className="grid gap-3 @5xl:grid-cols-4 @5xl:gap-4">
          <Controller
            name="price"
            control={control}
            render={({ field }) => (
              <MoneyInput
                key={`price-${priceSyncKey}`}
                label="Price"
                required
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v ?? 0);
                  // Manual price edit resets the sale list-price lock.
                  if (salePercent == null || salePercent <= 0) {
                    listPriceRef.current = null;
                  }
                }}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                error={errors.price?.message}
              />
            )}
          />
          <Controller
            name="compareAtPrice"
            control={control}
            render={({ field }) => (
              <MoneyInput
                key={`compare-${priceSyncKey}`}
                label="Compare at price"
                hint="Shown as crossed-out sale price"
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v);
                  listPriceRef.current = toMoneyAmount(v) || null;
                }}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                error={errors.compareAtPrice?.message}
              />
            )}
          />
          <Controller
            name="cost"
            control={control}
            render={({ field }) => (
              <MoneyInput
                label="Cost"
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                error={errors.cost?.message}
              />
            )}
          />
          <PercentInput
            label="Sale"
            hint="Discount applied to price"
            value={salePercent}
            onValueChange={handleSalePercentChange}
            onFocus={() => captureListPrice()}
          />
          <Input
            label="Inventory quantity"
            type="number"
            required={!hasMultipleSizes}
            disabled={Boolean(hasMultipleSizes)}
            hint={
              hasMultipleSizes
                ? "Live total from the size matrix (size required per row)."
                : undefined
            }
            error={errors.inventoryQuantity?.message}
            {...register("inventoryQuantity")}
          />
          <Input
            label="Low stock threshold"
            type="number"
            error={errors.lowStockThreshold?.message}
            {...register("lowStockThreshold")}
          />
          <div className="w-full">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <Label htmlFor={weightFieldId}>Weight</Label>
              <div
                className="inline-flex rounded-sm border border-[#cfd3d8] bg-[#e9ebef] p-0.5"
                role="group"
                aria-label="Weight unit"
              >
                {(["lb", "kg"] as const).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    className={cn(
                      "rounded-sm px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors",
                      weightUnit === unit
                        ? "bg-dark-charcoal text-white"
                        : "text-medium-gray hover:text-dark-charcoal",
                    )}
                    aria-pressed={weightUnit === unit}
                    onClick={() => setWeightUnit(unit)}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
            <Controller
              name="weight"
              control={control}
              render={({ field }) => (
                <Input
                  id={weightFieldId}
                  type="number"
                  step="0.01"
                  min={0}
                  inputMode="decimal"
                  placeholder={weightUnit === "kg" ? "e.g. 1.5" : "e.g. 3.3"}
                  error={errors.weight?.message}
                  hint={
                    weightUnit === "kg"
                      ? "Saved as pounds in the catalog"
                      : undefined
                  }
                  value={weightToDisplay(field.value, weightUnit)}
                  onChange={(event) => {
                    const raw = event.target.value;
                    if (raw.trim() === "") {
                      field.onChange(null);
                      return;
                    }
                    const next = Number(raw);
                    if (!Number.isFinite(next)) return;
                    field.onChange(displayToWeightLb(next, weightUnit));
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              )}
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Visibility"
        description="Active products appear in the shop. Drafts and archived stay admin-only."
      >
        <div className="grid gap-3 @5xl:grid-cols-2 @5xl:gap-4">
          <Select
            label="Catalog status"
            options={[
              { label: "Active (live in shop)", value: "active" },
              { label: "Draft", value: "draft" },
              { label: "Archived", value: "archived" },
            ]}
            error={errors.catalogStatus?.message}
            {...register("catalogStatus", {
              onChange: (e) => {
                setValue("active", e.target.value === "active");
              },
            })}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <VisibilityChip
            label="Featured"
            description="Homepage featured"
            checked={watch("featured")}
            onChange={(checked) => setValue("featured", checked)}
          />
          <VisibilityChip
            label="Bestseller"
            description="Bestsellers section"
            checked={watch("bestseller")}
            onChange={(checked) => setValue("bestseller", checked)}
          />
        </div>
      </FormSection>

      <FormActionsBar
        position="bottom"
        mode={mode}
        pending={pending}
        uploading={uploading}
        onCancel={() => router.push(returnHref)}
        onDelete={
          mode === "edit" && productId
            ? () => setDeleteOpen(true)
            : undefined
        }
      />

      {mode === "edit" && productId ? (
        <ConfirmDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Delete product?"
          itemLabel={watch("name") || "this product"}
          description="This permanently removes the product from the catalog. Order history keeps line items, but carts and wishlists lose this item."
          pending={pending}
          onConfirm={() => {
            startTransition(async () => {
              const result = await deleteProduct(productId);
              if (!result.success) {
                toast.error(result.message);
                return;
              }
              toast.success(result.message);
              setDeleteOpen(false);
              router.push(returnHref);
              router.refresh();
            });
          }}
        />
      ) : null}
    </form>
  );
}

function FormActionsBar({
  position,
  mode,
  pending,
  uploading,
  onCancel,
  onDelete,
}: {
  position: "top" | "bottom";
  mode: "create" | "edit";
  pending: boolean;
  uploading: boolean;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const isTop = position === "top";
  const saveLabel = pending
    ? "Saving…"
    : mode === "create"
      ? "Create product"
      : "Save changes";
  const saveLabelShort = pending
    ? "Saving…"
    : mode === "create"
      ? "Create"
      : "Save";

  return (
    <div
      className={cn(
        "relative z-10 -mx-0.5 flex flex-col gap-2 border border-[#cfd3d8] bg-[#eef0f3]/95 px-3 py-2.5 backdrop-blur-sm @5xl:-mx-1 @5xl:flex-row @5xl:flex-wrap @5xl:items-center @5xl:justify-between @5xl:gap-3 @5xl:px-5 @5xl:py-3",
        isTop
          ? "shadow-[0_1px_0_rgba(16,24,32,0.06)]"
          : "sticky bottom-0 shadow-[0_-6px_20px_rgba(16,24,32,0.08)]",
      )}
      style={
        isTop
          ? undefined
          : {
              paddingBottom:
                "calc(0.625rem + var(--phone-safe-bottom, 0px) + env(safe-area-inset-bottom, 0px))",
            }
      }
    >
      <p className="hidden text-sm text-medium-gray @5xl:block">
        {mode === "create"
          ? "Ready when the listing details look right."
          : "Save to publish changes to the storefront."}
      </p>
      <div
        className={cn(
          "grid w-full gap-2 @5xl:flex @5xl:w-auto",
          onDelete
            ? "grid-cols-[auto_minmax(0,1fr)_minmax(0,1.35fr)]"
            : "grid-cols-2",
        )}
      >
        {onDelete ? (
          <Button
            type="button"
            variant="danger"
            disabled={pending || uploading}
            onClick={onDelete}
            className="shrink-0 px-3"
          >
            Delete
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          disabled={pending || uploading}
          onClick={onCancel}
          className="min-w-0"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={pending || uploading}
          className="min-w-0"
        >
          <span className="@5xl:hidden">{saveLabelShort}</span>
          <span className="hidden @5xl:inline">{saveLabel}</span>
        </Button>
      </div>
    </div>
  );
}

function YesNoToggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="w-full">
      <p className="mb-1.5 text-sm font-medium text-dark-charcoal">{label}</p>
      <div
        className="grid h-10 grid-cols-2 overflow-hidden rounded-sm border border-border-gray bg-white"
        role="group"
        aria-label={label}
      >
        <button
          type="button"
          aria-pressed={value}
          onClick={() => onChange(true)}
          className={cn(
            "font-heading text-xs font-semibold uppercase tracking-wide transition-colors",
            value
              ? "bg-titan-yellow text-dark-charcoal"
              : "bg-white text-medium-gray hover:bg-light-gray hover:text-dark-charcoal",
          )}
        >
          Yes
        </button>
        <button
          type="button"
          aria-pressed={!value}
          onClick={() => onChange(false)}
          className={cn(
            "border-l border-border-gray font-heading text-xs font-semibold uppercase tracking-wide transition-colors",
            !value
              ? "bg-dark-charcoal text-white"
              : "bg-white text-medium-gray hover:bg-light-gray hover:text-dark-charcoal",
          )}
        >
          No
        </button>
      </div>
      {hint ? <p className="mt-1.5 text-sm text-medium-gray">{hint}</p> : null}
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="relative min-w-0 overflow-visible rounded-sm border border-[#cfd3d8] bg-[#f3f4f6] shadow-[0_1px_0_rgba(255,255,255,0.65)]">
      <div className="flex items-start gap-2.5 border-b border-[#d8dce1] bg-[#eceef1] px-3 py-3 @5xl:gap-3 @5xl:px-5 @5xl:py-4">
        <span className="mt-0.5 h-8 w-1 shrink-0 rounded-sm bg-titan-yellow" aria-hidden="true" />
        <div className="min-w-0">
          <h2 className="font-heading text-base font-semibold uppercase tracking-wide text-dark-charcoal @5xl:text-lg">
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-medium-gray @5xl:text-sm">{description}</p>
        </div>
      </div>
      <div className="p-3 @5xl:p-5">{children}</div>
    </section>
  );
}

function VisibilityChip({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-sm border px-3 py-3 transition-colors @5xl:min-w-[10rem]",
        checked
          ? "border-titan-yellow bg-titan-yellow/15"
          : "border-[#cfd3d8] bg-[#eef0f3] hover:border-dark-charcoal/40",
      )}
    >
      <input
        type="checkbox"
        className="mt-0.5 size-4 rounded-sm border-border-gray"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="block text-sm font-semibold text-dark-charcoal">
          {label}
        </span>
        <span className="block text-xs text-medium-gray">{description}</span>
      </span>
    </label>
  );
}
