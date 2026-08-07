"use client";

import { useState, useTransition, type ReactNode } from "react";
import {
  Mail,
  MapPin,
  Package,
  Sparkles,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { AddressPlacesSearch } from "@/components/checkout/address-places-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select } from "@/components/ui/select";
import { saveSiteSettings } from "@/lib/actions/admin";
import type { SiteSettingsForm } from "@/lib/data/admin";
import { US_STATES } from "@/lib/data/geo";
import { formatPhoneInput } from "@/lib/phone";
import type { ShipFromForm } from "@/lib/shipengine/config";

function SectionLabel({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="inline-flex size-6 items-center justify-center rounded-sm bg-titan-yellow/70 text-near-black">
        {icon}
      </span>
      <p className="text-xs font-semibold uppercase tracking-wide text-dark-charcoal">
        {children}
      </p>
    </div>
  );
}

export function SiteSettingsFormClient({
  defaults,
}: {
  defaults: SiteSettingsForm;
}) {
  const [pending, startTransition] = useTransition();
  const [siteName, setSiteName] = useState(defaults.siteName);
  const [tagline, setTagline] = useState(defaults.tagline);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<
    number | null
  >(defaults.freeShippingThreshold);
  const [shipFrom, setShipFrom] = useState<ShipFromForm>(() => ({
    ...defaults.shipFrom,
    phone: defaults.shipFrom.phone
      ? formatPhoneInput(defaults.shipFrom.phone)
      : "",
  }));

  const threshold =
    freeShippingThreshold ?? defaults.freeShippingThreshold;

  return (
    <section className="overflow-hidden rounded-sm border border-border-gray bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
      <div className="relative overflow-hidden border-b border-border-gray px-5 py-6 sm:px-6 sm:py-7">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--titan-yellow)_42%,transparent)_0%,color-mix(in_srgb,var(--titan-yellow)_10%,transparent)_45%,transparent_75%)]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-titan-yellow/30 blur-2xl"
          aria-hidden="true"
        />
        <h2 className="sr-only">Store profile</h2>
        <div className="relative flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- serve source PNG crisp, no optimizer re-encode */}
          <img
            src="/images/logo/logo-landscape-auth.png"
            alt="Titan Safety Co. logo"
            width={1470}
            height={500}
            className="h-28 w-auto max-w-full object-contain sm:h-32"
            decoding="async"
          />
        </div>
      </div>

      <form
        className="space-y-4 p-5"
        action={(formData) => {
          startTransition(async () => {
            formData.set("siteName", siteName);
            formData.set("tagline", tagline);
            formData.set(
              "freeShippingThreshold",
              String(freeShippingThreshold ?? defaults.freeShippingThreshold),
            );
            formData.set("shipFromName", shipFrom.name);
            formData.set("shipFromCompany", shipFrom.company);
            formData.set("shipFromPhone", shipFrom.phone);
            formData.set("shipFromLine1", shipFrom.line1);
            formData.set("shipFromLine2", shipFrom.line2);
            formData.set("shipFromCity", shipFrom.city);
            formData.set("shipFromState", shipFrom.state);
            formData.set("shipFromPostal", shipFrom.postalCode);
            formData.set("shipFromCountry", shipFrom.country || "US");
            const result = await saveSiteSettings(formData);
            if (!result.success) {
              toast.error(result.message);
              return;
            }
            toast.success(result.message);
          });
        }}
      >
        <div className="rounded-sm border border-titan-yellow/40 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--titan-yellow)_16%,white)_0%,white_100%)] p-4">
          <SectionLabel icon={<Sparkles className="size-3.5" aria-hidden="true" />}>
            Brand
          </SectionLabel>
          <div className="space-y-3">
            <Input
              label="Site name"
              name="siteName"
              value={siteName}
              onChange={(event) => setSiteName(event.target.value)}
              required
            />
            <Input
              label="Tagline"
              name="tagline"
              value={tagline}
              onChange={(event) => setTagline(event.target.value)}
              hint="Short line under the brand on key marketing surfaces."
            />
          </div>
        </div>

        <div className="rounded-sm border border-border-gray bg-light-gray/25 p-4">
          <SectionLabel icon={<Mail className="size-3.5" aria-hidden="true" />}>
            Contact
          </SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Support email"
              name="supportEmail"
              type="email"
              defaultValue={defaults.supportEmail}
            />
            <Input
              label="Phone"
              name="phone"
              defaultValue={defaults.phone}
            />
          </div>
        </div>

        <div className="rounded-sm border border-border-gray bg-white p-4">
          <SectionLabel icon={<Package className="size-3.5" aria-hidden="true" />}>
            Shipping portal
          </SectionLabel>
          <div className="mb-3 rounded-sm border border-dashed border-border-gray bg-light-gray/40 px-3 py-2.5">
            <div className="flex items-start gap-2">
              <MapPin
                className="mt-0.5 size-3.5 shrink-0 text-medium-gray"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm text-dark-charcoal">
                  ShipEngine ship-from address
                </p>
                <p className="mt-0.5 text-xs text-medium-gray">
                  Origin used when rate shopping and buying shipping labels on
                  orders. Must match a valid commercial shipper address.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Contact name"
              required
              value={shipFrom.name}
              onChange={(e) =>
                setShipFrom((s) => ({ ...s, name: e.target.value }))
              }
              autoComplete="shipping name"
            />
            <Input
              label="Company"
              value={shipFrom.company}
              onChange={(e) =>
                setShipFrom((s) => ({ ...s, company: e.target.value }))
              }
              autoComplete="shipping organization"
            />
            <div className="sm:col-span-2">
              <PhoneInput
                label="Phone"
                value={shipFrom.phone}
                onValueChange={(phone) =>
                  setShipFrom((s) => ({ ...s, phone }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <AddressPlacesSearch
                label="Street address"
                required
                value={shipFrom.line1}
                onChange={(line1) => setShipFrom((s) => ({ ...s, line1 }))}
                onAddressSelect={(address) => {
                  setShipFrom((s) => ({
                    ...s,
                    line1: address.line1,
                    line2: address.line2 || s.line2,
                    city: address.city,
                    state: address.state.trim().toUpperCase(),
                    postalCode: address.postalCode,
                    country: (address.country || "US").toUpperCase(),
                  }));
                }}
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Apt / suite"
                value={shipFrom.line2}
                onChange={(e) =>
                  setShipFrom((s) => ({ ...s, line2: e.target.value }))
                }
                autoComplete="shipping address-line2"
              />
            </div>
            <Input
              label="City"
              required
              value={shipFrom.city}
              onChange={(e) =>
                setShipFrom((s) => ({ ...s, city: e.target.value }))
              }
              autoComplete="shipping address-level2"
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="State"
                required
                value={shipFrom.state}
                onChange={(e) =>
                  setShipFrom((s) => ({ ...s, state: e.target.value }))
                }
                placeholder="—"
                options={US_STATES.map((s) => ({
                  label: s.value,
                  value: s.value,
                }))}
              />
              <Input
                label="ZIP"
                required
                value={shipFrom.postalCode}
                onChange={(e) =>
                  setShipFrom((s) => ({ ...s, postalCode: e.target.value }))
                }
                autoComplete="shipping postal-code"
              />
            </div>
            <input type="hidden" name="shipFromCountry" value={shipFrom.country || "US"} />
          </div>
        </div>

        <div className="rounded-sm border border-border-gray bg-white p-4">
          <SectionLabel icon={<Truck className="size-3.5" aria-hidden="true" />}>
            Shipping perk
          </SectionLabel>
          <div className="mb-3 rounded-sm border border-dashed border-titan-yellow/60 bg-titan-yellow/10 px-3 py-2.5">
            <p className="text-sm text-dark-charcoal">
              Free shipping kicks in at{" "}
              <span className="font-heading font-semibold tabular-nums">
                ${threshold.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
              .
            </p>
            <p className="mt-0.5 text-xs text-medium-gray">
              Shown in cart, checkout, and support chat.
            </p>
          </div>
          <MoneyInput
            label="Free shipping threshold"
            hint="Orders at or above this amount qualify for free shipping."
            value={freeShippingThreshold}
            onValueChange={setFreeShippingThreshold}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-gray pt-4">
          <p className="text-xs text-medium-gray">
            Updates apply storefront-wide after save. Ship-from feeds label rates.
          </p>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </form>
    </section>
  );
}
