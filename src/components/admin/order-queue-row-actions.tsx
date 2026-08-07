import Link from "next/link";
import { Eye, Pencil } from "lucide-react";

export function OrderQueueRowActions({ orderId }: { orderId: string }) {
  const href = `/admin/orders/${orderId}`;

  return (
    <div className="inline-flex items-center justify-end gap-1.5">
      <Link
        href={href}
        className="inline-flex h-8 items-center gap-1 rounded-sm bg-dark-charcoal px-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-near-black"
      >
        <Eye className="size-3" aria-hidden="true" />
        Open
      </Link>
      <Link
        href={href}
        className="inline-flex h-8 items-center gap-1 rounded-sm border border-border-gray bg-white px-2.5 text-xs font-semibold uppercase tracking-wide text-dark-charcoal hover:bg-light-gray"
      >
        <Pencil className="size-3" aria-hidden="true" />
        Edit
      </Link>
    </div>
  );
}
