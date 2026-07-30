import Link from "next/link";
import { FREE_SHIPPING_THRESHOLD, SITE_CONFIG } from "@/lib/data/seed-data";
import { formatCurrency } from "@/lib/utils";

export function UtilityBar() {
  return (
    <div className="bg-dark-charcoal text-white">
      <div className="container-titan flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 text-xs">
        <p className="border-l-2 border-titan-yellow pl-3 font-medium text-white">
          Free shipping on orders over {formatCurrency(FREE_SHIPPING_THRESHOLD)}
        </p>
        <nav
          aria-label="Utility links"
          className="flex flex-wrap items-center gap-x-4 gap-y-1"
        >
          <a
            href={`tel:${SITE_CONFIG.phone.replace(/[^+\d]/g, "")}`}
            className="hidden font-medium text-titan-yellow transition-colors hover:text-white sm:inline"
          >
            {SITE_CONFIG.phoneDisplay}
          </a>
          <Link
            href="/bulk-orders"
            className="text-white/85 transition-colors hover:text-titan-yellow"
          >
            Bulk Orders
          </Link>
          <Link
            href="/quote"
            className="text-white/85 transition-colors hover:text-titan-yellow"
          >
            Request a Quote
          </Link>
          <Link
            href="/login"
            className="text-white/85 transition-colors hover:text-titan-yellow"
          >
            Sign In / Register
          </Link>
        </nav>
      </div>
    </div>
  );
}
