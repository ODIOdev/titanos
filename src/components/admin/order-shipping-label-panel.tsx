"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  Loader2,
  Package,
  Plus,
  Printer,
  Sparkles,
  Truck,
  Zap,
} from "lucide-react";
import {
  buyCheapestShipEngineLabel,
  createAndPrintShipEngineLabel,
  fetchShipEngineCarriers,
  fetchShipEngineRates,
  getShipEngineStatus,
  syncOrderShippingFromRate,
} from "@/lib/actions/shipengine";
import {
  getOrderRememberedPackage,
  listShippingBoxPresets,
  saveShippingBoxPreset,
} from "@/lib/actions/shipping-packaging";
import type {
  ShipEngineCarrier,
  ShipEngineRate,
} from "@/lib/shipengine/types";
import {
  formatPackageLabel,
  type ShippingBoxPreset,
} from "@/lib/shipping/packaging";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";

export type OrderShipToAddress = {
  firstName?: string;
  lastName?: string;
  company?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
};

type CreatedLabel = {
  trackingNumber: string;
  shipmentCost: number;
  labelId: string;
  labelOpenUrl: string;
  serviceCode: string;
  carrierCode: string;
};

function openLabel(url: string) {
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened && url.startsWith("data:")) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "shipping-label.pdf";
    anchor.click();
  } else if (!opened) {
    toast.message("Allow pop-ups to print the label, or tap Print again.");
  }
}

