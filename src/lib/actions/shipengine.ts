"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  createShipEngineLabelFromRate,
  getShipEngineRates,
  listShipEngineCarriers,
} from "@/lib/shipengine/client";
import {
  isShipEngineConfigured,
  isShipEngineDirectConfigured,
  resolveShipFromAddress,
} from "@/lib/shipengine/config";
import type {
  ShipEngineAddress,
  ShipEngineCarrier,
  ShipEngineDimensions,
  ShipEngineLabelResult,
  ShipEngineRate,
  ShipEngineWeight,
} from "@/lib/shipengine/types";
import { isMasterAdmin, isMasterAdminEmail } from "@/lib/utils";

export type ShipEngineActionResult<T = undefined> = {
  success: boolean;
  message: string;
  data?: T;
};

type AuthGate =
  | { ok: true; userId: string }
  | { ok: false; result: ShipEngineActionResult };

async function requireAdmin(): Promise<AuthGate> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      result: {
        success: false,
        message: "Supabase is not configured. Demo mode cannot persist changes.",
      },
    };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        ok: false,
        result: { success: false, message: "You must be signed in." },
      };
    }

    if (isMasterAdminEmail(user.email)) {
      return { ok: true, userId: user.id };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_owner, email")
      .eq("id", user.id)
      .maybeSingle();

    if (!isMasterAdmin(profile)) {
      return {
        ok: false,
        result: { success: false, message: "Master admin access required." },
      };
    }

    return { ok: true, userId: user.id };
  } catch {
    return {
      ok: false,
      result: { success: false, message: "Unable to verify admin access." },
    };
  }
}

function parseWeight(pounds: number, ounces: number): ShipEngineWeight {
  const totalOz = Math.max(1, Math.round(pounds * 16 + ounces));
  return { value: totalOz, unit: "ounce" };
}

function parseDimensions(input: {
  length?: number;
  width?: number;
  height?: number;
}): ShipEngineDimensions | null {
  const length = Number(input.length) || 0;
  const width = Number(input.width) || 0;
  const height = Number(input.height) || 0;
  if (length <= 0 || width <= 0 || height <= 0) return null;
  return { length, width, height, unit: "inch" };
}

function toShipTo(input: {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  phone?: string;
  residential?: boolean;
}): ShipEngineAddress {
  return {
    name: input.name.trim() || "Customer",
    company_name: input.company?.trim() || null,
    phone: input.phone?.trim() || null,
    address_line1: input.street1.trim(),
    address_line2: input.street2?.trim() || null,
    city_locality: input.city.trim(),
    state_province: input.state.trim(),
    postal_code: input.postalCode.trim(),
    country_code: (input.country?.trim() || "US").toUpperCase(),
    address_residential_indicator: input.residential ? "yes" : "no",
  };
}

export async function getShipEngineStatus(): Promise<
  ShipEngineActionResult<{
    configured: boolean;
    directFallback: boolean;
    shipFrom: ShipEngineAddress;
  }>
> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return { success: false, message: auth.result.message };
  }
  const directFallback = isShipEngineDirectConfigured();
  const shipFrom = await resolveShipFromAddress();
  return {
    success: true,
    message: directFallback
      ? "ShipEngine ready via direct API key."
      : "SHIPENGINE_API_KEY is empty. Paste your ShipEngine API key into .env.local and restart next dev.",
    data: {
      // Local rates need the API key until the edge function is deployed with secrets.
      configured: directFallback,
      directFallback,
      shipFrom,
    },
  };
}

export async function fetchShipEngineCarriers(): Promise<
  ShipEngineActionResult<ShipEngineCarrier[]>
> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return { success: false, message: auth.result.message };
  }
  try {
    const carriers = await listShipEngineCarriers();
    return {
      success: true,
      message: `${carriers.length} carrier${carriers.length === 1 ? "" : "s"} loaded.`,
      data: carriers,
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error
          ? err.message
          : "Failed to load ShipEngine carriers.",
    };
  }
}

export async function fetchShipEngineRates(input: {
  carrierIds: string[];
  to: {
    name?: string;
    company?: string;
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    postalCode: string;
    country?: string;
    phone?: string;
    residential?: boolean;
  };
  pounds: number;
  ounces: number;
  length?: number;
  width?: number;
  height?: number;
}): Promise<ShipEngineActionResult<ShipEngineRate[]>> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return { success: false, message: auth.result.message };
  }
  if (!input.to.postalCode?.trim()) {
    return {
      success: false,
      message: "Destination ZIP is required for rates.",
    };
  }
  if (!input.to.street1?.trim() || !input.to.city?.trim()) {
    return {
      success: false,
      message: "Complete the ship-to address before rate shopping.",
    };
  }

  try {
    const rates = await getShipEngineRates({
      carrierIds: input.carrierIds,
      shipTo: toShipTo({
        name: input.to.name || "Customer",
        company: input.to.company,
        street1: input.to.street1 || "",
        street2: input.to.street2,
        city: input.to.city || "",
        state: input.to.state || "",
        postalCode: input.to.postalCode,
        country: input.to.country,
        phone: input.to.phone,
        residential: input.to.residential,
      }),
      weight: parseWeight(input.pounds, input.ounces),
      dimensions: parseDimensions(input),
    });
    return {
      success: true,
      message:
        rates.length > 0
          ? `${rates.length} rate${rates.length === 1 ? "" : "s"} found.`
          : "No rates returned for this package.",
      data: rates,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to get rates.",
    };
  }
}

