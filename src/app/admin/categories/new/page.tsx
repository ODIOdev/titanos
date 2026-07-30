import Link from "next/link";
import { AdminCategoryForm } from "@/components/admin/admin-category-form";

export default function AdminNewCategoryPage() {
  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/admin/categories"
          className="text-xs font-semibold uppercase tracking-wide text-medium-gray hover:text-dark-charcoal"
        >
          ← Categories
        </Link>
        <h2 className="mt-2 font-heading text-2xl uppercase tracking-wide text-dark-charcoal">
          Add new category
        </h2>
        <p className="mt-1 text-sm text-medium-gray">
          Create a catalog category for products on the storefront and in admin.
        </p>
      </div>
      <AdminCategoryForm />
    </div>
  );
}
