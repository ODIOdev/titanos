"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteCatalogDepartment,
  renameCatalogDepartment,
} from "@/lib/actions/admin";
import type { AdminDepartment } from "@/lib/data/admin";
import { AddDepartmentButton } from "@/components/admin/add-department-button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/admin/data-table";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";

type DepartmentsManagementCardProps = {
  departments: AdminDepartment[];
};

type EditSource = "catalog" | "custom" | "offline";

function toEditSource(source: AdminDepartment["source"]): EditSource {
  if (source === "catalog") return "catalog";
  if (source === "offline") return "offline";
  return "custom";
}

function parseEditSource(value: string): EditSource {
  if (value === "catalog") return "catalog";
  if (value === "offline") return "offline";
  return "custom";
}

function sourceBadgeVariant(
  source: AdminDepartment["source"],
): "success" | "warning" | "default" {
  if (source === "catalog") return "success";
  if (source === "offline") return "warning";
  return "default";
}

function sourceLabel(source: AdminDepartment["source"]) {
  if (source === "catalog") return "Catalog";
  if (source === "offline") return "Off-line";
  if (source === "custom") return "Custom";
  return "Product";
}

/** Side-by-side companion to the categories table — lists merchandise departments. */
export function DepartmentsManagementCard({
  departments,
}: DepartmentsManagementCardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editSource, setEditSource] = useState<EditSource>("custom");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function startEdit(department: AdminDepartment) {
    setEditing(department.name);
    setEditValue(department.name);
    setEditSource(toEditSource(department.source));
  }

  function cancelEdit() {
    setEditing(null);
    setEditValue("");
    setEditSource("custom");
  }

  function saveEdit(oldName: string) {
    const next = editValue.trim();
    if (!next) {
      toast.error("Enter a department name.");
      return;
    }
    startTransition(async () => {
      const result = await renameCatalogDepartment(oldName, next, editSource);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      cancelEdit();
      router.refresh();
    });
  }

  function handleRemove(departmentName: string) {
    startTransition(async () => {
      const result = await deleteCatalogDepartment(departmentName);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      if (editing === departmentName) cancelEdit();
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <div
      id="departments"
      className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-sm border border-border-gray bg-white scroll-mt-4"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border-gray px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold uppercase tracking-wide text-dark-charcoal">
            Departments
          </h2>
          <p className="mt-0.5 text-sm text-medium-gray">
            Top-level shop groupings for products.
            <span className="ml-1.5 tabular-nums text-dark-charcoal">
              · {departments.length} item
              {departments.length === 1 ? "" : "s"}
            </span>
          </p>
        </div>
        <AddDepartmentButton className="shrink-0" />
      </div>

      <DataTable
        className="rounded-none border-0"
        compact
        columns={[
          { key: "name", header: "Name", className: "w-[42%]" },
          { key: "products", header: "Products", className: "w-[14%]" },
          { key: "source", header: "Source", className: "w-[20%]" },
          { key: "actions", header: "Actions", className: "w-[24%] text-right" },
        ]}
        emptyMessage="No departments yet. Add one to organize the catalog."
        rows={departments.map((department) => [
          editing === department.name ? (
            <form
              key={`${department.name}-edit`}
              id={`edit-department-${department.slug}`}
              className="flex min-w-0 items-center gap-1.5"
              onSubmit={(event) => {
                event.preventDefault();
                saveEdit(department.name);
              }}
            >
              <input
                value={editValue}
                onChange={(event) => setEditValue(event.target.value)}
                autoFocus
                disabled={pending}
                className="h-8 min-w-0 w-full rounded-sm border border-border-gray px-2 text-sm focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40"
                aria-label={`Rename ${department.name}`}
              />
            </form>
          ) : (
            <div key={`${department.name}-name`} className="min-w-0">
              <p className="truncate font-medium text-dark-charcoal">
                {department.name}
              </p>
              <p className="truncate text-xs text-medium-gray">
                {department.slug}
              </p>
            </div>
          ),
          <span
            key={`${department.name}-products`}
            className="tabular-nums"
          >
            {department.productCount}
          </span>,
          editing === department.name ? (
            <select
              key={`${department.name}-source-edit`}
              form={`edit-department-${department.slug}`}
              value={editSource}
              disabled={pending}
              onChange={(event) =>
                setEditSource(parseEditSource(event.target.value))
              }
              className="h-8 max-w-full rounded-sm border border-border-gray bg-white px-1.5 text-[10px] font-semibold uppercase tracking-wide text-dark-charcoal focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40"
              aria-label={`Source for ${department.name}`}
            >
              <option value="custom">Custom</option>
              <option value="catalog">Catalog</option>
              <option value="offline">Off-line</option>
            </select>
          ) : (
            <Badge
              key={`${department.name}-source`}
              variant={sourceBadgeVariant(department.source)}
            >
              {sourceLabel(department.source)}
            </Badge>
          ),
          editing === department.name ? (
            <div
              key={`${department.name}-actions-edit`}
              className="flex flex-wrap items-center justify-end gap-1"
            >
              <button
                type="submit"
                form={`edit-department-${department.slug}`}
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
            </div>
          ) : (
            <div
              key={`${department.name}-actions`}
              className="flex items-center justify-end gap-1"
            >
              <button
                type="button"
                disabled={pending}
                onClick={() => startEdit(department)}
                className="inline-flex size-8 items-center justify-center rounded-sm border border-border-gray text-dark-charcoal hover:bg-light-gray disabled:opacity-50"
                aria-label={`Edit ${department.name}`}
                title="Edit"
              >
                <Pencil className="size-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setDeleteTarget(department.name)}
                className="inline-flex size-8 items-center justify-center rounded-sm border border-border-gray text-dark-charcoal hover:bg-light-gray disabled:opacity-50"
                aria-label={`Delete ${department.name}`}
                title="Delete"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          ),
        ])}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        itemLabel={deleteTarget ?? ""}
        description="This removes the department from the catalog list and clears it on any products using it."
        pending={pending}
        onConfirm={() => {
          if (deleteTarget) handleRemove(deleteTarget);
        }}
      />
    </div>
  );
}
