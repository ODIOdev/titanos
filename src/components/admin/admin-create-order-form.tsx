"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createAdminOrder } from "@/lib/actions/admin";
import type { OrderStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AdminProductLineSearch } from "@/components/admin/admin-product-line-search";
import { formatCurrency } from "@/lib/utils";

type ProductOption = {
  id: string;
  name: string;
  sku: string;
  price: number;
};

type LineDraft = {
  key: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: string;
  unitPrice: string;
};

const STATUS_OPTIONS: { label: string; value: OrderStatus }[] = [
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Processing", value: "processing" },
];

function blankLine(): LineDraft {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    productId: "",
    productName: "",
    sku: "",
    quantity: "1",
    unitPrice: "0",
  };
}

export function AdminCreateOrderForm({
  products,
}: {
  products: ProductOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<OrderStatus>("paid");
  const [shippingAmount, setShippingAmount] = useState("0");
  const [taxAmount, setTaxAmount] = useState("0");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [internalNotes, setInternalNotes] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([blankLine()]);

  const subtotal = lines.reduce((sum, line) => {
    const qty = Number(line.quantity) || 0;
    const price = Number(line.unitPrice) || 0;
    return sum + qty * price;
  }, 0);
  const shipping = Number(shippingAmount) || 0;
  const tax = Number(taxAmount) || 0;
  const discount = Number(discountAmount) || 0;
  const total = Math.max(0, subtotal - discount + shipping + tax);

  function updateLine(key: string, patch: Partial<LineDraft>) {
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  function pickProduct(key: string, productId: string) {
    if (!productId) {
      updateLine(key, { productId: "", productName: "", sku: "", unitPrice: "0" });
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    updateLine(key, {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      unitPrice: String(product.price),
    });
  }

  function submit() {
    startTransition(async () => {
      const result = await createAdminOrder({
        email,
        status,
        shippingAmount: shipping,
        taxAmount: tax,
        discountAmount: discount,
        internalNotes,
        shippingAddress: line1.trim()
          ? {
              first_name: firstName,
              last_name: lastName,
              company: company || undefined,
              line1,
              line2: line2 || undefined,
              city,
              state,
              postal_code: postalCode,
              country: "US",
              phone: phone || undefined,
            }
          : null,
        items: lines.map((line) => ({
          productId: line.productId || null,
          productName: line.productName,
          sku: line.sku,
          quantity: Number(line.quantity) || 0,
          unitPrice: Number(line.unitPrice) || 0,
        })),
      });

      // redirect() throws; only errors return here
      if (result && !result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result?.message ?? "Order created.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5 @5xl:space-y-6">
      <div className="grid gap-4 @5xl:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
        <div className="space-y-4">
          <section className="rounded-sm border border-border-gray bg-white p-4 @5xl:p-5">
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal @5xl:text-base">
              Customer
            </h3>
            <div className="mt-3 grid gap-3 @3xl:grid-cols-2">
              <Input
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="buyer@company.com"
              />
              <Select
                label="Starting status"
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                options={STATUS_OPTIONS}
              />
              <PhoneInput
                label="Phone"
                value={phone}
                onValueChange={setPhone}
              />
            </div>
          </section>

          <section className="rounded-sm border border-border-gray bg-white p-4 @5xl:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal @5xl:text-base">
                Line items
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLines((prev) => [...prev, blankLine()])}
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Add line
              </Button>
            </div>

            <ul className="mt-3 space-y-3">
              {lines.map((line, index) => (
                <li
                  key={line.key}
                  className="rounded-sm border border-border-gray bg-light-gray/30 p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-medium-gray">
                      Line {index + 1}
                    </p>
                    {lines.length > 1 ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-medium-gray hover:text-red-700"
                        onClick={() =>
                          setLines((prev) =>
                            prev.filter((row) => row.key !== line.key),
                          )
                        }
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <div className="grid gap-3">
                    <AdminProductLineSearch
                      products={products}
                      value={line.productId}
                      onSelect={(productId) => pickProduct(line.key, productId)}
                    />
                    <div className="grid gap-3 @3xl:grid-cols-[minmax(0,1fr)_8rem]">
                      <Input
                        label="Product name"
                        required
                        value={line.productName}
                        onChange={(e) =>
                          updateLine(line.key, {
                            productName: e.target.value,
                            productId: "",
                          })
                        }
                      />
                      <Input
                        label="SKU"
                        value={line.sku}
                        onChange={(e) =>
                          updateLine(line.key, {
                            sku: e.target.value,
                            productId: "",
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Qty"
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(line.key, { quantity: e.target.value })
                        }
                      />
                      <Input
                        label="Unit price"
                        type="number"
                        min={0}
                        step="0.01"
                        prefix="$"
                        value={line.unitPrice}
                        onChange={(e) =>
                          updateLine(line.key, { unitPrice: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-sm border border-border-gray bg-white p-4 @5xl:p-5">
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal @5xl:text-base">
              Ship to
            </h3>
            <p className="mt-1 text-xs text-medium-gray">
              Optional for unpaid holds — required before you ship.
            </p>
            <div className="mt-3 grid gap-3 @3xl:grid-cols-2">
              <Input
                label="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Input
                label="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <div className="@3xl:col-span-2">
                <Input
                  label="Company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div className="@3xl:col-span-2">
                <Input
                  label="Address line 1"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                />
              </div>
              <div className="@3xl:col-span-2">
                <Input
                  label="Address line 2"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                />
              </div>
              <Input
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
                <Input
                  label="ZIP"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-sm border border-border-gray bg-white p-4 @5xl:p-5">
            <Textarea
              label="Internal notes"
              rows={3}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Phone order, PO #, special packing…"
            />
          </section>
        </div>

        <aside className="space-y-4 @5xl:sticky @5xl:top-6 @5xl:self-start">
          <section className="rounded-sm border border-border-gray bg-white p-4 @5xl:p-5">
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
              Totals
            </h3>
            <div className="mt-3 space-y-3">
              <Input
                label="Shipping"
                type="number"
                min={0}
                step="0.01"
                prefix="$"
                value={shippingAmount}
                onChange={(e) => setShippingAmount(e.target.value)}
              />
              <Input
                label="Tax"
                type="number"
                min={0}
                step="0.01"
                prefix="$"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
              />
              <Input
                label="Discount"
                type="number"
                min={0}
                step="0.01"
                prefix="$"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
              />
            </div>
            <dl className="mt-4 space-y-2 border-t border-border-gray pt-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-medium-gray">Subtotal</dt>
                <dd className="tabular-nums">{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-3 font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatCurrency(total)}</dd>
              </div>
            </dl>
            <Button
              type="button"
              className="mt-4 w-full"
              disabled={pending}
              onClick={submit}
            >
              {pending ? "Creating…" : "Create order"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="mt-2 w-full"
              disabled={pending}
              onClick={() => router.push("/admin/orders")}
            >
              Cancel
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
}
