"use client";

import { useState } from "react";
import { useFieldArray, useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, Upload, X } from "lucide-react";
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
import { cn } from "@/lib/utils";

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

function SectionHeading({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b border-border-gray pb-3">
      <div className="flex items-baseline gap-3">
        <span className="font-heading text-xs font-semibold tabular-nums tracking-[0.14em] text-titan-yellow">
          {step}
        </span>
        <h2 className="font-heading text-lg uppercase tracking-wide text-dark-charcoal">
          {title}
        </h2>
      </div>
      {description ? (
        <p className="mt-1.5 text-sm text-medium-gray">{description}</p>
      ) : null}
    </div>
  );
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
        <SectionHeading
          step="01"
          title="Contact"
          description="Who should we reply to with pricing?"
        />
        <div className="grid gap-4 @3xl:grid-cols-2">
          <div className="@3xl:col-span-2">
            <Input
              label="Contact name"
              required
              autoComplete="name"
              error={errors.contactName?.message}
              {...register("contactName")}
            />
          </div>
          <Input
            label="Company"
            required
            autoComplete="organization"
            error={errors.company?.message}
            {...register("company")}
          />
          <Input
            label="EIN"
            hint="Optional — XX-XXXXXXX"
            placeholder="12-3456789"
            error={errors.ein?.message}
            {...register("ein")}
          />
          <Input
            label="Email"
            type="email"
            required
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Phone"
            type="tel"
            required
            autoComplete="tel"
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
            hint="Optional"
            error={errors.projectName?.message}
            {...register("projectName")}
          />
        </div>
        <div className="grid gap-4 border-t border-border-gray pt-4 @3xl:grid-cols-2">
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
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border-gray pb-3">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-heading text-xs font-semibold tabular-nums tracking-[0.14em] text-titan-yellow">
                02
              </span>
              <h2 className="font-heading text-lg uppercase tracking-wide text-dark-charcoal">
                Line items
              </h2>
            </div>
            <p className="mt-1.5 text-sm text-medium-gray">
              Search the catalog or enter custom products.
            </p>
          </div>
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
            Add line
          </Button>
        </div>

        {errors.items?.message || errors.items?.root?.message ? (
          <p className="text-sm text-red-700" role="alert">
            {errors.items?.message ?? errors.items?.root?.message}
          </p>
        ) : null}

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="border border-border-gray bg-light-gray/40 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-medium-gray">
                  Line {index + 1}
                </p>
                {fields.length > 1 ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs font-medium text-medium-gray transition-colors hover:text-red-700"
                    onClick={() => remove(index)}
                    aria-label={`Remove line ${index + 1}`}
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Remove
                  </button>
                ) : null}
              </div>
              <div className="grid gap-3 @3xl:grid-cols-12">
                <div className="@3xl:col-span-6">
                  <Controller
                    control={control}
                    name={`items.${index}.productName`}
                    render={({ field: productField }) => (
                      <ProductAutocomplete
                        label="Product"
                        required
                        hint="Search catalog or type a custom name"
                        error={errors.items?.[index]?.productName?.message}
                        value={productField.value}
                        onChange={(next) => {
                          productField.onChange(next);
                          setValue(`items.${index}.productId`, "");
                        }}
                        onBlur={productField.onBlur}
                        name={productField.name}
                        onSelectProduct={(product) => {
                          productField.onChange(product.name);
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
                <div className="@3xl:col-span-3">
                  <Input
                    label="SKU"
                    error={errors.items?.[index]?.sku?.message}
                    {...register(`items.${index}.sku`)}
                  />
                </div>
                <div className="@3xl:col-span-3">
                  <Input
                    label="Qty"
                    type="number"
                    min={1}
                    required
                    error={errors.items?.[index]?.quantity?.message}
                    {...register(`items.${index}.quantity`)}
                  />
                </div>
                <div className="@3xl:col-span-12">
                  <Input
                    label="Line notes"
                    hint="Size, color, or special requirements"
                    error={errors.items?.[index]?.notes?.message}
                    {...register(`items.${index}.notes`)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Textarea
          label="Custom / non-catalog description"
          hint="Anything not covered by the lines above"
          error={errors.customProductDescription?.message}
          {...register("customProductDescription")}
        />
      </section>

      <section className="space-y-4">
        <SectionHeading
          step="03"
          title="Ship to"
          description="Jobsite or receiving address for freight estimates."
        />
        <Input
          label="Address line 1"
          required
          autoComplete="shipping address-line1"
          error={errors.shippingLine1?.message}
          {...register("shippingLine1")}
        />
        <Input
          label="Address line 2"
          autoComplete="shipping address-line2"
          error={errors.shippingLine2?.message}
          {...register("shippingLine2")}
        />
        <div className="grid gap-4 @3xl:grid-cols-2 @5xl:grid-cols-4">
          <Input
            label="City"
            required
            autoComplete="shipping address-level2"
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
            autoComplete="shipping postal-code"
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
        <SectionHeading
          step="04"
          title="Files & notes"
          description="Optional BOM, drawings, or tax paperwork."
        />
        <div>
          <Label htmlFor="quote-attachments">Attachments</Label>
          <label
            htmlFor="quote-attachments"
            className={cn(
              "mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-border-gray bg-light-gray/40 px-4 py-7 text-center transition-colors",
              "hover:border-dark-charcoal/40 hover:bg-light-gray",
            )}
          >
            <Upload className="size-5 text-medium-gray" aria-hidden="true" />
            <span className="text-sm font-medium text-dark-charcoal">
              Drop files or click to upload
            </span>
            <span className="text-xs text-medium-gray">
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
            <ul className="mt-3 divide-y divide-border-gray border border-border-gray">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between gap-3 bg-white px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate text-dark-charcoal">
                    {file.name}{" "}
                    <span className="text-medium-gray">
                      ({Math.round(file.size / 1024)} KB)
                    </span>
                  </span>
                  <button
                    type="button"
                    className="inline-flex size-7 shrink-0 items-center justify-center text-medium-gray hover:text-red-700"
                    aria-label={`Remove ${file.name}`}
                    onClick={() =>
                      setFiles((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
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

      <div className="flex flex-col gap-3 border-t border-border-gray pt-6 @3xl:flex-row @3xl:items-center @3xl:justify-between">
        <p className="text-sm text-medium-gray">
          We typically reply within one business day.
        </p>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
          className="w-full @3xl:w-auto"
        >
          {isSubmitting ? "Submitting…" : "Submit quote request"}
        </Button>
      </div>
    </form>
  );
}
