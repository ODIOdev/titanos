import { redirect } from "next/navigation";

type SearchParams = Promise<{ q?: string }>;

export default async function AdminCustomersRedirect({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  qs.set("tab", "customers");
  if (params.q?.trim()) qs.set("q", params.q.trim());
  redirect(`/admin/users?${qs.toString()}`);
}
