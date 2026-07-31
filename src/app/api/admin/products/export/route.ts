import { NextResponse } from "next/server";
import { getAdminProducts } from "@/lib/data/admin";
import { productsToCsv } from "@/lib/admin/products-csv";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { isMasterAdmin, isMasterAdminEmail } from "@/lib/utils";

async function assertMasterAdmin(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    // Demo mode — allow export of seed catalog
    return true;
  }
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    if (isMasterAdminEmail(user.email)) return true;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_owner, email")
      .eq("id", user.id)
      .maybeSingle();
    return isMasterAdmin(profile);
  } catch {
    return false;
  }
}

export async function GET() {
  const ok = await assertMasterAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await getAdminProducts({ active: "all" });
  const csv = productsToCsv(products);
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="titan-products-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
