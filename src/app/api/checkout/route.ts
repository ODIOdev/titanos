import { NextResponse } from "next/server";
import {
  computeCheckoutTotals,
  orderItemOptionsFromLine,
  resolveCheckoutLineItems,
} from "@/lib/checkout/pricing";
import { absoluteUrl, generateOrderNumber } from "@/lib/utils";
import { checkoutSchema } from "@/lib/validations";
import { isStripeConfigured, getStripe } from "@/lib/stripe";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid checkout payload" },
      { status: 400 },
    );
  }

  const uiMode = parsed.data.uiMode ?? "embedded";
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
  const email = parsed.data.email ?? "guest@titansafetyco.com";

  // No real Stripe keys → local test checkout (address + card form). Do not
  // create an order yet; /api/checkout/demo creates a paid order on submit.
  if (!isStripeConfigured()) {
    return NextResponse.json({
      demo: true,
      orderNumberPreview: orderNumber,
      totals: { subtotal, shippingAmount, taxAmount, total },
    });
  }

  let orderId: string | null = null;

  if (isSupabaseConfigured()) {
    try {
      const { createServiceClient } = await import("@/lib/supabase/admin");
      const supabase = createServiceClient();
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          email,
          status: "pending",
          payment_status: "pending",
          fulfillment_status: "unfulfilled",
          subtotal,
          shipping_amount: shippingAmount,
          tax_amount: taxAmount,
          discount_amount: 0,
          total,
          currency: "USD",
        } as never)
        .select("id")
        .single();

      if (!error && order) {
        orderId = (order as { id: string }).id;
        await supabase.from("order_items").insert(
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
      }
    } catch {
      // Continue without persisted order
    }
  }

  try {
    const stripe = getStripe();
    const stripeLineItems = [
      ...lineItems.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(item.unitPrice * 100),
          product_data: {
            name: item.name,
            metadata: { sku: item.sku, productId: item.productId },
            images: item.imageUrl ? [absoluteUrl(item.imageUrl)] : undefined,
          },
        },
      })),
      ...(shippingAmount > 0
        ? [
            {
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: Math.round(shippingAmount * 100),
                product_data: { name: "Standard shipping" },
              },
            },
          ]
        : []),
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(taxAmount * 100),
          product_data: { name: "Estimated tax" },
        },
      },
    ];

    const shared = {
      mode: "payment" as const,
      line_items: stripeLineItems,
      customer_email: parsed.data.email,
      shipping_address_collection: {
        allowed_countries: ["US" as const],
      },
      billing_address_collection: "required" as const,
      phone_number_collection: { enabled: true },
      payment_method_types: ["card", "link"] as ("card" | "link")[],
      metadata: {
        orderNumber,
        orderId: orderId ?? "",
      },
    };

    const session =
      uiMode === "hosted"
        ? await stripe.checkout.sessions.create({
            ...shared,
            success_url: absoluteUrl(
              `/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            ),
            cancel_url: absoluteUrl("/checkout/cancel"),
          })
        : await stripe.checkout.sessions.create({
            ...shared,
            ui_mode: "embedded",
            return_url: absoluteUrl(
              `/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            ),
          });

    if (orderId && isSupabaseConfigured() && session.id) {
      try {
        const { createServiceClient } = await import("@/lib/supabase/admin");
        const supabase = createServiceClient();
        await supabase
          .from("orders")
          .update({ stripe_checkout_session_id: session.id } as never)
          .eq("id", orderId);
      } catch {
        // Non-fatal
      }
    }

    if (uiMode === "hosted") {
      if (!session.url) {
        return NextResponse.json(
          { error: "Stripe did not return a checkout URL" },
          { status: 500 },
        );
      }
      return NextResponse.json({ url: session.url, orderNumber });
    }

    if (!session.client_secret) {
      return NextResponse.json(
        { error: "Stripe did not return a client secret" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      clientSecret: session.client_secret,
      orderNumber,
      sessionId: session.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Stripe checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
