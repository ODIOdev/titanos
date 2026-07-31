import { notFound } from "next/navigation";
import { AdminMemberForm } from "@/components/admin/admin-member-form";
import { getAdminMember } from "@/lib/data/admin";

type Params = Promise<{ id: string }>;

export default async function AdminEditMemberPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const member = await getAdminMember(id);
  if (!member) notFound();

  return (
    <AdminMemberForm
      mode="edit"
      memberId={member.id}
      defaultValues={{
        firstName: member.first_name ?? "",
        lastName: member.last_name ?? "",
        email: member.email,
        phone: member.phone ?? "",
        dateOfBirth: member.date_of_birth ?? "",
        promoCode: member.promo_code ?? "",
        avatarUrl: member.avatar_url ?? "",
        password: "",
      }}
    />
  );
}
