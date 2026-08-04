"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { addCatalogDepartment } from "@/lib/actions/admin";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type DepartmentSource = "catalog" | "custom" | "offline";

function parseDepartmentSource(value: string): DepartmentSource {
  if (value === "catalog") return "catalog";
  if (value === "offline") return "offline";
  return "custom";
}

/** Opens a dialog to add a merchandise department. */
export function AddDepartmentButton({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [source, setSource] = useState<DepartmentSource>("custom");
  const [pending, startTransition] = useTransition();

  function resetForm() {
    setName("");
    setSource("custom");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = name.trim();
    if (!value) {
      toast.error("Enter a department name.");
      return;
    }

    startTransition(async () => {
      const result = await addCatalogDepartment(value, source);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      resetForm();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), className)}
      >
        <Plus className="size-3.5" aria-hidden="true" />
        Add department
      </button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetForm();
        }}
        title="Add department"
        description="Create a top-level merchandise department for the shop and product form."
        className="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Department name"
            placeholder="e.g. Hearing Protection"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            required
          />
          <Select
            label="Source"
            value={source}
            onChange={(event) =>
              setSource(parseDepartmentSource(event.target.value))
            }
            options={[
              { label: "Custom", value: "custom" },
              { label: "Catalog", value: "catalog" },
              { label: "Off-line", value: "offline" },
            ]}
            hint="Catalog and Custom appear on the live shop. Off-line stays admin-only."
            required
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add department"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
