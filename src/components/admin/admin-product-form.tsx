"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
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
  ANSI_CLASS_OPTIONS,
  DEPARTMENT_OPTIONS,
  PRODUCT_TAG_OPTIONS,
  SHIPPING_CLASS_OPTIONS,
  SIZE_OPTIONS,
  toSelectOptions,
} from "@/lib/data/catalog-options";
import { cn, slugify } from "@/lib/utils";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { ColorPaletteField } from "@/components/admin/color-palette-field";
import { CategorySpecsField } from "@/components/admin/category-specs-field";
import { CertificationsField } from "@/components/admin/certifications-field";
import {
  VariantMatrixField,
  type VariantRow,
} from "@/components/admin/variant-matrix-field";
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
      tag: "",
      ansiClass: "",
      color: "",
      size: "",
      hasMultipleSizes: false,
      variants: [],
      specifications: [],
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
  const certifications = watch("certifications") ?? [];
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

  const onSubmit = (values: ProductFormInput) => {
    startTransition(async () => {
      const payload = {
        ...values,
        slug: values.slug || slugify(values.name),
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
      if (mode === "create") {
        router.push(returnHref);
        router.refresh();
      } else {
        router.refresh();
      }
    });
  };

  const productName = watch("name");
  const primaryImage = images.find((img) => img.isPrimary) ?? images[0];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Product overview: identity + media */}
      <section className="overflow-hidden rounded-sm border border-border-gray bg-white">
        <div className="flex items-start gap-3 border-b border-border-gray bg-light-gray/40 px-5 py-4">
          <span className="mt-0.5 h-8 w-1 shrink-0 rounded-sm bg-titan-yellow" aria-hidden="true" />
          <div>
            <h2 className="font-heading text-lg font-semibold uppercase tracking-wide text-dark-charcoal">
              Product overview
            </h2>
            <p className="mt-0.5 text-sm text-medium-gray">
              Core listing details customers see first on the storefront.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6 p-5 lg:border-r lg:border-border-gray">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-medium-gray">
                Identity
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
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
                <Select
                  label="Tag"
                  options={toSelectOptions(
                    tagOptions?.length ? tagOptions : PRODUCT_TAG_OPTIONS,
                    "Select tag",
                  )}
                  error={errors.tag?.message}
                  {...register("tag")}
                />
              </div>
            </div>

            <div className="border-t border-border-gray pt-6">
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

          <aside className="bg-light-gray/30 p-5">
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
                "overflow-hidden rounded-sm border border-border-gray bg-white",
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
              <div className="relative aspect-square bg-light-gray">
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
                    <span className="flex size-11 items-center justify-center rounded-sm bg-white text-dark-charcoal">
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
                <ul className="grid grid-cols-4 gap-1.5 border-t border-border-gray p-2">
                  {images.map((img) => (
                    <li key={img.id} className="group relative">
                      <button
                        type="button"
                        onClick={() => setPrimary(img.id)}
                        className={cn(
                          "relative block aspect-square w-full overflow-hidden rounded-sm border bg-light-gray",
                          img.isPrimary
                            ? "border-titan-yellow ring-1 ring-titan-yellow"
                            : "border-border-gray hover:border-dark-charcoal",
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
                              : "bg-white/90 text-medium-gray opacity-0 group-hover:opacity-100",
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
        description="Category, brand, and attributes used by shop filters."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

          <div className="grid gap-4 sm:col-span-2 lg:col-span-3 lg:grid-cols-2">
            <CategorySpecsField
              categorySlug={selectedCategorySlug}
              value={specifications}
              onChange={(next) =>
                setValue("specifications", next, { shouldDirty: true })
              }
            />
            <CertificationsField
              value={certifications}
              onChange={(next) =>
                setValue("certifications", next, { shouldDirty: true })
              }
            />
          </div>

          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-4">
            <Select
              label="ANSI class"
              hint="Matches shop ANSI filter options"
              options={toSelectOptions(ANSI_CLASS_OPTIONS, "None / not applicable")}
              error={errors.ansiClass?.message}
              {...register("ansiClass")}
            />
            <Select
              label="Default size"
              options={toSelectOptions(sizes, "Select size")}
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

          <div className="sm:col-span-2 lg:col-span-3">
            <Checkbox
              label="Multiple sizes"
              description="When checked, shoppers pick color, size, and available qty from the matrix below."
              checked={Boolean(hasMultipleSizes)}
              onChange={(e) => {
                const checked = e.target.checked;
                setValue("hasMultipleSizes", checked, { shouldDirty: true });
                if (checked && variants.length === 0) {
                  setValue(
                    "variants",
                    [
                      {
                        color: watch("color") || "",
                        size: watch("size") || "",
                        qty: Number(watch("inventoryQuantity")) || 0,
                      },
                    ],
                    { shouldDirty: true },
                  );
                }
              }}
            />
          </div>

          {hasMultipleSizes ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <VariantMatrixField
                value={variants}
                sizeOptions={sizes}
                onChange={(next) =>
                  setValue("variants", next, { shouldDirty: true })
                }
              />
            </div>
          ) : (
            <div className="sm:col-span-2 lg:col-span-3">
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
            </div>
          )}
        </div>
      </FormSection>

      <FormSection
        title="Pricing & inventory"
        description="Costs and stock levels used for checkout and low-stock alerts."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                ? "Calculated automatically from the size & color matrix on save."
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
          <Input
            label="Weight (lb)"
            type="number"
            step="0.01"
            error={errors.weight?.message}
            {...register("weight")}
          />
        </div>
      </FormSection>

      <FormSection
        title="Visibility"
        description="Active products appear in the shop. Drafts and archived stay admin-only."
      >
        <div className="grid gap-4 sm:grid-cols-2">
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

      <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 border border-border-gray bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(16,24,32,0.06)] sm:px-5">
        <p className="text-sm text-medium-gray">
          {mode === "create" ? "Create a new catalog product" : "Save changes to this product"}
        </p>
        <div className="flex gap-2">
          {mode === "edit" && productId ? (
            <Button
              type="button"
              variant="danger"
              disabled={pending || uploading}
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            disabled={pending || uploading}
            onClick={() => router.push(returnHref)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={pending || uploading}>
            {pending
              ? "Saving…"
              : mode === "create"
                ? "Create product"
                : "Save changes"}
          </Button>
        </div>
      </div>

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
    <section className="overflow-visible rounded-sm border border-border-gray bg-white">
      <div className="flex items-start gap-3 border-b border-border-gray px-5 py-4">
        <span className="mt-0.5 h-8 w-1 shrink-0 rounded-sm bg-titan-yellow" aria-hidden="true" />
        <div>
          <h2 className="font-heading text-lg font-semibold uppercase tracking-wide text-dark-charcoal">
            {title}
          </h2>
          <p className="mt-0.5 text-sm text-medium-gray">{description}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
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
        "flex min-w-[10rem] cursor-pointer items-start gap-3 rounded-sm border px-3 py-3 transition-colors",
        checked
          ? "border-titan-yellow bg-titan-yellow/10"
          : "border-border-gray bg-white hover:border-dark-charcoal/40",
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
