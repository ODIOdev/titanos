import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const runtime = "nodejs";

async function markOrderPaid(session: Stripe.Checkout.Session) {
  if (!isSupabaseConfigured()) return;
  const supabase = createServiceClient();
  const sessionId = session.id;

  const { data: existing } = await supabase
    .from("orders")
    .select("id, status, user_id")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (!existing) return;
  if (existing.status === "paid" || existing.status === "processing") return;

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", existing.id);

  await supabase
    .from("orders")
    .update({
      status: "paid",
      payment_status: "paid",
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
    })
    .eq("id", existing.id)
    .eq("status", "pending");

  await supabase.from("order_status_history").insert({
    order_id: existing.id,
    status: "paid",
    notes: "Payment confirmed via Stripe webhook",
  });

  for (const item of items ?? []) {
    if (!item.product_id) continue;
    const { data: product } = await supabase
      .from("products")
      .select("inventory_quantity")
      .eq("id", item.product_id)
      .single();
    if (!product) continue;
    const nextQty = Math.max(0, Number(product.inventory_quantity) - item.quantity);
    await supabase
      .from("products")
      .update({ inventory_quantity: nextQty })
      .eq("id", item.product_id);
    await supabase.from("inventory_movements").insert({
      product_id: item.product_id,
      quantity_change: -item.quantity,
      reason: "sale",
      reference_type: "order",
      reference_id: existing.id,
    });
  }

  if (existing.user_id) {
    const { data: cart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", existing.user_id)
      .maybeSingle();
    if (cart) {
      await supabase.from("cart_items").delete().eq("cart_id", cart.id);
    }
  }
}

async function markOrderExpired(session: Stripe.Checkout.Session) {
  if (!isSupabaseConfigured()) return;
  const supabase = createServiceClient();
  await supabase
    .from("orders")
    .update({ status: "cancelled", payment_status: "expired" })
    .eq("stripe_checkout_session_id", session.id)
    .eq("status", "pending");
}

async function markOrderRefunded(charge: Stripe.Charge) {
  if (!isSupabaseConfigured()) return;
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!paymentIntentId) return;
  const supabase = createServiceClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();
  if (!order) return;
  await supabase
    .from("orders")
    .update({ status: "refunded", payment_status: "refunded" })
    .eq("id", order.id);
  await supabase.from("order_status_history").insert({
    order_id: order.id,
    status: "refunded",
    notes: "Charge refunded via Stripe",
  });
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing webhook signature" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await markOrderPaid(event.data.object as Stripe.Checkout.Session);
      break;
    case "checkout.session.expired":
      await markOrderExpired(event.data.object as Stripe.Checkout.Session);
      break;
    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      if (isSupabaseConfigured()) {
        const supabase = createServiceClient();
        await supabase
          .from("orders")
          .update({ payment_status: "failed" })
          .eq("stripe_payment_intent_id", pi.id);
      }
      break;
    }
    case "charge.refunded":
      await markOrderRefunded(event.data.object as Stripe.Charge);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
