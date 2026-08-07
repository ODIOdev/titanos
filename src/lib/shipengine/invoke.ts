import { isShipEngineDirectConfigured } from "@/lib/shipengine/config";

type InvokeInput = {
  action: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  payload?: unknown;
};

function missingKeyHint(edgeDetail?: string | null) {
  const base =
    "Set SHIPENGINE_API_KEY in .env.local (ShipEngine / ShipStation API key), then restart next dev.";
  if (edgeDetail) return `${edgeDetail} ${base}`;
  return base;
}

/**
 * Call ShipEngine via Supabase Edge Function when available, with direct
 * API fallback when SHIPENGINE_API_KEY is set on Vercel/.env.local.
 *
 * Locally, prefer direct when a key is present so undeployed edge functions
 * do not block rate shopping.
 */
export async function invokeShipEngine<T = unknown>(
  input: InvokeInput,
): Promise<{ data: T; via: "edge" | "direct" }> {
  const action = input.action.startsWith("/")
    ? input.action
    : `/${input.action}`;
  const method = (input.method ?? "POST").toUpperCase() as InvokeInput["method"];
  const preferDirect = isShipEngineDirectConfigured();

  let edgeError: string | null = null;

  if (!preferDirect) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data, error } = await supabase.functions.invoke("shipengine", {
        body: {
          action,
          method,
          payload: input.payload,
        },
      });

      if (!error) {
        if (
          data &&
          typeof data === "object" &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string" &&
          !("rate_response" in data) &&
          !("carriers" in data) &&
          !("label_id" in data)
        ) {
          throw new Error((data as { error: string }).error);
        }
        return { data: data as T, via: "edge" };
      }

      const detail =
        data &&
        typeof data === "object" &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : error.message || "Edge function invoke failed";
      edgeError = detail;
    } catch (err) {
      edgeError =
        err instanceof Error
          ? err.message
          : edgeError || "ShipEngine edge invoke failed.";
    }

    throw new Error(missingKeyHint(edgeError));
  }

  const apiKey = process.env.SHIPENGINE_API_KEY!.trim();
  const response = await fetch(`https://api.shipengine.com/v1${action}`, {
    method,
    headers: {
      "API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body:
      method === "GET" || input.payload === undefined
        ? undefined
        : JSON.stringify(input.payload),
    cache: "no-store",
  });

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "errors" in data &&
      Array.isArray((data as { errors: unknown }).errors) &&
      (data as { errors: Array<{ message?: string }> }).errors[0]?.message
        ? (data as { errors: Array<{ message?: string }> }).errors[0]!.message!
        : data &&
            typeof data === "object" &&
            "message" in data &&
            typeof (data as { message: unknown }).message === "string"
          ? (data as { message: string }).message
          : `ShipEngine error ${response.status}`;
    throw new Error(message);
  }

  return { data: data as T, via: "direct" };
}
