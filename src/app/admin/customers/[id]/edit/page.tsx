import { notFound } from "next/navigation";
import { AdminCustomerEditForm } from "@/components/admin/admin-customer-edit-form";
import { getAdminCustomer } from "@/lib/data/admin";

type Params = Promise<{ id: string }>;

export default async function AdminCustomerEditPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const customer = await getAdminCustomer(id);
  if (!customer) notFound();

  return (
    <div className="rounded-sm border border-border-gray bg-white p-5">
      <AdminCustomerEditForm
        customerId={customer.id}
        defaults={{
          firstName: customer.first_name ?? "",
          lastName: customer.last_name ?? "",
          email: customer.email,
          company: customer.company ?? "",
          phone: customer.phone ?? "",
          state: customer.state ?? "",
          postalCode: customer.postal_code ?? "",
        }}
      />
    </div>
  );
}
