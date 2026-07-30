import { NextResponse } from "next/server";
import { quoteSchema } from "@/lib/validations";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { generateQuoteNumber } from "@/lib/utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".xlsx", ".csv"];

function isAllowedFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const rawPayload = formData.get("payload");

    if (typeof rawPayload !== "string") {
      return NextResponse.json(
        { error: "Missing quote payload." },
        { status: 400 },
      );
    }

    let json: unknown;
    try {
      json = JSON.parse(rawPayload);
    } catch {
      return NextResponse.json({ error: "Invalid quote payload." }, { status: 400 });
    }

    const parsed = quoteSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid quote data." },
        { status: 400 },
      );
    }

    const attachments = formData
      .getAll("attachments")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    for (const file of attachments) {
      if (!isAllowedFile(file)) {
        return NextResponse.json(
          { error: `File type not allowed: ${file.name}` },
          { status: 400 },
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File exceeds 10MB: ${file.name}` },
          { status: 400 },
        );
      }
    }

    const quoteNumber = generateQuoteNumber();
    const data = parsed.data;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        quoteNumber,
        message: `Quote ${quoteNumber} received (demo mode). Our team will follow up shortly.`,
      });
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let client = supabase;
    try {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { createServiceClient } = await import("@/lib/supabase/admin");
        client = createServiceClient() as typeof supabase;
      }
    } catch {
      // Use user client
    }

    const { data: quote, error } = await client
      .from("quotes")
      .insert({
        quote_number: quoteNumber,
        user_id: user?.id ?? null,
        contact_name: data.contactName,
        company: data.company,
        email: data.email,
        phone: data.phone,
        industry: data.industry,
        project_name: data.projectName ?? null,
        requested_delivery_date: data.requestedDeliveryDate || null,
        custom_product_description: data.customProductDescription ?? null,
        tax_exempt: data.taxExempt,
        notes: data.notes ?? null,
        status: "submitted",
        shipping_address: {
          line1: data.shippingLine1,
          line2: data.shippingLine2 ?? null,
          city: data.shippingCity,
          state: data.shippingState,
          postal_code: data.shippingPostalCode,
          country: data.shippingCountry,
        },
      } as never)
      .select("id, quote_number")
      .single();

    if (error || !quote) {
      return NextResponse.json(
        { error: error?.message ?? "Unable to create quote." },
        { status: 500 },
      );
    }

    const quoteRow = quote as { id: string; quote_number: string };

    const items = data.items.map((item, index) => ({
      quote_id: quoteRow.id,
      product_id: item.productId || null,
      product_name: item.productName,
      sku: item.sku ?? null,
      quantity: item.quantity,
      notes: item.notes ?? null,
      sort_order: index,
    }));

    const { error: itemsError } = await client
      .from("quote_items")
      .insert(items as never);
    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    if (attachments.length > 0) {
      for (const file of attachments) {
        const safeName = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${quoteRow.id}/${Date.now()}-${safeName}`;

        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          const { error: uploadError } = await client.storage
            .from("quote-attachments")
            .upload(path, buffer, {
              contentType: file.type || "application/octet-stream",
              upsert: false,
            });

          if (uploadError) {
            // Storage may not be configured — continue without failing the quote
            continue;
          }

          await client.from("quote_attachments").insert({
            quote_id: quoteRow.id,
            file_name: file.name,
            file_path: path,
            file_size: file.size,
            mime_type: file.type || "application/octet-stream",
            uploaded_by: user?.id ?? null,
          } as never);
        } catch {
          // Skip attachment persistence failures
        }
      }
    }

    return NextResponse.json({
      success: true,
      quoteId: quoteRow.id,
      quoteNumber: quoteRow.quote_number,
      message: `Quote ${quoteRow.quote_number} submitted. We'll respond within one business day.`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unable to submit quote.",
      },
      { status: 500 },
    );
  }
}
