import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { isMasterAdmin, isMasterAdminEmail } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/account";
  let next = nextParam.startsWith("/") ? nextParam : "/account";

  if (code && isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && (next === "/account" || next === "/")) {
          if (isMasterAdminEmail(user.email)) {
            next = "/admin";
          } else {
            const { data: profile } = await supabase
              .from("profiles")
              .select("role, is_owner, email")
              .eq("id", user.id)
              .maybeSingle();
            if (isMasterAdmin(profile)) {
              next = "/admin";
            }
          }
        }

        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch {
      // Fall through to login redirect
    }
  }

  if (code && !isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/login?error=auth_not_configured`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
