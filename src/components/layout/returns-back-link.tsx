"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

function isProductPath(path: string | null | undefined): path is string {
  if (!path) return false;
  return /^\/product\/[a-z0-9]+(?:-[a-z0-9]+)*\/?$/i.test(path.trim());
}

function productPathFromReferrer(): string | null {
  if (typeof document === "undefined") return null;
  try {
    const ref = document.referrer;
    if (!ref) return null;
    const url = new URL(ref);
    if (url.origin !== window.location.origin) return null;
    const path = url.pathname.replace(/\/$/, "") || "/";
    return isProductPath(path) ? path : null;
  } catch {
    return null;
  }
}

export function ReturnsBackLink({ from }: { from?: string | null }) {
  const router = useRouter();
  const [href, setHref] = useState<string | null>(
    isProductPath(from) ? from.replace(/\/$/, "") : null,
  );

  useEffect(() => {
    if (href) return;
    const fromReferrer = productPathFromReferrer();
    if (fromReferrer) setHref(fromReferrer);
  }, [href]);

  const className =
    "mb-6 inline-flex items-center gap-2 text-sm font-medium text-medium-gray transition-colors hover:text-dark-charcoal";

  if (href) {
    return (
      <Link href={href} className={className}>
        <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
        Back to product
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
          return;
        }
        router.push("/shop");
      }}
    >
      <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
      Back
    </button>
  );
}