export async function createAndPrintShipEngineLabel(input: {
  orderId: string;
  orderNumber: string;
  rateId: string;
  markShipped?: boolean;
  /** Remember this package on order products for repeat shipments. */
  rememberPackage?: {
    productIds: string[];
    pounds: number;
    ounces: number;
    length?: number;
    width?: number;
    height?: number;
    presetId?: string | null;
  };
}): Promise<
  ShipEngineActionResult<
    ShipEngineLabelResult & { labelOpenUrl: string }
  >
> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return { success: false, message: auth.result.message };
  }
  if (!input.rateId) {
    return { success: false, message: "Select a rate first." };
  }

  try {
    const label = await createShipEngineLabelFromRate({
      rateId: input.rateId,
    });

    const openUrl = label.labelPdfUrl || label.labelPdfDataUrl;
    if (!openUrl) {
      return { success: false, message: "Label PDF URL missing." };
    }

    const note = [
      `ShipEngine label ${label.labelId}`,
      label.trackingNumber ? `tracking ${label.trackingNumber}` : null,
      `${label.carrierCode}/${label.serviceCode}`,
      `cost $${label.shipmentCost.toFixed(2)}`,
      `order ${input.orderNumber}`,
    ]
      .filter(Boolean)
      .join(" · ");

    if (isSupabaseConfigured()) {
      const { createServiceClient } = await import("@/lib/supabase/admin");
      const supabase = createServiceClient();
      const { data: existing } = await supabase
        .from("orders")
        .select(
          "internal_notes, billing_address, subtotal, tax_amount, discount_amount",
        )
        .eq("id", input.orderId)
        .maybeSingle();

      const previousNotes =
        typeof existing?.internal_notes === "string"
          ? existing.internal_notes.trim()
          : "";
      const nextNotes = previousNotes ? `${previousNotes}\n${note}` : note;

      const {
        computeLabelShipping,
        computeOrderTotal,
      } = await import("@/lib/shipping/label-fee");
      const shipping = computeLabelShipping(label.shipmentCost);
      const subtotal = Number(existing?.subtotal ?? 0);
      const taxAmount = Number(existing?.tax_amount ?? 0);
      const discountAmount = Number(existing?.discount_amount ?? 0);
      const nextTotal = computeOrderTotal({
        subtotal,
        shippingAmount: shipping.charged,
        taxAmount,
        discountAmount,
      });

      const prevBilling =
        existing?.billing_address &&
        typeof existing.billing_address === "object" &&
        !Array.isArray(existing.billing_address)
          ? (existing.billing_address as Record<string, unknown>)
          : {};

      await supabase
        .from("orders")
        .update({
          internal_notes: nextNotes,
          shipping_amount: shipping.charged,
          total: nextTotal,
          billing_address: {
            ...prevBilling,
            shipping_label: {
              carrier_cost: shipping.carrierCost,
              fee_percent: shipping.feePercent,
              fee_amount: shipping.feeAmount,
              charged: shipping.charged,
              carrier_code: label.carrierCode,
              service_code: label.serviceCode,
              label_id: label.labelId,
              tracking_number: label.trackingNumber || null,
            },
          },
          ...(input.markShipped ? { status: "shipped" as const } : {}),
        })
        .eq("id", input.orderId);

      if (input.markShipped) {
        await supabase.from("order_status_history").insert({
          order_id: input.orderId,
          status: "shipped",
          notes: `${note} · charged $${shipping.charged.toFixed(2)} (label + ${shipping.feePercent}% fee)`,
          created_by: auth.userId,
        });
      }

      if (input.rememberPackage?.productIds?.length) {
        const { rememberProductsShippingPackage } = await import(
          "@/lib/actions/shipping-packaging"
        );
        await rememberProductsShippingPackage({
          productIds: input.rememberPackage.productIds,
          package: {
            pounds: input.rememberPackage.pounds,
            ounces: input.rememberPackage.ounces,
            length: input.rememberPackage.length ?? 0,
            width: input.rememberPackage.width ?? 0,
            height: input.rememberPackage.height ?? 0,
          },
          presetId: input.rememberPackage.presetId,
        });
      }
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${input.orderId}`);

    return {
      success: true,
      message: label.trackingNumber
        ? `Label created · tracking ${label.trackingNumber}`
        : "Label created.",
      data: {
        ...label,
        labelOpenUrl: openUrl,
      },
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error
          ? err.message
          : "Failed to create ShipEngine label.",
    };
  }
}

/** One-tap: shop all carriers, buy cheapest rate, print, optionally mark shipped. */
export async function buyCheapestShipEngineLabel(input: {
  orderId: string;
  orderNumber: string;
  carrierIds: string[];
  to: {
    name?: string;
    company?: string;
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    postalCode: string;
    country?: string;
    phone?: string;
    residential?: boolean;
  };
  pounds: number;
  ounces: number;
  length?: number;
  width?: number;
  height?: number;
  markShipped?: boolean;
  rememberPackage?: {
    productIds: string[];
    pounds: number;
    ounces: number;
    length?: number;
    width?: number;
    height?: number;
    presetId?: string | null;
  };
}): Promise<
  ShipEngineActionResult<
    ShipEngineLabelResult & {
      labelOpenUrl: string;
      rate: ShipEngineRate;
    }
  >
> {
  const ratesResult = await fetchShipEngineRates({
    carrierIds: input.carrierIds,
    to: input.to,
    pounds: input.pounds,
    ounces: input.ounces,
    length: input.length,
    width: input.width,
    height: input.height,
  });
  if (!ratesResult.success || !ratesResult.data?.length) {
    return {
      success: false,
      message: ratesResult.message || "No rates available.",
    };
  }
  const best = ratesResult.data[0]!;
  const labelResult = await createAndPrintShipEngineLabel({
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    rateId: best.rateId,
    markShipped: input.markShipped,
    rememberPackage: input.rememberPackage,
  });
  if (!labelResult.success || !labelResult.data) {
    return {
      success: false,
      message: labelResult.message,
    };
  }
  return {
    success: true,
    message: labelResult.message,
    data: {
      ...labelResult.data,
      rate: best,
    },
  };
}

/** Customer shipping = selected carrier rate + 12% fee; recalculates order total. */
export async function syncOrderShippingFromRate(input: {
  orderId: string;
  carrierCost: number;
  carrierCode?: string;
  serviceCode?: string;
}): Promise<ShipEngineActionResult<{ shippingAmount: number; total: number }>> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return { success: false, message: auth.result.message };
  }
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: "Supabase is not configured.",
    };
  }

  try {
    const { computeLabelShipping, computeOrderTotal } = await import(
      "@/lib/shipping/label-fee"
    );
    const shipping = computeLabelShipping(input.carrierCost);
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const supabase = createServiceClient();
    const { data: existing } = await supabase
      .from("orders")
      .select("billing_address, subtotal, tax_amount, discount_amount")
      .eq("id", input.orderId)
      .maybeSingle();

    if (!existing) {
      return { success: false, message: "Order not found." };
    }

    const nextTotal = computeOrderTotal({
      subtotal: Number(existing.subtotal ?? 0),
      shippingAmount: shipping.charged,
      taxAmount: Number(existing.tax_amount ?? 0),
      discountAmount: Number(existing.discount_amount ?? 0),
    });

    const prevBilling =
      existing.billing_address &&
      typeof existing.billing_address === "object" &&
      !Array.isArray(existing.billing_address)
        ? (existing.billing_address as Record<string, unknown>)
        : {};

    const prevLabel =
      typeof prevBilling.shipping_label === "object" &&
      prevBilling.shipping_label &&
      !Array.isArray(prevBilling.shipping_label)
        ? (prevBilling.shipping_label as Record<string, unknown>)
        : {};

    const { error } = await supabase
      .from("orders")
      .update({
        shipping_amount: shipping.charged,
        total: nextTotal,
        billing_address: {
          ...prevBilling,
          shipping_label: {
            ...prevLabel,
            carrier_cost: shipping.carrierCost,
            fee_percent: shipping.feePercent,
            fee_amount: shipping.feeAmount,
            charged: shipping.charged,
            carrier_code: input.carrierCode ?? null,
            service_code: input.serviceCode ?? null,
          },
        },
      })
      .eq("id", input.orderId);

    if (error) throw error;

    revalidatePath(`/admin/orders/${input.orderId}`);
    revalidatePath("/admin/orders");

    return {
      success: true,
      message: `Shipping set to $${shipping.charged.toFixed(2)} (label + ${shipping.feePercent}% fee).`,
      data: { shippingAmount: shipping.charged, total: nextTotal },
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error
          ? err.message
          : "Failed to update shipping from rate.",
    };
  }
}
