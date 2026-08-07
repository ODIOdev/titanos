"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AddressPlacesSearch } from "@/components/checkout/address-places-search";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select } from "@/components/ui/select";
import {
  deleteShippingAddress,
  saveShippingAddress,
  setDefaultShippingAddress,
} from "@/lib/actions/addresses";
import { US_STATES } from "@/lib/data/geo";
import { formatPhoneInput } from "@/lib/phone";
import { cn } from "@/lib/utils";
import type { Address } from "@/types";

const NEW_VALUE = "__new__";

function labelFor(address: Address) {
  const bits = [
    address.line1,
    address.city,
    address.state,
    address.is_default ? "· Default" : "",
  ].filter(Boolean);
  return bits.join(", ");
}

function blankFromProfile(profile?: {
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
}) {
  return {
    id: "",
    firstName: profile?.firstName ?? "",
    lastName: profile?.lastName ?? "",
    company: profile?.company ?? "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    phone: profile?.phone ? formatPhoneInput(profile.phone) : "",
    isDefault: true,
  };
}

function fromAddress(address: Address) {
  return {
    id: address.id,
    firstName: address.first_name,
    lastName: address.last_name,
    company: address.company ?? "",
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state,
    postalCode: address.postal_code,
    phone: address.phone ? formatPhoneInput(address.phone) : "",
    isDefault: address.is_default,
  };
}

