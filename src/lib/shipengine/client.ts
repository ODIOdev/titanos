import {
  getConfiguredCarrierIds,
  resolveShipFromAddress,
} from "@/lib/shipengine/config";
import { invokeShipEngine } from "@/lib/shipengine/invoke";
import type {
  ShipEngineAddress,
  ShipEngineCarrier,
  ShipEngineDimensions,
  ShipEngineLabelResult,
  ShipEngineRate,
  ShipEngineWeight,
} from "@/lib/shipengine/types";

type CarriersResponse = {
  carriers?: Array<{
    carrier_id: string;
    carrier_code: string;
    account_number?: string | null;
    friendly_name?: string;
    carrier_friendly_name?: string;
    nickname?: string;
    primary?: boolean;
  }>;
};

type RatesResponse = {
  rate_response?: {
    rates?: Array<{
      rate_id: string;
      carrier_id: string;
      carrier_code: string;
      carrier_friendly_name?: string;
      service_code: string;
      service_type?: string;
      shipping_amount?: { amount?: number; currency?: string };
      confirmation_amount?: { amount?: number };
      insurance_amount?: { amount?: number };
      other_amount?: { amount?: number };
      delivery_days?: number | null;
    }>;
    errors?: Array<{ message?: string }>;
  };
  errors?: Array<{ message?: string }>;
};

type LabelResponse = {
  label_id?: string;
  shipment_id?: string;
  tracking_number?: string;
  shipment_cost?: { amount?: number };
  carrier_code?: string;
  service_code?: string;
  label_download?: {
    pdf?: string;
    href?: string;
  };
  label_data?: string;
  errors?: Array<{ message?: string }>;
};

function firstError(
  ...sources: Array<Array<{ message?: string }> | undefined>
): string | null {
  for (const list of sources) {
    const msg = list?.[0]?.message;
    if (msg) return msg;
  }
  return null;
}

/** International-only / wallet carriers that often error on domestic US parcels. */
const INTERNATIONAL_CARRIER_CODES = new Set([
  "globalpost",
  "globalpost_walleted",
  "access_worldwide",
  "apc",
  "asendia",
  "dhl_ecommerce",
  "dhl_express",
  "dhl_express_australia",
  "dhl_express_canada",
  "dhl_express_uk",
  "rr_donnelley",
]);

function isDomesticUsShipment(
  shipFrom: ShipEngineAddress,
  shipTo: ShipEngineAddress,
) {
  const from = (shipFrom.country_code || "US").toUpperCase();
  const to = (shipTo.country_code || "US").toUpperCase();
  return from === "US" && to === "US";
}

function filterCarrierIdsForShipment(input: {
  carrierIds: string[];
  carriers?: ShipEngineCarrier[];
  shipFrom: ShipEngineAddress;
  shipTo: ShipEngineAddress;
}): string[] {
  if (!isDomesticUsShipment(input.shipFrom, input.shipTo)) {
    return input.carrierIds;
  }
  const byId = new Map(
    (input.carriers ?? []).map((c) => [c.carrier_id, c.carrier_code]),
  );
  return input.carrierIds.filter((id) => {
    const code = (byId.get(id) || id).toLowerCase();
    // Pinned GlobalPost id even when list metadata is missing
    if (id === "se-6567512") return false;
    return !INTERNATIONAL_CARRIER_CODES.has(code);
  });
}

export async function listShipEngineCarriers(): Promise<ShipEngineCarrier[]> {
  let listed: ShipEngineCarrier[] = [];
  try {
    const { data } = await invokeShipEngine<CarriersResponse>({
      action: "/carriers",
      method: "GET",
    });
    listed = (data.carriers ?? []).map((c) => ({
      carrier_id: c.carrier_id,
      carrier_code: c.carrier_code,
      account_number: c.account_number ?? null,
      name:
        c.friendly_name ||
        c.carrier_friendly_name ||
        c.nickname ||
        c.carrier_code,
      friendly_name: c.friendly_name || c.carrier_friendly_name,
      primary: Boolean(c.primary),
    }));
  } catch {
    // Prefer configured IDs below when the carriers endpoint is unavailable.
  }

  const preferred = getConfiguredCarrierIds();
  if (preferred.length === 0) return listed;

  const byId = new Map(listed.map((c) => [c.carrier_id, c]));
  return preferred.map(
    (id) =>
      byId.get(id) ?? {
        carrier_id: id,
        carrier_code: id,
        account_number: null,
        name: id,
        friendly_name: id,
        primary: false,
      },
  );
}

