"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type FooterMobileSectionProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

/** Collapsible footer column for small screens. */
export function FooterMobileSection({
  title,
  children,
  defaultOpen = false,
}: FooterMobileSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className="border-b border-white/10">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="font-heading text-sm font-semibold tracking-wide text-white uppercase">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-white/55 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      <div id={panelId} hidden={!open} className="pb-3.5">
        {open ? children : null}
      </div>
    </div>
  );
}
