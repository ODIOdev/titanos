"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type PlacesSuggestion = {
  placeId: string;
  primaryText: string;
  secondaryText: string;
};

export type PlacesFilledAddress = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

/**
 * Compact Google Places street-address search for checkout / ship-to forms.
 */
export function AddressPlacesSearch({
  value,
  onChange,
  onAddressSelect,
  disabled = false,
  required = false,
  label = "Street address",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (address: PlacesFilledAddress) => void;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  className?: string;
}) {
  const listId = useId();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchAbort = useRef<AbortController | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<PlacesSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  /** After a place pick, ignore autocomplete until the user types again. */
  const [selectionLocked, setSelectionLocked] = useState(false);

  function closeMenu() {
    setOpen(false);
    setSuggestions([]);
    setSearching(false);
    searchAbort.current?.abort();
    searchAbort.current = null;
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/places?q=")
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 503) {
          setConfigured(false);
          return;
        }
        setConfigured(true);
      })
      .catch(() => {
        if (!cancelled) setConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (configured === false) return;
    if (selectionLocked) {
      closeMenu();
      return;
    }

    const q = value.trim();
    if (q.length < 3) {
      closeMenu();
      return;
    }

    const handle = window.setTimeout(() => {
      searchAbort.current?.abort();
      const controller = new AbortController();
      searchAbort.current = controller;
      setSearching(true);

      void (async () => {
        try {
          const res = await fetch(`/api/places?q=${encodeURIComponent(q)}`, {
            signal: controller.signal,
          });
          const data = (await res.json()) as {
            suggestions?: PlacesSuggestion[];
            configured?: boolean;
          };
          if (controller.signal.aborted) return;
          if (data.configured === false) {
            setConfigured(false);
            closeMenu();
            return;
          }
          setConfigured(true);
          const next = data.suggestions ?? [];
          setSuggestions(next);
          setOpen(next.length > 0);
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return;
          // keep typing; manual entry still works
        } finally {
          if (!controller.signal.aborted) setSearching(false);
        }
      })();
    }, 250);

    return () => {
      window.clearTimeout(handle);
      searchAbort.current?.abort();
    };
    // closeMenu is stable enough via refs; include selectionLocked intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lock gates search
  }, [value, configured, selectionLocked]);

  async function applyPlace(placeId: string) {
    if (blurTimer.current) {
      clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
    setSelectionLocked(true);
    closeMenu();
    inputRef.current?.blur();
    setSearching(true);
    try {
      const res = await fetch(
        `/api/places?placeId=${encodeURIComponent(placeId)}`,
      );
      const data = (await res.json()) as {
        address?: PlacesFilledAddress;
        error?: string;
      };
      if (!res.ok || !data.address) {
        setSelectionLocked(false);
        setSearching(false);
        return;
      }
      onAddressSelect({
        line1: data.address.line1,
        line2: data.address.line2 || "",
        city: data.address.city,
        state: data.address.state,
        postalCode: data.address.postalCode,
        country: data.address.country || "US",
      });
      closeMenu();
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className={cn("relative w-full", className)}>
      <Label htmlFor={inputId}>
        {label}
        {required ? (
          <span className="ml-0.5 text-red-600" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-medium-gray"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={value}
          required={required}
          disabled={disabled}
          autoComplete="shipping address-line1"
          placeholder={
            configured === false
              ? "Street address"
              : "Start typing an address…"
          }
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open && suggestions.length > 0}
          className="flex h-9 w-full rounded-sm border border-border-gray bg-white py-2 pl-8 pr-8 text-sm text-near-black placeholder:text-medium-gray transition-colors focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40 disabled:cursor-not-allowed disabled:bg-light-gray disabled:opacity-60"
          onChange={(e) => {
            setSelectionLocked(false);
            onChange(e.target.value);
          }}
          onFocus={() => {
            if (!selectionLocked && suggestions.length) setOpen(true);
          }}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 150);
          }}
        />
        {searching ? (
          <Loader2
            className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-medium-gray"
            aria-hidden="true"
          />
        ) : null}
      </div>
      {configured === false ? (
        <p className="mt-1 text-[0.65rem] text-medium-gray">
          Enter the address manually.
        </p>
      ) : configured ? (
        <p className="mt-1 text-[0.65rem] text-medium-gray">
          Powered by Google Places — pick a result to autofill.
        </p>
      ) : null}

      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-sm border border-border-gray bg-white shadow-md"
        >
          {suggestions.map((item) => (
            <li key={item.placeId}>
              <button
                type="button"
                className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-light-gray"
                onMouseDown={(e) => {
                  e.preventDefault();
                  void applyPlace(item.placeId);
                }}
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
  );
}
