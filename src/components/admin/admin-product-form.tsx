"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createProduct, updateProduct } from "@/lib/actions/admin";
import { productFormSchema, type ProductFormInput } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

type Option = { id: string; name: string };

type AdminProductFormProps = {
  mode: "create" | "edit";
  productId?: string;
  categories: Option[];
  brands: Option[];
  defaultValues?: Partial<ProductFormInput>;
};

export function AdminProductForm({
  mode,
  productId,
  categories,
  brands,
  defaultValues,
}: AdminProductFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

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
      active: true,
      featured: false,
      bestseller: false,
      productType: "",
      ansiClass: "",
      color: "",
      size: "",
      ...defaultValues,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const onSubmit = (values: ProductFormInput) => {
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createProduct(values)
          : await updateProduct(productId!, values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      if (mode === "create" && result.id) {
        router.push(`/admin/products/${result.id}`);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-sm border border-border-gray bg-white p-5">
        <h2 className="font-heading text-lg font-semibold uppercase tracking-wide">
          Basic info
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            required
            error={errors.name?.message}
            {...register("name")}
            onBlur={(e) => {
              register("name").onBlur(e);
              if (!watch("slug")) {
                setValue("slug", slugify(e.target.value), { shouldValidate: true });
              }
            }}
          />
          <Input
            label="Slug"
            required
            error={errors.slug?.message}
            {...register("slug")}
          />
          <Input
            label="SKU"
            required
            error={errors.sku?.message}
            {...register("sku")}
          />
          <Input
            label="Product type"
            error={errors.productType?.message}
            {...register("productType")}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Short description"
              rows={2}
              error={errors.shortDescription?.message}
              {...register("shortDescription")}
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="Description"
              rows={5}
              error={errors.description?.message}
              {...register("description")}
            />
          </div>
        </div>
      </div>

      <div className="rounded-sm border border-border-gray bg-white p-5">
        <h2 className="font-heading text-lg font-semibold uppercase tracking-wide">
          Organization
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
          <Input label="ANSI class" {...register("ansiClass")} />
          <Input label="Color" {...register("color")} />
          <Input label="Size" {...register("size")} />
          <Input label="Shipping class" {...register("shippingClass")} />
        </div>
      </div>

      <div className="rounded-sm border border-border-gray bg-white p-5">
        <h2 className="font-heading text-lg font-semibold uppercase tracking-wide">
          Pricing & inventory
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Price"
            type="number"
            step="0.01"
            required
            error={errors.price?.message}
            {...register("price")}
          />
          <Input
            label="Compare at price"
            type="number"
            step="0.01"
            error={errors.compareAtPrice?.message}
            {...register("compareAtPrice")}
          />
          <Input
            label="Cost"
            type="number"
            step="0.01"
            error={errors.cost?.message}
            {...register("cost")}
          />
          <Input
            label="Inventory quantity"
            type="number"
            required
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
      </div>

      <div className="rounded-sm border border-border-gray bg-white p-5">
        <h2 className="font-heading text-lg font-semibold uppercase tracking-wide">
          Visibility
        </h2>
        <div className="mt-4 flex flex-wrap gap-6">
          <Checkbox
            label="Active"
            checked={watch("active")}
            onChange={(e) => setValue("active", e.target.checked)}
          />
          <Checkbox
            label="Featured"
            checked={watch("featured")}
            onChange={(e) => setValue("featured", e.target.checked)}
          />
          <Checkbox
            label="Bestseller"
            checked={watch("bestseller")}
            onChange={(e) => setValue("bestseller", e.target.checked)}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/products")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
