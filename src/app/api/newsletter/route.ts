import { NextResponse } from "next/server";
import { newsletterSchema } from "@/lib/validations";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid email" },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase().trim();

  if (isSupabaseConfigured()) {
    try {
      const { createServiceClient } = await import("@/lib/supabase/admin");
      const supabase = createServiceClient();
      // Database Insert typings are incomplete in local schema stubs.
      const { error } = await supabase.from("newsletter_subscribers").insert({
        email,
        active: true,
      } as never);

      if (error) {
        // Duplicate email — treat as success
        if (error.code === "23505") {
          return NextResponse.json({ ok: true, message: "Already subscribed" });
        }
        // Fall through to accept-without-persist
      } else {
        return NextResponse.json({ ok: true });
      }
    } catch {
      // Fall through
    }
  }

  return NextResponse.json({ ok: true });
}