export function ProfileShippingAddressCard({
  addresses,
  profile,
}: {
  addresses: Address[];
  profile?: {
    firstName?: string;
    lastName?: string;
    company?: string;
    phone?: string;
  };
}) {
  const router = useRouter();
  const shipping = useMemo(
    () => addresses.filter((a) => a.type === "shipping"),
    [addresses],
  );
  const defaultId =
    shipping.find((a) => a.is_default)?.id ?? shipping[0]?.id ?? NEW_VALUE;

  const [selectedId, setSelectedId] = useState(defaultId);
  const [draft, setDraft] = useState(() => {
    const current = shipping.find((a) => a.id === defaultId);
    return current ? fromAddress(current) : blankFromProfile(profile);
  });
  const [pending, startTransition] = useTransition();

  const options = [
    { value: NEW_VALUE, label: "Add new shipping address" },
    ...shipping.map((a) => ({
      value: a.id,
      label: labelFor(a),
    })),
  ];

  function loadSelection(id: string) {
    setSelectedId(id);
    if (id === NEW_VALUE) {
      setDraft(blankFromProfile(profile));
      return;
    }
    const match = shipping.find((a) => a.id === id);
    if (match) setDraft(fromAddress(match));
  }

  function save() {
    startTransition(async () => {
      const result = await saveShippingAddress({
        id: draft.id || null,
        type: "shipping",
        firstName: draft.firstName,
        lastName: draft.lastName,
        company: draft.company,
        line1: draft.line1,
        line2: draft.line2,
        city: draft.city,
        state: draft.state,
        postalCode: draft.postalCode,
        country: "US",
        phone: draft.phone,
        isDefault: draft.isDefault,
      });
      if (!result.success) {
        toast.error(result.error ?? "Unable to save address.");
        return;
      }
      toast.success(result.message ?? "Address saved.");
      if (result.id) setSelectedId(result.id);
      router.refresh();
    });
  }

  function makeDefault() {
    if (!draft.id) {
      toast.message("Save the address first, then set it as default.");
      return;
    }
    startTransition(async () => {
      const result = await setDefaultShippingAddress(draft.id);
      if (!result.success) {
        toast.error(result.error ?? "Unable to update default.");
        return;
      }
      toast.success(result.message ?? "Default updated.");
      setDraft((d) => ({ ...d, isDefault: true }));
      router.refresh();
    });
  }

  function remove() {
    if (!draft.id) {
      loadSelection(NEW_VALUE);
      return;
    }
    startTransition(async () => {
      const result = await deleteShippingAddress(draft.id);
      if (!result.success) {
        toast.error(result.error ?? "Unable to delete address.");
        return;
      }
      toast.success(result.message ?? "Address deleted.");
      loadSelection(NEW_VALUE);
      router.refresh();
    });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-sm border border-border-gray bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between gap-2 border-b border-border-gray bg-light-gray/40 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm bg-titan-yellow/70 text-near-black">
            <MapPin className="size-3.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
              Shipping
            </h2>
            <p className="text-xs text-medium-gray">Checkout default</p>
          </div>
        </div>
        <Link
          href="/account/addresses"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "shrink-0 text-xs",
          )}
        >
          All
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <Select
          label="Saved addresses"
          value={selectedId}
          onChange={(e) => loadSelection(e.target.value)}
          options={options}
          disabled={pending}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            required
            value={draft.firstName}
            onChange={(e) =>
              setDraft((d) => ({ ...d, firstName: e.target.value }))
            }
            disabled={pending}
            autoComplete="shipping given-name"
          />
          <Input
            label="Last name"
            required
            value={draft.lastName}
            onChange={(e) =>
              setDraft((d) => ({ ...d, lastName: e.target.value }))
            }
            disabled={pending}
            autoComplete="shipping family-name"
          />
          <div className="col-span-2">
            <Input
              label="Company"
              value={draft.company}
              onChange={(e) =>
                setDraft((d) => ({ ...d, company: e.target.value }))
              }
              disabled={pending}
              autoComplete="shipping organization"
            />
          </div>
          <div className="col-span-2">
            <AddressPlacesSearch
              label="Street"
              required
              value={draft.line1}
              disabled={pending}
              onChange={(line1) => setDraft((d) => ({ ...d, line1 }))}
              onAddressSelect={(address) => {
                setDraft((d) => ({
                  ...d,
                  line1: address.line1,
                  line2: address.line2 || d.line2,
                  city: address.city,
                  state: address.state.trim().toUpperCase(),
                  postalCode: address.postalCode,
                }));
              }}
            />
          </div>
          <div className="col-span-2">
            <Input
              label="Apt / suite"
              value={draft.line2}
              onChange={(e) =>
                setDraft((d) => ({ ...d, line2: e.target.value }))
              }
              disabled={pending}
              autoComplete="shipping address-line2"
            />
          </div>
          <Input
            label="City"
            required
            value={draft.city}
            onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
            disabled={pending}
            autoComplete="shipping address-level2"
          />
          <div className="grid grid-cols-2 gap-2">
            <Select
              label="State"
              required
              value={draft.state}
              onChange={(e) =>
                setDraft((d) => ({ ...d, state: e.target.value }))
              }
              disabled={pending}
              placeholder="—"
              options={US_STATES.map((s) => ({
                label: s.value,
                value: s.value,
              }))}
            />
            <Input
              label="ZIP"
              required
              value={draft.postalCode}
              onChange={(e) =>
                setDraft((d) => ({ ...d, postalCode: e.target.value }))
              }
              disabled={pending}
              autoComplete="shipping postal-code"
            />
          </div>
          <div className="col-span-2">
            <PhoneInput
              label="Phone"
              value={draft.phone}
              onValueChange={(phone) => setDraft((d) => ({ ...d, phone }))}
              disabled={pending}
            />
          </div>
        </div>

        <label className="flex items-start gap-2 text-xs text-dark-charcoal">
          <input
            type="checkbox"
            className="mt-0.5 size-3.5 shrink-0 rounded-sm border-border-gray text-dark-charcoal focus:ring-titan-yellow"
            checked={draft.isDefault}
            disabled={pending}
            onChange={(e) =>
              setDraft((d) => ({ ...d, isDefault: e.target.checked }))
            }
          />
          Default address at checkout
        </label>

        <div className="mt-auto flex flex-wrap gap-2 border-t border-border-gray pt-3">
          <Button
            type="button"
            className="flex-1"
            disabled={pending}
            onClick={save}
          >
            {pending ? "Saving…" : draft.id ? "Update" : "Save address"}
          </Button>
          {draft.id && !draft.isDefault ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={makeDefault}
            >
              Set default
            </Button>
          ) : null}
          {draft.id || draft.line1 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              className="text-medium-gray hover:text-red-700"
              onClick={remove}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              {draft.id ? "Delete" : "Clear"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
