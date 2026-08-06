"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCategory, updateCategory } from "@/lib/actions/admin";
import { AddCategoryButton } from "@/components/admin/add-category-button";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { LoadMoreDataTable } from "@/components/admin/load-more-data-table";
import { Badge } from "@/components/ui/badge";
import { slugify } from "@/lib/utils";

export type CategoriesManagementRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  active: boolean;
  productCount: number;
  department: string | null;
};

type CategoriesManagementCardProps = {
  title: string;
  emptyMessage: string;
  categories: CategoriesManagementRow[];
  departmentOptions?: { label: string; value: string }[];
  /** Remount key (e.g. active tab) so load-more resets. */
  listKey?: string;
};

/** Side-by-side companion to departments — inline name/department/status edits. */
export function CategoriesManagementCard({
  title,
  emptyMessage,
  categories,
  departmentOptions = [],
  listKey,
}: CategoriesManagementCardProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CategoriesManagementRow | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  const [mobileVisible, setMobileVisible] = useState(8);

  function departmentSelectOptions(current: string | null | undefined) {
    const options = [...departmentOptions].sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
    );
    const currentValue = current?.trim() ?? "";
    if (
      currentValue &&
      !options.some((option) => option.value === currentValue)
    ) {
      options.unshift({ label: currentValue, value: currentValue });
    }
    return options;
  }

  function startEdit(category: CategoriesManagementRow) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditDepartment(category.department ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditDepartment("");
  }

  function saveEdit(category: CategoriesManagementRow) {
    const nextName = editName.trim();
    if (!nextName) {
      toast.error("Enter a category name.");
      return;
    }
    startTransition(async () => {
      const result = await updateCategory(category.id, {
        name: nextName,
        slug:
          nextName.toLowerCase() === category.name.toLowerCase()
            ? category.slug
            : slugify(nextName),
        description: category.description ?? undefined,
        imageUrl: category.imageUrl ?? undefined,
        department: editDepartment.trim() || undefined,
        sortOrder: category.sortOrder,
        active: category.active,
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      cancelEdit();
      router.refresh();
    });
  }

  function handleRemove(category: CategoriesManagementRow) {
    startTransition(async () => {
      const result = await deleteCategory(category.id);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      if (editingId === category.id) cancelEdit();
      setDeleteTarget(null);
      router.refresh();
    });
  }

  const mobileRows = categories.slice(0, mobileVisible);
  const mobileRemaining = Math.max(0, categories.length - mobileRows.length);

  return (
    <div
      id="categories"
      className="min-w-0 overflow-hidden rounded-sm border border-border-gray bg-white scroll-mt-4"
    >
      <div className="flex items-start justify-between gap-2 border-b border-border-gray px-3 py-3 @5xl:gap-3 @5xl:px-5 @5xl:py-4">
        <div className="min-w-0">
          <h2 className="font-heading text-base font-semibold uppercase tracking-wide text-dark-charcoal @5xl:text-lg">
            {title}
          </h2>
          <p className="mt-0.5 text-xs tabular-nums text-medium-gray @5xl:text-sm">
            {categories.length} item
            {categories.length === 1 ? "" : "s"}
          </p>
        </div>
        <AddCategoryButton
          className="shrink-0"
          departmentOptions={departmentOptions}
        />
      </div>

      {/* Mobile: stacked cards */}
      <div key={`mobile-${listKey ?? "all"}`} className="@5xl:hidden">
        {categories.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-medium-gray">
            {emptyMessage}
          </p>
        ) : (
          <ul className="divide-y divide-border-gray">
            {mobileRows.map((category) => (
              <li key={category.id} className="px-3 py-3">
                {editingId === category.id ? (
                  <form
                    className="space-y-2.5"
                    onSubmit={(event) => {
                      event.preventDefault();
                      saveEdit(category);
                    }}
                  >
                    <input
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      autoFocus
                      disabled={pending}
                      className="h-9 w-full rounded-sm border border-border-gray px-2.5 text-sm focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40"
                      aria-label={`Rename ${category.name}`}
                    />
                    <select
                      value={editDepartment}
                      disabled={pending}
                      onChange={(event) => setEditDepartment(event.target.value)}
                      className="h-9 w-full rounded-sm border border-border-gray bg-white px-2 text-xs font-semibold uppercase tracking-wide text-dark-charcoal focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40"
                      aria-label={`Department for ${category.name}`}
                    >
                      <option value="">Department</option>
                      {departmentSelectOptions(category.department).map(
                        (option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ),
                      )}
                    </select>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={pending}
                        className="h-9 flex-1 rounded-sm bg-dark-charcoal text-xs font-semibold text-white disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={cancelEdit}
                        className="h-9 flex-1 rounded-sm border border-border-gray text-xs font-semibold disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href={`/admin/categories/${category.id}`}
                      className="flex items-start justify-between gap-2 active:bg-light-gray/60"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-dark-charcoal">
                          {category.name}
                        </p>
                        <p className="truncate text-[0.65rem] text-medium-gray">
                          {category.department
                            ? `${category.department} · `
                            : ""}
                          {category.slug} · {category.productCount} products
                        </p>
                      </div>
                      <Badge
                        variant={category.active ? "success" : "default"}
                        className="shrink-0"
                      >
                        {category.active ? "Active" : "Inactive"}
                      </Badge>
                    </Link>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => startEdit(category)}
                        className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-sm border border-border-gray text-xs font-semibold text-dark-charcoal disabled:opacity-50"
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setDeleteTarget(category)}
                        className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-sm border border-border-gray text-xs font-semibold text-dark-charcoal disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {mobileRemaining > 0 ? (
          <div className="border-t border-border-gray px-3 py-3">
            <button
              type="button"
              onClick={() => setMobileVisible((count) => count + 8)}
              className="h-9 w-full rounded-sm border border-border-gray text-xs font-semibold uppercase tracking-wide text-dark-charcoal"
            >
              Load more · {mobileRemaining}
            </button>
          </div>
        ) : null}
      </div>

      {/* Desktop table */}
      <div className="hidden @5xl:block">
        <LoadMoreDataTable
          key={listKey}
          className="rounded-none border-0"
          compact
          columns={[
            { key: "name", header: "Name", className: "w-[34%]" },
            { key: "department", header: "Department", className: "w-[28%]" },
            {
              key: "products",
              header: "Products",
              className: "w-[12%] whitespace-nowrap",
            },
            { key: "status", header: "Status", className: "w-[12%]" },
            {
              key: "actions",
              header: "Actions",
              className: "w-[14%] text-right",
            },
          ]}
          emptyMessage={emptyMessage}
          rowHrefs={categories.map((category) =>
            editingId === category.id
              ? null
              : `/admin/categories/${category.id}`,
          )}
          rows={categories.map((category) => [
            editingId === category.id ? (
              <form
                key={`${category.id}-edit`}
                id={`edit-category-${category.id}`}
                className="flex min-w-0 items-center gap-1.5"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveEdit(category);
                }}
              >
                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  autoFocus
                  disabled={pending}
                  className="h-8 min-w-0 w-full rounded-sm border border-border-gray px-2 text-sm focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40"
                  aria-label={`Rename ${category.name}`}
                />
              </form>
            ) : (
              <div key={`${category.id}-name`} className="min-w-0">
                <p className="truncate font-medium text-dark-charcoal">
                  {category.name}
                </p>
                <p className="truncate text-xs text-medium-gray">
                  {category.slug}
                </p>
              </div>
            ),
            editingId === category.id ? (
              <select
                key={`${category.id}-department-edit`}
                form={`edit-category-${category.id}`}
                value={editDepartment}
                disabled={pending}
                onChange={(event) => setEditDepartment(event.target.value)}
                className="h-8 w-full min-w-0 max-w-full rounded-sm border border-border-gray bg-white px-1.5 text-[10px] font-semibold uppercase tracking-wide text-dark-charcoal focus-visible:border-dark-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow/40"
                aria-label={`Department for ${category.name}`}
              >
                <option value="">Department</option>
                {departmentSelectOptions(category.department).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span
                key={`${category.id}-department`}
                className="block min-w-0 truncate text-xs text-dark-charcoal"
                title={category.department ?? undefined}
              >
                {category.department || "—"}
              </span>
            ),
            <span key={`${category.id}-products`} className="tabular-nums">
              {category.productCount}
            </span>,
            <Badge
              key={`${category.id}-status`}
              variant={category.active ? "success" : "default"}
            >
              {category.active ? "Active" : "Inactive"}
            </Badge>,
            editingId === category.id ? (
              <div
                key={`${category.id}-actions-edit`}
                className="flex flex-wrap items-center justify-end gap-1"
              >
                <button
                  type="submit"
                  form={`edit-category-${category.id}`}
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
                key={`${category.id}-actions`}
                className="flex items-center justify-end gap-1"
              >
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => startEdit(category)}
                  className="inline-flex size-8 items-center justify-center rounded-sm border border-border-gray text-dark-charcoal hover:bg-light-gray disabled:opacity-50"
                  aria-label={`Edit ${category.name}`}
                  title="Edit"
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setDeleteTarget(category)}
                  className="inline-flex size-8 items-center justify-center rounded-sm border border-border-gray text-dark-charcoal hover:bg-light-gray disabled:opacity-50"
                  aria-label={`Delete ${category.name}`}
                  title="Delete"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            ),
          ])}
        />
      </div>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        itemLabel={deleteTarget?.name ?? ""}
        description="Products in this category will become uncategorized. This cannot be undone."
        pending={pending}
        onConfirm={() => {
          if (deleteTarget) handleRemove(deleteTarget);
        }}
      />
    </div>
  );
}
