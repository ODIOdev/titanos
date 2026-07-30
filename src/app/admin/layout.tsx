import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminPathHeader } from "@/components/admin/admin-path-header";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

async function getAdminUser(): Promise<{ email: string } | null> {
  if (!isSupabaseConfigured()) {
    // Demo mode — middleware skips auth when env is unset
    return { email: "demo-admin@titansafetyco.com" };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, email")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") return null;

    return { email: profile.email || user.email || "" };
  } catch {
    return null;
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminUser();

  if (!admin) {
    redirect("/login?redirect=/admin");
  }

  return (
    <div className="flex min-h-screen bg-light-gray">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminPathHeader userEmail={admin.email} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
