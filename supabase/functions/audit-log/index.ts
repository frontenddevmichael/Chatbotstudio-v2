import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuditLogPayload {
  agency_id: string;
  user_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, unknown>;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("authorization") || "";
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return jsonResponse({ error: "missing_authorization_header" }, 401);
    }
    const token = match[1];

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: "unauthorized" }, 401);
    }

    const body: AuditLogPayload = await req.json();
    const { agency_id, user_id, action, resource_type, resource_id, details } = body;

    if (!agency_id || !action) {
      return jsonResponse({ error: "agency_id and action are required" }, 400);
    }

    if (user_id && user_id !== user.id) {
      return jsonResponse({ error: "user_id must match your authenticated user" }, 403);
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";

    const { error: insertError } = await supabase.from("audit_logs").insert({
      agency_id,
      user_id: user.id,
      action,
      resource_type: resource_type || null,
      resource_id: resource_id || null,
      details: details || null,
      ip_address: ip,
    });

    if (insertError) {
      return jsonResponse({ error: "insert_failed" }, 500);
    }

    return jsonResponse({ success: true });
  } catch {
    return jsonResponse({ error: "internal_error" }, 500);
  }
});
