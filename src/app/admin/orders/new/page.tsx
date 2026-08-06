import { AdminCreateOrderForm } from "@/components/admin/admin-create-order-form";
import { getAdminProducts } from "@/lib/data/admin";

export default async function AdminCreateOrderPage() {
  const products = await getAdminProducts({ active: "active" });

  return (
    <AdminCreateOrderForm
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price,
      }))}
    />
  );
}
