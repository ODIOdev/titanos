import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isMasterAdmin, isMasterAdminEmail } from "@/lib/utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !url ||
    !key ||
    url.includes("your-project") ||
    key.includes("your-anon")
  ) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password");
  const isAccountRoute = pathname.startsWith("/account");
  const isAdminRoute = pathname.startsWith("/admin");

  if (!user && (isAccountRoute || isAdminRoute)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirect", isAdminRoute ? "/admin" : pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Hard rule: master email always uses /admin CRM — never /account
  const masterByEmail = isMasterAdminEmail(user?.email);
  let master = masterByEmail;

  if (user && !master && (isAuthRoute || isAccountRoute || isAdminRoute)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_owner, email")
      .eq("id", user.id)
      .maybeSingle();
    master = isMasterAdmin(profile) || isMasterAdminEmail(profile?.email);
  }

  if (user && master) {
    if (isAuthRoute || isAccountRoute) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin";
      return NextResponse.redirect(redirectUrl);
    }
    // Allow /admin CRM through
    return supabaseResponse;
  }

  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/account";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAdminRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/account";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
