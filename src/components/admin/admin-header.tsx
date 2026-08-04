import type { ReactNode } from "react";
import { AdminGlobalSearch } from "@/components/admin/admin-global-search";

type AdminHeaderProps = {
  title: string;
  description?: string;
  back?: ReactNode;
  actions?: ReactNode;
};

export function AdminHeader({
  title,
  description,
  back,
  actions,
}: AdminHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-border-gray bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {back ? <div className="mb-2">{back}</div> : null}
        <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide text-dark-charcoal">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-medium-gray">{description}</p>
        ) : null}
      </div>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
        <AdminGlobalSearch />
        {actions ? (
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
