import Link from "next/link";
import { ExternalLink } from "lucide-react";

type AdminHeaderProps = {
  title: string;
  userEmail?: string | null;
  description?: string;
  actions?: React.ReactNode;
};

export function AdminHeader({
  title,
  userEmail,
  description,
  actions,
}: AdminHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-border-gray bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide text-dark-charcoal">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-medium-gray">{description}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {actions}
        {userEmail ? (
          <span className="text-sm text-medium-gray">{userEmail}</span>
        ) : null}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-dark-charcoal hover:text-titan-yellow"
        >
          Storefront
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
