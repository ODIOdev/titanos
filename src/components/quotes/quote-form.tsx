"use client";

import { useState } from "react";
import { useFieldArray, useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ProductAutocomplete } from "@/components/quotes/product-autocomplete";
import { INDUSTRY_SOLUTIONS } from "@/lib/data/seed-data";
import { SHIPPING_COUNTRIES, US_STATES } from "@/lib/data/geo";
import { quoteSchema, type QuoteInput } from "@/lib/validations";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/vnd.ms-excel",
];
const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".xlsx", ".csv"];

function isAllowedFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  const extOk = ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
  const typeOk = !file.type || ALLOWED_TYPES.includes(file.type);
  return extOk && typeOk;
}

export function QuoteForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<QuoteInput>({
    resolver: zodResolver(quoteSchema) as Resolver<QuoteInput>,
    defaultValues: {
      contactName: "",
      company: "",
      ein: "",
      email: "",
      phone: "",
      industry: "",
      projectName: "",
      requestedDeliveryDate: "",
      urgency: "standard",
      customProductDescription: "",
      taxExempt: false,
      notes: "",
      shippingLine1: "",
      shippingLine2: "",
      shippingCity: "",
      shippingState: "",
      shippingPostalCode: "",
      shippingCountry: "US",
      items: [{ productId: "", productName: "", sku: "", quantity: 1, notes: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  function onFilesSelected(list: FileList | null) {
    if (!list?.length) return;
    const next: File[] = [...files];
    let error: string | null = null;

    Array.from(list).forEach((file) => {
      if (!isAllowedFile(file)) {
        error = "Only PDF, JPG, PNG, XLSX, and CSV files are allowed.";
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        error = "Each file must be 10MB or smaller.";
        return;
      }
      next.push(file);
    });

    setFileError(error);
    if (!error) setFiles(next);
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const formData = new FormData();
      formData.append("payload", JSON.stringify(values));
      files.forEach((file) => formData.append("attachments", file));

      const response = await fetch("/api/quotes", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
        quoteNumber?: string;
      } | null;

      if (!response.ok) {
        toast.error(data?.error ?? "Unable to submit quote.");
        return;
      }

      toast.success(
        data?.message ??
          `Quote ${data?.quoteNumber ?? ""} submitted. We'll be in touch shortly.`,
      );
      reset();
      setFiles([]);
      setFileError(null);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-10" noValidate>
      <section className="space-y-4">
        <h2 className="font-heading text-xl uppercase tracking-wide text-dark-charcoal">
          Contact details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Contact name"
              required
              error={errors.contactName?.message}
              {...register("contactName")}
            />
          </div>
          <Input
            label="Company"
            required
            error={errors.company?.message}
            {...register("company")}
          />
          <Input
            label="EIN"
            hint="XX-XXXXXXX"
            placeholder="12-3456789"
            error={errors.ein?.message}
            {...register("ein")}
          />
          <Input
            label="Email"
            type="email"
            required
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Phone"
            type="tel"
            required
            error={errors.phone?.message}
            {...register("phone")}
          />
          <Select
            label="Industry"
            required
            placeholder="Select industry"
            options={INDUSTRY_SOLUTIONS.map((i) => ({
              label: i.name,
              value: i.slug,
            }))}
            error={errors.industry?.message}
            {...register("industry")}
          />
          <Input
            label="Project name"
            error={errors.projectName?.message}
            {...register("projectName")}
          />
          <Input
            label="Requested delivery date"
            type="date"
            error={errors.requestedDeliveryDate?.message}
            {...register("requestedDeliveryDate")}
          />
          <Select
            label="Urgency"
            required
            placeholder="Select urgency"
            options={[
              { label: "Standard", value: "standard" },
              { label: "Needed soon", value: "soon" },
              { label: "Urgent", value: "urgent" },
              { label: "Emergency / ASAP", value: "emergency" },
            ]}
            error={errors.urgency?.message}
            {...register("urgency")}
          />
        </div>
        <Textarea
          label="Custom product description"
          hint="Describe non-catalog or customized items."
          error={errors.customProductDescription?.message}
          {...register("customProductDescription")}
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl uppercase tracking-wide text-dark-charcoal">
            Products
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                productId: "",
                productName: "",
                sku: "",
                quantity: 1,
                notes: "",
              })
            }
          >
            <Plus aria-hidden="true" />
            Add item
          </Button>
        </div>
        {errors.items?.message || errors.items?.root?.message ? (
          <p className="text-sm text-red-700" role="alert">
            {errors.items?.message ?? errors.items?.root?.message}
          </p>
        ) : null}

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-sm border border-border-gray bg-white p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-dark-charcoal">
                  Item {index + 1}
                </p>
                {fields.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    aria-label={`Remove item ${index + 1}`}
                  >
                    <Trash2 aria-hidden="true" />
                    Remove
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2">
                  <Controller
                    control={control}
                    name={`items.${index}.productName`}
                    render={({ field }) => (
                      <ProductAutocomplete
                        label="Product name"
                        required
                        hint="Search the catalog or type a custom product."
                        error={errors.items?.[index]?.productName?.message}
                        value={field.value}
                        onChange={(next) => {
                          field.onChange(next);
                          setValue(`items.${index}.productId`, "");
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        onSelectProduct={(product) => {
                          field.onChange(product.name);
                          setValue(`items.${index}.productId`, product.id, {
                            shouldDirty: true,
                          });
                          setValue(`items.${index}.sku`, product.sku ?? "", {
                            shouldDirty: true,
                          });
                        }}
                      />
                    )}
                  />
                </div>
                <Input
                  label="SKU"
                  error={errors.items?.[index]?.sku?.message}
                  {...register(`items.${index}.sku`)}
                />
                <Input
                  label="Quantity"
                  type="number"
                  min={1}
                  required
                  error={errors.items?.[index]?.quantity?.message}
                  {...register(`items.${index}.quantity`)}
                />
                <div className="sm:col-span-2 lg:col-span-4">
                  <Input
                    label="Notes"
                    error={errors.items?.[index]?.notes?.message}
                    {...register(`items.${index}.notes`)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl uppercase tracking-wide text-dark-charcoal">
          Shipping address
        </h2>
        <Input
          label="Address line 1"
          required
          error={errors.shippingLine1?.message}
          {...register("shippingLine1")}
        />
        <Input
          label="Address line 2"
          error={errors.shippingLine2?.message}
          {...register("shippingLine2")}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="City"
            required
            error={errors.shippingCity?.message}
            {...register("shippingCity")}
          />
          <Select
            label="State"
            required
            placeholder="Select state"
            options={US_STATES.map((state) => ({
              label: state.label,
              value: state.value,
            }))}
            error={errors.shippingState?.message}
            {...register("shippingState")}
          />
          <Input
            label="Postal code"
            required
            error={errors.shippingPostalCode?.message}
            {...register("shippingPostalCode")}
          />
          <Select
            label="Country"
            required
            placeholder="Select country"
            options={SHIPPING_COUNTRIES.map((country) => ({
              label: country.label,
              value: country.value,
            }))}
            error={errors.shippingCountry?.message}
            {...register("shippingCountry")}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl uppercase tracking-wide text-dark-charcoal">
          Attachments & notes
        </h2>
        <div>
          <Label htmlFor="quote-attachments">Upload files</Label>
          <label
            htmlFor="quote-attachments"
            className="mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-border-gray bg-light-gray/50 px-4 py-8 text-center transition-colors hover:bg-light-gray"
          >
            <Upload className="size-6 text-medium-gray" aria-hidden="true" />
            <span className="text-sm text-dark-charcoal">
              PDF, JPG, PNG, XLSX, or CSV — max 10MB each
            </span>
            <input
              id="quote-attachments"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.xlsx,.csv,application/pdf,image/jpeg,image/png"
              className="sr-only"
              onChange={(e) => {
                onFilesSelected(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          {fileError ? (
            <p className="mt-1.5 text-sm text-red-700" role="alert">
              {fileError}
            </p>
          ) : null}
          {files.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-sm border border-border-gray bg-white px-3 py-2 text-sm"
                >
                  <span className="truncate text-dark-charcoal">
                    {file.name}{" "}
                    <span className="text-medium-gray">
                      ({Math.round(file.size / 1024)} KB)
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <Checkbox label="Tax-exempt organization" {...register("taxExempt")} />
        <Textarea
          label="Additional notes"
          error={errors.notes?.message}
          {...register("notes")}
        />
      </section>

      <Button type="submit" variant="primary" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Submitting…" : "Submit quote request"}
      </Button>
    </form>
  );
}
