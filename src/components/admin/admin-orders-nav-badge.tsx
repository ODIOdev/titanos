"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Counts = { open: number; new: number };

function useOpenOrderCounts(initial: Counts): Counts {
  const [counts, setCounts] = useState(() => CountsSafe(initial));

  useEffect(() => {
    setCounts(CountsSafe(initial));
  }, [initial.open, initial.new]);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch("/api/admin/orders/open-count", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as Counts;
        if (!cancelled) setCounts(CountsSafe(data));
      } catch {
        // keep last known
      }
    }

    const id = window.setInterval(refresh, 30_000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return counts;
}

/**
 * Live open-order pill for the Orders nav item.
 * Polls every 30s so the badge stays current without a full page reload.
 */
export function AdminOrdersNavBadge({
  initial,
  active = false,
}: {
  initial: Counts;
  active?: boolean;
}) {
  const counts = useOpenOrderCounts(initial);

  if (counts.open <= 0) return null;

  return (
    <span
      className={cn(
        "ml-auto inline-flex min-w-5 items-center justify-center gap-1 rounded-sm px-1.5 py-0.5 text-[0.65rem] font-bold tabular-nums leading-none",
        active
          ? "bg-dark-charcoal text-titan-yellow"
          : counts.new > 0
            ? "bg-titan-yellow text-dark-charcoal"
            : "bg-white/15 text-white",
      )}
      title={
        counts.new > 0
          ? `${counts.new} new · ${counts.open} open`
          : `${counts.open} open order${counts.open === 1 ? "" : "s"}`
      }
      aria-label={
        counts.new > 0
          ? `${counts.new} new, ${counts.open} open orders`
          : `${counts.open} open orders`
      }
    >
      {counts.new > 0 ? (
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full animate-pulse",
            active ? "bg-titan-yellow" : "bg-dark-charcoal",
          )}
          aria-hidden="true"
        />
      ) : null}
      {counts.open}
    </span>
  );
}

/** Corner count on the mobile hamburger — same live source as the Orders pill. */
export function AdminOrdersMenuBadge({ initial }: { initial: Counts }) {
  const counts = useOpenOrderCounts(initial);

  if (counts.open <= 0) return null;

  return (
    <span
      className={cn(
        "absolute right-1 top-1 flex min-w-[1.1rem] items-center justify-center rounded-sm px-1 text-[0.6rem] font-bold leading-none tabular-nums",
        counts.new > 0
          ? "bg-titan-yellow text-dark-charcoal"
          : "bg-white/20 text-white",
      )}
      aria-hidden="true"
    >
      {counts.open > 99 ? "99+" : counts.open}
    </span>
  );
}

function CountsSafe(value: Counts): Counts {
  return {
    open: Math.max(0, Number(value?.open) || 0),
    new: Math.max(0, Number(value?.new) || 0),
  };
}
