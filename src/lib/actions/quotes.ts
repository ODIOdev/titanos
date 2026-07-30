"use server";

import { revalidatePath } from "next/cache";
import { quoteSchema } from "@/lib/validations";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { generateQuoteNumber } from "@/lib/utils";

export type QuoteActionResult = {
  success: boolean;
  error?: string;
  message?: string;
  quoteNumber?: string;
  quoteId?: string;
};

export async function submitQuote(
  input: unknown,
): Promise<QuoteActionResult> {
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Please check the form and try again.",
    };
  }

  const quoteNumber = generateQuoteNumber();
  const data = parsed.data;

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      quoteNumber,
      message: `Quote ${quoteNumber} received (demo mode). Our team will follow up shortly.`,
    };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let client = supabase;
    try {
      const { createServiceClient } = await import("@/lib/supabase/admin");
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        client = createServiceClient() as typeof supabase;
      }
    } catch {
      // Fall back to user-scoped client
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
      return { success: false, error: error?.message ?? "Unable to create quote." };
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
      return { success: false, error: itemsError.message };
    }

    revalidatePath("/account/quotes");
    revalidatePath("/quote");

    return {
      success: true,
      quoteId: quoteRow.id,
      quoteNumber: quoteRow.quote_number,
      message: `Quote ${quoteRow.quote_number} submitted. We'll respond within one business day.`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unable to submit quote.",
    };
  }
}