export async function getShipEngineRates(input: {
  carrierIds: string[];
  shipTo: ShipEngineAddress;
  shipFrom?: ShipEngineAddress;
  weight: ShipEngineWeight;
  dimensions?: ShipEngineDimensions | null;
}): Promise<ShipEngineRate[]> {
  if (input.carrierIds.length === 0) {
    throw new Error("Connect at least one carrier in ShipEngine / ShipStation.");
  }

  const shipFrom = input.shipFrom ?? (await resolveShipFromAddress());
  const carrierIds = filterCarrierIdsForShipment({
    carrierIds: input.carrierIds,
    shipFrom,
    shipTo: input.shipTo,
  });
  if (carrierIds.length === 0) {
    throw new Error(
      "No domestic carriers available for this US shipment (GlobalPost was skipped).",
    );
  }

  const packages: Array<Record<string, unknown>> = [
    {
      weight: input.weight,
      ...(input.dimensions
        ? {
            dimensions: input.dimensions,
          }
        : {}),
    },
  ];

  const { data } = await invokeShipEngine<RatesResponse>({
    action: "/rates",
    method: "POST",
    payload: {
      rate_options: {
        carrier_ids: carrierIds,
        preferred_currency: "usd",
      },
      shipment: {
        validate_address: "no_validation",
        ship_to: input.shipTo,
        ship_from: shipFrom,
        packages,
      },
    },
  });

  const rates = data.rate_response?.rates ?? [];
  const err = firstError(data.rate_response?.errors, data.errors);
  // Carrier-specific errors (e.g. GlobalPost on domestic) should not wipe good rates.
  if (rates.length === 0 && err) throw new Error(err);

  return rates
    .map((rate) => {
      const shipping = Number(rate.shipping_amount?.amount) || 0;
      const confirmation = Number(rate.confirmation_amount?.amount) || 0;
      const insurance = Number(rate.insurance_amount?.amount) || 0;
      const other = Number(rate.other_amount?.amount) || 0;
      return {
        rateId: rate.rate_id,
        carrierId: rate.carrier_id,
        carrierCode: rate.carrier_code,
        carrierFriendlyName:
          rate.carrier_friendly_name || rate.carrier_code || "Carrier",
        serviceCode: rate.service_code,
        serviceType: rate.service_type || rate.service_code,
        totalAmount: shipping + confirmation + insurance + other,
        currency: rate.shipping_amount?.currency || "usd",
        deliveryDays:
          typeof rate.delivery_days === "number" ? rate.delivery_days : null,
      } satisfies ShipEngineRate;
    })
    .sort((a, b) => a.totalAmount - b.totalAmount);
}

export async function createShipEngineLabelFromRate(input: {
  rateId: string;
  labelFormat?: "pdf" | "png" | "zpl";
  labelLayout?: "4x6" | "letter";
}): Promise<ShipEngineLabelResult> {
  const { data } = await invokeShipEngine<LabelResponse>({
    action: `/labels/rates/${encodeURIComponent(input.rateId)}`,
    method: "POST",
    payload: {
      label_format: input.labelFormat ?? "pdf",
      label_layout: input.labelLayout ?? "4x6",
      validate_address: "no_validation",
    },
  });

  const err = firstError(data.errors);
  if (err) throw new Error(err);
  if (!data.label_id) {
    throw new Error("ShipEngine did not return a label.");
  }

  const pdfUrl = data.label_download?.pdf || data.label_download?.href || null;
  const labelPdfDataUrl = data.label_data
    ? `data:application/pdf;base64,${data.label_data}`
    : null;

  if (!pdfUrl && !labelPdfDataUrl) {
    throw new Error("ShipEngine label created but no PDF download was returned.");
  }

  return {
    labelId: data.label_id,
    shipmentId: data.shipment_id || "",
    trackingNumber: data.tracking_number || "",
    shipmentCost: Number(data.shipment_cost?.amount) || 0,
    carrierCode: data.carrier_code || "",
    serviceCode: data.service_code || "",
    labelPdfUrl: pdfUrl,
    labelPdfDataUrl,
  };
}
