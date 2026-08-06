import Link from "next/link";
import { FREE_SHIPPING_THRESHOLD, SITE_CONFIG } from "@/lib/data/seed-data";
import { formatCurrency } from "@/lib/utils";
import { logout } from "@/lib/actions/auth";
import { DevIphonePreviewNavButton } from "@/components/dev/dev-iphone-shell";

const linkClass =
  "text-white/85 transition-colors hover:text-titan-yellow";

export function UtilityBar({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <div className="storefront-utility-bar hidden bg-dark-charcoal text-white @5xl:block">
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
          <Link href="/bulk-orders" className={linkClass}>
            Bulk Orders
          </Link>
          <Link href="/quote" className={linkClass}>
            Request a Quote
          </Link>
          <DevIphonePreviewNavButton className={linkClass} />
          {signedIn ? (
            <form action={logout}>
              <button type="submit" className={linkClass}>
                Sign Out
              </button>
            </form>
          ) : (
            <Link href="/login" className={linkClass}>
              Sign In / Register
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
