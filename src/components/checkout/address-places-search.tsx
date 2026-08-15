"use client";

import { useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
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
 * Suggestions only appear while the user is typing — never for a prefilled
 * or already-selected address.
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
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchAbort = useRef<AbortController | null>(null);
  const searchSeq = useRef(0);
  const pickSeq = useRef(0);

  const [configured, setConfigured] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<PlacesSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  /** True only after the user types; false after a pick or on mount. */
  const [typing, setTyping] = useState(false);

  const open = typing && suggestions.length > 0;

  function clearSuggestions() {
    searchSeq.current += 1;
    searchAbort.current?.abort();
    searchAbort.current = null;
    setSuggestions([]);
    setSearching(false);
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/places?q=")
      .then(async (res) => {
        if (cancelled) return;
        setConfigured(res.status !== 503);
      })
      .catch(() => {
        if (!cancelled) setConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Autocomplete only while the user is actively typing.
  useEffect(() => {
    if (!typing || configured === false) {
      return;
    }

    const q = value.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    const seq = ++searchSeq.current;
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
          if (seq !== searchSeq.current || controller.signal.aborted) return;
          if (data.configured === false) {
            setConfigured(false);
            setSuggestions([]);
            return;
          }
          setConfigured(true);
          setSuggestions(data.suggestions ?? []);
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return;
        } finally {
          if (seq === searchSeq.current) setSearching(false);
        }
      })();
    }, 250);

    return () => {
      window.clearTimeout(handle);
      searchAbort.current?.abort();
    };
  }, [value, typing, configured]);

  // Click outside closes the list without clearing the field.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setTyping(false);
        clearSuggestions();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  async function applyPlace(placeId: string) {
    const myPick = ++pickSeq.current;

    // Hide list immediately — do not wait on the place details request.
    flushSync(() => {
      setTyping(false);
      clearSuggestions();
    });
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
      if (myPick !== pickSeq.current) return;
      if (!res.ok || !data.address) return;

      onAddressSelect({
        line1: data.address.line1,
        line2: data.address.line2 || "",
        city: data.address.city,
        state: data.address.state,
        postalCode: data.address.postalCode,
        country: data.address.country || "US",
      });
    } finally {
      if (myPick === pickSeq.current) {
        setSearching(false);
        setTyping(false);
        setSuggestions([]);
      }
    }
  }

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
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
          autoComplete="off"
          placeholder={
            configured === false
              ? "Street address"
              : "Start typing an address…"
          }
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          className="flex h-9 w-full rounded-sm border border-border-gray bg-white py-2 pl-8 pr-8 text-sm text-near-black placeholder:text-medium-gray transition-colors focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40 disabled:cursor-not-allowed disabled:bg-light-gray disabled:opacity-60"
          onChange={(e) => {
            setTyping(true);
            onChange(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setTyping(false);
              clearSuggestions();
            }
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

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-sm border border-border-gray bg-white shadow-md"
        >
          {suggestions.map((item) => (
            <li key={item.placeId} role="option">
              <button
                type="button"
                className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-light-gray"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
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
