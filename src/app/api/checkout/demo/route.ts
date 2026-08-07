import { NextResponse } from "next/server";
import {
  computeCheckoutTotals,
  orderItemOptionsFromLine,
  resolveCheckoutLineItems,
} from "@/lib/checkout/pricing";
import { deductStockForOrder } from "@/lib/catalog/inventory";
import { phoneDigits } from "@/lib/phone";
import { isStripeConfigured } from "@/lib/stripe";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { absoluteUrl, generateOrderNumber } from "@/lib/utils";
import { demoCheckoutSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

function normalizeCardNumber(value: string) {
  return value.replace(/\D/g, "");
}

function isAcceptableTestCard(number: string) {
  const digits = normalizeCardNumber(number);
  if (digits.length < 13 || digits.length > 19) return false;
  // Stripe test cards + any Luhn-valid length for local demos
  if (digits.startsWith("4242") || digits.startsWith("4000")) return true;
  return digits.length >= 15;
}

export async function POST(request: Request) {
  if (isStripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Stripe is configured — use the Stripe checkout form instead of demo checkout.",
      },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = demoCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid checkout payload" },
      { status: 400 },
    );
  }

  if (!isAcceptableTestCard(parsed.data.card.number)) {
    return NextResponse.json(
      {
        error:
          "Enter a valid test card (e.g. 4242 4242 4242 4242).",
      },
      { status: 400 },
    );
  }

  const cvcDigits = parsed.data.card.cvc.replace(/\D/g, "");
  if (cvcDigits.length < 3 || cvcDigits.length > 4) {
    return NextResponse.json({ error: "Enter a valid CVC." }, { status: 400 });
  }

  const expiry = parsed.data.card.expiry.replace(/\s/g, "");
  if (!/^\d{2}\/\d{2}$/.test(expiry)) {
    return NextResponse.json(
      { error: "Expiry must be MM/YY." },
      { status: 400 },
    );
  }

  const resolved = await resolveCheckoutLineItems(parsed.data.items);
  if ("error" in resolved) {
    return NextResponse.json(
      { error: resolved.error },
      { status: resolved.status },
    );
  }

  const { lineItems } = resolved;
  const { subtotal, shippingAmount, taxAmount, total } =
    computeCheckoutTotals(lineItems);
  const orderNumber = generateOrderNumber();
  const email = parsed.data.email.trim().toLowerCase();
  const ship = parsed.data.shipping;
  const cardLast4 = normalizeCardNumber(parsed.data.card.number).slice(-4);

  const shippingAddress = {
    first_name: ship.first_name,
    last_name: ship.last_name,
    company: ship.company || null,
    line1: ship.line1,
    line2: ship.line2 || null,
    city: ship.city,
    state: ship.state.toUpperCase(),
    postal_code: ship.postal_code,
    country: ship.country || "US",
    phone: phoneDigits(ship.phone)
      ? `(${phoneDigits(ship.phone).slice(0, 3)}) ${phoneDigits(ship.phone).slice(3, 6)}-${phoneDigits(ship.phone).slice(6)}`
      : ship.phone,
  };

  if (!isSupabaseConfigured()) {
    // Still allow success path so UI can be tested without DB.
    const demoSessionId = `demo_${orderNumber}`;
    return NextResponse.json({
      demo: true,
      orderNumber,
      orderId: null,
      url: absoluteUrl(`/checkout/success?session_id=${demoSessionId}`),
      warning:
        "Supabase is not configured — order was not saved to the admin dashboard.",
    });
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        email,
        status: "paid",
        payment_status: "paid",
        fulfillment_status: "unfulfilled",
        subtotal,
        shipping_amount: shippingAmount,
        tax_amount: taxAmount,
        discount_amount: 0,
        total,
        currency: "USD",
        shipping_address: shippingAddress,
        billing_address: {
          payment_method: "card",
          card_brand: "visa",
          card_last4: cardLast4,
          cardholder_name: parsed.data.card.name.trim(),
        },
        stripe_payment_intent_id: `demo_pi_${orderNumber}_${cardLast4}`,
        internal_notes: `Demo checkout · card ending ${cardLast4} · ${parsed.data.card.name}`,
      } as never)
      .select("id")
      .single();

    if (error || !order) {
      throw error ?? new Error("Failed to create order");
    }

    const orderId = (order as { id: string }).id;

    const { error: itemsError } = await supabase.from("order_items").insert(
      lineItems.map((item) => ({
        order_id: orderId,
        product_id: item.productId,
        product_name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        options: orderItemOptionsFromLine(item),
      })) as never,
    );
    if (itemsError) throw itemsError;

    await supabase.from("order_status_history").insert({
      order_id: orderId,
      status: "paid",
      notes: `Demo storefront checkout · card ···· ${cardLast4}`,
    } as never);

    await deductStockForOrder(
      supabase,
      orderId,
      `Demo checkout · ${orderNumber}`,
    );

    revalidatePath("/shop");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/products");
    revalidatePath("/admin/orders");

    return NextResponse.json({
      demo: true,
      orderNumber,
      orderId,
      url: absoluteUrl(
        `/checkout/success?session_id=demo_${orderNumber}&order=${orderId}`,
      ),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not create test order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
