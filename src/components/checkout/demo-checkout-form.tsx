"use client";

import { useState, useTransition } from "react";
import { CreditCard, Lock, MapPin, User } from "lucide-react";
import { toast } from "sonner";
import { PaymentMethodLogos } from "@/components/shared/payment-method-logos";
import { AddressPlacesSearch } from "@/components/checkout/address-places-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select } from "@/components/ui/select";
import { US_STATES } from "@/lib/data/geo";
import { formatPhoneInput } from "@/lib/phone";
import { cn, formatCurrency } from "@/lib/utils";

type CartItemPayload = {
  productId: string;
  quantity: number;
  variantId?: string | null;
};

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

const compactField =
  "[&_label]:mb-1 [&_label]:text-[0.7rem] [&_input]:h-9 [&_input]:text-sm [&_select]:h-9 [&_select]:text-sm";

function SectionHeading({
  step,
  icon: Icon,
  title,
}: {
  step: number;
  icon: typeof User;
  title: string;
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-dark-charcoal font-heading text-[0.6rem] font-semibold text-titan-yellow">
        {step}
      </span>
      <Icon className="size-3 text-[#9a8b6e]" aria-hidden="true" />
      <h3 className="font-heading text-[0.7rem] font-semibold uppercase tracking-wide text-dark-charcoal">
        {title}
      </h3>
      <span className="h-px flex-1 bg-[#eadfce]" aria-hidden="true" />
    </div>
  );
}

export function DemoCheckoutForm({
  items,
  total,
  defaults,
}: {
  items: CartItemPayload[];
  total: number;
  defaults?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
}) {
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState(defaults?.email ?? "");
  const [firstName, setFirstName] = useState(defaults?.firstName ?? "");
  const [lastName, setLastName] = useState(defaults?.lastName ?? "");
  const [company, setCompany] = useState(defaults?.company ?? "");
  const [line1, setLine1] = useState(defaults?.line1 ?? "");
  const [line2, setLine2] = useState(defaults?.line2 ?? "");
  const [city, setCity] = useState(defaults?.city ?? "");
  const [state, setState] = useState(defaults?.state ?? "");
  const [postalCode, setPostalCode] = useState(defaults?.postalCode ?? "");
  const [phone, setPhone] = useState(
    defaults?.phone ? formatPhoneInput(defaults.phone) : "",
  );
  const [cardName, setCardName] = useState(
    [defaults?.firstName, defaults?.lastName].filter(Boolean).join(" "),
  );
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  function placeOrder() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/checkout/demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items,
            email,
            shipping: {
              first_name: firstName,
              last_name: lastName,
              company,
              line1,
              line2,
              city,
              state,
              postal_code: postalCode,
              country: "US",
              phone: formatPhoneInput(phone) || phone,
            },
            card: {
              name: cardName,
              number: cardNumber,
              expiry,
              cvc,
            },
          }),
        });
        const data = (await res.json().catch(() => null)) as {
          url?: string;
          error?: string;
          orderNumber?: string;
          warning?: string;
        } | null;

        if (!res.ok || !data?.url) {
          toast.error(data?.error ?? "Could not place test order.");
          return;
        }

        if (data.warning) toast.message(data.warning);
        else if (data.orderNumber) {
          toast.success(
            `Order ${data.orderNumber} placed — check Admin → Orders.`,
          );
        }
        window.location.href = data.url;
      } catch {
        toast.error("Could not place test order.");
      }
    });
  }

  return (
    <div className={cn("space-y-3.5", compactField)}>
      <section>
        <SectionHeading step={1} icon={User} title="Contact" />
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pending}
          autoComplete="email"
          placeholder="you@company.com"
          hint={defaults?.email ? "From your profile" : undefined}
        />
      </section>

      <section>
        <SectionHeading step={2} icon={MapPin} title="Shipping" />
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            label="First name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={pending}
            autoComplete="shipping given-name"
          />
          <Input
            label="Last name"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={pending}
            autoComplete="shipping family-name"
          />
          <div className="sm:col-span-2">
            <Input
              label="Company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              disabled={pending}
              autoComplete="shipping organization"
              placeholder="Optional"
            />
          </div>
          <div className="sm:col-span-2">
            <AddressPlacesSearch
              label="Street address"
              required
              value={line1}
              disabled={pending}
              onChange={setLine1}
              onAddressSelect={(address) => {
                setLine1(address.line1);
                if (address.line2) setLine2(address.line2);
                setCity(address.city);
                const st = address.state.trim().toUpperCase();
                if (US_STATES.some((s) => s.value === st)) setState(st);
                setPostalCode(address.postalCode);
              }}
            />
          </div>
          <div className="sm:col-span-2 grid grid-cols-[1fr_5.5rem_4.5rem] gap-2">
            <Input
              label="City"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={pending}
              autoComplete="shipping address-level2"
            />
            <Select
              label="State"
              required
              value={state}
              onChange={(e) => setState(e.target.value)}
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
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              disabled={pending}
              autoComplete="shipping postal-code"
            />
          </div>
          <div className="sm:col-span-2 grid gap-2 sm:grid-cols-[1fr_1fr]">
            <Input
              label="Apt / suite"
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              disabled={pending}
              autoComplete="shipping address-line2"
              placeholder="Optional"
            />
            <PhoneInput
              label="Phone"
              value={phone}
              onValueChange={setPhone}
              disabled={pending}
            />
          </div>
        </div>
      </section>

      <section>
        <SectionHeading step={3} icon={CreditCard} title="Payment" />
        <div className="space-y-2 rounded-sm border border-[#eadfce] bg-[#faf6ee] p-2.5">
          <Input
            label="Name on card"
            required
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            disabled={pending}
            autoComplete="cc-name"
          />
          <Input
            label="Card number"
            required
            inputMode="numeric"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            disabled={pending}
            autoComplete="cc-number"
            placeholder="4242 4242 4242 4242"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Expiry"
              required
              inputMode="numeric"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              disabled={pending}
              autoComplete="cc-exp"
              placeholder="MM/YY"
            />
            <Input
              label="CVC"
              required
              inputMode="numeric"
              value={cvc}
              onChange={(e) =>
                setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              disabled={pending}
              autoComplete="cc-csc"
              placeholder="123"
            />
          </div>
          <div className="border-t border-[#eadfce] pt-2">
            <PaymentMethodLogos
              className="justify-start gap-1"
              itemClassName="h-7 w-[3.75rem] border-[#eadfce]"
            />
            <p className="mt-1.5 text-[0.6rem] leading-snug text-[#8a7d66]">
              Test ·{" "}
              <span className="font-medium text-dark-charcoal">
                4242 4242 4242 4242
              </span>
            </p>
          </div>
        </div>
      </section>

      <div className="space-y-1.5 border-t border-[#eadfce] pt-3" id="checkout-pay">
        <Button
          type="button"
          variant="primary"
          size="md"
          className="h-10 w-full gap-2"
          disabled={pending}
          onClick={placeOrder}
        >
          <Lock className="size-3.5" aria-hidden="true" />
          {pending ? "Placing order…" : `Pay ${formatCurrency(total)}`}
        </Button>
        <p className="text-center text-[0.6rem] text-[#8a7d66]">
          Saves a paid order to Admin → Orders.
        </p>
      </div>
    </div>
  );
}
