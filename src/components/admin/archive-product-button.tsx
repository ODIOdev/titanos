"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { archiveProduct, restoreProduct } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export function ArchiveProductButton({
  productId,
  active,
}: {
  productId: string;
  active: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "outline" : "secondary"}
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = active
            ? await archiveProduct(productId)
            : await restoreProduct(productId);
          if (!result.success) {
            toast.error(result.message);
            return;
          }
          toast.success(result.message);
          if (active) {
            router.push("/admin/products?tab=archived");
          }
          router.refresh();
        });
      }}
    >
      {pending ? "…" : active ? "Archive" : "Restore"}
    </Button>
  );
}
