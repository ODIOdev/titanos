// Supabase Edge Function — proxies ShipEngine (ShipStation API) requests.
// API key stays in Supabase secrets — never exposed to the Vercel browser bundle.
//
// SETUP:
//   supabase secrets set SHIPENGINE_API_KEY=your_key_here
//   supabase functions deploy shipengine
//
// Vercel frontend (admin) calls via the user's Supabase session JWT:
//   supabase.functions.invoke('shipengine', {
//     body: { action: '/rates', method: 'POST', payload: {...} }
//   })

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SHIPENGINE_BASE_URL = "https://api.shipengine.com/v1";
const MASTER_ADMIN_EMAIL = (
  Deno.env.get("MASTER_ADMIN_EMAIL") ?? "admin@gmail.com"
)
  .trim()
  .toLowerCase();

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Only shipping endpoints — block arbitrary proxying. */
const ALLOWED_ACTIONS: Array<{ method: string; pattern: RegExp }> = [
  { method: "GET", pattern: /^\/carriers\/?$/ },
  { method: "GET", pattern: /^\/carriers\/[^/]+\/?$/ },
  { method: "POST", pattern: /^\/rates\/?$/ },
  { method: "POST", pattern: /^\/rates\/estimate\/?$/ },
  { method: "POST", pattern: /^\/labels\/?$/ },
  { method: "POST", pattern: /^\/labels\/rates\/[^/]+\/?$/ },
  { method: "POST", pattern: /^\/addresses\/validate\/?$/ },
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function isAllowed(action: string, method: string) {
  const normalized = action.startsWith("/") ? action : `/${action}`;
  return ALLOWED_ACTIONS.some(
    (rule) =>
      rule.method === method.toUpperCase() && rule.pattern.test(normalized),
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const email = (user.email ?? "").trim().toLowerCase();
    let allowed = email === MASTER_ADMIN_EMAIL;

    if (!allowed) {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("role, is_owner, email")
        .eq("id", user.id)
        .maybeSingle();

      const profileEmail = (profile?.email ?? "").trim().toLowerCase();
      allowed =
        profileEmail === MASTER_ADMIN_EMAIL ||
        (profile?.is_owner === true &&
          (profile?.role === "admin" || profile?.role === "owner"));
    }

    if (!allowed) {
      return json({ error: "Admin access required" }, 403);
    }

    const body = await req.json();
    const action = typeof body?.action === "string" ? body.action.trim() : "";
    const method =
      typeof body?.method === "string" ? body.method.toUpperCase() : "POST";
    const payload = body?.payload;

    if (!action) {
      return json({ error: "Missing 'action' in request body" }, 400);
    }

    const path = action.startsWith("/") ? action : `/${action}`;
    if (!isAllowed(path, method)) {
      return json(
        { error: `Action not allowed: ${method} ${path}` },
        400,
      );
    }

    const apiKey = Deno.env.get("SHIPENGINE_API_KEY");
    if (!apiKey) {
      return json({ error: "SHIPENGINE_API_KEY not configured" }, 500);
    }

    const fetchOptions: RequestInit = {
      method,
      headers: {
        "API-Key": apiKey,
        "Content-Type": "application/json",
      },
    };

    if (method !== "GET" && method !== "HEAD" && payload !== undefined) {
      fetchOptions.body = JSON.stringify(payload);
    }

    const response = await fetch(`${SHIPENGINE_BASE_URL}${path}`, fetchOptions);
    const text = await response.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "ShipEngine proxy failed";
    return json({ error: message }, 500);
  }
});
