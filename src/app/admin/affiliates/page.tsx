import { redirect } from "next/navigation";

type SearchParams = Promise<{ q?: string }>;

export default async function AdminAffiliatesRedirect({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  qs.set("tab", "affiliates");
  if (params.q?.trim()) qs.set("q", params.q.trim());
  redirect(`/admin/users?${qs.toString()}`);
}
