import { NextResponse } from "next/server";
import { getAdminOpenOrderCounts } from "@/lib/data/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { isMasterAdmin, isMasterAdminEmail } from "@/lib/utils";

async function requireAdmin() {
  if (!isSupabaseConfigured()) return true; // demo
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
  const ok = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const counts = await getAdminOpenOrderCounts();
  return NextResponse.json(counts, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
