import { notFound } from "next/navigation";
import { AdminBrandForm } from "@/components/admin/admin-brand-form";
import { getAdminBrands } from "@/lib/data/admin";

export default async function AdminEditBrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const brands = await getAdminBrands();
  const brand = brands.find((b) => b.id === id);
  if (!brand) notFound();

  return (
    <AdminBrandForm
      mode="edit"
      brandId={brand.id}
      defaultValues={{
        name: brand.name,
        slug: brand.slug,
        description: brand.description ?? "",
        logoUrl: brand.logo_url ?? "",
        website: brand.website ?? "",
        active: brand.active,
      }}
    />
  );
}