export function OrderShippingLabelPanel({
  orderId,
  orderNumber,
  itemCount,
  shipTo,
  orderLines = [],
  className,
  compact = false,
  autoShopRates = true,
}: {
  orderId: string;
  orderNumber: string;
  itemCount: number;
  shipTo: OrderShipToAddress | null;
  /** Line products — used to restore + remember packaging. */
  orderLines?: Array<{ productId: string | null; quantity: number }>;
  className?: string;
  /** Nested inside the Shipped stage card. */
  compact?: boolean;
  autoShopRates?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [shipFromLabel, setShipFromLabel] = useState("");
  const [carriers, setCarriers] = useState<ShipEngineCarrier[]>([]);
  const [pounds, setPounds] = useState(String(Math.max(1, itemCount)));
  const [ounces, setOunces] = useState("0");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [residential, setResidential] = useState(true);
  const [rates, setRates] = useState<ShipEngineRate[]>([]);
  const [selectedRateId, setSelectedRateId] = useState("");
  const [label, setLabel] = useState<CreatedLabel | null>(null);
  const [markShipped, setMarkShipped] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [presets, setPresets] = useState<ShippingBoxPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [addingBox, setAddingBox] = useState(false);
  const [newBoxName, setNewBoxName] = useState("");
  const [packagingHint, setPackagingHint] = useState<string | null>(null);

  const productIds = [
    ...new Set(
      orderLines
        .map((line) => line.productId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const destinationReady = Boolean(
    shipTo?.line1?.trim() &&
      shipTo?.postalCode?.trim() &&
      shipTo?.city?.trim() &&
      shipTo?.state?.trim(),
  );
  const shipToName = [shipTo?.firstName, shipTo?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const carrierIds = carriers.map((c) => c.carrier_id);
  const selectedRate =
    rates.find((r) => r.rateId === selectedRateId) ?? rates[0] ?? null;

  function applyPackage(dims: {
    pounds: number;
    ounces: number;
    length: number;
    width: number;
    height: number;
  }) {
    setPounds(String(dims.pounds));
    setOunces(String(dims.ounces));
    setLength(dims.length > 0 ? String(dims.length) : "");
    setWidth(dims.width > 0 ? String(dims.width) : "");
    setHeight(dims.height > 0 ? String(dims.height) : "");
  }

  function packagePayload() {
    return {
      pounds: Number(pounds) || 0,
      ounces: Number(ounces) || 0,
      length: length ? Number(length) : undefined,
      width: width ? Number(width) : undefined,
      height: height ? Number(height) : undefined,
    };
  }

  function rememberPayload() {
    const pkg = packagePayload();
    return {
      productIds,
      pounds: pkg.pounds,
      ounces: pkg.ounces,
      length: pkg.length,
      width: pkg.width,
      height: pkg.height,
      presetId: selectedPresetId || null,
    };
  }

  function shipToPayload() {
    return {
      name: shipToName || "Customer",
      company: shipTo?.company,
      street1: shipTo?.line1,
      street2: shipTo?.line2,
      city: shipTo?.city,
      state: shipTo?.state,
      postalCode: shipTo?.postalCode || "",
      country: shipTo?.country || "US",
      phone: shipTo?.phone,
      residential,
    };
  }

  async function applyRateShipping(rate: ShipEngineRate) {
    setSelectedRateId(rate.rateId);
    const result = await syncOrderShippingFromRate({
      orderId,
      carrierCost: rate.totalAmount,
      carrierCode: rate.carrierCode,
      serviceCode: rate.serviceCode,
    });
    if (!result.success) {
      toast.error(result.message);
      return false;
    }
    router.refresh();
    return true;
  }

  function shopRates(
    nextCarriers?: ShipEngineCarrier[],
    overridePkg?: ReturnType<typeof packagePayload>,
  ) {
    const ids = (nextCarriers ?? carriers).map((c) => c.carrier_id);
    if (!ids.length) {
      toast.error("No carriers connected in ShipEngine.");
      return;
    }
    if (!destinationReady) {
      toast.error("Complete the ship-to address first.");
      return;
    }
    startTransition(async () => {
      setRates([]);
      setSelectedRateId("");
      const result = await fetchShipEngineRates({
        carrierIds: ids,
        to: shipToPayload(),
        ...(overridePkg ?? packagePayload()),
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      const nextRates = result.data ?? [];
      setRates(nextRates);
      if (nextRates[0]) await applyRateShipping(nextRates[0]);
      if (nextRates.length === 0) {
        toast.message(result.message);
      }
    });
  }

  function applyPreset(presetId: string) {
    setSelectedPresetId(presetId);
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;
    applyPackage(preset);
    setPackagingHint(`Preset · ${preset.name}`);
  }

  function saveNewBox() {
    startTransition(async () => {
      const result = await saveShippingBoxPreset({
        name: newBoxName,
        ...packagePayload(),
        length: Number(length) || 0,
        width: Number(width) || 0,
        height: Number(height) || 0,
      });
      if (!result.success || !result.data) {
        toast.error(result.message);
        return;
      }
      setPresets(result.data);
      const created = result.data[result.data.length - 1];
      if (created) {
        setSelectedPresetId(created.id);
        setPackagingHint(`Preset · ${created.name}`);
      }
      setAddingBox(false);
      setNewBoxName("");
      toast.success(result.message);
    });
  }

  useEffect(() => {
    let cancelled = false;
    startTransition(async () => {
      const [status, presetResult, remembered] = await Promise.all([
        getShipEngineStatus(),
        listShippingBoxPresets(),
        getOrderRememberedPackage({
          lines: orderLines,
          fallbackItemCount: itemCount,
        }),
      ]);
      if (cancelled) return;

      if (presetResult.success && presetResult.data) {
        setPresets(presetResult.data);
      }

      let pkgForRates = {
        pounds: Math.max(1, itemCount),
        ounces: 0,
        length: undefined as number | undefined,
        width: undefined as number | undefined,
        height: undefined as number | undefined,
      };

      if (remembered.success && remembered.data?.package) {
        const pkg = remembered.data.package;
        applyPackage(pkg);
        setPackagingHint(
          `Remembered from past shipments · ${formatPackageLabel(pkg)}`,
        );
        pkgForRates = {
          pounds: pkg.pounds || Math.max(1, itemCount),
          ounces: pkg.ounces,
          length: pkg.length || undefined,
          width: pkg.width || undefined,
          height: pkg.height || undefined,
        };
        if (presetResult.data) {
          const match = presetResult.data.find(
            (p) =>
              p.length === pkg.length &&
              p.width === pkg.width &&
              p.height === pkg.height &&
              p.pounds === pkg.pounds &&
              p.ounces === pkg.ounces,
          );
          if (match) setSelectedPresetId(match.id);
        }
      }

      if (!status.success || !status.data) {
        setConfigured(false);
        return;
      }
      setConfigured(status.data.configured);
      const from = status.data.shipFrom;
      setShipFromLabel(
        `${from.city_locality}, ${from.state_province} ${from.postal_code}`.trim(),
      );
      if (!status.data.configured) return;

      const carrierResult = await fetchShipEngineCarriers();
      if (cancelled) return;
      if (!carrierResult.success || !carrierResult.data) {
        toast.error(carrierResult.message);
        return;
      }
      setCarriers(carrierResult.data);
      if (
        autoShopRates &&
        destinationReady &&
        carrierResult.data.length > 0
      ) {
        const ids = carrierResult.data.map((c) => c.carrier_id);
        const result = await fetchShipEngineRates({
          carrierIds: ids,
          to: {
            name: shipToName || "Customer",
            company: shipTo?.company,
            street1: shipTo?.line1,
            street2: shipTo?.line2,
            city: shipTo?.city,
            state: shipTo?.state,
            postalCode: shipTo?.postalCode || "",
            country: shipTo?.country || "US",
            phone: shipTo?.phone,
            residential: true,
          },
          ...pkgForRates,
        });
        if (cancelled) return;
        if (result.success && result.data) {
          setRates(result.data);
          if (result.data[0]) await applyRateShipping(result.data[0]);
        }
      }
    });
    return () => {
      cancelled = true;
    };
    // Intentionally once on mount for this order context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  function printSelected() {
    if (!selectedRate) {
      toast.error("Shop rates first.");
      return;
    }
    startTransition(async () => {
      const result = await createAndPrintShipEngineLabel({
        orderId,
        orderNumber,
        rateId: selectedRate.rateId,
        markShipped,
        rememberPackage: rememberPayload(),
      });
      if (!result.success || !result.data) {
        toast.error(result.message);
        return;
      }
      const created: CreatedLabel = {
        trackingNumber: result.data.trackingNumber,
        shipmentCost: result.data.shipmentCost,
        labelId: result.data.labelId,
        labelOpenUrl: result.data.labelOpenUrl,
        serviceCode: result.data.serviceCode,
        carrierCode: result.data.carrierCode,
      };
      setLabel(created);
      openLabel(created.labelOpenUrl);
      toast.success(result.message);
      router.refresh();
    });
  }

  function printCheapest() {
    if (!carrierIds.length) {
      toast.error("No carriers connected.");
      return;
    }
    if (!destinationReady) {
      toast.error("Complete the ship-to address first.");
      return;
    }
    startTransition(async () => {
      const result = await buyCheapestShipEngineLabel({
        orderId,
        orderNumber,
        carrierIds,
        to: shipToPayload(),
        ...packagePayload(),
        markShipped,
        rememberPackage: rememberPayload(),
      });
      if (!result.success || !result.data) {
        toast.error(result.message);
        return;
      }
      setRates([result.data.rate, ...rates.filter((r) => r.rateId !== result.data!.rate.rateId)]);
      setSelectedRateId(result.data.rate.rateId);
      const created: CreatedLabel = {
        trackingNumber: result.data.trackingNumber,
        shipmentCost: result.data.shipmentCost,
        labelId: result.data.labelId,
        labelOpenUrl: result.data.labelOpenUrl,
        serviceCode: result.data.serviceCode,
        carrierCode: result.data.carrierCode,
      };
      setLabel(created);
      openLabel(created.labelOpenUrl);
      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <section
      id="shipstation-label"
      className={cn(
        "overflow-hidden rounded-sm border border-sky-200/90",
        "bg-[linear-gradient(165deg,#f0f9ff_0%,#ffffff_52%)]",
        compact && "border-sky-200 bg-[linear-gradient(165deg,#e0f2fe_0%,#ffffff_70%)]",
        className,
      )}
    >
      <div
        className={cn(
          "border-b border-sky-200/80 px-4 py-3 @5xl:px-5",
          compact && "px-3 py-2.5",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-sky-800">
              ShipStation · ShipEngine
            </p>
            <h3
              className={cn(
                "font-heading font-semibold uppercase tracking-wide text-dark-charcoal",
                compact ? "text-xs" : "text-sm @5xl:text-base",
              )}
            >
              {compact ? "Label desk" : "Rate · buy · print"}
            </h3>
            {!compact ? (
              <p className="mt-1 text-xs text-medium-gray">
                {shipFromLabel
                  ? `From ${shipFromLabel}`
                  : "Warehouse origin"}
                {shipTo?.postalCode ? ` → ${shipTo.postalCode}` : ""}
                {" · "}
                via Supabase Edge
              </p>
            ) : null}
          </div>
          <Truck
            className={cn(
              "shrink-0 text-sky-600",
              compact ? "size-4" : "size-5",
            )}
            aria-hidden="true"
          />
        </div>
      </div>

      <div className={cn("space-y-3", compact ? "px-3 py-3" : "space-y-4 px-4 py-4 @5xl:px-5")}>
        {configured === false ? (
          <div className="rounded-sm border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-relaxed text-amber-950">
            <p className="font-medium">ShipEngine API key missing</p>
            <p className="mt-1 text-amber-900/80">
              Add your key to{" "}
              <code className="text-[0.65rem]">.env.local</code>:
            </p>
            <pre className="mt-2 overflow-x-auto rounded-sm bg-white/80 px-2 py-1.5 text-[0.65rem] text-dark-charcoal">
              {`SHIPENGINE_API_KEY=your_shipengine_key`}
            </pre>
            <p className="mt-2 text-amber-900/80">
              Get it from ShipStation → API → API Keys (ShipEngine). Then
              restart <code className="text-[0.65rem]">next dev</code>.
            </p>
          </div>
        ) : null}

        {!destinationReady ? (
          <div className="rounded-sm border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
            Add a complete ship-to address to unlock rates and labels.
          </div>
        ) : null}

        {/* Effortless primary action */}
        <div className="space-y-2">
          <Button
            type="button"
            className="w-full gap-2 bg-sky-700 text-white hover:bg-sky-800"
            disabled={
              pending ||
              configured === false ||
              !destinationReady ||
              carrierIds.length === 0
            }
            onClick={printCheapest}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Zap className="size-4" aria-hidden="true" />
            )}
            {pending ? "Working…" : "Buy cheapest & print"}
          </Button>
          <p className="text-[0.65rem] leading-snug text-medium-gray">
            Rates all connected carriers, buys the lowest, opens the PDF
            {markShipped ? ", marks shipped" : ""}.
          </p>
          <Checkbox
            label="Mark shipped after label"
            checked={markShipped}
            onChange={(e) => setMarkShipped(e.target.checked)}
            disabled={pending || configured === false}
          />
        </div>

        {label ? (
          <div className="rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-950">
            <p className="font-medium">
              Label ready
              {label.trackingNumber ? ` · ${label.trackingNumber}` : ""}
            </p>
            <p className="mt-0.5 text-xs text-emerald-800/80">
              {label.carrierCode}/{label.serviceCode} ·{" "}
              {formatCurrency(label.shipmentCost)} · {label.labelId}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 gap-1.5 border-emerald-300 bg-white"
              onClick={() => openLabel(label.labelOpenUrl)}
            >
              <Printer className="size-3.5" aria-hidden="true" />
              Print again
            </Button>
          </div>
        ) : null}

        {/* Package + rates (collapsible advanced in compact) */}
        {compact ? (
          <button
            type="button"
            className="text-[0.65rem] font-semibold uppercase tracking-wide text-sky-800 underline-offset-2 hover:underline"
            onClick={() => setAdvancedOpen((v) => !v)}
          >
            {advancedOpen ? "Hide package & rates" : "Adjust package & pick rate"}
          </button>
        ) : null}

        {(!compact || advancedOpen) && (
          <div className="space-y-3 border-t border-sky-100 pt-3">
            <div className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-wide text-medium-gray">
              <Package className="size-3.5" aria-hidden="true" />
              Package
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Weight (lb)"
                type="number"
                min={0}
                step={1}
                value={pounds}
                onChange={(e) => {
                  setPounds(e.target.value);
                  setSelectedPresetId("");
                }}
                disabled={pending || configured === false}
              />
              <Input
                label="Ounces"
                type="number"
                min={0}
                max={15}
                step={1}
                value={ounces}
                onChange={(e) => {
                  setOunces(e.target.value);
                  setSelectedPresetId("");
                }}
                disabled={pending || configured === false}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input
                label="L"
                type="number"
                min={0}
                step={0.1}
                value={length}
                onChange={(e) => {
                  setLength(e.target.value);
                  setSelectedPresetId("");
                  setPackagingHint(null);
                }}
                disabled={pending || configured === false}
                placeholder="in"
              />
              <Input
                label="W"
                type="number"
                min={0}
                step={0.1}
                value={width}
                onChange={(e) => {
                  setWidth(e.target.value);
                  setSelectedPresetId("");
                  setPackagingHint(null);
                }}
                disabled={pending || configured === false}
                placeholder="in"
              />
              <Input
                label="H"
                type="number"
                min={0}
                step={0.1}
                value={height}
                onChange={(e) => {
                  setHeight(e.target.value);
                  setSelectedPresetId("");
                  setPackagingHint(null);
                }}
                disabled={pending || configured === false}
                placeholder="in"
              />
            </div>

            <div className="space-y-2">
              <Select
                label="Box preset"
                value={selectedPresetId}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) {
                    setSelectedPresetId("");
                    return;
                  }
                  applyPreset(value);
                }}
                disabled={pending || configured === false || presets.length === 0}
                placeholder="Custom / choose a saved box"
                options={[
                  { value: "", label: "Custom dimensions" },
                  ...presets.map((preset) => ({
                    value: preset.id,
                    label: `${preset.name} · ${preset.length}×${preset.width}×${preset.height}`,
                  })),
                ]}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={pending || configured === false}
                  onClick={() => {
                    setAddingBox((open) => !open);
                    if (!addingBox) setNewBoxName("");
                  }}
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Add box
                </Button>
                {packagingHint ? (
                  <p className="min-w-0 flex-1 text-[0.65rem] leading-snug text-sky-800">
                    {packagingHint}
                  </p>
                ) : (
                  <p className="min-w-0 flex-1 text-[0.65rem] leading-snug text-medium-gray">
                    Saves named L×W×H for reuse. Product packaging is remembered
                    after each label.
                  </p>
                )}
              </div>
              {addingBox ? (
                <div className="rounded-sm border border-sky-200 bg-sky-50/70 p-2.5 space-y-2">
                  <Input
                    label="Box name"
                    value={newBoxName}
                    onChange={(e) => setNewBoxName(e.target.value)}
                    placeholder="e.g. Hard hat carton"
                    disabled={pending}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1"
                      disabled={pending || !newBoxName.trim()}
                      onClick={saveNewBox}
                    >
                      Save preset
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        setAddingBox(false);
                        setNewBoxName("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
            <Checkbox
              label="Residential delivery"
              checked={residential}
              onChange={(e) => setResidential(e.target.checked)}
              disabled={pending || configured === false}
            />

            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-wide text-medium-gray">
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  Rates
                </div>
                {carrierIds.length > 0 ? (
                  <p className="mt-0.5 truncate text-[0.6rem] tabular-nums text-medium-gray/80">
                    {carrierIds.length} carrier
                    {carrierIds.length === 1 ? "" : "s"} ·{" "}
                    {carrierIds.join(" · ")}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending || configured === false || !destinationReady}
                onClick={() => shopRates()}
              >
                Refresh
              </Button>
            </div>

            {rates.length === 0 ? (
              <p className="rounded-sm border border-dashed border-border-gray bg-white/70 px-3 py-3 text-xs text-medium-gray">
                {pending
                  ? "Shopping rates…"
                  : "Rates appear here after refresh or auto-shop."}
              </p>
            ) : (
              <ul className="max-h-48 space-y-1.5 overflow-y-auto">
                {rates.map((rate) => {
                  const selected = selectedRateId === rate.rateId;
                  return (
                    <li key={rate.rateId}>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          startTransition(async () => {
                            await applyRateShipping(rate);
                          });
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-sm border px-3 py-2 text-left transition-colors",
                          selected
                            ? "border-sky-500 bg-sky-50"
                            : "border-border-gray bg-white hover:border-sky-200",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-dark-charcoal">
                            {rate.serviceType}
                          </span>
                          <span className="text-[0.65rem] text-medium-gray">
                            {rate.carrierFriendlyName}
                            {rate.deliveryDays != null
                              ? ` · ~${rate.deliveryDays}d`
                              : ""}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="tabular-nums text-sm font-semibold">
                            {formatCurrency(rate.totalAmount)}
                          </span>
                          {selected ? (
                            <Check
                              className="size-4 text-sky-600"
                              aria-hidden="true"
                            />
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              disabled={
                pending ||
                configured === false ||
                !selectedRate ||
                !destinationReady
              }
              onClick={printSelected}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Printer className="size-4" aria-hidden="true" />
              )}
              Print selected rate
              {selectedRate
                ? ` · ${formatCurrency(selectedRate.totalAmount)}`
                : ""}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

/** @deprecated Use OrderShippingLabelPanel */
export const OrderShipStationPanel = OrderShippingLabelPanel;
