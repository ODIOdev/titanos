import { NextResponse } from "next/server";
import { getProductById } from "@/lib/data/products";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/data/seed-data";
import { absoluteUrl, generateOrderNumber } from "@/lib/utils";
import { checkoutSchema } from "@/lib/validations";
import { isStripeConfigured, getStripe } from "@/lib/stripe";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const STANDARD_SHIPPING = 12.99;
const TAX_RATE = 0.08;

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

  const lineItems: {
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    imageUrl: string | null;
  }[] = [];

  for (const item of parsed.data.items) {
    const product = await getProductById(item.productId);
    if (!product || !product.active) {
      return NextResponse.json(
        { error: `Product not found: ${item.productId}` },
        { status: 400 },
      );
    }
    if (product.inventory_quantity < item.quantity) {
      return NextResponse.json(
        { error: `Insufficient stock for ${product.name}` },
        { status: 400 },
      );
    }

    const unitPrice = Number(product.price);
    lineItems.push({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      quantity: item.quantity,
      unitPrice,
      totalPrice: unitPrice * item.quantity,
      imageUrl:
        product.image_url ??
        product.images?.find((img) => img.is_primary)?.url ??
        product.images?.[0]?.url ??
        null,
    });
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const shippingAmount =
    subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
  const taxAmount = Number((subtotal * TAX_RATE).toFixed(2));
  const total = Number((subtotal + shippingAmount + taxAmount).toFixed(2));
  const orderNumber = generateOrderNumber();
  const email = parsed.data.email ?? "guest@titansafetyco.com";

  let orderId: string | null = null;

  if (isSupabaseConfigured()) {
    try {
      const { createServiceClient } = await import("@/lib/supabase/admin");
      const supabase = createServiceClient();
      // Database Insert typings are incomplete in local schema stubs.
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
          })) as never,
        );
      }
    } catch {
      // Continue without persisted order
    }
  }

  if (isStripeConfigured()) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: absoluteUrl(
          `/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        ),
        cancel_url: absoluteUrl("/checkout/cancel"),
        customer_email: parsed.data.email,
        line_items: [
          ...lineItems.map((item) => ({
            quantity: item.quantity,
            price_data: {
              currency: "usd",
              unit_amount: Math.round(item.unitPrice * 100),
              product_data: {
                name: item.name,
                metadata: { sku: item.sku, productId: item.productId },
                images: item.imageUrl
                  ? [absoluteUrl(item.imageUrl)]
                  : undefined,
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
        ],
        metadata: {
          orderNumber,
          orderId: orderId ?? "",
        },
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

      if (!session.url) {
        return NextResponse.json(
          { error: "Stripe did not return a checkout URL" },
          { status: 500 },
        );
      }

      return NextResponse.json({ url: session.url, orderNumber });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Stripe checkout failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const demoSessionId = `demo_${orderNumber}`;
  return NextResponse.json({
    url: absoluteUrl(`/checkout/success?session_id=${demoSessionId}`),
    orderNumber,
    demo: true,
  });
}
