"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, MapPin, Pencil, Search, X } from "lucide-react";
import { updateOrderShippingAddress } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select } from "@/components/ui/select";
import { US_STATES } from "@/lib/data/geo";
import { cn } from "@/lib/utils";
import { formatPhoneInput } from "@/lib/phone";

export type ShipToAddressFields = {
  first_name?: string;
  last_name?: string;
  company?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
};

type PlacesSuggestion = {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  description: string;
};

function hasAddress(address: ShipToAddressFields | null) {
  return Boolean(address?.line1?.trim() || address?.postal_code?.trim());
}

function normalizeState(value: string | undefined | null) {
  const raw = (value ?? "").trim().toUpperCase();
  if (!raw) return "";
  if (US_STATES.some((s) => s.value === raw)) return raw;
  const byName = US_STATES.find((s) => s.label.toUpperCase() === raw);
  return byName?.value ?? raw.slice(0, 2);
}

export function OrderShipToCard({
  orderId,
  address,
}: {
  orderId: string;
  address: ShipToAddressFields | null;
}) {
  const router = useRouter();
  const listId = useId();
  const searchId = useId();
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(!hasAddress(address));
  const [placesConfigured, setPlacesConfigured] = useState<boolean | null>(
    null,
  );
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlacesSuggestion[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  const [firstName, setFirstName] = useState(address?.first_name ?? "");
  const [lastName, setLastName] = useState(address?.last_name ?? "");
  const [company, setCompany] = useState(address?.company ?? "");
  const [line1, setLine1] = useState(address?.line1 ?? "");
  const [line2, setLine2] = useState(address?.line2 ?? "");
  const [city, setCity] = useState(address?.city ?? "");
  const [state, setState] = useState(normalizeState(address?.state));
  const [postalCode, setPostalCode] = useState(address?.postal_code ?? "");
  const [country, setCountry] = useState(address?.country ?? "US");
  const [phone, setPhone] = useState(formatPhoneInput(address?.phone ?? ""));

  useEffect(() => {
    setFirstName(address?.first_name ?? "");
    setLastName(address?.last_name ?? "");
    setCompany(address?.company ?? "");
    setLine1(address?.line1 ?? "");
    setLine2(address?.line2 ?? "");
    setCity(address?.city ?? "");
    setState(normalizeState(address?.state));
    setPostalCode(address?.postal_code ?? "");
    setCountry(address?.country ?? "US");
    setPhone(formatPhoneInput(address?.phone ?? ""));
    if (!hasAddress(address)) setEditing(true);
  }, [address]);

  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    fetch("/api/admin/places?q=")
      .then(async (res) => {
        if (cancelled) return;
        const data = (await res.json().catch(() => ({}))) as {
          configured?: boolean;
          error?: string;
        };
        if (res.status === 503 || data.configured === false) {
          setPlacesConfigured(false);
          setPlacesError(null);
          return;
        }
        if (res.status === 401) {
          setPlacesConfigured(false);
          setPlacesError("Sign in as admin to use address search.");
          return;
        }
        setPlacesConfigured(true);
        setPlacesError(null);
      })
      .catch(() => {
        if (!cancelled) {
          setPlacesConfigured(false);
          setPlacesError("Unable to reach address search.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [editing]);

  useEffect(() => {
    if (!editing || placesConfigured === false) return;
    const q = query.trim();
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    const handle = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/admin/places?q=${encodeURIComponent(q)}`,
        );
        const data = (await res.json()) as {
          suggestions?: PlacesSuggestion[];
          configured?: boolean;
          error?: string;
        };
        if (data.configured === false) {
          setPlacesConfigured(false);
          setSuggestions([]);
          return;
        }
        setPlacesConfigured(true);
        setSuggestions(data.suggestions ?? []);
        setSearchOpen(true);
        if (!res.ok && data.error) {
          toast.error(data.error);
        }
      } catch {
        toast.error("Unable to reach Google Places.");
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query, editing, placesConfigured]);

  async function applyPlace(placeId: string) {
    setSearching(true);
    try {
      const res = await fetch(
        `/api/admin/places?placeId=${encodeURIComponent(placeId)}`,
      );
      const data = (await res.json()) as {
        address?: {
          line1: string;
          line2: string;
          city: string;
          state: string;
          postalCode: string;
          country: string;
        };
        error?: string;
      };
      if (!res.ok || !data.address) {
        toast.error(data.error ?? "Could not load that address.");
        return;
      }
      setLine1(data.address.line1);
      setLine2(data.address.line2 || "");
      setCity(data.address.city);
      setState(normalizeState(data.address.state));
      setPostalCode(data.address.postalCode);
      setCountry(data.address.country || "US");
      setQuery("");
      setSuggestions([]);
      setSearchOpen(false);
      toast.success("Address fields filled from Google Places.");
    } catch {
      toast.error("Could not load that address.");
    } finally {
      setSearching(false);
    }
  }

  function cancelEdit() {
    setFirstName(address?.first_name ?? "");
    setLastName(address?.last_name ?? "");
    setCompany(address?.company ?? "");
    setLine1(address?.line1 ?? "");
    setLine2(address?.line2 ?? "");
    setCity(address?.city ?? "");
    setState(normalizeState(address?.state));
    setPostalCode(address?.postal_code ?? "");
    setCountry(address?.country ?? "US");
    setPhone(formatPhoneInput(address?.phone ?? ""));
    setEditing(false);
    setQuery("");
    setSuggestions([]);
  }

  function save() {
    startTransition(async () => {
      const result = await updateOrderShippingAddress(orderId, {
        first_name: firstName,
        last_name: lastName,
        company,
        line1,
        line2,
        city,
        state,
        postal_code: postalCode,
        country,
        phone,
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setEditing(false);
      router.refresh();
    });
  }

  const searchDisabled = pending || placesConfigured === false;

  return (
    <div className="rounded-sm border border-border-gray bg-white p-4 @5xl:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-medium-gray" aria-hidden="true" />
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide @5xl:text-base">
            Ship to
          </h3>
        </div>
        {!editing ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setEditing(true)}
          >
            <Pencil className="size-3" aria-hidden="true" />
            Edit
          </Button>
        ) : null}
      </div>

      {!editing ? (
        hasAddress(address) ? (
          <div className="mt-3 space-y-3">
            <div className="rounded-sm border border-border-gray bg-light-gray/40 px-3 py-3">
              <p className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
                {[address?.first_name, address?.last_name]
                  .filter(Boolean)
                  .join(" ") || "Recipient"}
              </p>
              {address?.company ? (
                <p className="mt-0.5 text-sm text-medium-gray">{address.company}</p>
              ) : null}
            </div>

            <address className="not-italic">
              <div className="space-y-1 text-sm text-dark-charcoal">
                <p className="font-medium">{address?.line1}</p>
                {address?.line2 ? (
                  <p className="text-medium-gray">{address.line2}</p>
                ) : null}
                <p>
                  {[address?.city, address?.state]
                    .filter(Boolean)
                    .join(", ")}
                  {address?.postal_code ? (
                    <span className="tabular-nums">
                      {" "}
                      {address.postal_code}
                    </span>
                  ) : null}
                </p>
              </div>

              <dl className="mt-3 grid gap-2 border-t border-border-gray pt-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-medium-gray">
                    Country
                  </dt>
                  <dd className="mt-0.5 text-dark-charcoal">
                    {address?.country || "US"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-medium-gray">
                    Phone
                  </dt>
                  <dd className="mt-0.5 tabular-nums text-dark-charcoal">
                    {address?.phone
                      ? formatPhoneInput(address.phone)
                      : "—"}
                  </dd>
                </div>
              </dl>
            </address>
          </div>
        ) : (
          <div className="mt-3 rounded-sm border border-dashed border-border-gray bg-light-gray/30 px-3 py-4 text-center">
            <MapPin
              className="mx-auto size-5 text-medium-gray"
              aria-hidden="true"
            />
            <p className="mt-2 text-sm text-medium-gray">No address on file.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setEditing(true)}
            >
              Add address
            </Button>
          </div>
        )
      ) : (
        <div className="mt-3 space-y-3">
          <div className="relative space-y-1.5">
            <Label htmlFor={searchId}>Search address</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-medium-gray"
                aria-hidden="true"
              />
              <input
                id={searchId}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length) setSearchOpen(true);
                }}
                onBlur={() => {
                  blurTimer.current = setTimeout(() => setSearchOpen(false), 150);
                }}
                placeholder="Start typing a street, city, or ZIP…"
                autoComplete="off"
                aria-autocomplete="list"
                aria-controls={listId}
                disabled={searchDisabled}
                className={cn(
                  "flex h-10 w-full rounded-sm border border-border-gray bg-white py-2 pl-9 pr-9 text-sm text-dark-charcoal outline-none transition-colors placeholder:text-medium-gray focus-visible:border-dark-charcoal focus-visible:ring-1 focus-visible:ring-dark-charcoal disabled:cursor-not-allowed disabled:bg-light-gray disabled:opacity-70",
                )}
              />
              {searching ? (
                <Loader2
                  className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-medium-gray"
                  aria-hidden="true"
                />
              ) : query ? (
                <button
                  type="button"
                  className="absolute right-1.5 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-medium-gray hover:bg-light-gray hover:text-dark-charcoal"
                  aria-label="Clear search"
                  disabled={searchDisabled}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setQuery("");
                    setSuggestions([]);
                    setSearchOpen(false);
                  }}
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              ) : null}
            </div>
            <p className="text-[0.65rem] leading-snug text-medium-gray">
              {placesConfigured === false
                ? placesError ||
                  "Google Places unavailable — enter the address manually below."
                : searching
                  ? "Searching Google Places…"
                  : placesConfigured === null
                    ? "Checking Google Places…"
                    : "Pick a result to fill the fields below. You can still edit manually."}
            </p>
            {searchOpen && suggestions.length > 0 ? (
              <ul
                id={listId}
                role="listbox"
                className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-sm border border-border-gray bg-white shadow-md"
              >
                {suggestions.map((item) => (
                  <li key={item.placeId}>
                    <button
                      type="button"
                      className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-light-gray"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => void applyPlace(item.placeId)}
                    >
                      <span className="font-medium text-dark-charcoal">
                        {item.primaryText}
                      </span>
                      {item.secondaryText ? (
                        <span className="text-xs text-medium-gray">
                          {item.secondaryText}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {placesConfigured === false ? (
            <p className="rounded-sm border border-amber-200 bg-amber-50 px-2.5 py-2 text-[0.65rem] leading-snug text-amber-900">
              {placesError || (
                <>
                  Set <code className="text-[0.6rem]">GOOGLE_PLACES_API_KEY</code>{" "}
                  and restart the dev server to enable autocomplete.
                </>
              )}
            </p>
          ) : null}

          <div className="grid gap-2 @3xl:grid-cols-2">
            <Input
              label="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={pending}
              autoComplete="shipping given-name"
            />
            <Input
              label="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={pending}
              autoComplete="shipping family-name"
            />
            <div className="@3xl:col-span-2">
              <Input
                label="Company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                disabled={pending}
                autoComplete="shipping organization"
              />
            </div>
            <div className="@3xl:col-span-2">
              <Input
                label="Address line 1"
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                disabled={pending}
                autoComplete="shipping address-line1"
                required
              />
            </div>
            <div className="@3xl:col-span-2">
              <Input
                label="Address line 2"
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
                disabled={pending}
                autoComplete="shipping address-line2"
                placeholder="Apt, suite, unit…"
              />
            </div>
            <Input
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={pending}
              autoComplete="shipping address-level2"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <Select
                label="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                disabled={pending}
                autoComplete="shipping address-level1"
                required
                placeholder="—"
                options={US_STATES.map((s) => ({
                  label: s.value,
                  value: s.value,
                }))}
              />
              <Input
                label="ZIP"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                disabled={pending}
                autoComplete="shipping postal-code"
                required
              />
            </div>
            <Input
              label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={pending}
              autoComplete="shipping country"
            />
            <PhoneInput
              label="Phone"
              value={phone}
              onValueChange={setPhone}
              disabled={pending}
              autoComplete="shipping tel"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={save}
              className="gap-1.5"
            >
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : null}
              {pending ? "Saving…" : "Save address"}
            </Button>
            {hasAddress(address) ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={cancelEdit}
                className="gap-1.5"
              >
                <X className="size-3.5" aria-hidden="true" />
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
