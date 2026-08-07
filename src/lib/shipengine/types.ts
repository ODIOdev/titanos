/** ShipEngine (ShipStation API) types for admin label rate / print. */

export type ShipEngineWeight = {
  value: number;
  unit: "ounce" | "pound" | "gram" | "kilogram";
};

export type ShipEngineDimensions = {
  length: number;
  width: number;
  height: number;
  unit: "inch" | "centimeter";
};

export type ShipEngineAddress = {
  name: string;
  company_name?: string | null;
  phone?: string | null;
  address_line1: string;
  address_line2?: string | null;
  city_locality: string;
  state_province: string;
  postal_code: string;
  country_code: string;
  address_residential_indicator?: "yes" | "no" | "unknown";
};

export type ShipEngineCarrier = {
  carrier_id: string;
  carrier_code: string;
  account_number?: string | null;
  name: string;
  friendly_name?: string;
  primary?: boolean;
};

export type ShipEngineRate = {
  rateId: string;
  carrierId: string;
  carrierCode: string;
  carrierFriendlyName: string;
  serviceCode: string;
  serviceType: string;
  totalAmount: number;
  currency: string;
  deliveryDays: number | null;
};

export type ShipEngineLabelResult = {
  labelId: string;
  shipmentId: string;
  trackingNumber: string;
  shipmentCost: number;
  carrierCode: string;
  serviceCode: string;
  /** Absolute URL to PDF (preferred). */
  labelPdfUrl: string | null;
  /** data: URL fallback when PDF bytes are available. */
  labelPdfDataUrl: string | null;
};
