"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createCatalogTag,
  deleteCatalogTag,
  renameCatalogTag,
} from "@/lib/actions/admin";
import type { AdminTag } from "@/lib/data/admin";
import { getTagPastelClasses } from "@/lib/data/catalog-options";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/admin/data-table";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";

type TagsManagementCardProps = {
  tags: AdminTag[];
};

export function TagsManagementCard({ tags }: TagsManagementCardProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [source, setSource] = useState<"catalog" | "custom">("custom");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const value = name.trim();
    if (!value) {
      toast.error("Enter a tag name.");
      return;
    }
    startTransition(async () => {
      const result = await createCatalogTag(value, source);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setName("");
      setSource("custom");
      setAddOpen(false);
      router.refresh();
    });
  }

  function startEdit(tagName: string) {
    setEditing(tagName);
    setEditValue(tagName);
  }

  function cancelEdit() {
    setEditing(null);
    setEditValue("");
  }

  function saveEdit(oldName: string) {
    const next = editValue.trim();
    if (!next) {
      toast.error("Enter a tag name.");
      return;
    }
    startTransition(async () => {
      const result = await renameCatalogTag(oldName, next);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setEditing(null);
      setEditValue("");
      router.refresh();
    });
  }

  function handleRemove(tagName: string) {
    startTransition(async () => {
      const result = await deleteCatalogTag(tagName);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      if (editing === tagName) cancelEdit();
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold uppercase tracking-wide text-dark-charcoal">
            Tags
          </h2>
          <p className="mt-1 text-sm text-medium-gray">
            Tags selected on products sync here. Add custom tags to use them on
            new products.
          </p>
        </div>
        <Button
          type="button"
          className="shrink-0"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add tag
        </Button>
      </div>

      <DataTable
        columns={[
          { key: "name", header: "Name" },
          { key: "products", header: "Products" },
          { key: "source", header: "Source" },
          { key: "actions", header: "Actions", className: "text-right" },
        ]}
        emptyMessage="No tags yet. Select a tag on a product or add one with Add tag."
        rows={tags.map((tag) => [
          editing === tag.name ? (
            <form
              key={`${tag.name}-edit`}
              className="flex max-w-xs items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                saveEdit(tag.name);
              }}
            >
              <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                autoFocus
                disabled={pending}
                className="h-8 w-full rounded-sm border border-border-gray px-2 text-sm focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40"
                aria-label={`Rename ${tag.name}`}
              />
              <button
                type="submit"
                disabled={pending}
                className="h-8 rounded-sm bg-dark-charcoal px-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={cancelEdit}
                className="h-8 rounded-sm border border-border-gray px-2 text-xs font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
            </form>
          ) : (
            <span
              key={`${tag.name}-name`}
              className={cn(
                "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                getTagPastelClasses(tag.name),
              )}
            >
              {tag.name}
            </span>
          ),
          <span key={`${tag.name}-count`}>{tag.productCount}</span>,
          <Badge
            key={`${tag.name}-source`}
            variant={tag.source === "catalog" ? "success" : "default"}
          >
            {tag.source === "catalog"
              ? "Catalog"
              : tag.source === "custom"
                ? "Custom"
                : "From products"}
          </Badge>,
          <div
            key={`${tag.name}-actions`}
            className="flex items-center justify-end gap-1"
          >
            <button
              type="button"
              disabled={pending || editing === tag.name}
              onClick={() => startEdit(tag.name)}
              className="inline-flex size-8 items-center justify-center rounded-sm border border-border-gray text-dark-charcoal hover:bg-light-gray disabled:opacity-50"
              aria-label={`Edit ${tag.name}`}
              title="Edit"
            >
              <Pencil className="size-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setDeleteTarget(tag.name)}
              className="inline-flex size-8 items-center justify-center rounded-sm border border-border-gray text-dark-charcoal hover:bg-light-gray disabled:opacity-50"
              aria-label={`Delete ${tag.name}`}
              title="Delete"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </button>
          </div>,
        ])}
      />

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) {
            setName("");
            setSource("custom");
          }
        }}
        title="Add tag"
        description="Create a merchandising tag for the product form and catalog."
        className="max-w-md"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <Input
            label="Tag name"
            placeholder="e.g. Seasonal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />
          <Select
            label="Source"
            value={source}
            onChange={(e) =>
              setSource(e.target.value === "catalog" ? "catalog" : "custom")
            }
            options={[
              { label: "Custom", value: "custom" },
              { label: "Catalog", value: "catalog" },
            ]}
            hint="Catalog tags show as built-in catalog source. Custom tags are admin-defined."
            required
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                setAddOpen(false);
                setName("");
                setSource("custom");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add tag"}
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        itemLabel={deleteTarget ?? ""}
        description="This tag will be removed from the catalog and cleared from any products using it."
        pending={pending}
        onConfirm={() => {
          if (deleteTarget) handleRemove(deleteTarget);
        }}
      />
    </section>
  );
}
